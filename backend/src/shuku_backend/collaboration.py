"""Private workspaces and revision-bound, locally verified contribution merges."""
import json
from uuid import uuid4
from .errors import require
from .storage import course_view
from .workflow import identifier


def teaching(project):
    """Copy teaching material without author chats, image references or undo history."""
    value={k:project[k] for k in ('version','id','courseId','title','duration','style','outlineConfirmed')}
    value['pages']=[{**{k:p[k] for k in ('id','nativeId','format','title','goal','summary','ready','designed') if k in p},'note':'','revisions':[],'messages':[]} for p in project['pages']]
    return value


class Collaboration:
    def __init__(self,workflow):
        self.flow=workflow;self.store=workflow.store;self.bucket=workflow.bucket;self.clock=workflow.clock

    def manages(self,db,uid,cid):
        user=self.store.user_in(db,uid)
        return bool(db.execute("SELECT 1 FROM shuku_business.courses c WHERE c.id=%s AND (owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_business.course_managers m WHERE m.course_id=c.id AND m.user_id=%s))",(cid,uid,user['role']=='admin',uid)).fetchone())

    def releases(self,cid):
        with self.store.transaction() as db:
            return [course_view(r) for r in db.execute("SELECT r.id,r.version,r.revision_id,r.created_at,r.id=c.current_release AS current FROM shuku_business.releases r JOIN shuku_business.courses c ON c.id=r.course_id WHERE c.id=%s AND c.status='published' ORDER BY r.created_at DESC,r.id",(identifier(cid),)).fetchall()]

    def create(self,uid,cid,data):
        require(set(data)<= {'base_release_id'},400,'INVALID_INPUT','共创请求格式不正确。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            course=db.execute("SELECT * FROM shuku_business.courses WHERE id=%s AND status='published' FOR UPDATE",(identifier(cid),)).fetchone()
            require(course,404,'NOT_FOUND','课程尚未公开。')
            base=identifier(data['base_release_id']) if data.get('base_release_id') else str(course['current_release'])
            release=db.execute('SELECT * FROM shuku_business.releases WHERE id=%s AND course_id=%s',(base,cid)).fetchone()
            require(release,404,'NOT_FOUND','正式版本不存在。')
            old=db.execute('SELECT id FROM shuku_business.workspaces WHERE target_course_id=%s AND owner_id=%s AND base_release_id=%s',(cid,uid,base)).fetchone()
            if old:return {'id':str(old['id'])}
            revision=db.execute('SELECT * FROM shuku_business.revisions WHERE id=%s',(release['revision_id'],)).fetchone()
            project=teaching(json.loads(self.bucket.read(revision['files']['project.json']['sha256'])))
            wid=str(uuid4());project['id']=wid
            db.execute("INSERT INTO shuku_business.courses(id,owner_id,module_id,title,description,category,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",(wid,uid,course['module_id'],project['title'],course['description'],course['category'],self.clock()))
            db.execute('INSERT INTO shuku_business.workspaces VALUES (%s,%s,%s,%s,%s)',(wid,cid,uid,base,self.clock()))
            self.flow.save_in(db,uid,wid,{'project':project,'expected_revision':None})
            self.flow.audit(db,uid,'workspace.create',wid)
            return {'id':wid}

    def workspaces(self,uid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            return [course_view(r) for r in db.execute("SELECT w.id,w.target_course_id,c.title,r.version AS base_version,k.id AS contribution_id,k.status,k.score,k.note FROM shuku_business.workspaces w JOIN shuku_business.courses c ON c.id=w.target_course_id JOIN shuku_business.releases r ON r.id=w.base_release_id LEFT JOIN LATERAL (SELECT * FROM shuku_business.contributions WHERE workspace_id=w.id ORDER BY created_at DESC,id DESC LIMIT 1) k ON true WHERE w.owner_id=%s ORDER BY w.created_at DESC LIMIT 100",(uid,)).fetchall()]

    def can_preview(self,db,uid,revision):
        # Managers receive only submitted revisions, never unrelated personal drafts.
        row=db.execute("SELECT target_course_id FROM shuku_business.contributions WHERE revision_id=%s AND status IN ('pending','approved','merging','merged')",(revision['id'],)).fetchone()
        return bool(row and self.manages(db,uid,row['target_course_id']))

    def project(self,db,rid):
        row=db.execute('SELECT files FROM shuku_business.revisions WHERE id=%s',(rid,)).fetchone()
        return teaching(json.loads(self.bucket.read(row['files']['project.json']['sha256'])))

    def difference(self,db,base,rid):
        before=self.project(db,base);after=self.project(db,rid)
        a={p['id']:p for p in before['pages']};b={p['id']:p for p in after['pages']}
        fields=('title','goal','summary','nativeId','format')
        changes=[]
        for pid in dict.fromkeys([*a,*b]):
            old=a.get(pid);new=b.get(pid)
            if old is None or new is None or any(old.get(k)!=new.get(k) for k in fields):
                changes.append({'page_id':pid,'kind':'added' if old is None else 'removed' if new is None else 'modified','before':{k:old.get(k) for k in fields} if old else None,'after':{k:new.get(k) for k in fields} if new else None})
        settings={k:{'before':before.get(k),'after':after.get(k)} for k in ('title','duration','style') if before.get(k)!=after.get(k)}
        if list(a)!=list(b):settings['page_order']={'before':list(a),'after':list(b)}
        return {'pages':changes,'settings':settings}

    def submit(self,uid,wid,data):
        require(set(data)<= {'revision_id','summary'} and isinstance(data.get('summary'),str) and 0<len(data['summary'].strip())<=2000,400,'INVALID_INPUT','请填写简短的修改说明。')
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,uid,wid)
            w=db.execute('SELECT * FROM shuku_business.workspaces WHERE id=%s AND owner_id=%s',(identifier(wid),uid)).fetchone()
            require(w,404,'NOT_FOUND','共创工作区不存在。')
            rid=identifier(data.get('revision_id'))
            require(str(course['head_revision'])==rid,409,'REVISION_CONFLICT','请保存并提交最新修订。')
            revision=db.execute("SELECT * FROM shuku_business.revisions WHERE id=%s AND state='ready'",(rid,)).fetchone()
            require(revision,409,'NOT_READY','请等待预览准备完成。')
            existing=db.execute('SELECT * FROM shuku_business.contributions WHERE revision_id=%s',(rid,)).fetchone()
            if existing:
                require(existing['status'] in ('pending','approved','merging','merged') and existing['summary']==data['summary'].strip(),409,'NEW_REVISION_REQUIRED','请保存新修订后重新提交。')
                return course_view(existing)
            target=db.execute("SELECT * FROM shuku_business.courses WHERE id=%s AND status='published' FOR UPDATE",(w['target_course_id'],)).fetchone()
            require(target,409,'TARGET_UNAVAILABLE','课程当前不可共创。')
            base=db.execute('SELECT revision_id FROM shuku_business.releases WHERE id=%s',(w['base_release_id'],)).fetchone()
            diff=self.difference(db,base['revision_id'],rid)
            require(diff['pages'] or diff['settings'],409,'NO_CHANGES','尚未修改教学内容。')
            row=db.execute("INSERT INTO shuku_business.contributions(id,workspace_id,target_course_id,revision_id,target_head,artifact_hash,summary,status,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,'pending',%s) RETURNING *",(uuid4(),wid,w['target_course_id'],rid,target['head_revision'],revision['artifact_hash'],data['summary'].strip(),self.clock())).fetchone()
            self.flow.audit(db,uid,'contribution.submit',row['id']);return course_view(row)

    def listing(self,uid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            rows=db.execute("SELECT k.*,c.title,w.owner_id,u.display_name AS author FROM shuku_business.contributions k JOIN shuku_business.workspaces w ON w.id=k.workspace_id JOIN shuku_business.courses c ON c.id=k.target_course_id JOIN shuku_business.users u ON u.id=w.owner_id WHERE k.status IN ('pending','approved','merging') AND w.owner_id<>%s AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_business.course_managers m WHERE m.course_id=c.id AND m.user_id=%s)) ORDER BY k.created_at LIMIT 100",(uid,uid,self.store.user_in(db,uid)['role']=='admin',uid)).fetchall()
            return [course_view(r) for r in rows]

    def record(self,db,uid,kid):
        row=db.execute('SELECT k.*,w.owner_id,w.base_release_id,c.head_revision,c.title FROM shuku_business.contributions k JOIN shuku_business.workspaces w ON w.id=k.workspace_id JOIN shuku_business.courses c ON c.id=w.id WHERE k.id=%s',(identifier(kid),)).fetchone()
        require(row and (str(row['owner_id'])==uid or self.manages(db,uid,row['target_course_id'])),404,'NOT_FOUND','共创建议不存在。')
        return row

    def detail(self,uid,kid):
        with self.store.transaction() as db:
            row=self.record(db,uid,kid)
            base=db.execute('SELECT revision_id,version FROM shuku_business.releases WHERE id=%s',(row['base_release_id'],)).fetchone()
            task=db.execute('SELECT status,error_code FROM shuku_business.tasks WHERE idempotency_key=%s',('build:'+str(row['merged_revision']),)).fetchone() if row['merged_revision'] else None
            return {**course_view(row),'can_manage':str(row['owner_id'])!=uid and self.manages(db,uid,row['target_course_id']),'merge_task':task,'base_version':base['version'],'diff':self.difference(db,base['revision_id'],row['revision_id']),'preview_url':'/api/shuku/revisions/'+str(row['revision_id'])+'/files/index.html'}

    def decide(self,uid,kid,data):
        require(set(data)<= {'decision','revision_id','score','note'} and data.get('decision') in ('approved','rejected'),400,'INVALID_INPUT','审核结果格式不正确。')
        note=data.get('note','');score=data.get('score')
        require(isinstance(note,str) and len(note)<=2000 and (data['decision']!='rejected' or note.strip()),400,'NOTE_REQUIRED','退回时请填写原因。')
        require(data['decision']!='approved' or type(score) is int and 0<=score<=10,400,'INVALID_SCORE','请填写 0～10 的整数质量分。')
        with self.store.transaction() as db:
            row=self.record(db,uid,kid)
            db.execute('SELECT id FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['workspace_id'],))
            row=self.record(db,uid,kid)
            require(str(row['owner_id'])!=uid,403,'SELF_REVIEW','不能审核或评分自己的贡献。')
            require(self.manages(db,uid,row['target_course_id']),403,'FORBIDDEN','没有课程审核权限。')
            require(row['status']=='pending' and str(row['revision_id'])==data.get('revision_id') and row['revision_id']==row['head_revision'],409,'REVIEW_CHANGED','共创内容已变化，请重新查看。')
            revision=db.execute('SELECT artifact_hash FROM shuku_business.revisions WHERE id=%s',(row['revision_id'],)).fetchone()
            require(revision['artifact_hash']==row['artifact_hash'],409,'REVIEW_CHANGED','课程产物已变化。')
            db.execute('UPDATE shuku_business.contributions SET status=%s,score=%s,note=%s,reviewer_id=%s,decided_at=%s WHERE id=%s',(data['decision'],score if data['decision']=='approved' else None,note,uid,self.clock(),kid))
            self.flow.audit(db,uid,'contribution.'+data['decision'],kid)
            return {'status':data['decision']}

    def merge(self,uid,kid,data):
        require(set(data)== {'revision_id'},400,'INVALID_INPUT','合并请求格式不正确。')
        with self.store.transaction() as db:
            row=self.record(db,uid,kid)
            db.execute('SELECT id FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['workspace_id'],))
            row=self.record(db,uid,kid)
            require(str(row['owner_id'])!=uid,403,'SELF_MERGE','不能合并自己的贡献。')
            require(self.manages(db,uid,row['target_course_id']),403,'FORBIDDEN','没有合并权限。')
            require(str(row['revision_id'])==data.get('revision_id'),409,'REVIEW_CHANGED','合并修订不匹配。')
            if row['status'] in ('merging','merged'):
                if row['status']=='merging':
                    # An explicit repeated merge retries a terminal failed build, never creates a new revision.
                    db.execute("UPDATE shuku_business.tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE idempotency_key=%s AND status='failed'",(self.clock(),'build:'+str(row['merged_revision'])))
                return {'status':row['status'],'revision_id':str(row['merged_revision'])}
            require(row['status']=='approved' and row['head_revision']==row['revision_id'],409,'APPROVAL_REQUIRED','请先审核最新修订。')
            target=db.execute('SELECT * FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['target_course_id'],)).fetchone()
            base=db.execute('SELECT revision_id FROM shuku_business.releases WHERE id=%s',(row['base_release_id'],)).fetchone()
            require(target['status']=='published' and target['current_release']==row['base_release_id'] and target['head_revision']==row['target_head'] and row['target_head']==base['revision_id'],409,'BASE_CHANGED','官方内容已变化，请保留当前工作区，并基于最新正式版本重新共创。')
            source=db.execute('SELECT * FROM shuku_business.revisions WHERE id=%s',(row['revision_id'],)).fetchone()
            require(source['state']=='ready' and source['artifact_hash']==row['artifact_hash'],409,'REVIEW_CHANGED','课程产物已变化。')
            # Verify all approved objects, then create an independent official revision.
            for obj in source['files'].values():self.bucket.read(obj['sha256'])
            result=self.flow.save_in(db,uid,str(row['target_course_id']),{'project':self.project(db,row['revision_id']),'expected_revision':str(target['head_revision'])})
            db.execute("UPDATE shuku_business.contributions SET status='merging',merger_id=%s,merged_revision=%s WHERE id=%s",(uid,result['id'],kid))
            self.flow.audit(db,uid,'contribution.merge.request',kid)
            return {'status':'merging','revision_id':result['id']}

    def frozen_merge(self,rid,objects,checkpoint):
        """Reuse the exact approved runtime; only revision-specific resource URLs change."""
        with self.store.transaction() as db:
            row=db.execute("SELECT k.revision_id,k.artifact_hash,r.files FROM shuku_business.contributions k JOIN shuku_business.revisions r ON r.id=k.revision_id WHERE k.merged_revision=%s AND k.status IN ('merging','merged')",(rid,)).fetchone()
        if not row:return None
        result=dict(objects)
        old=('/api/shuku/revisions/'+str(row['revision_id'])+'/files/').encode()
        new=('/api/shuku/revisions/'+rid+'/files/').encode()
        import hashlib
        require(hashlib.sha256(json.dumps(row['files'],sort_keys=True).encode()).hexdigest()==row['artifact_hash'],409,'REVIEW_CHANGED','审核产物清单已变化。')
        for index,(name,obj) in enumerate(row['files'].items()):
            if name in ('project.json',) or name.startswith('images/'):continue
            data=self.bucket.read(obj['sha256'])
            require(len(data)==obj['size'],503,'FILE_CORRUPT','审核产物不完整。')
            if name in ('index.html','bundle.js','bundle.css','utilities.css'):
                result[name]={**self.bucket.put(data.replace(old,new)),'mime':obj['mime']}
            else:result[name]=obj
            if index%16==0:checkpoint({'stage':'copying-approved-artifacts','revision_id':rid})
        return result

    def complete_merge(self,db,rid,digest):
        row=db.execute("SELECT * FROM shuku_business.contributions WHERE merged_revision=%s AND status='merging' FOR UPDATE",(rid,)).fetchone()
        if not row:return
        course=db.execute('SELECT head_revision FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['target_course_id'],)).fetchone()
        require(str(course['head_revision'])==rid,409,'REVIEW_CHANGED','待发布修订已变化。')
        db.execute("INSERT INTO shuku_business.reviews(id,revision_id,course_id,status,artifact_hash,reviewer_id,note,created_at,decided_at) VALUES (%s,%s,%s,'approved',%s,%s,%s,%s,%s)",(uuid4(),rid,row['target_course_id'],digest,row['reviewer_id'],row['note'],self.clock(),self.clock()))
        db.execute("UPDATE shuku_business.contributions SET status='merged',merged_at=%s WHERE id=%s",(self.clock(),row['id']))
        self.flow.audit(db,str(row['merger_id']),'contribution.merged',row['id'])

    def history(self,uid,cid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            course=db.execute("SELECT id FROM shuku_business.courses WHERE id=%s AND status='published'",(identifier(cid),)).fetchone()
            require(course or self.manages(db,uid,cid),404,'NOT_FOUND','课程不存在。')
            rows=[course_view(r) for r in db.execute("SELECT k.id,w.owner_id AS author_id,u.display_name AS author,k.reviewer_id,k.merger_id,k.score,k.summary,k.merged_revision,k.merged_at,r.version FROM shuku_business.contributions k JOIN shuku_business.workspaces w ON w.id=k.workspace_id JOIN shuku_business.users u ON u.id=w.owner_id LEFT JOIN shuku_business.releases r ON r.revision_id=k.merged_revision WHERE k.target_course_id=%s AND k.status='merged' ORDER BY k.merged_at,k.id",(cid,)).fetchall()]
            ranking={}
            for row in rows:
                item=ranking.setdefault(row['author_id'],{'author_id':row['author_id'],'author':row['author'],'score':0,'count':0});item['score']+=row['score'];item['count']+=1
            return {'contributions':rows,'ranking':sorted(ranking.values(),key=lambda v:(-v['score'],v['author_id']))}
