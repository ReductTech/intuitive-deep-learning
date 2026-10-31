"""Account-scoped bookmarks and optimistic, version-bound study state."""
import json
import re
from urllib.parse import quote
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
            if module is None and version in (None,'builtin'):
                item=self.flow.library.course(alias)
                require(item.get('interactive_path') and item.get('page_ids'),404,'NOT_FOUND','互动课程不存在或已不可访问。')
                return {'resource':key,'title':item['title'],'version':'builtin','version_label':'互动课程',
                        'course_id':None,'revision_id':None,'pages':item['page_ids'],
                        'url':item['interactive_path'],'available':True}
            require(module and version in (None,'builtin'),404,'NOT_FOUND','课程版本不存在或已不可访问。')
            return {'resource':key,'title':module['title'],'version':'builtin','version_label':'内置课程',
                    'course_id':None,'revision_id':None,'pages':module['pages'],
                    'url':'/study?module='+quote(alias),'available':True}
        require(key.startswith('course:'),400,'INVALID_INPUT','课程标识不正确。')
        cid=identifier(key[7:])
        require(key=='course:'+cid,400,'INVALID_INPUT','请使用规范的课程标识。')
        course=db.execute("SELECT * FROM shuku_courses WHERE id=%s AND status='published' AND NOT deleting FOR SHARE",(cid,)).fetchone()
        require(course,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        if version is None:
            release=db.execute('SELECT * FROM shuku_releases WHERE id=%s',(course['current_release'],)).fetchone()
        else:
            release=db.execute('SELECT * FROM shuku_releases WHERE course_id=%s AND revision_id=%s',(cid,identifier(version))).fetchone()
        require(release,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        revision=db.execute("SELECT files FROM shuku_revisions WHERE id=%s AND state='ready'",(release['revision_id'],)).fetchone()
        require(revision,404,'NOT_FOUND','课程版本不存在或已不可访问。')
        project=json.loads(self.flow.bucket.read(revision['files']['project.json']['sha256']))
        rid=str(release['revision_id'])
        return {'resource':key,'title':project['title'],'version':rid,'version_label':'v'+release['version'],
                'course_id':cid,'revision_id':rid,'pages':[p['id'] for p in project['pages']],
                'page_details':teaching_pages(project,revision['files'],rid,str(course['module_id'])),
                'sandboxed':bool(project.get('source') or project.get('externalSnapshot')),'url':'/learn?revision='+rid,'available':True}

    def context(self,key,version):
        with self.store.transaction() as db:return self.resource(db,key,version)

    def favorite(self,uid,data):
        require(set(data)=={'resource','saved'} and type(data['saved']) is bool,400,'INVALID_INPUT','收藏信息格式不正确。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            # Serialize the cap and changes for this account, never accept client user IDs.
            db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,))
            if data['saved']:
                context=self.resource(db,data['resource'])
                old=db.execute('SELECT 1 FROM shuku_favorites WHERE user_id=%s AND resource=%s',(uid,data['resource'])).fetchone()
                count=db.execute('SELECT count(*) AS n FROM shuku_favorites WHERE user_id=%s',(uid,)).fetchone()['n']
                require(old or count<500,409,'FAVORITE_LIMIT','收藏已达 500 门，请先整理收藏。')
                db.insert_once('INSERT INTO shuku_favorites VALUES (%s,%s,%s,%s)',(uid,data['resource'],context['course_id'],self.clock()))
            else:
                require(isinstance(data['resource'],str) and len(data['resource'])<=120,400,'INVALID_INPUT','课程标识不正确。')
                db.execute('DELETE FROM shuku_favorites WHERE user_id=%s AND resource=%s',(uid,data['resource']))
        return {'saved':data['saved']}

    def state(self,uid,key,version):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            context=self.resource(db,key,version)
            row=db.execute('SELECT page_id,mode,completed,state_version,updated_at FROM shuku_learning_states WHERE user_id=%s AND resource=%s AND version=%s',(uid,key,version)).fetchone()
            # Built-in courses aren't versioned releases; don't silently resume a removed page.
            return {'account_id':uid,'context':context,'state':course_view(row) if row else None}

    def save(self,uid,data):
        require(set(data)=={'resource','version','page_id','mode','completed','expected_version'},400,'INVALID_INPUT','学习记录格式不正确。')
        require(isinstance(data['version'],str) and isinstance(data['page_id'],str) and data['mode'] in ('guide','ppt') and type(data['expected_version']) is int and 0<=data['expected_version']<2147483647 and isinstance(data['completed'],list) and len(data['completed'])<=1000 and all(isinstance(p,str) for p in data['completed']),400,'INVALID_INPUT','学习记录格式不正确。')
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,))
            context=self.resource(db,data['resource'],data['version'])
            require(data['page_id'] in context['pages'] and set(data['completed'])<=set(context['pages']),400,'INVALID_PAGE','学习页面不属于该课程版本。')
            old=db.execute('SELECT state_version FROM shuku_learning_states WHERE user_id=%s AND resource=%s AND version=%s',(uid,data['resource'],data['version'])).fetchone()
            require((old['state_version'] if old else 0)==data['expected_version'],409,'LEARNING_CHANGED','另一设备已更新学习进度，请刷新后继续。')
            recent=db.execute('SELECT max(updated_at) AS stamp FROM shuku_learning_states WHERE user_id=%s',(uid,)).fetchone()['stamp']
            now=max(self.clock(),(recent or 0)+0.000001)
            db.upsert('learning_states', dict(user_id=uid,resource=data['resource'],version=data['version'],course_id=context['course_id'],revision_id=context['revision_id'],page_id=data['page_id'],mode=data['mode'],completed=sorted(set(data['completed'])),state_version=data['expected_version']+1,updated_at=now), ['page_id','mode','completed','state_version','updated_at'])
            row=db.execute('SELECT page_id,mode,completed,state_version,updated_at FROM shuku_learning_states WHERE user_id=%s AND resource=%s AND version=%s',(uid,data['resource'],data['version'])).fetchone()
            return course_view(row)

    def listing(self,uid,cursor=None):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            favorites=db.execute('SELECT resource FROM shuku_favorites WHERE user_id=%s ORDER BY created_at DESC,resource LIMIT 500',(uid,)).fetchall()
            params=[uid];where=''
            if cursor:
                try:
                    stamp,key,version=json.loads(cursor)
                    require(type(stamp) in (int,float) and isinstance(key,str) and len(key)<=120 and isinstance(version,str) and len(version)<=40,400,'INVALID_CURSOR','分页位置不正确。')
                except (ValueError,TypeError):raise BusinessError(400,'INVALID_CURSOR','分页位置不正确。')
                where=' AND (updated_at,resource,version)<(%s,%s,%s)';params.extend([stamp,key,version])
            rows=db.execute('SELECT * FROM (SELECT s.*,ROW_NUMBER() OVER(PARTITION BY resource ORDER BY updated_at DESC,version DESC) AS resource_rank FROM shuku_learning_states s WHERE user_id=%s) recent WHERE resource_rank=1'+where+' ORDER BY updated_at DESC,resource DESC,version DESC LIMIT 21',params).fetchall()
            saved_courses=[course_view(r) for r in db.execute("SELECT c.id,c.title,c.description,c.category,l.version,l.revision_id FROM shuku_favorites f JOIN shuku_courses c ON c.id=f.course_id JOIN shuku_releases l ON l.id=c.current_release WHERE f.user_id=%s AND c.status='published' AND NOT c.deleting ORDER BY f.created_at DESC,c.id LIMIT 500",(uid,)).fetchall()]
            result=[]
            for row in rows[:20]:
                try:context=self.resource(db,row['resource'],row['version'])
                except BusinessError as error:
                    if error.status!=404:raise
                    context={'resource':row['resource'],'title':'课程暂不可访问','version':row['version'],'available':False,'pages':[],'url':None,'version_label':''}
                result.append({**context,**{k:row[k] for k in ('page_id','mode','completed','updated_at')},'page_count':len(context['pages'])})
            last=rows[19] if len(rows)>20 else None
            return {'account_id':uid,'favorite_courses':saved_courses,'favorites':[r['resource'] for r in favorites],'history':result,'next_cursor':json.dumps([last['updated_at'],last['resource'],last['version']]) if last else None}


def teaching_pages(project,files,rid,module_id):
    """Public presentation metadata, bound to the selected release's own artifacts."""
    pages=[]
    for page in project['pages']:
        stem='assets/'+module_id+'/scenedeck-thumbnails/'+str(page.get('nativeId',''))
        # Older frozen releases keep their original PNG members.
        path=next((stem+ext for ext in ('.jpg','.png') if stem+ext in files),None)
        thumbnail='/api/shuku/revisions/'+rid+'/files/'+quote(path,safe='/') if page.get('nativeId') and path else None
        pages.append({'id':page['id'],'title':page['title'],'thumbnail':thumbnail})
    return pages
