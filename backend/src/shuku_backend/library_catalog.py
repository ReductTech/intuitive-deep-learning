"""Register a validated, fixed remote snapshot; HTTP reads only database metadata.

Catalog sync never creates users or releases. Explicit bootstrap adopts an existing snapshot under an existing administrator. Missing source entries
are absent from this deployed snapshot, while older snapshot records remain intact.
"""
import json
import os
from idl_backend.config import asset_directory, asset_relative
from pathlib import Path
import re
import subprocess
from urllib.parse import quote
from uuid import UUID,uuid4,uuid5,NAMESPACE_URL
from .errors import require

REPOSITORY = 'reduct-shuku/intuitive-deep-learning'


class LibraryCatalog:
    def __init__(self, workflow):
        self.w = workflow
        self.commit = None

    def sync(self):
        root = self.w.course_root
        if root is None or not (root/'course-library.json').is_file():
            # A source checkout can still build editor previews, but is not a
            # publication source for the production catalog.
            self.commit = None
            return 0
        def git(*args):
            return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=30).strip()
        manifest = json.loads((root/'course-library.json').read_text())
        source = json.loads((root/'source-lock.json').read_text())
        commit = git('rev-parse','HEAD')
        require(manifest.get('schema') == 1 and manifest.get('repository') == REPOSITORY
                and source.get('repository') == 'ReductTech/intuitive-deep-learning'
                and re.fullmatch('[0-9a-f]{40}',commit) and not git('status','--porcelain'),
                503,'INVALID_COURSE_LIBRARY','课程快照无效或存在未提交修改。')
        lock_path=Path(self.w.root)/'course-library.lock.json' if self.w.root else None
        if lock_path and lock_path.is_file():
            lock=json.loads(lock_path.read_text())
            require(lock.get('repository')==REPOSITORY and lock.get('commit')==commit,
                    503,'COURSE_VERSION_MISMATCH','课程快照与当前部署版本不一致。')
        modules = manifest.get('modules')
        require(isinstance(modules,list) and modules,503,'INVALID_COURSE_LIBRARY','课程清单为空。')
        rows=[];aliases=set();identities=set()
        for item in modules:
            directory=item.get('directory','')
            require(bool(re.fullmatch(r'[A-Za-z0-9_-]+',directory)),503,'INVALID_COURSE_LIBRARY','课程目录无效。')
            path=root/'modules'/directory/'outlines.json'
            require(path.resolve().is_relative_to(root.resolve()) and path.is_file(),503,'INVALID_COURSE_LIBRARY','课程描述不存在。')
            data=json.loads(path.read_text())
            if not data.get('entry') or not ((data.get('ppt') or {}).get('entry') or data.get('catalogListed') is True):continue
            uid=str(UUID(data['moduleIdentity']['id']));alias=data.get('id') or directory
            require(uid==item.get('uuid') and (item.get('id') or directory)==alias
                    and re.fullmatch(r'[A-Za-z0-9_-]+',alias) and alias not in aliases and uid not in identities,
                    503,'INVALID_COURSE_LIBRARY','课程标识不匹配或重复。')
            aliases.add(alias);identities.add(uid)
            pages=(self.w.runtime_scenes(uid,root,commit=commit) if (data.get('ppt') or {}).get('entry') else None) or data.get('pages',[])
            asset_id=uid
            assets=asset_directory(asset_id,root)
            cover=next((asset_relative(asset_id,'course-covers/'+p['id']+'.jpg',root) for p in pages if re.fullmatch(r'[A-Za-z0-9_-]+',p.get('id','')) and ((assets/asset_relative(asset_id,'course-covers/'+p['id']+'.jpg',root)).is_file() or os.environ.get('SHUKU_STORAGE')=='oss')),None)
            runtime_file=root.parent/('_runtime-'+commit+'.json')
            if os.environ.get('SHUKU_STORAGE')=='oss' and runtime_file.is_file():
                name=json.loads(runtime_file.read_text()).get('modules',{}).get(uid,{}).get('cover')
                cover=asset_relative(uid,'course-covers/'+name+'.jpg',root) if isinstance(name,str) and re.fullmatch('[A-Za-z0-9_-]+',name) else None
            payload={'kind':'library','id':uid,'module_id':uid,'alias':alias,
                     'title':data['title'],'description':data.get('description',''),
                     'category':data.get('category') or data.get('badge') or '课程',
                     'difficulty':data.get('difficulty',''),'page_count':len(pages),
                     'cover_url':(os.environ.get('IDL_ASSET_BASE_URL','https://image.reduct.cn/cloud-IDL/assets').rstrip('/')+'/'+asset_id+'/'+cover) if cover else None,
                     'repository':REPOSITORY,'source_commit':commit,
                     'github_url':'https://github.com/'+REPOSITORY+'/tree/'+commit+'/modules/'+quote(directory),
                     'version':commit[:8]}
            if not (data.get('ppt') or {}).get('entry'):
                payload.update(interactive_path=data.get('path') or '/modules/'+directory.lower(),
                               page_ids=[page['id'] for page in pages])
            rows.append({'module_id':uid,'snapshot_commit':commit,'alias':alias,'repository':REPOSITORY,'payload':payload,'synced_at':self.w.clock()})
        require(rows,503,'INVALID_COURSE_LIBRARY','没有可学习的课程。')
        # Validate the entire snapshot before a single transaction writes it.
        with self.w.store.transaction() as db:
            for row in rows:
                db.upsert('library_courses',row,('payload','synced_at'))
        self.commit=commit
        return len(rows)

    def courses(self):
        if not self.commit:return []
        with self.w.store.transaction() as db:
            rows=db.execute("SELECT l.payload,b.module_id AS bound,b.course_id,c.status,c.deleting,c.title,c.description,c.category,r.version,r.revision_id FROM shuku_library_courses l LEFT JOIN shuku_library_bindings b ON b.module_id=l.module_id LEFT JOIN shuku_courses c ON c.id=b.course_id LEFT JOIN shuku_releases r ON r.id=c.current_release WHERE l.snapshot_commit=%s ORDER BY l.alias",(self.commit,)).fetchall()
            result=[]
            for row in rows:
                if row['bound'] and (not row['course_id'] or row['deleting'] or row['status']=='hidden'):continue
                item=dict(row['payload'])
                if row['bound'] and row['status']=='published' and row['revision_id']:
                    item.update(course_id=row['course_id'],revision_id=row['revision_id'],version=row['version'],title=row['title'],description=row['description'],category=row['category'])
                result.append(item)
            return result

    def course(self,alias):
        result=next((c for c in self.courses() if c['alias']==alias),None)
        require(result,404,'NOT_FOUND','课程不存在或已不可访问。')
        return result

    def bootstrap(self,manager='admin'):
        """Explicit operator action: adopt current source as initial v1.0.0.

        Build tasks use the normal lease, retry and artifact verification path.
        Re-running never resets releases, managers or deletion tombstones.
        """
        require(self.commit,409,'COURSE_LIBRARY_REQUIRED','请先配置并同步独立课程快照。')
        with self.w.store.transaction() as db:
            user=db.execute("SELECT * FROM shuku_users WHERE username=%s AND role='admin' AND active",(manager,)).fetchone()
            require(user,404,'ADMIN_REQUIRED','请指定现有的有效管理员账号。')
            uid=user['id']
            # Serializes concurrent bootstrap invocations without a new global lock.
            db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,))
            entries=db.execute('SELECT payload FROM shuku_library_courses WHERE snapshot_commit=%s ORDER BY alias',(self.commit,)).fetchall()
            created=[];retried=0
            for entry in entries:
                item=entry['payload'];mid=item['module_id']
                # Guide-only interactive modules have no deck revision to bootstrap.
                if not self.w.module_context(mid).get('directory'):continue
                binding=db.execute('SELECT b.*,c.head_revision,c.current_release FROM shuku_library_bindings b LEFT JOIN shuku_courses c ON c.id=b.course_id WHERE b.module_id=%s',(mid,)).fetchone()
                if binding:
                    if binding['course_id'] and not binding['current_release'] and binding['head_revision']==binding['initial_revision_id']:
                        retried+=db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE idempotency_key=%s AND status='failed'",(self.w.clock(),'build:'+str(binding['initial_revision_id']))).rowcount
                    continue
                cid=str(uuid5(NAMESPACE_URL,'shuku:official:'+REPOSITORY+':'+mid))
                require(not db.execute('SELECT id FROM shuku_courses WHERE id=%s',(cid,)).fetchone(),409,'COURSE_ID_CONFLICT','官方课程标识已被占用。')
                project=self.initial_project(mid,cid,item['title'])
                db.execute("INSERT INTO shuku_courses(id,owner_id,module_id,title,description,category,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",(cid,uid,mid,item['title'],item['description'],item['category'],self.w.clock()))
                db.execute('INSERT INTO shuku_course_managers VALUES (%s,%s)',(cid,uid))
                db.execute('INSERT INTO shuku_library_bindings(module_id,course_id,source_commit,created_at) VALUES (%s,%s,%s,%s)',(mid,cid,self.commit,self.w.clock()))
                revision=self.w.save_in(db,uid,cid,{'project':project,'expected_revision':None},native_snapshot=self.commit)
                db.execute('UPDATE shuku_library_bindings SET initial_revision_id=%s WHERE module_id=%s',(revision['id'],mid))
                self.w.audit(db,uid,'library.bootstrap',cid)
                created.append({'course_id':cid,'revision_id':revision['id']})
        return {'created':created,'count':len(created),'retried':retried}

    def initial_project(self,mid,cid,title):
        module=self.w.module_context(mid)
        data=json.loads((Path(module['directory'])/'outlines.json').read_text())
        outlines={p['id']:p for p in data.get('pages',[]) if p.get('id')}
        scenes=self.w.runtime_scenes(mid,required=True)
        return {'version':1,'id':cid,'courseId':module['alias'],'title':title,'duration':30,'style':'原课程','outlineConfirmed':True,'nativeSnapshot':self.commit,'sourceSceneIds':[p['id'] for p in scenes],
                'pages':[{'id':p['id'],'nativeId':p['id'],'title':p['title'],'goal':outlines.get(p['id'],{}).get('goal','理解本页的核心概念。'),'summary':outlines.get(p['id'],{}).get('summary',p['title']),'ready':True,'designed':True,'note':'','revisions':[],'messages':[]} for p in scenes]}

    def complete_initial(self,db,rid,digest):
        row=db.execute("SELECT c.id,c.owner_id,c.head_revision,c.current_release,c.status FROM shuku_library_bindings b JOIN shuku_courses c ON c.id=b.course_id WHERE c.head_revision=%s AND b.initial_revision_id=%s FOR UPDATE",(rid,rid)).fetchone()
        if not row or row['current_release'] or row['status']!='draft':return
        # Only the explicit initial import has a draft without a release; normal
        # review/publication gates remain mandatory for every later revision.
        require(not db.execute('SELECT 1 FROM shuku_reviews WHERE course_id=%s',(row['id'],)).fetchone(),409,'INITIAL_IMPORT_CHANGED','初始登记已变化。')
        release=str(uuid4());note='登记当前课程快照为初始版本'
        db.execute("INSERT INTO shuku_reviews(id,revision_id,course_id,status,artifact_hash,note,created_at,decided_at) VALUES (%s,%s,%s,'published',%s,%s,%s,%s)",(uuid4(),rid,row['id'],digest,note,self.w.clock(),self.w.clock()))
        db.execute('INSERT INTO shuku_releases(id,course_id,revision_id,version,note,publisher_id,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)',(release,row['id'],rid,'1.0.0',note,row['owner_id'],self.w.clock()))
        db.execute("UPDATE shuku_courses SET status='published',current_release=%s WHERE id=%s",(release,row['id']))
        self.w.audit(db,row['owner_id'],'library.initial_release',release)
