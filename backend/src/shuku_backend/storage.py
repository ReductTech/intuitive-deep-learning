"""MySQL business persistence, using SQLAlchemy pooling and explicit transactions."""
from contextlib import contextmanager
from hashlib import sha256
from uuid import uuid4, UUID
import json
from .database import JsonValue, Connection, engine_for
from .errors import BusinessError, require

DEMO_USERS = (
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f01", "linzhi", "林知", "learner"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f02", "xiaoman", "小满", "creator"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f03", "admin", "管理员", "admin"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f04", "scy", "scy", "creator"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f05", "msh", "msh", "creator"),
)


class Store:
    def __init__(self, database_url):
        self.engine = engine_for(database_url)
        self.database_url = self.engine.url.render_as_string(hide_password=False)

    @contextmanager
    def transaction(self, *, isolation=None):
        with self.engine.connect() as connection:
            if isolation:
                connection = connection.execution_options(isolation_level=isolation)
            with connection.begin():
                yield Connection(connection)

    def migrate(self):
        from .migrations import migrate
        migrate(self.engine)

    def ready(self):
        from .migrations import verify
        with self.engine.connect() as connection:
            verify(connection)

    def close(self):
        self.engine.dispose()

    def seed_demo(self):
        with self.transaction() as db:
            for uid,name,display,role in DEMO_USERS:
                existing = db.execute("SELECT id,username,role FROM shuku_users WHERE id=%s OR username=%s", (uid,name)).fetchall()
                if existing:
                    if len(existing)!=1 or str(existing[0]["id"])!=uid or existing[0]["username"]!=name or existing[0]["role"]!=role:
                        raise RuntimeError("Demo account conflicts with an existing user")
                    continue
                db.execute("INSERT INTO shuku_users(id,username,display_name,role) VALUES (%s,%s,%s,%s)",(uid,name,display,role))

    @staticmethod
    def user_in(db, uid):
        user = db.execute("SELECT id,username,display_name,role FROM shuku_users WHERE id=%s AND active",(uid,)).fetchone()
        require(user,401,"LOGIN_REQUIRED","请重新登录。")
        return {**user,"id":str(user["id"])}

    def session_user(self, token_hash, now):
        with self.transaction() as db:
            row=db.execute("SELECT user_id FROM shuku_sessions WHERE token_hash=%s AND expires_at>%s",(token_hash,now)).fetchone()
            require(row,401,"LOGIN_REQUIRED","请先登录。")
            return self.user_in(db,row["user_id"])

    def profile(self, uid):
        with self.transaction() as db:
            user=self.user_in(db,uid)
            row=db.execute("SELECT bio,email,updated_at FROM shuku_profiles WHERE user_id=%s",(uid,)).fetchone()
            return {"user":user,**(row or {"bio":"","email":"","updated_at":None})}

    def save_profile(self, uid, data, now):
        import re
        require(isinstance(data,dict) and set(data)=={'display_name','bio','email'},400,'INVALID_INPUT','包含不支持的个人资料字段。')
        for key,limit in [('display_name',60),('bio',500),('email',254)]:
            require(isinstance(data[key],str) and len(data[key])<=limit,400,'INVALID_INPUT','个人资料格式或长度不正确。')
        name=data['display_name'].strip();bio=data['bio'].strip();email=data['email'].strip()
        require(name and not any(ord(c)<32 for c in name),400,'INVALID_INPUT','请填写有效的姓名。')
        require(not email or re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email),400,'INVALID_INPUT','请填写有效的联系邮箱。')
        with self.transaction() as db:
            self.user_in(db,uid)
            db.execute("UPDATE shuku_users SET display_name=%s WHERE id=%s",(name,uid))
            db.upsert("profiles", dict(user_id=uid,bio=bio,email=email,updated_at=now), ["bio","email","updated_at"])
            db.execute("INSERT INTO shuku_audit(user_id,action,object_id,created_at) VALUES (%s,'profile.update',%s,%s)",(uid,uid,now))
            return {"user":self.user_in(db,uid),"bio":bio,"email":email,"updated_at":now}

    def remove_session(self, token_hash):
        with self.transaction() as db:
            db.execute("DELETE FROM shuku_sessions WHERE token_hash=%s",(token_hash,))

    def create_course(self, uid, data, now, github=None, *, db=None):
        require(isinstance(data,dict),400,"INVALID_INPUT","课程信息格式不正确。")
        require(not set(data)-{"title","description","category","module_id"},400,"INVALID_INPUT","包含不支持的课程字段。")
        for key,limit in [("title",120),("description",3000),("category",80)]:
            value=data.get(key,"")
            require(isinstance(value,str) and len(value)<=limit and (key!="title" or value.strip()),400,"INVALID_INPUT","请检查课程名称、简介和类别。")
        try: module_id=str(UUID(data.get("module_id","")))
        except (ValueError,TypeError,AttributeError):raise BusinessError(400,"INVALID_INPUT","模块 ID 必须为 UUID。")
        from contextlib import nullcontext
        with (self.transaction() if db is None else nullcontext(db)) as db:
            user=self.user_in(db,uid)
            require(user["role"] in ("creator","admin"),403,"FORBIDDEN","当前账号没有创建权限。")
            cid=str(uuid4())
            db.execute("INSERT INTO shuku_courses(id,owner_id,module_id,title,description,category,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",(cid,uid,module_id,data["title"].strip(),data.get("description",""),data.get("category",""),now))
            row=db.execute("SELECT * FROM shuku_courses WHERE id=%s",(cid,)).fetchone()
            db.execute("INSERT INTO shuku_audit(user_id,action,object_id,created_at) VALUES (%s,'course.create',%s,%s)",(uid,cid,now))
            if github and github.client:github.provision_in(db,cid)
            return course_view(row)

    def courses(self, uid):
        with self.transaction() as db:
            user=self.user_in(db,uid)
            return [course_view(r) for r in db.execute("SELECT c.*,EXISTS(SELECT 1 FROM shuku_agent_credentials a WHERE a.course_id=c.id) AS local_agent,CASE WHEN r.state='building' AND t.status='failed' THEN 'failed' ELSE r.state END AS revision_state,v.status AS review_status,v.note AS review_note,l.version AS current_version,EXISTS(SELECT 1 FROM shuku_editor_drafts d WHERE d.course_id=c.id) AS has_draft FROM shuku_courses c LEFT JOIN shuku_revisions r ON r.id=c.head_revision LEFT JOIN shuku_reviews v ON v.revision_id=c.head_revision LEFT JOIN shuku_releases l ON l.id=c.current_release LEFT JOIN shuku_tasks t ON t.idempotency_key=CONCAT('build:',c.head_revision) WHERE NOT c.deleting AND NOT EXISTS(SELECT 1 FROM shuku_workspaces w WHERE w.id=c.id) AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_course_managers m WHERE m.course_id=c.id AND m.user_id=%s)) ORDER BY c.created_at,c.id LIMIT 100",(uid,user["role"]=="admin",uid)).fetchall()]

    def course(self, uid, cid):
        try: cid=str(UUID(cid))
        except ValueError:raise BusinessError(404,"NOT_FOUND","课程不存在。")
        with self.transaction() as db:
            user=self.user_in(db,uid)
            row=db.execute("SELECT c.*,EXISTS(SELECT 1 FROM shuku_agent_credentials a WHERE a.course_id=c.id) AS local_agent FROM shuku_courses c WHERE c.id=%s AND NOT c.deleting AND NOT EXISTS(SELECT 1 FROM shuku_workspaces w JOIN shuku_courses t ON t.id=w.target_course_id WHERE w.id=c.id AND t.deleting) AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_course_managers m WHERE m.course_id=c.id AND m.user_id=%s))",(cid,uid,user["role"]=="admin",uid)).fetchone()
            require(row,404,"NOT_FOUND","课程不存在。")
            result=course_view(row)
            workspace=db.execute('SELECT target_course_id,base_release_id FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone()
            if workspace:result['workspace']=course_view(workspace)
            return result

    def enqueue(self, kind, resource, key, payload, now):
        digest=sha256(json.dumps([kind,resource,payload],sort_keys=True,separators=(",",":")).encode()).hexdigest()
        with self.transaction() as db:
            tid=str(uuid4())
            db.insert_once('INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(tid,kind,resource,key,digest,JsonValue(payload),now,now))
            row=db.execute("SELECT id,request_hash FROM shuku_tasks WHERE idempotency_key=%s",(key,)).fetchone()
            require(row["request_hash"]==digest,409,"IDEMPOTENCY_CONFLICT","相同请求标识不能用于不同内容。")
            return str(row["id"])

    def claim(self, kinds, now, ttl=30):
        if not kinds:return None
        with self.transaction() as db:
            exhausted=db.execute("SELECT id FROM shuku_tasks WHERE status='running' AND lease_until<=%s AND attempts>=max_attempts FOR UPDATE SKIP LOCKED",(now,)).fetchall()
            for old in exhausted:
                db.execute("UPDATE shuku_tasks SET status='failed',error_code='ATTEMPTS_EXHAUSTED',lease_token=NULL,lease_until=NULL WHERE id=%s",(old["id"],))
                db.execute("DELETE FROM shuku_task_leases WHERE task_id=%s AND expires_at<=%s",(old["id"],now))
            candidates=db.execute("SELECT * FROM shuku_tasks WHERE kind IN %s AND attempts<max_attempts AND ((status='queued' AND available_at<=%s) OR (status='running' AND lease_until<=%s)) ORDER BY created_at,id LIMIT 16 FOR UPDATE SKIP LOCKED",(list(kinds),now,now)).fetchall()
            for row in candidates:
                token=str(uuid4())
                # Serializing the lease row keeps different tasks for one resource exclusive.
                db.insert_once("INSERT INTO shuku_task_leases(resource_key,task_id,lease_token,expires_at) VALUES (%s,%s,%s,%s)",(row["resource_key"],row["id"],token,now+ttl))
                lease=db.execute("SELECT * FROM shuku_task_leases WHERE resource_key=%s FOR UPDATE",(row["resource_key"],)).fetchone()
                if lease["lease_token"]!=token and lease["expires_at"]>now:continue
                db.execute("UPDATE shuku_task_leases SET task_id=%s,lease_token=%s,expires_at=%s WHERE resource_key=%s",(row["id"],token,now+ttl,row["resource_key"]))
                db.execute("UPDATE shuku_tasks SET status='running',attempts=attempts+1,lease_token=%s,lease_until=%s WHERE id=%s",(token,now+ttl,row["id"]))
                return db.execute("SELECT * FROM shuku_tasks WHERE id=%s",(row["id"],)).fetchone()

    def finish(self, tid, token, now, *, result=None, error=None, deferred=False):
        with self.transaction() as db:
            row=db.execute("SELECT * FROM shuku_tasks WHERE id=%s FOR UPDATE",(tid,)).fetchone()
            require(row and row["status"]=="running" and str(row["lease_token"])==str(token) and row["lease_until"]>now,409,"STALE_LEASE","任务已被其他执行者接管。")
            lease=db.execute("SELECT resource_key FROM shuku_task_leases WHERE task_id=%s AND lease_token=%s AND expires_at>%s FOR UPDATE",(tid,token,now)).fetchone()
            require(lease,409,"STALE_LEASE","任务租约已失效。")
            status="queued" if deferred else "succeeded" if error is None else ("queued" if row["attempts"]<row["max_attempts"] else "failed")
            db.execute("UPDATE shuku_tasks SET status=%s,result=%s,error_code=%s,available_at=%s,attempts=attempts-%s,lease_until=NULL,lease_token=NULL WHERE id=%s",(status,JsonValue(result),error,now+(2 if deferred else min(60,2**row["attempts"])),1 if deferred else 0,tid))
            db.execute("DELETE FROM shuku_task_leases WHERE task_id=%s AND lease_token=%s",(tid,token))
            return status

    def checkpoint(self, tid, token, now, checkpoint, ttl=30):
        with self.transaction() as db:
            row=db.execute("SELECT t.resource_key FROM shuku_tasks t WHERE t.id=%s AND t.status='running' AND t.lease_token=%s AND t.lease_until>%s AND EXISTS(SELECT 1 FROM shuku_task_leases l WHERE l.task_id=t.id AND l.lease_token=t.lease_token AND l.expires_at>%s) FOR UPDATE",(tid,token,now,now)).fetchone()
            require(row,409,"STALE_LEASE","任务租约已失效。")
            db.execute("UPDATE shuku_tasks SET checkpoint=%s,lease_until=%s WHERE id=%s",(JsonValue(checkpoint),now+ttl,tid))
            db.execute("UPDATE shuku_task_leases SET expires_at=%s WHERE task_id=%s AND lease_token=%s",(now+ttl,tid,token))


def course_view(row):
    return {key:str(value) if isinstance(value,UUID) else value for key,value in row.items()}
