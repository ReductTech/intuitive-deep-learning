"""Owner-scoped, durable standard course imports. File bytes stay in Bucket."""
import hashlib
import json
import mimetypes
import re
import subprocess
from pathlib import Path
from uuid import uuid4,uuid5,NAMESPACE_URL
from urllib.parse import quote
from .course_package import read_zip, normalize, candidates, github_location, MAX_UPLOAD, MAX_FILE
from .database import JsonValue
from .errors import require
from .github_course_source import GitHubCourseSource
from .local_agent import AUTHORING
from .source import validate_assets
from .workflow import identifier
from .workers import DeferredTask

LIFETIME=86400
REFERENCE_KINDS="('revision.player','course.import.inspect','course.asset')"


class CourseImports:
    def __init__(self,flow,source=None):
        self.flow,self.store,self.bucket,self.clock=flow,flow.store,flow.bucket,flow.clock
        self.source=source or GitHubCourseSource()
        self.next_expiry=0

    def owned(self,db,uid,tid,lock=False):
        self.store.user_in(db,uid)
        row=db.execute("SELECT * FROM shuku_tasks WHERE id=%s AND kind='course.import.inspect'"+(' FOR UPDATE' if lock else ''),(identifier(tid),)).fetchone()
        require(row and row['payload'].get('user_id')==uid,404,'NOT_FOUND','导入任务不存在。')
        return row

    def create(self,uid,key,data,upload=None):
        require(self.flow.root is not None,503,'IMPORT_NOT_CONFIGURED','请先配置课程源码构建环境。')
        require(isinstance(key,str) and re.fullmatch(r'[A-Za-z0-9_-]{8,80}',key),400,'IDEMPOTENCY_REQUIRED','缺少导入请求标识。')
        require(isinstance(data,dict) and set(data)<= {'type','url'} and data.get('type') in ('github','zip'),400,'INVALID_INPUT','请选择 GitHub 链接或 ZIP。')
        if data['type']=='github':github_location(data.get('url'))
        else:require(upload is not None,400,'ZIP_REQUIRED','请选择 ZIP 文件。')
        # Hash and validate before creating a task; an identical request reuses it.
        obj=None
        if upload is not None:
            upload.seek(0,2);size=upload.tell();upload.seek(0)
            require(0<size<=MAX_UPLOAD,413,'PACKAGE_LIMIT','ZIP 最大 100 MiB。')
            digest=hashlib.sha256()
            for chunk in iter(lambda:upload.read(65536),b''):digest.update(chunk)
            upload.seek(0);obj={'sha256':digest.hexdigest(),'size':size,'mime':'application/zip'}
        payload={'user_id':uid,'type':data['type'],'url':data.get('url') if data['type']=='github' else None,'upload':obj}
        digest=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid)
            require(user['role'] in ('creator','admin'),403,'FORBIDDEN','当前账号没有创建课程权限。')
            db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,)).fetchone()
            old=db.execute('SELECT * FROM shuku_tasks WHERE idempotency_key=%s',('course-import:'+uid+':'+key,)).fetchone()
            if old:
                require(old['request_hash']==digest,409,'IDEMPOTENCY_CONFLICT','请求标识已用于不同内容。');return {'id':str(old['id'])}
            pending=db.execute("SELECT COUNT(*) AS n FROM shuku_tasks WHERE kind='course.import.inspect' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.user_id'))=%s AND created_at>%s",(uid,self.clock()-LIFETIME)).fetchone()['n']
            require(pending<10,429,'IMPORT_LIMIT','每天最多创建 10 个导入任务。')
            db.file_reference_lock(shared=True)
            if obj:require(self.bucket.put_file(upload)=={k:obj[k] for k in ('sha256','size')},409,'UPLOAD_CHANGED','上传内容发生变化。')
            tid=str(uuid4());now=self.clock();result={'files':{'upload.zip':obj} if obj else {}}
            db.execute("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,result,available_at,created_at) VALUES (%s,'course.import.inspect',%s,%s,%s,%s,%s,%s,%s)",(tid,'import:'+tid,'course-import:'+uid+':'+key,digest,JsonValue(payload),JsonValue(result),now,now))
            self.flow.audit(db,uid,'course.import.create',tid)
        return {'id':tid}

    def status(self,uid,tid):
        with self.store.transaction() as db:
            row=self.owned(db,uid,tid);result=row.get('result') or {};course_id=result.get('course_id')
            final=db.execute("SELECT status,error_code,checkpoint FROM shuku_tasks WHERE idempotency_key=%s",('course-import-finalize:'+tid,)).fetchone() if course_id else None
            cleanup=db.execute('SELECT status,error_code FROM shuku_tasks WHERE idempotency_key=%s',('import-cleanup:'+tid,)).fetchone()
            dependency=db.execute("SELECT kind,error_code,checkpoint FROM shuku_tasks WHERE idempotency_key IN %s AND status='failed' ORDER BY created_at LIMIT 1",(['build:'+result['revision_id'],'github-provision:'+course_id],)).fetchone() if course_id else None
            removed=row['resource_key'].startswith('course:') and not result.get('course_id')
            state='removed' if removed else 'expired' if row['payload'].get('expired') else 'cancelled' if row['payload'].get('cancelled') else final['status'] if final else row['status']
            return {'id':tid,'state':state,'phase':'initializing' if course_id or removed else 'inspecting','error_code':dependency['error_code'] if dependency else (final or row)['error_code'],
                    'progress':(final or row).get('checkpoint') or {},'course_id':course_id,'revision_id':result.get('revision_id'),
                    'expires_at':row['created_at']+LIFETIME,'source':result.get('source'),'cleanup_state':cleanup['status'] if cleanup else None,'cleanup_error':cleanup['error_code'] if cleanup else None,
                    'candidates':[{'key':x['key'],**x['summary']} for x in result.get('candidates',[])]}

    def listing(self,uid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            rows=db.execute("SELECT id FROM shuku_tasks WHERE kind='course.import.inspect' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.user_id'))=%s ORDER BY created_at DESC LIMIT 10",(uid,)).fetchall()
        return {'imports':[self.status(uid,str(row['id'])) for row in rows]}

    def inspect(self,task,checkpoint):
        payload=task['payload'];state=dict(task.get('checkpoint') or {})
        def save(progress):
            state.update(progress);checkpoint(state)
        require(not payload.get('cancelled') and task['created_at']+LIFETIME>self.clock(),410,'IMPORT_EXPIRED','导入已取消或过期。')
        if payload['type']=='zip':
            save({'stage':'validating-package'})
            with self.bucket.path(payload['upload']['sha256']).open('rb') as content:files=read_zip(content)
            source={'type':'zip','sha256':payload['upload']['sha256']}
        else:
            source=state.get('source') or self.source.pin(payload['url'],save)
            save({'stage':'reading-source','source':source})
            files=self.source.load(source,save);source={**source,'type':'github'}
        from .source import EXTENSIONS
        text_bytes=sum(len(data) for name,data in files.items() if Path(name).suffix.lower() in EXTENSIONS or Path(name).name.upper() in ('LICENSE','NOTICE'))
        require(text_bytes<=12*1024*1024,413,'SOURCE_LIMIT','课程包文本合计最多 12 MiB，请选择具体课程目录。')
        choices=candidates(files)
        require(1<=len(choices)<=10,422,'COURSE_SELECTION_REQUIRED','请选择包含 1～10 个标准课程的目录或 ZIP。')
        # TypeScript AST inspection only. Uploaded JS is never run in Node.
        text={k:v.decode('utf-8-sig') for k,v in files.items() if Path(k).suffix.lower() in ('.tsx','.jsx','.ts','.js')}
        from .build_process import run_build
        import os,tempfile
        with tempfile.TemporaryDirectory(prefix='shuku-inspect-') as folder:
            path=Path(folder)/'source.json';path.write_text(json.dumps(text),encoding='utf8');del text
            from .build_process import build_environment
            env=build_environment()
            code,stdout,_=run_build(['node',str(Path(self.flow.root)/'scripts/inspect-course-package.mjs'),str(path),'--by-file'],env,lambda:save({'stage':'inspecting-pages'}))
            require(code==0,422,'INVALID_SOURCE','无法解析课程页面。')
            ids=json.loads(stdout)
        reports=[];manifest=dict((task.get('result') or {}).get('files') or {});prepared=[];project_bytes=0
        for index,choice in enumerate(choices):
            prefix=str(Path(choice).parent).replace(chr(92),'/')
            implemented={pid for name,items in ids.items() if prefix=='.' or name.startswith(prefix+'/') for pid in items}
            normalized=normalize(files,choice,implemented)
            assets={name:{'sha256':hashlib.sha256(content).hexdigest(),'size':len(content),'mime':mimetypes.guess_type(name)[0] or 'application/octet-stream'} for name,content in normalized['assets'].items()}
            project={'version':1,'id':str(uuid5(NAMESPACE_URL,str(task['id'])+':'+choice)),'courseId':'','title':normalized['summary']['title'],'duration':30,
                     'style':'简洁教学','outlineConfirmed':True,'pages':normalized['pages'],'source':{'files':normalized['files']},
                     'sourceFormatVersion':2,'sourceAssets':assets,'sourceGuideEntry':normalized['guide'],'authoringModule':normalized['module'],
                     'authoringVersion':AUTHORING['commit'],'importOrigin':source}
            from .source import validate_source
            validate_source(project);validate_assets(project)
            encoded=json.dumps(project,ensure_ascii=False,sort_keys=True).encode();project_bytes+=len(encoded)
            require(project_bytes<=24*1024*1024,413,'PACKAGE_LIMIT','多课程包过大，请选择具体课程目录。')
            project_obj={'sha256':hashlib.sha256(encoded).hexdigest(),'size':len(encoded),'mime':'application/json'}
            manifest['candidate-'+str(index)+'.json']=project_obj
            manifest.update({'asset-'+str(index)+'-'+name:obj for name,obj in assets.items()})
            reports.append({'key':choice,'summary':normalized['summary'],'project':project_obj})
            prepared.append((normalized['assets'],encoded))
        result={'files':manifest,'candidates':reports,'source':source}
        state.update(stage='storing-assets');self.store.checkpoint(task['id'],task['lease_token'],self.clock(),state,ttl=120)
        # Register the complete planned manifest first. A disk error or crash can
        # then be retried/cleaned even when only some objects reached the bucket.
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True);self.flow.governance.active_lease(db,task)
            db.execute('UPDATE shuku_tasks SET result=%s WHERE id=%s',(JsonValue(result),task['id']))
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True);self.flow.governance.active_lease(db,task)
            for assets,encoded in prepared:
                for content in assets.values():self.bucket.put(content)
                self.bucket.put(encoded)
        save({'stage':'awaiting-confirmation','source':source})
        return result

    def confirm(self,uid,tid,data):
        require(isinstance(data,dict) and set(data)<= {'selection','title','description','category'},400,'INVALID_INPUT','课程信息格式不正确。')
        require(self.flow.github.client and self.flow.github.config.get('owner') and self.flow.github.config.get('installationId'),503,'GITHUB_NOT_CONFIGURED','需要配置 GitHub 组织及 App 后才能初始化私有课程。')
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True);row=self.owned(db,uid,tid,True);result=row.get('result') or {}
            if result.get('course_id'):
                require(result.get('confirmation')==data,409,'IDEMPOTENCY_CONFLICT','该导入已按其他课程信息确认。')
                return {'course_id':result['course_id'],'revision_id':result['revision_id']}
            require(row['status']=='succeeded' and not row['payload'].get('cancelled') and row['created_at']+LIFETIME>self.clock(),409,'IMPORT_NOT_READY','导入尚未检查完成、已取消或已过期。')
            selected=next((x for x in result.get('candidates',[]) if x['key']==data.get('selection')),None)
            require(selected,400,'COURSE_SELECTION_REQUIRED','请选择要导入的课程。')
            info={k:data.get(k,selected['summary'].get(k,'')) for k in ('title','description','category')};info['module_id']=str(uuid4())
            course=self.store.create_course(uid,info,self.clock(),self.flow.github,db=db);cid=course['id']
            project=json.loads(self.bucket.read(selected['project']['sha256']));project['courseId']='custom-'+info['module_id'];project['title']=info['title'].strip()
            outline_path=project['authoringModule']+'/outlines.json'
            outline=json.loads(project['source']['files'][outline_path])
            outline.update({key:info[key].strip() for key in ('title','description','category')})
            project['source']['files'][outline_path]=json.dumps(outline,ensure_ascii=False,indent=2)
            revision=self.flow.save_in(db,uid,cid,{'project':project,'expected_revision':None},source_assets=project['sourceAssets'])
            result.update(course_id=cid,revision_id=revision['id'],confirmation=data)
            db.execute('UPDATE shuku_tasks SET resource_key=%s,result=%s WHERE id=%s',('course:'+cid,JsonValue(result),tid))
            now=self.clock();jid=str(uuid4());key='course-import-finalize:'+tid
            db.execute("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'course.import.finalize',%s,%s,%s,%s,%s,%s)",(jid,'course:'+cid,key,key,JsonValue({'import_id':tid,'course_id':cid,'revision_id':revision['id']}),now,now))
            self.flow.audit(db,uid,'course.import.confirm',tid)
            return {'course_id':cid,'revision_id':revision['id']}

    def finalize(self,task,checkpoint):
        cid=task['payload']['course_id'];rid=task['payload']['revision_id'];state=dict(task.get('checkpoint') or {})
        def save(**progress):state.update(progress);checkpoint(state)
        with self.store.transaction() as db:
            course=db.execute('SELECT * FROM shuku_courses WHERE id=%s',(cid,)).fetchone()
            require(course and not course['deleting'],409,'RESOURCE_REMOVED','课程已移除。')
            revision=db.execute('SELECT * FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()
            dependencies=db.execute("SELECT status FROM shuku_tasks WHERE idempotency_key IN %s",(['build:'+rid,'github-provision:'+cid],)).fetchall()
            require(not any(x['status']=='failed' for x in dependencies),409,'IMPORT_DEPENDENCY_FAILED','课程预览或私有仓库创建失败，请重试。')
            repo=self.flow.github.repo(db,cid)
        if not revision or revision['state']!='ready' or not repo:
            save(stage='waiting-for-preview-and-repository');raise DeferredTask()
        from .adapters.github import blob_sha
        base='/repos/'+repo['owner']+'/'+repo['name'];ref=quote(repo['default_branch'],safe='')
        def call(method,path,data=None):
            save(stage='initializing-private-repository')
            return self.flow.github.client.call(repo,method,path,data)
        remote=call('GET','')
        require(remote['id']==repo['repository_id'] and remote.get('private') and remote.get('description')=='Shuku course '+cid,409,'REMOTE_CHANGED','私有仓库身份或可见性已变化。')
        current=call('GET','/git/ref/heads/'+ref)['object']['sha'];marker='Shuku initial course '+cid+' '+rid
        commit=call('GET','/git/commits/'+current)
        expected=self.flow.github.export(revision)
        expected={name:data for name,data in expected.items() if name in ('courses/project.json','course.manifest.json') or name.startswith('courses/sources/')}
        expected.update({'courses/sources/'+name:self.bucket.read(obj['sha256']) for name,obj in json.loads(self.bucket.read(revision['files']['project.json']['sha256'])).get('sourceAssets',{}).items()})
        if commit['message'].strip()!=marker:
            require(current==repo['initial_sha'],409,'REMOTE_CHANGED','仓库已有独立修改，保留远程内容，请人工处理后重试。')
            done=state.setdefault('blobs',{})
            for name,content in expected.items():
                sha=blob_sha(content)
                if done.get(name)!=sha:
                    import base64
                    actual=call('POST','/git/blobs',{'content':base64.b64encode(content).decode(),'encoding':'base64'})['sha']
                    require(actual==sha,502,'REMOTE_CONTENT_MISMATCH','远程文件校验失败。');done[name]=sha;save(blobs=done)
            if not state.get('tree'):
                tree=call('POST','/git/trees',{'base_tree':commit['tree']['sha'],'tree':[{'path':name,'mode':'100644','type':'blob','sha':blob_sha(content)} for name,content in expected.items()]})['sha'];save(tree=tree)
            if not state.get('commit'):
                from datetime import datetime,timezone
                date=datetime.fromtimestamp(revision['created_at'],timezone.utc).isoformat()
                author={'name':'Shuku','email':'noreply@shuku.local','date':date}
                value=call('POST','/git/commits',{'message':marker,'tree':state['tree'],'parents':[current],'author':author,'committer':author})['sha'];save(commit=value)
            call('PATCH','/git/refs/heads/'+ref,{'sha':state['commit'],'force':False})
            current=call('GET','/git/ref/heads/'+ref)['object']['sha']
            require(current==state['commit'],409,'REMOTE_CHANGED','初始化提交后仓库又发生变化。')
        tree=call('GET','/git/trees/'+current+'?recursive=1')
        require(not tree.get('truncated'),502,'REMOTE_CONTENT_MISMATCH','远程文件清单不完整。')
        actual={x['path']:x['sha'] for x in tree['tree'] if x['type']=='blob'}
        require(all(actual.get(name)==blob_sha(content) for name,content in expected.items()),502,'REMOTE_CONTENT_MISMATCH','私有仓库源码不完整。')
        with self.store.transaction() as db:
            self.flow.governance.active_lease(db,task)
            # Future first review branches must start from this imported source.
            db.execute('UPDATE shuku_github_repositories SET initial_sha=%s WHERE course_id=%s AND initial_sha=%s',(current,cid,repo['initial_sha']))
        save(stage='ready',commit=current,blobs={})
        return {'course_id':cid,'revision_id':rid,'commit':current}

    def retry(self,uid,tid):
        with self.store.transaction() as db:
            row=self.owned(db,uid,tid,True);result=row.get('result') or {}
            if row['payload'].get('cancelled') or row['payload'].get('expired'):
                db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE idempotency_key=%s AND status='failed'",(self.clock(),'import-cleanup:'+tid))
                self.flow.audit(db,uid,'course.import.cleanup.retry',tid)
                return {'id':tid}
            require(not row['payload'].get('cancelled') and (result.get('course_id') or row['created_at']+LIFETIME>self.clock()),410,'IMPORT_EXPIRED','任务已取消或过期。')
            require(not row['resource_key'].startswith('course:') or result.get('course_id'),409,'RESOURCE_REMOVED','课程已经删除。')
            if result.get('course_id'):
                course,_=self.flow.owner(db,uid,result['course_id'])
                initial=db.execute('SELECT state FROM shuku_revisions WHERE id=%s',(result['revision_id'],)).fetchone()
                final=db.execute('SELECT * FROM shuku_tasks WHERE idempotency_key=%s FOR UPDATE',('course-import-finalize:'+tid,)).fetchone()
                if initial and initial['state']=='failed' and course['head_revision']!=result['revision_id']:
                    require(final and final['status']=='failed' and not (final['checkpoint'] or {}).get('commit'),409,'IMPORT_BUSY','请等待初始化任务停止后再重试。')
                    result['revision_id']=str(course['head_revision'])
                    payload={**final['payload'],'revision_id':result['revision_id']}
                    db.execute('UPDATE shuku_tasks SET payload=%s,checkpoint=%s WHERE id=%s',(JsonValue(payload),JsonValue({}),final['id']))
                    db.execute('UPDATE shuku_tasks SET result=%s WHERE id=%s',(JsonValue(result),tid))
            keys=['course-import-finalize:'+tid,'github-provision:'+result['course_id'],'build:'+result['revision_id']] if result.get('course_id') else [row['idempotency_key']]
            db.execute("UPDATE shuku_revisions SET state='building' WHERE id=%s AND state='failed'",(result.get('revision_id'),))
            db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE idempotency_key IN %s AND status='failed'",(self.clock(),keys))
            self.flow.audit(db,uid,'course.import.retry',tid)
        return {'id':tid}

    def cancel(self,uid,tid):
        with self.store.transaction() as db:
            db.file_reference_lock()
            row=self.owned(db,uid,tid,True);result=row.get('result') or {}
            require(not result.get('course_id'),409,'USE_COURSE_REMOVAL','课程已创建，请在我的课程中删除，保留完整的失败恢复与审计。')
            require(row['status']!='running' or not row['lease_until'] or row['lease_until']<=self.clock(),409,'IMPORT_BUSY','正在检查文件，请稍后再取消。')
            self.discard(db,row,'cancelled')
            self.flow.audit(db,uid,'course.import.cancel',tid)
        return {'id':tid,'state':'cancelled'}

    def discard(self,db,row,reason):
        db.file_reference_lock();payload=dict(row['payload']);payload[reason]=True
        objects=list(((row.get('result') or {}).get('files') or {}).values())
        tid=str(uuid4());now=self.clock();key='import-cleanup:'+str(row['id'])
        db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'course.import.cleanup',%s,%s,%s,%s,%s,%s)",(tid,'import-cleanup:'+str(row['id']),key,key,JsonValue({'objects':objects}),now,now))
        db.execute("UPDATE shuku_tasks SET status='failed',error_code='IMPORT_EXPIRED',payload=%s,result=NULL,lease_token=NULL,lease_until=NULL WHERE id=%s",(JsonValue(payload),row['id']))
        db.execute('DELETE FROM shuku_task_leases WHERE task_id=%s AND expires_at<=%s',(row['id'],now))

    def maintenance(self):
        if self.clock()<self.next_expiry:return
        self.next_expiry=self.clock()+60
        with self.store.transaction() as db:
            db.file_reference_lock()
            rows=db.execute("SELECT * FROM shuku_tasks WHERE kind='course.import.inspect' AND created_at<%s AND (status<>'running' OR lease_until<=%s) AND JSON_EXTRACT(result,'$.course_id') IS NULL AND result IS NOT NULL LIMIT 10 FOR UPDATE SKIP LOCKED",(self.clock()-LIFETIME,self.clock())).fetchall()
            for row in rows:self.discard(db,row,'expired')

    def cleanup(self,task,checkpoint):
        for index,obj in enumerate(task['payload']['objects']):
            checkpoint({'stage':'cleaning-files','index':index})
            with self.store.transaction() as db:
                db.file_reference_lock();self.flow.governance.active_lease(db,task)
                digest=obj['sha256']
                used=db.execute("SELECT 1 FROM shuku_revisions r JOIN JSON_TABLE(JSON_EXTRACT(r.files,'$.*'),'$[*]' COLUMNS(sha VARCHAR(64) PATH '$.sha256')) j ON TRUE WHERE j.sha=%s LIMIT 1",(digest,)).fetchone()
                staged=db.execute("SELECT 1 FROM shuku_tasks t JOIN JSON_TABLE(JSON_EXTRACT(t.result,'$.files.*'),'$[*]' COLUMNS(sha VARCHAR(64) PATH '$.sha256')) j ON TRUE WHERE t.kind IN "+REFERENCE_KINDS+" AND j.sha=%s LIMIT 1",(digest,)).fetchone()
                if not used and not staged:self.bucket.remove(digest)
        return {'removed':True}

    def upload_asset(self,uid,cid,name,content):
        require(0<len(content)<=MAX_FILE,413,'SOURCE_ASSET_LIMIT','单个素材最大 32 MiB。')
        obj={'sha256':hashlib.sha256(content).hexdigest(),'size':len(content),'mime':mimetypes.guess_type(name)[0] or 'application/octet-stream'}
        validate_assets({'sourceAssets':{name:obj}})
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True)
            course,_=self.flow.owner(db,uid,cid)
            require(str(course['owner_id'])==uid,403,'FORBIDDEN','只能上传本人课程的素材。')
            staged=db.execute("SELECT result FROM shuku_tasks WHERE kind='course.asset' AND resource_key=%s FOR UPDATE",('course:'+cid,)).fetchall()
            objects={v['sha256']:v['size'] for row in staged for v in ((row.get('result') or {}).get('files') or {}).values()}
            objects[obj['sha256']]=obj['size']
            require(len(staged)<2000 and sum(objects.values())<=64*1024*1024,413,'SOURCE_ASSET_LIMIT','待保存素材最多 2000 个、64 MiB。')
            self.bucket.put(content);now=self.clock();key='course-asset:'+cid+':'+hashlib.sha256((name+obj['sha256']).encode()).hexdigest()
            db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,result,status,available_at,created_at) VALUES (%s,'course.asset',%s,%s,%s,%s,%s,'succeeded',%s,%s)",(uuid4(),'course:'+cid,key,obj['sha256'],JsonValue({'user_id':uid}),JsonValue({'files':{name:obj},'assets':{name:obj}}),now,now))
            db.execute('UPDATE shuku_tasks SET result=%s,created_at=%s WHERE idempotency_key=%s',(JsonValue({'files':{name:obj},'assets':{name:obj}}),now,key))
        return {'asset':obj}

    def asset(self,uid,cid,digest):
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,uid,cid);assets=[]
            if course['head_revision']:
                row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['head_revision'],)).fetchone()
                assets=list(row['files'].values())
            for row in db.execute("SELECT result FROM shuku_tasks WHERE kind='course.asset' AND resource_key=%s",('course:'+cid,)).fetchall():assets+=list((row['result'] or {}).get('assets',{}).values())
            obj=next((x for x in assets if x['sha256']==digest),None)
            require(obj,404,'NOT_FOUND','课程素材不存在。')
        return self.bucket.path(obj['sha256']),obj['mime']
