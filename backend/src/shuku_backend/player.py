"""Replace viewer code without changing approved course source or release hashes."""
import hashlib
import json
import mimetypes
from pathlib import Path
import tempfile
from uuid import uuid4
from .database import JsonValue
from .errors import require
from .workflow import identifier
from .build_process import run_build,build_environment

RENDERER='shuku-managed-slide-v6-narration'
FAILURES={
    'BUILD_TIMEOUT':'课程页面构建超时，旧构建已停止，可以重试。',
    'BUILD_HEARTBEAT_FAILED':'构建任务续期失败，旧构建已停止，请稍后重试。',
    'BUILD_HEARTBEAT_TIMEOUT':'构建任务续期超时，旧构建已停止，请稍后重试。',
    'STALE_LEASE':'上次构建任务已失效，可以重新准备课程页面。',
    'ATTEMPTS_EXHAUSTED':'上次构建任务已失效或重试次数已用尽，可以重新准备课程页面。',
    'SOURCE_BUILD_FAILED':'课程源码无法构建，请修复源码后重试。',
    'PLAYER_BUILD_FAILED':'课程源码无法构建，请修复源码后重试。',
    'BUILD_CLEANUP_FAILED':'未确认旧构建进程退出，已停止重试，请联系管理员处理。',
}

