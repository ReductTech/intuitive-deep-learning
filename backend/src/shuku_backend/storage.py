"""Scoped PostgreSQL access. No JSON or in-memory database fallback."""
from contextlib import contextmanager
from importlib.resources import files
from hashlib import sha256
from uuid import uuid4, UUID
import json
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from .errors import BusinessError, require

DEMO_USERS = (
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f01", "linzhi", "林知", "learner"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f02", "xiaoman", "小满", "creator"),
    ("c46c13b0-4c69-5e36-aa4a-4d57ffdb0f03", "admin", "管理员", "admin"),
)


class Store:
    def __init__(self, database_url):
        self.database_url = database_url

    @contextmanager
    def transaction(self):
        with psycopg.connect(self.database_url, connect_timeout=5, row_factory=dict_row,
                             options="-c statement_timeout=10000 -c lock_timeout=3000") as db:
            yield db

    def migrate(self):
        with self.transaction() as db:
            db.execute("SELECT pg_advisory_xact_lock(791034102)")
            db.execute("CREATE SCHEMA IF NOT EXISTS shuku_business")
            db.execute("CREATE TABLE IF NOT EXISTS shuku_business.schema_migrations (version text PRIMARY KEY, checksum text NOT NULL)")
            for path in sorted(files("shuku_backend").joinpath("migrations").iterdir(), key=lambda p:p.name):
                if not path.name.endswith(".sql"):
                    continue
                source = path.read_text(encoding="utf-8")
                digest = sha256(source.encode()).hexdigest()
                applied = db.execute("SELECT checksum FROM shuku_business.schema_migrations WHERE version=%s", (path.name,)).fetchone()
                if applied:
                    if applied["checksum"] != digest:
                        raise RuntimeError("Applied schema migration has changed")
                    continue
                db.execute(source, prepare=False)
                db.execute("INSERT INTO shuku_business.schema_migrations VALUES (%s,%s)", (path.name,digest))

    def ready(self):
        with self.transaction() as db:
            rows = db.execute("SELECT version,checksum FROM shuku_business.schema_migrations").fetchall()
            applied = {row["version"]: row["checksum"] for row in rows}
            expected = {p.name for p in files("shuku_backend").joinpath("migrations").iterdir() if p.name.endswith(".sql")}
            if set(applied) != expected:
                raise RuntimeError("Database schema version does not match this backend")
            for p in files("shuku_backend").joinpath("migrations").iterdir():
                if p.name.endswith(".sql") and applied.get(p.name) != sha256(p.read_bytes()).hexdigest():
                    raise RuntimeError("Run shuku_backend migrate before serving")
            db.execute("SELECT id FROM shuku_business.users LIMIT 0")

    def seed_demo(self):
        with self.transaction() as db:
            for uid,name,display,role in DEMO_USERS:
                existing = db.execute("SELECT id,username,role FROM shuku_business.users WHERE id=%s OR username=%s", (uid,name)).fetchall()
                if existing:
                    if len(existing)!=1 or str(existing[0]["id"])!=uid or existing[0]["username"]!=name or existing[0]["role"]!=role:
                        raise RuntimeError("Demo account conflicts with an existing user")
                    continue
                db.execute("INSERT INTO shuku_business.users(id,username,display_name,role) VALUES (%s,%s,%s,%s)",(uid,name,display,role))

    @staticmethod
    def user_in(db, uid):
        user = db.execute("SELECT id,username,display_name,role FROM shuku_business.users WHERE id=%s AND active",(uid,)).fetchone()
        require(user,401,"LOGIN_REQUIRED","请重新登录。")
        return {**user,"id":str(user["id"])}

    def session_user(self, token_hash, now):
        with self.transaction() as db:
            row=db.execute("SELECT user_id FROM shuku_business.sessions WHERE token_hash=%s AND expires_at>%s",(token_hash,now)).fetchone()
            require(row,401,"LOGIN_REQUIRED","请先登录。")
            return self.user_in(db,row["user_id"])

    def remove_session(self, token_hash):
        with self.transaction() as db:
            db.execute("DELETE FROM shuku_business.sessions WHERE token_hash=%s",(token_hash,))

    def create_course(self, uid, data, now):
        require(isinstance(data,dict),400,"INVALID_INPUT","课程信息格式不正确。")
        require(not set(data)-{"title","description","category","module_id"},400,"INVALID_INPUT","包含不支持的课程字段。")
        for key,limit in [("title",120),("description",3000),("category",80)]:
            value=data.get(key,"")
            require(isinstance(value,str) and len(value)<=limit and (key!="title" or value.strip()),400,"INVALID_INPUT","请检查课程名称、简介和类别。")
        try: module_id=str(UUID(data.get("module_id","")))
        except (ValueError,TypeError,AttributeError):raise BusinessError(400,"INVALID_INPUT","模块 ID 必须为 UUID。")
        with self.transaction() as db:
            user=self.user_in(db,uid)
            require(user["role"] in ("creator","admin"),403,"FORBIDDEN","当前账号没有创建权限。")
            cid=str(uuid4())
            row=db.execute("INSERT INTO shuku_business.courses(id,owner_id,module_id,title,description,category,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",(cid,uid,module_id,data["title"].strip(),data.get("description",""),data.get("category",""),now)).fetchone()
            db.execute("INSERT INTO shuku_business.audit(user_id,action,object_id,created_at) VALUES (%s,'course.create',%s,%s)",(uid,cid,now))
            return course_view(row)

    def courses(self, uid):
        with self.transaction() as db:
            user=self.user_in(db,uid)
            return [course_view(r) for r in db.execute("SELECT c.* FROM shuku_business.courses c WHERE c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_business.course_managers m WHERE m.course_id=c.id AND m.user_id=%s) ORDER BY c.created_at,c.id LIMIT 100",(uid,user["role"]=="admin",uid)).fetchall()]

    def course(self, uid, cid):
        try: cid=str(UUID(cid))
        except ValueError:raise BusinessError(404,"NOT_FOUND","课程不存在。")
        with self.transaction() as db:
            user=self.user_in(db,uid)
            row=db.execute("SELECT c.* FROM shuku_business.courses c WHERE c.id=%s AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_business.course_managers m WHERE m.course_id=c.id AND m.user_id=%s))",(cid,uid,user["role"]=="admin",uid)).fetchone()
            require(row,404,"NOT_FOUND","课程不存在。")
            return course_view(row)

    def enqueue(self, kind, resource, key, payload, now):
        digest=sha256(json.dumps([kind,resource,payload],sort_keys=True,separators=(",",":")).encode()).hexdigest()
        with self.transaction() as db:
            tid=str(uuid4())
            db.execute("INSERT INTO shuku_business.tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(idempotency_key) DO NOTHING",(tid,kind,resource,key,digest,Jsonb(payload),now,now))
            row=db.execute("SELECT id,request_hash FROM shuku_business.tasks WHERE idempotency_key=%s",(key,)).fetchone()
            require(row["request_hash"]==digest,409,"IDEMPOTENCY_CONFLICT","相同请求标识不能用于不同内容。")
            return str(row["id"])

    def claim(self, kinds, now, ttl=30):
        if not kinds:return None
        with self.transaction() as db:
            exhausted=db.execute("WITH exhausted AS (SELECT id FROM shuku_business.tasks WHERE status='running' AND lease_until<=%s AND attempts>=max_attempts FOR UPDATE SKIP LOCKED) UPDATE shuku_business.tasks SET status='failed',error_code='ATTEMPTS_EXHAUSTED',lease_token=NULL,lease_until=NULL WHERE id IN (SELECT id FROM exhausted) RETURNING id",(now,)).fetchall()
            for old in exhausted:
                db.execute("DELETE FROM shuku_business.task_leases WHERE task_id=%s AND expires_at<=%s",(old["id"],now))
            candidates=db.execute("SELECT * FROM shuku_business.tasks WHERE kind=ANY(%s) AND attempts<max_attempts AND ((status='queued' AND available_at<=%s) OR (status='running' AND lease_until<=%s)) ORDER BY created_at,id LIMIT 16 FOR UPDATE SKIP LOCKED",(list(kinds),now,now)).fetchall()
            for row in candidates:
                token=uuid4()
                lease=db.execute("INSERT INTO shuku_business.task_leases(resource_key,task_id,lease_token,expires_at) VALUES (%s,%s,%s,%s) ON CONFLICT(resource_key) DO UPDATE SET task_id=EXCLUDED.task_id,lease_token=EXCLUDED.lease_token,expires_at=EXCLUDED.expires_at WHERE shuku_business.task_leases.expires_at<=%s RETURNING resource_key",(row["resource_key"],row["id"],token,now+ttl,now)).fetchone()
                if not lease:continue
                return db.execute("UPDATE shuku_business.tasks SET status='running',attempts=attempts+1,lease_token=%s,lease_until=%s WHERE id=%s RETURNING *",(token,now+ttl,row["id"])).fetchone()

    def finish(self, tid, token, now, *, result=None, error=None):
        with self.transaction() as db:
            row=db.execute("SELECT * FROM shuku_business.tasks WHERE id=%s FOR UPDATE",(tid,)).fetchone()
            require(row and row["status"]=="running" and str(row["lease_token"])==str(token) and row["lease_until"]>now,409,"STALE_LEASE","任务已被其他执行者接管。")
            lease=db.execute("SELECT resource_key FROM shuku_business.task_leases WHERE task_id=%s AND lease_token=%s AND expires_at>%s FOR UPDATE",(tid,token,now)).fetchone()
            require(lease,409,"STALE_LEASE","任务租约已失效。")
            status="succeeded" if error is None else ("queued" if row["attempts"]<row["max_attempts"] else "failed")
            db.execute("UPDATE shuku_business.tasks SET status=%s,result=%s,error_code=%s,available_at=%s,lease_until=NULL,lease_token=NULL WHERE id=%s",(status,Jsonb(result),error,now+min(60,2**row["attempts"]),tid))
            db.execute("DELETE FROM shuku_business.task_leases WHERE task_id=%s AND lease_token=%s",(tid,token))
            return status

    def checkpoint(self, tid, token, now, checkpoint, ttl=30):
        with self.transaction() as db:
            row=db.execute("UPDATE shuku_business.tasks t SET checkpoint=%s,lease_until=%s WHERE t.id=%s AND t.status='running' AND t.lease_token=%s AND t.lease_until>%s AND EXISTS(SELECT 1 FROM shuku_business.task_leases l WHERE l.task_id=t.id AND l.lease_token=t.lease_token AND l.expires_at>%s) RETURNING resource_key",(Jsonb(checkpoint),now+ttl,tid,token,now,now)).fetchone()
            require(row,409,"STALE_LEASE","任务租约已失效。")
            db.execute("UPDATE shuku_business.task_leases SET expires_at=%s WHERE task_id=%s AND lease_token=%s",(now+ttl,tid,token))


def course_view(row):
    return {key:str(value) if isinstance(value,UUID) else value for key,value in row.items()}
