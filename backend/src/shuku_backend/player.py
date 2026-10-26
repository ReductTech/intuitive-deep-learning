"""Replace viewer code without changing approved course source or release hashes."""
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import subprocess
import tempfile
import time
from uuid import uuid4
from .database import JsonValue
from .errors import require
from .workflow import identifier

RENDERER='original-39a0557-v1'

class Player:
    def __init__(self,flow):
        self.flow,self.store,self.bucket,self.clock=flow,flow.store,flow.bucket,flow.clock

    def key(self,rid):return 'player:'+RENDERER+':'+identifier(rid)

    def status(self,uid,rid):
        rid=identifier(rid)
        with self.store.transaction() as db:
            row=self.flow.allowed(db,rid,uid)
            require(row['state']=='ready',409,'NOT_READY','请等待课程预览准备完成。')
            require(self.flow.root,503,'BUILD_NOT_CONFIGURED','课程构建目录尚未配置。')
            now=self.clock();key=self.key(rid)
            db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'revision.player',%s,%s,%s,%s,%s,%s)",(str(uuid4()),'course:'+str(row['course_id']),key,hashlib.sha256(key.encode()).hexdigest(),JsonValue({'revision_id':rid}),now,now))
            task=db.execute('SELECT status FROM shuku_tasks WHERE idempotency_key=%s',(key,)).fetchone()
            state='ready' if task['status']=='succeeded' else task['status']
        return {'state':state,**({'url':'/api/shuku/revisions/'+rid+'/player/files/index.html'} if state=='ready' else {})}

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
                env=os.environ.copy();env['NODE_OPTIONS']='--max-old-space-size=256'
                process=subprocess.Popen(['node',str(Path(self.flow.root)/'scripts/build-shuku-preview.mjs'),'--course-root',str(root),'--project',str(source),'--module',module['directory'] or '','--revision',rid,'--outdir',str(output),'--player','1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env)
                start=time.monotonic()
                while True:
                    try:_,stderr=process.communicate(timeout=5);break
                    except subprocess.TimeoutExpired:
                        if time.monotonic()-start>90:
                            process.kill();process.communicate();raise RuntimeError('Player build timeout')
                        checkpoint({'stage':'restoring-original-player'})
                require(process.returncode==0,422,'PLAYER_BUILD_FAILED','课程页面准备失败。')
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
