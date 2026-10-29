"""Immutable editor revisions, authorized files and local-course review/publication."""
import base64
import hashlib
import json
import mimetypes
from pathlib import Path
import re
import subprocess
import tempfile
import time
from uuid import UUID,uuid4
from shuku_backend.database import JsonValue
from .errors import BusinessError,require
from .storage import course_view


def identifier(value):
    try:return str(UUID(value))
    except (ValueError,TypeError,AttributeError):raise BusinessError(400,"INVALID_ID","标识格式不正确。")


class Workflow:
    def __init__(self,store,bucket,root,clock=time.time,course_root=None):
        self.store,self.bucket,self.root,self.clock=store,bucket,root,clock
        self.course_root=Path(course_root or root) if (course_root or root) else None

    def modules(self,course_root=None):
        require(self.course_root is not None,503,"BUILD_NOT_CONFIGURED","课程构建目录尚未配置。")
        result=[]
        for path in sorted(((course_root or self.course_root)/'modules').glob('*/outlines.json')):
            data=json.loads(path.read_text())
            if data.get('ppt',{}).get('entry') and data.get('entry'):
                result.append({'id':data['moduleIdentity']['id'],'alias':data.get('id',path.parent.name),'title':data['title'],'directory':str(path.parent),'entry':data['ppt']['entry'],'pages':list(dict.fromkeys(p['id'] for p in [*(self.runtime_scenes(data['moduleIdentity']['id'],course_root or self.course_root) or []),*data.get('pages',[])] if isinstance(p,dict) and isinstance(p.get('id'),str) and p['id']))})
        return result

    def runtime_scenes(self,module_id,root=None,required=False,commit=None):
        root=root or self.course_root
        if root is None:
            require(not required,409,'RUNTIME_CATALOG_REQUIRED','请先导出课程实际页面清单。')
            return None
        commit=commit or (root.name if re.fullmatch('[0-9a-f]{40}',root.name) else getattr(getattr(self,'library',None),'commit',None))
        path=root.parent/('_runtime-'+str(commit)+'.json')
        if not path.is_file():
            require(not required,409,'RUNTIME_CATALOG_REQUIRED','请先导出课程实际页面清单，再登记正式版本。')
            return None
        data=json.loads(path.read_text());item=data.get('modules',{}).get(str(module_id))
        require(data.get('schema')==1 and data.get('commit')==commit and isinstance(item,dict),409,'INVALID_RUNTIME_CATALOG','实际页面清单与课程快照不匹配。')
        scenes=item.get('scenes')
        require(isinstance(scenes,list) and 1<=len(scenes)<=100 and all(isinstance(p,dict) and isinstance(p.get('id'),str) and 0<len(p['id'])<=200 and isinstance(p.get('title'),str) and p['title'] for p in scenes) and len({p['id'] for p in scenes})==len(scenes),409,'INVALID_RUNTIME_CATALOG','实际页面清单不完整或存在重复页面。')
        return scenes

    def module_context(self,module_id,course_root=None):
        return next((m for m in self.modules(course_root) if m['id']==str(module_id)),
                    {'id':str(module_id),'alias':'custom-'+str(module_id),'pages':[],'directory':None})

    def native_root(self,commit):
        if not commit:return self.course_root
        require(isinstance(commit,str) and re.fullmatch('[0-9a-f]{40}',commit) and self.course_root is not None,409,'SOURCE_SNAPSHOT_MISSING','课程基础源码快照不可用。')
        root=self.course_root if commit==getattr(getattr(self,'library',None),'commit',None) or self.course_root.name==commit else self.course_root.parent/commit
        require(root.is_dir() and not root.is_symlink() and json.loads((root/'course-library.json').read_text()).get('repository')=='reduct-shuku/intuitive-deep-learning',409,'SOURCE_SNAPSHOT_MISSING','课程基础源码快照不可用。')
        return root

    def owner(self,db,uid,cid):
        user=self.store.user_in(db,uid)
        row=db.execute('SELECT * FROM shuku_courses WHERE id=%s FOR UPDATE',(identifier(cid),)).fetchone()
        require(row and not row['deleting'] and not db.execute('SELECT 1 FROM shuku_workspaces w JOIN shuku_courses t ON t.id=w.target_course_id WHERE w.id=%s AND t.deleting',(cid,)).fetchone(),404,'NOT_FOUND','课程不存在或正在移除。')
        require(str(row['owner_id'])==uid or user['role']=='admin' or db.execute('SELECT 1 FROM shuku_course_managers WHERE course_id=%s AND user_id=%s',(cid,uid)).fetchone(),403,'FORBIDDEN','没有课程管理权限。')
        return row,user

    def audit(self,db,uid,action,obj):
        db.execute('INSERT INTO shuku_audit(user_id,action,object_id,created_at) VALUES (%s,%s,%s,%s)',(uid,action,str(obj),self.clock()))

    def prepare(self,project,module):
        require(isinstance(project,dict) and project.get('version')==1 and project.get('courseId')==module['alias'],400,'INVALID_PROJECT','课程内容与模块不匹配。')
        require(isinstance(project.get('title'),str) and 0<len(project['title'])<=120,400,'INVALID_PROJECT','请填写课件名称。')
        if 'repositoryName' in project and project['repositoryName']!='':
            from .repository_names import repository_name
            project['repositoryName']=repository_name(project['repositoryName'])
        pages=project.get('pages')
        require(isinstance(pages,list) and 1<=len(pages)<=100,400,'INVALID_PROJECT','课程需要 1～100 页。')
        require(type(project.get('duration')) in (int,float) and 0<project['duration']<=480 and isinstance(project.get('style'),str) and isinstance(project.get('outlineConfirmed'),bool),400,'INVALID_PROJECT','课程设置格式不正确。')
        ids=set()
        for page in pages:
            require(isinstance(page,dict) and isinstance(page.get('id'),str) and page['id'] not in ids,400,'INVALID_PROJECT','页面标识无效或重复。');ids.add(page['id'])
            for key in ['title','goal','summary','note']:
                require(isinstance(page.get(key),str) and len(page[key])<=10000,400,'INVALID_PROJECT','页面文字格式不正确。')
            require(isinstance(page.get('revisions',[]),list) and len(page.get('revisions',[]))<=100 and isinstance(page.get('messages',[]),list),400,'INVALID_PROJECT','页面历史格式不正确。')
            require(isinstance(page.get('ready'),bool) and isinstance(page.get('designed'),bool),400,'INVALID_PROJECT','页面状态格式不正确。')
            require(all(isinstance(item,dict) and all(isinstance(item.get(k),str) for k in ('title','goal','summary','note')) and isinstance(item.get('ready'),bool) and isinstance(item.get('designed'),bool) for item in page.get('revisions',[])),400,'INVALID_PROJECT','页面历史格式不正确。')
            require(all(isinstance(item,dict) and item.get('role') in ('user','assistant') and isinstance(item.get('text'),str) for item in page.get('messages',[])),400,'INVALID_PROJECT','对话记录格式不正确。')
            native=page.get('nativeId')
            require(native in module['pages'] if native else page.get('format') in ('text','react'),400,'UNSUPPORTED_PAGE','请使用原课程页面或文字教学页，模拟网页不能发布，请保存文字页或 React 源码。')
        from .source import validate_source
        source_files=validate_source(project)
        value=json.loads(json.dumps(project))
        images=value.pop('designImages',{})
        require(isinstance(images,dict) and len(images)<=200,400,'INVALID_PROJECT','设计图数据格式不正确。')
        objects={'sources/'+name:{**self.bucket.put(text.encode()),'mime':'text/plain'} for name,text in source_files.items()}
        image_map={}
        for key,data in images.items():
            require(re.fullmatch(r'[A-Za-z0-9_-]{1,80}',key) and isinstance(data,str),400,'INVALID_IMAGE','设计图格式不正确。')
            match=re.fullmatch(r'data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)',data)
            require(match,400,'INVALID_IMAGE','仅支持 PNG、JPEG 或 WebP 设计图。')
            try:content=base64.b64decode(match[2],validate=True)
            except ValueError:raise BusinessError(400,'INVALID_IMAGE','设计图编码不正确。')
            require(len(content)<=8*1024*1024,413,'IMAGE_LIMIT','单张设计图过大。')
            valid=(content.startswith(b'\x89PNG\r\n\x1a\n') if match[1]=='png' else content.startswith(b'\xff\xd8\xff') if match[1]=='jpeg' else content.startswith(b'RIFF') and content[8:12]==b'WEBP')
            require(valid,400,'INVALID_IMAGE','设计图内容与格式不匹配。')
            path='images/'+key+'.'+match[1]
            objects[path]={**self.bucket.put(content),'mime':'image/'+match[1]};image_map[key]=path
        referenced={p.get('designImageId') for p in pages if p.get('designImageId')}
        referenced.update(x.get('designImageId') for p in pages for x in p.get('revisions',[]) if isinstance(x,dict) and x.get('designImageId'))
        require(referenced.issubset(image_map),400,'INVALID_IMAGE','设计图缺失，请重新保存。')
        value['designImages']=image_map
        content=json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
        objects['project.json']={**self.bucket.put(content),'mime':'application/json'}
        digest=hashlib.sha256(json.dumps(objects,sort_keys=True).encode()).hexdigest()
        return objects,digest

    def save(self,uid,cid,data):
        require(isinstance(data,dict) and set(data)<= {'project','expected_revision','expected_draft'},400,'INVALID_INPUT','修订请求格式不正确。')
        with self.store.transaction() as db:
            return self.save_in(db,uid,cid,data)

    def save_in(self,db,uid,cid,data,remote_job_id=None,materials=None,native_snapshot=None):
        db.file_reference_lock(shared=True)
        course,_=self.owner(db,uid,cid)
        require(not db.execute('SELECT 1 FROM shuku_library_bindings WHERE course_id=%s AND initial_revision_id IS NOT NULL AND %s IS NULL',(cid,course['current_release'])).fetchone(),409,'INITIAL_IMPORT_BUSY','正在准备课程初始版本，请完成后再修改。')
        require(not db.execute("SELECT 1 FROM shuku_contributions WHERE (workspace_id=%s OR target_course_id=%s) AND status='merging'",(cid,cid)).fetchone(),409,'MERGE_BUSY','共创正在合并，请稍后再保存。')
        require(not db.execute("SELECT 1 FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.course_id=%s AND j.kind='release' AND t.status IN ('queued','running')",(cid,)).fetchone(),409,'RELEASE_BUSY','课程正在发布，请完成后再保存。')
        require(not db.execute("SELECT 1 FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.course_id=%s AND j.kind='external_merge' AND (%s IS NULL OR j.id<>%s) AND t.status IN ('queued','running')",(cid,remote_job_id,remote_job_id)).fetchone(),409,'MERGE_BUSY','外部共创正在合并，请完成后再保存。')
        draft=db.execute('SELECT version FROM shuku_editor_drafts WHERE course_id=%s',(cid,)).fetchone()
        if 'expected_draft' in data:
            require(data['expected_draft']==(draft['version'] if draft else None),409,'DRAFT_CONFLICT','草稿已在其他窗口更新，请保留当前内容并重新打开。')
        previous_project={}
        if course['head_revision']:
            existing=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['head_revision'],)).fetchone()
            require(not json.loads(self.bucket.read(existing['files']['project.json']['sha256'])).get('externalSnapshot'),409,'USE_GITHUB_CONTRIBUTION','静态仓库课程请通过 GitHub Pull Request 共创。')
        if course['head_revision']:
            prior=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['head_revision'],)).fetchone()
            previous_project=json.loads(self.bucket.read(prior['files']['project.json']['sha256']))
        pinned=previous_project.get('nativeSnapshot') or native_snapshot
        require(isinstance(data.get('project'),dict) and data['project'].get('nativeSnapshot')==pinned,409,'SOURCE_SNAPSHOT_CHANGED','不能更换本次共创的基础源码快照。')
        module=self.module_context(course['module_id'],self.native_root(pinned))
        require(data.get('expected_revision')==(str(course['head_revision']) if course['head_revision'] else None),409,'REVISION_CONFLICT','课程已更新，请重新载入后保存。')
        objects,digest=self.prepare(data.get('project'),module)
        # Retain private imported source across revisions without trusting client file pointers.
        if course['head_revision']:
            previous=db.execute('SELECT files FROM shuku_revisions WHERE id=%s AND course_id=%s',(course['head_revision'],cid)).fetchone()
            objects.update({k:v for k,v in previous['files'].items() if k.startswith('materials/')})
        if materials:objects.update(materials)
        digest=hashlib.sha256(json.dumps(objects,sort_keys=True).encode()).hexdigest()
        rid=str(uuid4());now=self.clock()
        db.execute("INSERT INTO shuku_revisions VALUES (%s,%s,%s,%s,'building',%s,NULL,%s)",(rid,cid,uid,digest,JsonValue(objects),now))
        db.execute("UPDATE shuku_reviews SET status='superseded' WHERE course_id=%s AND status IN ('pending','approved')",(cid,))
        db.execute('UPDATE shuku_courses SET head_revision=%s WHERE id=%s',(rid,cid))
        db.execute("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'revision.build',%s,%s,%s,%s,%s,%s)",(uuid4(),'course:'+cid,'build:'+rid,digest,JsonValue({'revision_id':rid}),now,now))
        db.execute("UPDATE shuku_contributions SET status='superseded' WHERE workspace_id=%s AND status IN ('pending','approved')",(cid,))
        if 'expected_draft' in data:
            db.execute('DELETE FROM shuku_editor_drafts WHERE course_id=%s',(cid,))
        self.audit(db,uid,'revision.save',rid)
        github=getattr(self,'github',None)
        if github and getattr(github,'hosted',None):github.hosted.queue_in(db,cid,rid)
        return {'id':rid,'state':'building'}


    def allowed(self,db,rid,uid,public=True):
        row=db.execute("SELECT r.*,c.owner_id,c.status AS course_status,c.module_id,c.head_revision FROM shuku_revisions r JOIN shuku_courses c ON c.id=r.course_id WHERE r.id=%s AND NOT c.deleting AND NOT EXISTS(SELECT 1 FROM shuku_workspaces w JOIN shuku_courses t ON t.id=w.target_course_id WHERE w.id=c.id AND t.deleting)",(identifier(rid),)).fetchone()
        require(row,404,'NOT_FOUND','修订不存在。')
        user=self.store.user_in(db,uid) if uid else None
        private=bool(user and (str(row['owner_id'])==uid or user['role']=='admin'))
        if user and not private:
            private=bool(db.execute('SELECT 1 FROM shuku_course_managers WHERE course_id=%s AND user_id=%s',(row['course_id'],uid)).fetchone())
        released=public and row['course_status']=='published' and db.execute('SELECT 1 FROM shuku_releases WHERE revision_id=%s',(rid,)).fetchone()
        if not private and user and hasattr(self,'collaboration'):
            private=self.collaboration.can_preview(db,uid,row)
        require(private or released,404,'NOT_FOUND','修订不存在或无权访问。')
        return row

    def revision(self,uid,rid):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid,public=False)
            project=json.loads(self.bucket.read(row['files']['project.json']['sha256']))
            if str(row['owner_id'])!=uid and self.store.user_in(db,uid)['role']!='admin' and db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s',(row['course_id'],)).fetchone():
                from .collaboration import teaching
                project=teaching(project)
            project['designImages']={key:'data:'+row['files'][path]['mime']+';base64,'+base64.b64encode(self.bucket.read(row['files'][path]['sha256'])).decode() for key,path in project.get('designImages',{}).items()}
            review=db.execute('SELECT status,note FROM shuku_reviews WHERE revision_id=%s',(rid,)).fetchone()
            task=db.execute("SELECT status,error_code,checkpoint FROM shuku_tasks WHERE idempotency_key=%s",('build:'+rid,)).fetchone()
            state='failed' if row['state']=='building' and task and task['status']=='failed' else row['state']
            contribution=db.execute('SELECT id,status,score,note FROM shuku_contributions WHERE revision_id=%s',(rid,)).fetchone()
            return {'id':str(row['id']),'state':state,'project':project,'build_error':((task.get('checkpoint') or {}).get('build_error') or ('课程构建失败，任务已停止（'+str(task.get('error_code') or 'BUILD_FAILED')+'）。' if state=='failed' else '')) if task else '', 'contribution':course_view(contribution) if contribution else None,'review':review,'preview_url':'/api/shuku/revisions/'+rid+'/files/index.html'}

    def file(self,uid,rid,path):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid)
            artifact=path in ('index.html','bundle.js','bundle.css','utilities.css') or path.startswith(('static/','assets/'))
            require(row['state']=='ready' and path in row['files'] and artifact,404,'NOT_FOUND','课程资源不存在。')
            obj=row['files'][path]
        content=self.bucket.read(obj['sha256'])
        require(len(content)==obj['size'],503,'FILE_CORRUPT','课程文件校验失败。')
        return content,obj['mime']

    def external(self,uid,rid):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid)
            return json.loads(self.bucket.read(row['files']['project.json']['sha256'])).get('externalSnapshot')

    def sandboxed(self,uid,rid):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid)
            return bool(json.loads(self.bucket.read(row['files']['project.json']['sha256'])).get('source')) or bool(json.loads(self.bucket.read(row['files']['project.json']['sha256'])).get('externalSnapshot'))

    def build(self,task,checkpoint):
        with self.store.transaction() as guard:
            guard.file_reference_lock(shared=True)
            return self.build_guarded(task,checkpoint)

    def build_guarded(self,task,checkpoint):
        rid=str(task['payload']['revision_id'])
        with self.store.transaction() as db:
            row=db.execute('SELECT * FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()
            require(row,404,'NOT_FOUND','课程修订已移除。')
            if row['state']=='ready':return {'revision_id':rid}
            course=db.execute('SELECT module_id FROM shuku_courses WHERE id=%s',(row['course_id'],)).fetchone()
        objects=dict(row['files']);project=json.loads(self.bucket.read(objects['project.json']['sha256']))
        build_root=self.native_root(project.get('nativeSnapshot'))
        module=self.module_context(course['module_id'],build_root)
        checkpoint({'stage':'building','revision_id':rid})
        try:
            frozen=self.collaboration.frozen_merge(rid,objects,checkpoint) if hasattr(self,'collaboration') else None
            if frozen is not None:objects=frozen
            else:
                with tempfile.TemporaryDirectory(prefix='shuku-build-') as folder:
                    folder=Path(folder);source=folder/'project.json';source.write_text(json.dumps(project));out=folder/'dist'
                    env=__import__('os').environ.copy();env['NODE_OPTIONS']='--max-old-space-size=256'
                    from .build_process import run_build
                    code,stdout,stderr=run_build(['node',str(Path(self.root)/'scripts/build-shuku-preview.mjs'),'--course-root',str(build_root),'--project',str(source),'--module',module['directory'] or '','--revision',rid,'--outdir',str(out)],env,lambda:checkpoint({'stage':'building','revision_id':rid}))
                    if code:
                        checkpoint({'stage':'build-failed','revision_id':rid,'build_error':'源码构建失败，请检查入口、语法和依赖。'+stderr.decode(errors='replace')[-1600:]})
                        raise BusinessError(422,'SOURCE_BUILD_FAILED','课程源码构建失败。')
                    for path in sorted(out.rglob('*')):
                        if path.is_file():
                            require(path.stat().st_size<=32*1024*1024,413,'ARTIFACT_LIMIT','课程资源过大。')
                            relative=path.relative_to(out).as_posix()
                            objects[relative]={**self.bucket.put(path.read_bytes()),'mime':mimetypes.guess_type(relative)[0] or 'application/octet-stream'}
            artifact_hash=hashlib.sha256(json.dumps(objects,sort_keys=True).encode()).hexdigest()
            checkpoint({'stage':'verified','revision_id':rid})
            with self.store.transaction() as db:
                current=db.execute('SELECT * FROM shuku_courses WHERE id=%s FOR UPDATE',(row['course_id'],)).fetchone()
                require(current and not current['deleting'] and not db.execute('SELECT 1 FROM shuku_workspaces w JOIN shuku_courses t ON t.id=w.target_course_id WHERE w.id=%s AND t.deleting',(row['course_id'],)).fetchone(),409,'RESOURCE_REMOVED','课程正在移除。')
                # Fence artifact writes with the same active task lease as completion.
                lease=db.execute("SELECT id FROM shuku_tasks WHERE id=%s AND lease_token=%s AND lease_until>%s FOR UPDATE",(task['id'],task['lease_token'],self.clock())).fetchone()
                require(lease,409,'STALE_LEASE','任务已被接管。')
                db.execute("UPDATE shuku_revisions SET files=%s,artifact_hash=%s,state='ready' WHERE id=%s AND state='building'",(JsonValue(objects),artifact_hash,rid))
                if hasattr(self,'collaboration'):self.collaboration.complete_merge(db,rid,artifact_hash)
                if hasattr(self,'library'):self.library.complete_initial(db,rid,artifact_hash)
        except Exception:
            # Retry retains the immutable source; final failure is projected by revision().
            raise
        return {'revision_id':rid,'artifact_hash':artifact_hash}

    def submit(self,uid,cid,data):
        with self.store.transaction() as db:
            course,_=self.owner(db,uid,cid);rid=identifier(data.get('revision_id'))
            require(not db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone(),409,'USE_CONTRIBUTION','请提交共创建议。')
            require(str(course['head_revision'])==rid,409,'REVISION_CONFLICT','请提交当前最新修订。')
            revision=db.execute("SELECT * FROM shuku_revisions WHERE id=%s AND course_id=%s AND state='ready'",(rid,cid)).fetchone()
            require(revision,409,'NOT_READY','请等待课程预览准备完成。')
            existing=db.execute('SELECT * FROM shuku_reviews WHERE revision_id=%s',(rid,)).fetchone()
            if existing:
                require(existing['status'] in ('pending','approved'),409,'NEW_REVISION_REQUIRED','请修改并保存新修订后重新提交。')
                return {'id':str(existing['id']),'status':existing['status']}
            review=str(uuid4());db.execute("INSERT INTO shuku_reviews(id,revision_id,course_id,status,artifact_hash,created_at) VALUES (%s,%s,%s,'pending',%s,%s)",(review,rid,cid,revision['artifact_hash'],self.clock()))
            self.audit(db,uid,'review.submit',review)
            return {'id':review,'status':'pending'}

    def reviews(self,uid):
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid);require(user['role']=='admin',403,'FORBIDDEN','需要管理员权限。')
            return [course_view(r) for r in db.execute("SELECT r.*,c.title,c.owner_id FROM shuku_reviews r JOIN shuku_courses c ON c.id=r.course_id WHERE r.status='pending' AND NOT c.deleting ORDER BY r.created_at LIMIT 100").fetchall()]

    def decide(self,uid,review_id,data):
        require(data.get('decision') in ('approved','rejected') and isinstance(data.get('note',''),str) and len(data.get('note',''))<=2000,400,'INVALID_REVIEW','审核意见格式不正确。')
        require(data['decision']!='rejected' or data.get('note','').strip(),400,'NOTE_REQUIRED','请填写退回原因。')
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid);require(user['role']=='admin',403,'FORBIDDEN','需要管理员权限。')
            row=db.execute('SELECT * FROM shuku_reviews WHERE id=%s',(identifier(review_id),)).fetchone();require(row,404,'NOT_FOUND','审核记录不存在。')
            course=db.execute('SELECT * FROM shuku_courses WHERE id=%s FOR UPDATE',(row['course_id'],)).fetchone()
            row=db.execute('SELECT * FROM shuku_reviews WHERE id=%s FOR UPDATE',(review_id,)).fetchone()
            require(not course['deleting'],409,'RESOURCE_REMOVED','课程正在移除。')
            require(str(course['owner_id'])!=uid,403,'SELF_REVIEW','不能审核自己的课程。')
            require(row['status']=='pending' and row['revision_id']==course['head_revision'] and str(row['revision_id'])==data.get('revision_id'),409,'REVIEW_CHANGED','审核内容已变化，请重新查看。')
            db.execute('UPDATE shuku_reviews SET status=%s,note=%s,reviewer_id=%s,decided_at=%s WHERE id=%s',(data['decision'],data.get('note',''),uid,self.clock(),review_id))
            self.audit(db,uid,'review.'+data['decision'],review_id)
            return {'status':data['decision']}

    def publish(self,uid,cid,data):
        version=data.get('version','');note=data.get('note','')
        require(isinstance(version,str) and re.fullmatch(r'v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)',version),400,'INVALID_VERSION','版本号格式为 1.0.0。')
        version=version.removeprefix('v');rid=identifier(data.get('revision_id'))
        require(isinstance(note,str) and len(note)<=3000,400,'INVALID_INPUT','版本说明过长。')
        with self.store.transaction() as db:
            course,_=self.owner(db,uid,cid)
            require(not db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone(),409,'WORKSPACE_PRIVATE','共创工作区不能直接发布。')
            require(course['status']!='hidden',409,'COURSE_HIDDEN','课程已下架，请管理员恢复后再发布。')
            previous=db.execute('SELECT * FROM shuku_releases WHERE course_id=%s AND version=%s',(cid,version)).fetchone()
            if previous:
                require(str(previous['revision_id'])==rid and previous['note']==note,409,'VERSION_EXISTS','该版本号已被使用。')
                return course_view(previous)
            require(str(course['head_revision'])==rid,409,'REVISION_CONFLICT','请发布当前已审核修订。')
            revision=db.execute("SELECT * FROM shuku_revisions WHERE id=%s AND course_id=%s AND state='ready'",(rid,cid)).fetchone()
            review=db.execute("SELECT * FROM shuku_reviews WHERE revision_id=%s AND status='approved' FOR UPDATE",(rid,)).fetchone()
            require(revision and review and revision['artifact_hash']==review['artifact_hash'],409,'APPROVAL_REQUIRED','需要先通过当前修订的审核。')
            if course['current_release']:
                current=db.execute('SELECT version FROM shuku_releases WHERE id=%s',(course['current_release'],)).fetchone()
                require(tuple(map(int,version.split('.')))>tuple(map(int,current['version'].split('.'))),409,'VERSION_ORDER','新版本号需高于当前版本。')
            # Verify every immutable referenced object before changing the live pointer.
            remote=self.github.release_gate(db,uid,cid,rid,version,note,data.get('repository_name'))
            if remote:return remote
            for obj in revision['files'].values():
                require(len(self.bucket.read(obj['sha256']))==obj['size'],503,'FILE_CORRUPT','课程文件不完整，保留原正式版。')
            release_id=str(uuid4())
            db.execute('INSERT INTO shuku_releases VALUES (%s,%s,%s,%s,%s,%s,%s)',(release_id,cid,rid,version,note,uid,self.clock()))
            release=db.execute('SELECT * FROM shuku_releases WHERE id=%s',(release_id,)).fetchone()
            published_title=json.loads(self.bucket.read(revision['files']['project.json']['sha256']))['title']
            db.execute("UPDATE shuku_courses SET status='published',current_release=%s,title=%s WHERE id=%s",(release['id'],published_title,cid))
            db.execute("UPDATE shuku_reviews SET status='published' WHERE revision_id=%s",(rid,))
            self.audit(db,uid,'course.publish',release['id']);return course_view(release)

    def public_courses(self):
        with self.store.transaction() as db:
            published = [course_view(row) for row in db.execute("SELECT c.id,c.title,c.description,c.category,c.module_id,r.version,r.revision_id FROM shuku_courses c JOIN shuku_releases r ON r.id=c.current_release WHERE c.status='published' AND NOT c.deleting AND NOT EXISTS (SELECT 1 FROM shuku_library_bindings b JOIN shuku_library_courses l ON l.module_id=b.module_id WHERE b.course_id=c.id AND l.snapshot_commit=%s) ORDER BY r.created_at DESC LIMIT 100",(self.library.commit,)).fetchall()]
        return published + self.library.courses()


    def public_course(self,cid):
        """Public detail exposes published metadata and aggregates, never private drafts."""
        cid=identifier(cid)
        with self.store.transaction() as db:
            course=db.execute("SELECT c.id,c.title,c.description,c.category,c.module_id,c.owner_id,u.display_name AS creator,r.version,r.revision_id FROM shuku_courses c JOIN shuku_users u ON u.id=c.owner_id JOIN shuku_releases r ON r.id=c.current_release WHERE c.id=%s AND c.status='published' AND NOT c.deleting",(cid,)).fetchone()
            require(course,404,'NOT_FOUND','课程不存在或已不可访问。')
            binding=db.execute('SELECT l.payload FROM shuku_library_bindings b JOIN shuku_library_courses l ON l.module_id=b.module_id AND l.snapshot_commit=b.source_commit WHERE b.course_id=%s',(cid,)).fetchone()
            if binding:course['library']=binding['payload']
            revision=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['revision_id'],)).fetchone()
            course['external']=json.loads(self.bucket.read(revision['files']['project.json']['sha256'])).get('externalSnapshot')
            releases=[{**course_view(r),'current':bool(r['current'])} for r in db.execute("SELECT r.id,r.version,r.revision_id,r.created_at,r.note,r.id=c.current_release AS current FROM shuku_releases r JOIN shuku_courses c ON c.id=r.course_id WHERE r.course_id=%s ORDER BY current DESC,r.created_at DESC,r.id",(cid,)).fetchall()]
            ranking={str(course['owner_id']):{'name':course['creator'],'score':0,'count':0}}
            for row in db.execute("SELECT w.owner_id,u.display_name,SUM(k.score) AS score,COUNT(*) AS count FROM shuku_contributions k JOIN shuku_workspaces w ON w.id=k.workspace_id JOIN shuku_users u ON u.id=w.owner_id WHERE k.target_course_id=%s AND k.status='merged' GROUP BY w.owner_id,u.display_name ORDER BY score DESC,w.owner_id LIMIT 100",(cid,)).fetchall():
                ranking[str(row['owner_id'])]={'name':row['display_name'],'score':int(row['score'] or 0),'count':int(row['count'])}
            public={key:value for key,value in course_view(course).items() if key!='owner_id'}
            return {'course':public,'releases':releases,'contributors':sorted(ranking.values(),key=lambda item:(-item['score'],item['name']))}
