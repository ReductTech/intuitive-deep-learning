"""Version-bound course feedback and recipient-scoped persistent inbox."""
from hashlib import sha256
import json
from uuid import uuid4
from .errors import require
from .storage import course_view
from .workflow import identifier

STATUS_LABELS={'open':'待处理','in_progress':'处理中','resolved':'已解决','dismissed':'已关闭'}


class Feedback:
    def __init__(self,flow):
        self.flow=flow;self.store=flow.store;self.clock=flow.clock

    def learning(self,rid):
        with self.store.transaction() as db:
            row=db.execute("SELECT c.id AS course_id,c.title,l.id AS release_id,l.revision_id,l.version FROM shuku_business.releases l JOIN shuku_business.courses c ON c.id=l.course_id WHERE l.revision_id=%s AND c.status='published' AND NOT c.deleting",(identifier(rid),)).fetchone()
            require(row,404,'NOT_FOUND','课程版本不存在或已不可访问。')
            return course_view(row)

    def notify(self,db,recipients,fid,event,kind,title,summary):
        now=self.clock()
        for recipient in set(str(uid) for uid in recipients):
            db.execute("INSERT INTO shuku_business.messages(id,recipient_id,feedback_id,event_key,kind,title,summary,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(recipient_id,event_key) DO NOTHING",(uuid4(),recipient,fid,event,kind,title,summary[:180],now))

    def submit(self,uid,rid,data):
        require(set(data)<= {'request_key','message','location'},400,'INVALID_INPUT','反馈包含不支持的字段。')
        message=data.get('message');location=data.get('location','');key=identifier(data.get('request_key'));rid=identifier(rid)
        require(isinstance(message,str) and 0<len(message.strip())<=5000 and isinstance(location,str) and len(location)<=200,400,'INVALID_FEEDBACK','请填写问题描述，最多 5000 字。')
        message=message.strip();location=location.strip()
        digest=sha256(json.dumps([rid,message,location],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            db.execute('SELECT pg_advisory_xact_lock(hashtextextended(%s,0))',('feedback:'+uid,))
            release=db.execute('SELECT * FROM shuku_business.releases WHERE revision_id=%s',(rid,)).fetchone()
            require(release,404,'NOT_FOUND','正式版本不存在。')
            course=db.execute('SELECT * FROM shuku_business.courses WHERE id=%s FOR UPDATE',(release['course_id'],)).fetchone()
            require(course and course['status']=='published' and not course['deleting'],404,'NOT_FOUND','课程当前不可反馈。')
            existing=db.execute('SELECT id,request_hash FROM shuku_business.feedback WHERE reporter_id=%s AND request_key=%s',(uid,key)).fetchone()
            if existing:
                require(existing['request_hash']==digest,409,'IDEMPOTENCY_CONFLICT','相同提交标识不能用于不同反馈。')
                return {'id':str(existing['id'])}
            count=db.execute('SELECT count(*) AS n FROM shuku_business.feedback WHERE reporter_id=%s AND created_at>%s',(uid,self.clock()-3600)).fetchone()['n']
            require(count<10,429,'FEEDBACK_LIMIT','提交较频繁，请稍后再试。')
            fid=str(uuid4());now=self.clock()
            db.execute('INSERT INTO shuku_business.feedback(id,release_id,reporter_id,request_key,request_hash,message,location,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',(fid,release['id'],uid,key,digest,message,location,now,now))
            recipients=[r['id'] for r in db.execute('SELECT u.id FROM shuku_business.users u WHERE u.active AND (u.id=%s OR EXISTS(SELECT 1 FROM shuku_business.course_managers m WHERE m.course_id=%s AND m.user_id=u.id))',(course['owner_id'],course['id'])).fetchall()]
            if not recipients:recipients=[r['id'] for r in db.execute("SELECT id FROM shuku_business.users WHERE active AND role='admin'").fetchall()]
            require(recipients,409,'NO_MANAGER','暂时没有可接收反馈的课程管理者。')
            self.notify(db,recipients,fid,'feedback.create:'+fid,'feedback_received','课程问题反馈 · '+course['title'],message)
            self.flow.audit(db,uid,'feedback.submit',fid)
            return {'id':fid}

    def record(self,db,uid,fid):
        self.store.user_in(db,uid)
        row=db.execute('SELECT f.*,l.course_id,l.revision_id,l.version,c.title,c.deleting,u.display_name AS reporter FROM shuku_business.feedback f JOIN shuku_business.releases l ON l.id=f.release_id JOIN shuku_business.courses c ON c.id=l.course_id JOIN shuku_business.users u ON u.id=f.reporter_id WHERE f.id=%s',(identifier(fid),)).fetchone()
        require(row and not row['deleting'],404,'NOT_FOUND','反馈不存在。')
        manages=self.flow.collaboration.manages(db,uid,row['course_id'])
        require(str(row['reporter_id'])==uid or manages,404,'NOT_FOUND','反馈不存在。')
        return row,manages

    def detail(self,uid,fid):
        with self.store.transaction() as db:
            row,manages=self.record(db,uid,fid)
            return {**{k:v for k,v in course_view(row).items() if k not in ('request_key','request_hash','deleting')},'can_manage':manages}

    def update(self,uid,fid,data):
        require(set(data)=={'status','reply','expected_version'} and isinstance(data.get('status'),str) and data['status'] in STATUS_LABELS and isinstance(data.get('reply'),str) and len(data['reply'])<=2000 and type(data.get('expected_version')) is int and data['expected_version']>=0,400,'INVALID_INPUT','反馈处理信息格式不正确。')
        with self.store.transaction() as db:
            row,manages=self.record(db,uid,fid)
            title=row['title']
            require(manages,403,'FORBIDDEN','需要课程管理权限。')
            course=db.execute('SELECT deleting FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['course_id'],)).fetchone()
            require(course and not course['deleting'],404,'NOT_FOUND','课程正在删除。')
            row=db.execute('SELECT * FROM shuku_business.feedback WHERE id=%s FOR UPDATE',(fid,)).fetchone()
            require(row,404,'NOT_FOUND','反馈不存在。')
            if row['status']==data['status'] and row['reply']==data['reply']:return {'status':row['status'],'status_version':row['status_version']}
            require(row['status_version']==data['expected_version'],409,'FEEDBACK_CHANGED','反馈已被其他管理者更新，请刷新后再处理。')
            version=row['status_version']+1
            db.execute('UPDATE shuku_business.feedback SET status=%s,reply=%s,status_version=%s,handler_id=%s,updated_at=%s WHERE id=%s',(data['status'],data['reply'],version,uid,self.clock(),fid))
            self.notify(db,[row['reporter_id']],fid,'feedback.status:'+fid+':'+str(version),'feedback_updated','反馈进度更新 · '+title,STATUS_LABELS[data['status']]+('：'+data['reply'] if data['reply'] else ''))
            self.flow.audit(db,uid,'feedback.'+data['status'],fid)
            return {'status':data['status'],'status_version':version}

    def messages(self,uid,cursor=None):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            args=[uid];where=''
            if cursor:
                anchor=db.execute('SELECT created_at,id FROM shuku_business.messages WHERE id=%s AND recipient_id=%s',(identifier(cursor),uid)).fetchone()
                require(anchor,400,'INVALID_CURSOR','分页位置已失效，请刷新消息。')
                where=' AND (m.created_at,m.id)<(%s,%s)';args.extend([anchor['created_at'],anchor['id']])
            rows=db.execute('SELECT m.* FROM shuku_business.messages m WHERE recipient_id=%s'+where+' ORDER BY created_at DESC,id DESC LIMIT 21',args).fetchall()
            return {'messages':[course_view(r) for r in rows[:20]],'next_cursor':str(rows[19]['id']) if len(rows)>20 else None,'unread_count':self.unread(db,uid)}

    @staticmethod
    def unread(db,uid):
        return db.execute('SELECT count(*) AS n FROM shuku_business.messages WHERE recipient_id=%s AND read_at IS NULL',(uid,)).fetchone()['n']

    def read(self,uid,mid,data):
        require(not data,400,'INVALID_INPUT','已读请求不需要其他参数。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            row=db.execute('UPDATE shuku_business.messages SET read_at=COALESCE(read_at,%s) WHERE id=%s AND recipient_id=%s RETURNING *',(self.clock(),identifier(mid),uid)).fetchone()
            require(row,404,'NOT_FOUND','消息不存在。')
            return {'message':course_view(row),'unread_count':self.unread(db,uid)}

    def read_all(self,uid,data):
        require(not data,400,'INVALID_INPUT','一键已读不需要其他参数。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            changed=db.execute('UPDATE shuku_business.messages SET read_at=%s WHERE recipient_id=%s AND read_at IS NULL',(self.clock(),uid)).rowcount
            return {'updated':changed,'unread_count':self.unread(db,uid)}
