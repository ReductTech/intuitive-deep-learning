"""Reversible visibility, durable deletion and reference-safe file reclamation."""
from uuid import uuid4
from psycopg.types.json import Jsonb
from .errors import require
from .storage import course_view,FILE_REFERENCE_LOCK
from .workflow import identifier
from .workers import DeferredTask


class Governance:
    def __init__(self,flow):
        self.flow=flow;self.store=flow.store;self.bucket=flow.bucket;self.clock=flow.clock

    def admin(self,db,uid):
        require(self.store.user_in(db,uid)['role']=='admin',403,'FORBIDDEN','需要平台管理员权限。')

    def visibility(self,uid,cid,data):
        require(set(data)=={'action'} and data['action'] in ('hide','restore'),400,'INVALID_INPUT','请选择下架或恢复。')
        with self.store.transaction() as db:
            self.admin(db,uid)
            course,_=self.flow.owner(db,uid,cid)
            require(not db.execute('SELECT 1 FROM shuku_business.workspaces WHERE id=%s',(cid,)).fetchone(),400,'NOT_OFFICIAL','个人工作区不能上下架。')
            if data['action']=='hide' and course['status']!='hidden':
                db.execute("UPDATE shuku_business.courses SET hidden_from=status,status='hidden' WHERE id=%s",(cid,))
            elif data['action']=='restore' and course['status']=='hidden':
                status=course['hidden_from'] or ('published' if course['current_release'] else 'draft')
                require(status!='published' or course['current_release'],409,'NO_RELEASE','课程没有可恢复的正式版本。')
                db.execute('UPDATE shuku_business.courses SET status=%s,hidden_from=NULL WHERE id=%s',(status,cid))
            self.flow.audit(db,uid,'course.'+data['action'],cid)
            return course_view(db.execute('SELECT * FROM shuku_business.courses WHERE id=%s',(cid,)).fetchone())

    def request(self,uid,kind,cid,data):
        require(set(data)=={'confirm'} and data['confirm'] is True,400,'CONFIRM_REQUIRED','请再次确认删除。')
        cid=identifier(cid)
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid)
            previous=db.execute('SELECT * FROM shuku_business.removals WHERE kind=%s AND resource_id=%s',(kind,cid)).fetchone()
            if previous:
                require(user['role']=='admin' or str(previous['requested_by'])==uid,403,'FORBIDDEN','没有删除权限。')
                return {'id':str(previous['id'])}
            row=db.execute('SELECT * FROM shuku_business.courses WHERE id=%s FOR UPDATE',(cid,)).fetchone()
            require(row,404,'NOT_FOUND','课程或工作区不存在。')
            # Recheck after the resource lock: concurrent requests reuse one receipt.
            previous=db.execute('SELECT id,requested_by FROM shuku_business.removals WHERE kind=%s AND resource_id=%s',(kind,cid)).fetchone()
            if previous:
                require(user['role']=='admin' or str(previous['requested_by'])==uid,403,'FORBIDDEN','没有删除权限。')
                return {'id':str(previous['id'])}
            w=db.execute('SELECT * FROM shuku_business.workspaces WHERE id=%s',(cid,)).fetchone()
            if kind=='course':
                self.admin(db,uid);require(not w,400,'NOT_OFFICIAL','请使用删除个人工作区。')
                ids=[cid]+[str(r['id']) for r in db.execute('SELECT id FROM shuku_business.workspaces WHERE target_course_id=%s',(cid,)).fetchall()]
            else:
                require(w and (str(w['owner_id'])==uid or user['role']=='admin'),403,'FORBIDDEN','只能删除本人的共创工作区。')
                ids=[cid]
                parent=db.execute('SELECT deleting FROM shuku_business.courses WHERE id=%s',(w['target_course_id'],)).fetchone()
                require(not parent['deleting'],409,'PARENT_REMOVING','官方课程正在整体移除。')
            db.execute('UPDATE shuku_business.courses SET deleting=true WHERE id=%s',(cid,))
            keys=['course:'+value for value in ids]
            db.execute("UPDATE shuku_business.tasks SET status='failed',error_code='RESOURCE_REMOVED' WHERE resource_key=ANY(%s) AND status='queued' AND kind<>'governance.remove'",(keys,))
            removal=str(uuid4());tid=str(uuid4());now=self.clock()
            db.execute("INSERT INTO shuku_business.tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'governance.remove',%s,%s,%s,%s,%s,%s)",(tid,'course:'+cid,'remove:'+removal,removal,Jsonb({'removal_id':removal}),now,now))
            db.execute('INSERT INTO shuku_business.removals(id,kind,resource_id,requested_by,title,resource_ids,task_id,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(removal,kind,cid,uid,row['title'],Jsonb(ids),tid,now))
            self.flow.audit(db,uid,kind+'.remove.request',cid)
            return {'id':removal}

    def listing(self,uid):
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid)
            rows=db.execute("SELECT r.*,t.status AS task_status,t.checkpoint,t.error_code FROM shuku_business.removals r JOIN shuku_business.tasks t ON t.id=r.task_id WHERE r.requested_by=%s OR %s ORDER BY r.created_at DESC,r.id LIMIT 100",(uid,user['role']=='admin')).fetchall()
            return [{**course_view(r),'state':'failed' if r['task_status']=='failed' and r['state']!='succeeded' else r['state']} for r in rows]

    def retry(self,uid,rid,data):
        require(not data,400,'INVALID_INPUT','重试请求不需要其他参数。')
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid)
            r=db.execute('SELECT * FROM shuku_business.removals WHERE id=%s FOR UPDATE',(identifier(rid),)).fetchone()
            require(r and (str(r['requested_by'])==uid or user['role']=='admin'),404,'NOT_FOUND','删除任务不存在。')
            if r['state']!='succeeded':
                db.execute("UPDATE shuku_business.tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE id=%s AND status='failed'",(self.clock(),r['task_id']))
            return {'id':str(r['id'])}

    def active_lease(self,db,task):
        require(db.execute("SELECT 1 FROM shuku_business.tasks WHERE id=%s AND status='running' AND lease_token=%s AND lease_until>%s FOR UPDATE",(task['id'],task['lease_token'],self.clock())).fetchone(),409,'STALE_LEASE','删除任务已由其他执行者接管。')

    def run(self,task,checkpoint):
        rid=task['payload']['removal_id'];checkpoint({'stage':'waiting-for-tasks'})
        with self.store.transaction() as db:
            r=db.execute('SELECT * FROM shuku_business.removals WHERE id=%s FOR UPDATE',(rid,)).fetchone()
            if r['state']=='succeeded':return {'removal_id':rid}
            self.active_lease(db,task)
            ids=r['resource_ids'];keys=['course:'+cid for cid in ids]
            running=db.execute("SELECT 1 FROM shuku_business.task_leases WHERE resource_key=ANY(%s) AND task_id<>%s AND expires_at>%s",(keys,task['id'],self.clock())).fetchone()
            merging=r['kind']=='workspace' and db.execute("SELECT 1 FROM shuku_business.contributions WHERE workspace_id=%s AND status='merging'",(r['resource_id'],)).fetchone()
            if running or merging:raise DeferredTask()
            db.execute("UPDATE shuku_business.tasks SET status='failed',error_code='RESOURCE_REMOVED',lease_token=NULL,lease_until=NULL WHERE resource_key=ANY(%s) AND id<>%s AND status IN ('queued','running') AND kind<>'governance.remove'",(keys,task['id']))
            db.execute('DELETE FROM shuku_business.task_leases WHERE resource_key=ANY(%s) AND task_id<>%s',(keys,task['id']))
            if r['state']=='queued':
                db.execute('SELECT id FROM shuku_business.courses WHERE id=ANY(%s::uuid[]) ORDER BY id FOR UPDATE',(ids,)).fetchall()
                db.execute("INSERT INTO shuku_business.removal_objects SELECT %s,item.value->>'sha256',NULL FROM shuku_business.revisions r CROSS JOIN LATERAL jsonb_each(r.files) item WHERE r.course_id=ANY(%s::uuid[]) ON CONFLICT DO NOTHING",(rid,ids))
                db.execute('UPDATE shuku_business.courses SET head_revision=NULL,current_release=NULL WHERE id=ANY(%s::uuid[])',(ids,))
                if r['kind']=='course':
                    db.execute('DELETE FROM shuku_business.contributions WHERE target_course_id=%s',(r['resource_id'],))
                    db.execute('DELETE FROM shuku_business.workspaces WHERE target_course_id=%s',(r['resource_id'],))
                else:
                    db.execute("UPDATE shuku_business.contributions SET status='superseded' WHERE workspace_id=%s AND status<>'merged'",(r['resource_id'],))
                    db.execute('UPDATE shuku_business.workspaces SET deleted_at=%s WHERE id=%s',(self.clock(),r['resource_id']))
                    db.execute("UPDATE shuku_business.courses SET status='hidden',title='',description='',category='' WHERE id=%s",(r['resource_id'],))
                db.execute('DELETE FROM shuku_business.reviews WHERE course_id=ANY(%s::uuid[])',(ids,))
                db.execute('DELETE FROM shuku_business.releases WHERE course_id=ANY(%s::uuid[])',(ids,))
                db.execute('DELETE FROM shuku_business.revisions WHERE course_id=ANY(%s::uuid[])',(ids,))
                db.execute('DELETE FROM shuku_business.course_managers WHERE course_id=ANY(%s::uuid[])',(ids,))
                if r['kind']=='course':db.execute('DELETE FROM shuku_business.courses WHERE id=ANY(%s::uuid[])',(ids,))
                db.execute("UPDATE shuku_business.removals SET state='cleaning' WHERE id=%s",(rid,))
        while True:
            checkpoint({'stage':'cleaning-unreferenced-files'})
            with self.store.transaction() as db:
                self.active_lease(db,task)
                # Save/build reference writers take the matching shared transaction lock.
                db.execute('SELECT pg_advisory_xact_lock(%s)',(FILE_REFERENCE_LOCK,))
                batch=db.execute('SELECT sha256 FROM shuku_business.removal_objects WHERE removal_id=%s AND result IS NULL ORDER BY sha256 LIMIT 32 FOR UPDATE',(rid,)).fetchall()
                if not batch:
                    db.execute("UPDATE shuku_business.removals SET state='succeeded',finished_at=%s WHERE id=%s",(self.clock(),rid))
                    self.flow.audit(db,str(r['requested_by']),r['kind']+'.remove.complete',r['resource_id'])
                    break
                digests=[item['sha256'] for item in batch]
                referenced={row['sha'] for row in db.execute("SELECT DISTINCT item.value->>'sha256' AS sha FROM shuku_business.revisions r CROSS JOIN LATERAL jsonb_each(r.files) item WHERE item.value->>'sha256'=ANY(%s)",(digests,)).fetchall()}
                for digest in digests:
                    if digest not in referenced:self.bucket.remove(digest)
                    db.execute('UPDATE shuku_business.removal_objects SET result=%s WHERE removal_id=%s AND sha256=%s',('shared' if digest in referenced else 'removed',rid,digest))
        return {'removal_id':rid}