class Player:
    def __init__(self,flow):
        self.flow,self.store,self.bucket,self.clock=flow,flow.store,flow.bucket,flow.clock

    def key(self,rid):return 'player:'+RENDERER+':'+identifier(rid)

    def status(self,uid,rid):
        rid=identifier(rid)
        with self.store.transaction() as db:
            row=self.flow.allowed(db,rid,uid)
            require(row['state']=='ready',409,'NOT_READY','请等待课程预览准备完成。')
            external=json.loads(self.bucket.read(row['files']['project.json']['sha256'])).get('externalSnapshot')
            if external:return {'state':'ready','url':'/api/shuku/revisions/'+rid+'/files/static/'+external['entry']}
            require(self.flow.root,503,'BUILD_NOT_CONFIGURED','课程构建目录尚未配置。')
            now=self.clock();key=self.key(rid)
            db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'revision.player',%s,%s,%s,%s,%s,%s)",(str(uuid4()),'course:'+str(row['course_id']),key,hashlib.sha256(key.encode()).hexdigest(),JsonValue({'revision_id':rid}),now,now))
            task=db.execute('SELECT status,error_code FROM shuku_tasks WHERE idempotency_key=%s',(key,)).fetchone()
            state='ready' if task['status']=='succeeded' else task['status']
        return {'state':state,**({'url':'/api/shuku/revisions/'+rid+'/player/files/index.html'} if state=='ready' else {}),**({'error_code':task['error_code'],'message':FAILURES.get(task['error_code'],'课程页面准备失败，可以稍后重试。'),'can_retry':bool(uid) and task['error_code']!='BUILD_CLEANUP_FAILED'} if state=='failed' else {})}

    def retry(self,uid,rid,data):
        rid=identifier(rid);require(isinstance(data,dict) and not data,400,'INVALID_INPUT','重试无需提供课程内容。')
        with self.store.transaction() as db:
            row=self.flow.allowed(db,rid,uid)
            require(row['state']=='ready',409,'NOT_READY','请先完成课程修订构建。')
            task=db.execute("SELECT * FROM shuku_tasks WHERE idempotency_key=%s FOR UPDATE",(self.key(rid),)).fetchone()
            require(task,404,'NOT_FOUND','播放器任务不存在，请刷新后重试。')
            require(task['error_code']!='BUILD_CLEANUP_FAILED',409,'BUILD_CLEANUP_FAILED',FAILURES['BUILD_CLEANUP_FAILED'])
            if task['status']=='failed':
                now=self.clock()
                busy=db.execute('SELECT 1 FROM shuku_task_leases WHERE resource_key=%s AND expires_at>%s',(task['resource_key'],now)).fetchone()
                require(not busy,409,'BUILD_BUSY','课程有其他任务正在执行，请稍后重试。')
                db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,result=NULL,checkpoint=%s,available_at=%s,lease_token=NULL,lease_until=NULL WHERE id=%s",(JsonValue({}),now,task['id']))
                self.flow.audit(db,uid,'player.retry',task['id'])
        return {'state':'queued' if task['status']=='failed' else 'ready' if task['status']=='succeeded' else task['status']}

    def file(self,uid,rid,path):
        with self.store.transaction() as db:
            self.flow.allowed(db,rid,uid)
            task=db.execute("SELECT result FROM shuku_tasks WHERE idempotency_key=%s AND status='succeeded'",(self.key(rid),)).fetchone()
            files=(task['result'] or {}).get('files',{}) if task else {}
            artifact=path in ('index.html','bundle.js','bundle.css','utilities.css') or path.startswith(('static/','assets/'))
            require(artifact and path in files,404,'NOT_FOUND','课程资源不存在。')
            obj=files[path]
        content=self.bucket.read(obj['sha256'])
        require(len(content)==obj['size'],503,'FILE_CORRUPT','课程资源校验失败。')
        return content,obj['mime']

    def run(self,task,checkpoint):
        rid=task['payload']['revision_id']
        # Protect new objects until their references are committed; same lock as course builds/GC.
        with self.store.transaction() as guard:
            guard.file_reference_lock(shared=True)
            with self.store.transaction() as db:
                row=db.execute('SELECT r.*,c.module_id,c.deleting FROM shuku_revisions r JOIN shuku_courses c ON c.id=r.course_id WHERE r.id=%s',(rid,)).fetchone()
                require(row and not row['deleting'] and row['state']=='ready',404,'NOT_FOUND','课程已移除。')
            project=json.loads(self.bucket.read(row['files']['project.json']['sha256']))
            root=self.flow.native_root(project.get('nativeSnapshot'))
            module=self.flow.module_context(row['module_id'],root)
            checkpoint({'stage':'restoring-original-player'})
            with tempfile.TemporaryDirectory(prefix='shuku-player-') as directory:
                directory=Path(directory);source=directory/'project.json';source.write_text(json.dumps(project));output=directory/'dist'
                code,_,_=run_build(['node',str(Path(self.flow.root)/'scripts/build-shuku-preview.mjs'),'--course-root',str(root),'--project',str(source),'--module',module['directory'] or '','--revision',rid,'--outdir',str(output),'--player','1'],build_environment(),lambda:checkpoint({'stage':'restoring-original-player'}))
                require(code==0,422,'SOURCE_BUILD_FAILED',FAILURES['SOURCE_BUILD_FAILED'])
                files={}
                for path in sorted(output.rglob('*')):
                    if path.is_file():
                        require(path.stat().st_size<=32*1024*1024,413,'ARTIFACT_LIMIT','课程资源过大。')
                        relative=path.relative_to(output).as_posix()
                        files[relative]={**self.bucket.put(path.read_bytes()),'mime':mimetypes.guess_type(relative)[0] or 'application/octet-stream'}
            result={'revision_id':rid,'renderer':RENDERER,'files':files}
            checkpoint({'stage':'ready'})
            with self.store.transaction() as db:
                course=db.execute('SELECT deleting FROM shuku_courses WHERE id=%s FOR UPDATE',(row['course_id'],)).fetchone()
                require(course and not course['deleting'],409,'RESOURCE_REMOVED','课程正在移除。')
                lease=db.execute("SELECT id FROM shuku_tasks WHERE id=%s AND status='running' AND lease_token=%s AND lease_until>%s FOR UPDATE",(task['id'],task['lease_token'],self.clock())).fetchone()
                require(lease,409,'STALE_LEASE','任务已被接管。')
                db.execute('UPDATE shuku_tasks SET result=%s WHERE id=%s',(JsonValue(result),task['id']))
            return result
