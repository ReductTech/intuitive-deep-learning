"""Account-scoped bookmarks and optimistic, version-bound study state."""
import json
import re
from urllib.parse import quote
from psycopg.types.json import Jsonb
from .errors import BusinessError, require
from .workflow import identifier
from .storage import course_view


class PersonalLearning:
    def __init__(self, flow):
        self.flow, self.store, self.clock = flow, flow.store, flow.clock

    def resource(self, db, key, version=None):
        require(isinstance(key,str) and len(key)<=120,400,'INVALID_INPUT','课程标识不正确。')
        if key.startswith('module:'):
            alias=key[7:]
            require(re.fullmatch(r'[A-Za-z0-9_-]+',alias),400,'INVALID_INPUT','课程标识不正确。')
            module=next((m for m in self.flow.modules() if m['alias']==alias),None)
            require(module and version in (None,'builtin'),404,'NOT_FOUND','课程版本不存在或已不可访问。')
            return {'resource':key,'title':module['title'],'version':'builtin','version_label':'内置课程',
                    'course_id':None,'revision_id':None,'pages':module['pages'],
                    'url':'/study?module='+quote(alias),'available':True}
        require(key.startswith('course:'),400,'INVALID_INPUT','课程标识不正确。')
        cid=identifier(key[7:])
        require(key=='course:'+cid,400,'INVALID_INPUT','请使用规范的课程标识。')
        course=db.execute("SELECT * FROM shuku_business.courses WHERE id=%s AND status='published' AND NOT deleting FOR SHARE",(cid,)).fetchone()
        require(course,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        if version is None:
            release=db.execute('SELECT * FROM shuku_business.releases WHERE id=%s',(course['current_release'],)).fetchone()
        else:
            release=db.execute('SELECT * FROM shuku_business.releases WHERE course_id=%s AND revision_id=%s',(cid,identifier(version))).fetchone()
        require(release,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        revision=db.execute("SELECT files FROM shuku_business.revisions WHERE id=%s AND state='ready'",(release['revision_id'],)).fetchone()
        require(revision,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        project=json.loads(self.flow.bucket.read(revision['files']['project.json']['sha256']))
        rid=str(release['revision_id'])
        return {'resource':key,'title':project['title'],'version':rid,'version_label':'v'+release['version'],
                'course_id':cid,'revision_id':rid,'pages':[p['id'] for p in project['pages']],
                'url':'/learn?revision='+rid,'available':True}

    def context(self,key,version):
        with self.store.transaction() as db:return self.resource(db,key,version)

    def favorite(self,uid,data):
        require(set(data)=={'resource','saved'} and type(data['saved']) is bool,400,'INVALID_INPUT','收藏信息格式不正确。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            # Serialize the cap and changes for this account, never accept client user IDs.
            db.execute('SELECT pg_advisory_xact_lock(hashtextextended(%s,0))',('personal:'+uid,))
            if data['saved']:
                context=self.resource(db,data['resource'])
                old=db.execute('SELECT 1 FROM shuku_business.favorites WHERE user_id=%s AND resource=%s',(uid,data['resource'])).fetchone()
                count=db.execute('SELECT count(*) AS n FROM shuku_business.favorites WHERE user_id=%s',(uid,)).fetchone()['n']
                require(old or count<500,409,'FAVORITE_LIMIT','收藏已达 500 门，请先整理收藏。')
                db.execute('INSERT INTO shuku_business.favorites VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING',(uid,data['resource'],context['course_id'],self.clock()))
            else:
                require(isinstance(data['resource'],str) and len(data['resource'])<=120,400,'INVALID_INPUT','课程标识不正确。')
                db.execute('DELETE FROM shuku_business.favorites WHERE user_id=%s AND resource=%s',(uid,data['resource']))
        return {'saved':data['saved']}

    def state(self,uid,key,version):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            context=self.resource(db,key,version)
            row=db.execute('SELECT page_id,mode,completed,state_version,updated_at FROM shuku_business.learning_states WHERE user_id=%s AND resource=%s AND version=%s',(uid,key,version)).fetchone()
            # Built-in courses aren't versioned releases; don't silently resume a removed page.
            return {'account_id':uid,'context':context,'state':course_view(row) if row else None}

    def save(self,uid,data):
        require(set(data)=={'resource','version','page_id','mode','completed','expected_version'},400,'INVALID_INPUT','学习记录格式不正确。')
        require(isinstance(data['version'],str) and isinstance(data['page_id'],str) and data['mode'] in ('guide','ppt') and type(data['expected_version']) is int and 0<=data['expected_version']<2147483647 and isinstance(data['completed'],list) and len(data['completed'])<=1000 and all(isinstance(p,str) for p in data['completed']),400,'INVALID_INPUT','学习记录格式不正确。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            db.execute('SELECT pg_advisory_xact_lock(hashtextextended(%s,0))',('personal:'+uid,))
            context=self.resource(db,data['resource'],data['version'])
            require(data['page_id'] in context['pages'] and set(data['completed'])<=set(context['pages']),400,'INVALID_PAGE','学习页面不属于该课程版本。')
            old=db.execute('SELECT state_version FROM shuku_business.learning_states WHERE user_id=%s AND resource=%s AND version=%s',(uid,data['resource'],data['version'])).fetchone()
            require((old['state_version'] if old else 0)==data['expected_version'],409,'LEARNING_CHANGED','另一设备已更新学习进度，请刷新后继续。')
            recent=db.execute('SELECT max(updated_at) AS stamp FROM shuku_business.learning_states WHERE user_id=%s',(uid,)).fetchone()['stamp']
            now=max(self.clock(),(recent or 0)+0.000001)
            row=db.execute('INSERT INTO shuku_business.learning_states VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(user_id,resource,version) DO UPDATE SET page_id=EXCLUDED.page_id,mode=EXCLUDED.mode,completed=EXCLUDED.completed,state_version=EXCLUDED.state_version,updated_at=EXCLUDED.updated_at RETURNING page_id,mode,completed,state_version,updated_at',(uid,data['resource'],data['version'],context['course_id'],context['revision_id'],data['page_id'],data['mode'],Jsonb(sorted(set(data['completed']))),data['expected_version']+1,now)).fetchone()
            return course_view(row)

    def listing(self,uid,cursor=None):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            favorites=db.execute('SELECT resource FROM shuku_business.favorites WHERE user_id=%s ORDER BY created_at DESC,resource LIMIT 500',(uid,)).fetchall()
            params=[uid];where=''
            if cursor:
                try:
                    stamp,key,version=json.loads(cursor)
                    require(type(stamp) in (int,float) and isinstance(key,str) and len(key)<=120 and isinstance(version,str) and len(version)<=40,400,'INVALID_CURSOR','分页位置不正确。')
                except (ValueError,TypeError):raise BusinessError(400,'INVALID_CURSOR','分页位置不正确。')
                where=' WHERE (updated_at,resource,version)<(%s,%s,%s)';params.extend([stamp,key,version])
            rows=db.execute('SELECT * FROM (SELECT DISTINCT ON(resource) * FROM shuku_business.learning_states WHERE user_id=%s ORDER BY resource,updated_at DESC,version DESC) recent'+where+' ORDER BY updated_at DESC,resource DESC,version DESC LIMIT 21',params).fetchall()
            saved_courses=[course_view(r) for r in db.execute("SELECT c.id,c.title,c.description,c.category,l.version,l.revision_id FROM shuku_business.favorites f JOIN shuku_business.courses c ON c.id=f.course_id JOIN shuku_business.releases l ON l.id=c.current_release WHERE f.user_id=%s AND c.status='published' AND NOT c.deleting ORDER BY f.created_at DESC,c.id LIMIT 500",(uid,)).fetchall()]
            result=[]
            for row in rows[:20]:
                try:context=self.resource(db,row['resource'],row['version'])
                except BusinessError as error:
                    if error.status!=404:raise
                    context={'resource':row['resource'],'title':'课程暂不可访问','version':row['version'],'available':False,'pages':[],'url':None,'version_label':''}
                result.append({**context,**{k:row[k] for k in ('page_id','mode','completed','updated_at')},'page_count':len(context['pages'])})
            last=rows[19] if len(rows)>20 else None
            return {'account_id':uid,'favorite_courses':saved_courses,'favorites':[r['resource'] for r in favorites],'history':result,'next_cursor':json.dumps([last['updated_at'],last['resource'],last['version']]) if last else None}
