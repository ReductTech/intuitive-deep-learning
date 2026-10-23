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
from psycopg.types.json import Jsonb
from .errors import BusinessError,require
from .storage import course_view


def identifier(value):
    try:return str(UUID(value))
    except (ValueError,TypeError,AttributeError):raise BusinessError(400,"INVALID_ID","标识格式不正确。")


class Workflow:
    def __init__(self,store,bucket,root,clock=time.time):
        self.store,self.bucket,self.root,self.clock=store,bucket,root,clock

    def modules(self):
        require(self.root is not None,503,"BUILD_NOT_CONFIGURED","课程构建目录尚未配置。")
        result=[]
        for path in sorted((Path(self.root)/'modules').glob('*/outlines.json')):
            data=json.loads(path.read_text())
            if data.get('ppt',{}).get('entry') and data.get('entry'):
                result.append({'id':data['moduleIdentity']['id'],'alias':data.get('id',path.parent.name),'title':data['title'],'directory':str(path.parent),'entry':data['ppt']['entry'],'pages':[p['id'] for p in data.get('pages',[])]})
        return result

    def owner(self,db,uid,cid):
        user=self.store.user_in(db,uid)
        row=db.execute('SELECT * FROM shuku_business.courses WHERE id=%s FOR UPDATE',(identifier(cid),)).fetchone()
        require(row,404,'NOT_FOUND','课程不存在。')
        require(str(row['owner_id'])==uid or user['role']=='admin',403,'FORBIDDEN','没有课程管理权限。')
        return row,user

    def audit(self,db,uid,action,obj):
        db.execute('INSERT INTO shuku_business.audit(user_id,action,object_id,created_at) VALUES (%s,%s,%s,%s)',(uid,action,str(obj),self.clock()))

    def prepare(self,project,module):
        require(isinstance(project,dict) and project.get('version')==1 and project.get('courseId')==module['alias'],400,'INVALID_PROJECT','课程内容与模块不匹配。')
        require(isinstance(project.get('title'),str) and 0<len(project['title'])<=120,400,'INVALID_PROJECT','请填写课件名称。')
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
            require(native in module['pages'] if native else page.get('format')=='text',400,'UNSUPPORTED_PAGE','请使用原课程页面或文字教学页，模拟网页不能发布。')
        value=json.loads(json.dumps(project))
        images=value.pop('designImages',{})
        require(isinstance(images,dict) and len(images)<=200,400,'INVALID_PROJECT','设计图数据格式不正确。')
        objects={}
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
        require(isinstance(data,dict) and set(data)<= {'project','expected_revision'},400,'INVALID_INPUT','修订请求格式不正确。')
        with self.store.transaction() as db:
            course,_=self.owner(db,uid,cid)
            module=next((m for m in self.modules() if m['id']==str(course['module_id'])),None)
            require(module,400,'UNKNOWN_MODULE','课程模块不存在。')
            require(data.get('expected_revision')==(str(course['head_revision']) if course['head_revision'] else None),409,'REVISION_CONFLICT','课程已更新，请重新载入后保存。')
            objects,digest=self.prepare(data.get('project'),module)
            rid=str(uuid4());now=self.clock()
            db.execute("INSERT INTO shuku_business.revisions VALUES (%s,%s,%s,%s,'building',%s,NULL,%s)",(rid,cid,uid,digest,Jsonb(objects),now))
            db.execute("UPDATE shuku_business.reviews SET status='superseded' WHERE course_id=%s AND status IN ('pending','approved')",(cid,))
            db.execute('UPDATE shuku_business.courses SET head_revision=%s WHERE id=%s',(rid,cid))
            db.execute("INSERT INTO shuku_business.tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'revision.build',%s,%s,%s,%s,%s,%s)",(uuid4(),'course:'+cid,'build:'+rid,digest,Jsonb({'revision_id':rid}),now,now))
            self.audit(db,uid,'revision.save',rid)
        return {'id':rid,'state':'building'}

    def allowed(self,db,rid,uid,public=True):
        row=db.execute("SELECT r.*,c.owner_id,c.status AS course_status,c.module_id,c.head_revision FROM shuku_business.revisions r JOIN shuku_business.courses c ON c.id=r.course_id WHERE r.id=%s",(identifier(rid),)).fetchone()
        require(row,404,'NOT_FOUND','修订不存在。')
        user=self.store.user_in(db,uid) if uid else None
        private=bool(user and (str(row['owner_id'])==uid or user['role']=='admin'))
        released=public and row['course_status']=='published' and db.execute('SELECT 1 FROM shuku_business.releases WHERE revision_id=%s',(rid,)).fetchone()
        require(private or released,404,'NOT_FOUND','修订不存在或无权访问。')
        return row

    def revision(self,uid,rid):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid,public=False)
            project=json.loads(self.bucket.read(row['files']['project.json']['sha256']))
            project['designImages']={key:'data:'+row['files'][path]['mime']+';base64,'+base64.b64encode(self.bucket.read(row['files'][path]['sha256'])).decode() for key,path in project.get('designImages',{}).items()}
            review=db.execute('SELECT status,note FROM shuku_business.reviews WHERE revision_id=%s',(rid,)).fetchone()
            task=db.execute("SELECT status,error_code FROM shuku_business.tasks WHERE idempotency_key=%s",('build:'+rid,)).fetchone()
            state='failed' if row['state']=='building' and task and task['status']=='failed' else row['state']
            return {'id':str(row['id']),'state':state,'project':project,'review':review,'preview_url':'/api/shuku/revisions/'+rid+'/files/index.html'}

    def file(self,uid,rid,path):
        with self.store.transaction() as db:
            row=self.allowed(db,rid,uid)
            artifact=path in ('index.html','bundle.js','bundle.css','utilities.css') or path.startswith(('static/','assets/'))
            require(row['state']=='ready' and path in row['files'] and artifact,404,'NOT_FOUND','课程资源不存在。')
            obj=row['files'][path]
        content=self.bucket.read(obj['sha256'])
        require(len(content)==obj['size'],503,'FILE_CORRUPT','课程文件校验失败。')
        return content,obj['mime']

    def build(self,task,checkpoint):
        rid=str(task['payload']['revision_id'])
        with self.store.transaction() as db:
            row=db.execute('SELECT * FROM shuku_business.revisions WHERE id=%s',(rid,)).fetchone()
            if row['state']=='ready':return {'revision_id':rid}
            course=db.execute('SELECT module_id FROM shuku_business.courses WHERE id=%s',(row['course_id'],)).fetchone()
        module=next(m for m in self.modules() if m['id']==str(course['module_id']))
        objects=dict(row['files']);project=json.loads(self.bucket.read(objects['project.json']['sha256']))
        checkpoint({'stage':'building','revision_id':rid})
        try:
            with tempfile.TemporaryDirectory(prefix='shuku-build-') as folder:
                folder=Path(folder);source=folder/'project.json';source.write_text(json.dumps(project));out=folder/'dist'
                env=__import__('os').environ.copy();env['NODE_OPTIONS']='--max-old-space-size=256'
                process=subprocess.Popen(['node',str(Path(self.root)/'scripts/build-shuku-preview.mjs'),'--project',str(source),'--module',module['directory'],'--revision',rid,'--outdir',str(out)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env)
                started=time.monotonic()
                while True:
                    try:
                        stdout,stderr=process.communicate(timeout=5);break
                    except subprocess.TimeoutExpired:
                        if time.monotonic()-started>90:
                            process.kill();process.communicate();raise RuntimeError('Build timeout')
                        checkpoint({'stage':'building','revision_id':rid})
                if process.returncode:raise RuntimeError('Course artifact build failed')
                for path in sorted(out.rglob('*')):
                    if path.is_file():
                        require(path.stat().st_size<=32*1024*1024,413,'ARTIFACT_LIMIT','课程资源过大。')
                        relative=path.relative_to(out).as_posix()
                        objects[relative]={**self.bucket.put(path.read_bytes()),'mime':mimetypes.guess_type(relative)[0] or 'application/octet-stream'}
            artifact_hash=hashlib.sha256(json.dumps(objects,sort_keys=True).encode()).hexdigest()
            checkpoint({'stage':'verified','revision_id':rid})
            with self.store.transaction() as db:
                # Fence artifact writes with the same active task lease as completion.
                lease=db.execute("SELECT id FROM shuku_business.tasks WHERE id=%s AND lease_token=%s AND lease_until>%s FOR UPDATE",(task['id'],task['lease_token'],self.clock())).fetchone()
                require(lease,409,'STALE_LEASE','任务已被接管。')
                db.execute("UPDATE shuku_business.revisions SET files=%s,artifact_hash=%s,state='ready' WHERE id=%s AND state='building'",(Jsonb(objects),artifact_hash,rid))
        except Exception:
            # Retry retains the immutable source; final failure is projected by revision().
            raise
        return {'revision_id':rid,'artifact_hash':artifact_hash}

    def submit(self,uid,cid,data):
        with self.store.transaction() as db:
            course,_=self.owner(db,uid,cid);rid=identifier(data.get('revision_id'))
            require(str(course['head_revision'])==rid,409,'REVISION_CONFLICT','请提交当前最新修订。')
            revision=db.execute("SELECT * FROM shuku_business.revisions WHERE id=%s AND course_id=%s AND state='ready'",(rid,cid)).fetchone()
            require(revision,409,'NOT_READY','请等待课程预览准备完成。')
            existing=db.execute('SELECT * FROM shuku_business.reviews WHERE revision_id=%s',(rid,)).fetchone()
            if existing:
                require(existing['status'] in ('pending','approved'),409,'NEW_REVISION_REQUIRED','请修改并保存新修订后重新提交。')
                return {'id':str(existing['id']),'status':existing['status']}
            review=str(uuid4());db.execute("INSERT INTO shuku_business.reviews(id,revision_id,course_id,status,artifact_hash,created_at) VALUES (%s,%s,%s,'pending',%s,%s)",(review,rid,cid,revision['artifact_hash'],self.clock()))
            self.audit(db,uid,'review.submit',review)
            return {'id':review,'status':'pending'}

    def reviews(self,uid):
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid);require(user['role']=='admin',403,'FORBIDDEN','需要管理员权限。')
            return [course_view(r) for r in db.execute("SELECT r.*,c.title,c.owner_id FROM shuku_business.reviews r JOIN shuku_business.courses c ON c.id=r.course_id WHERE r.status='pending' ORDER BY r.created_at LIMIT 100").fetchall()]

    def decide(self,uid,review_id,data):
        require(data.get('decision') in ('approved','rejected') and isinstance(data.get('note',''),str) and len(data.get('note',''))<=2000,400,'INVALID_REVIEW','审核意见格式不正确。')
        require(data['decision']!='rejected' or data.get('note','').strip(),400,'NOTE_REQUIRED','请填写退回原因。')
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid);require(user['role']=='admin',403,'FORBIDDEN','需要管理员权限。')
            row=db.execute('SELECT * FROM shuku_business.reviews WHERE id=%s',(identifier(review_id),)).fetchone();require(row,404,'NOT_FOUND','审核记录不存在。')
            course=db.execute('SELECT * FROM shuku_business.courses WHERE id=%s FOR UPDATE',(row['course_id'],)).fetchone()
            row=db.execute('SELECT * FROM shuku_business.reviews WHERE id=%s FOR UPDATE',(review_id,)).fetchone()
            require(str(course['owner_id'])!=uid,403,'SELF_REVIEW','不能审核自己的课程。')
            require(row['status']=='pending' and row['revision_id']==course['head_revision'] and str(row['revision_id'])==data.get('revision_id'),409,'REVIEW_CHANGED','审核内容已变化，请重新查看。')
            db.execute('UPDATE shuku_business.reviews SET status=%s,note=%s,reviewer_id=%s,decided_at=%s WHERE id=%s',(data['decision'],data.get('note',''),uid,self.clock(),review_id))
            self.audit(db,uid,'review.'+data['decision'],review_id)
            return {'status':data['decision']}

    def publish(self,uid,cid,data):
        version=data.get('version','');note=data.get('note','')
        require(isinstance(version,str) and re.fullmatch(r'v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)',version),400,'INVALID_VERSION','版本号格式为 1.0.0。')
        version=version.removeprefix('v');rid=identifier(data.get('revision_id'))
        require(isinstance(note,str) and len(note)<=3000,400,'INVALID_INPUT','版本说明过长。')
        with self.store.transaction() as db:
            course,_=self.owner(db,uid,cid)
            previous=db.execute('SELECT * FROM shuku_business.releases WHERE course_id=%s AND version=%s',(cid,version)).fetchone()
            if previous:
                require(str(previous['revision_id'])==rid and previous['note']==note,409,'VERSION_EXISTS','该版本号已被使用。')
                return course_view(previous)
            require(str(course['head_revision'])==rid,409,'REVISION_CONFLICT','请发布当前已审核修订。')
            revision=db.execute("SELECT * FROM shuku_business.revisions WHERE id=%s AND course_id=%s AND state='ready'",(rid,cid)).fetchone()
            review=db.execute("SELECT * FROM shuku_business.reviews WHERE revision_id=%s AND status='approved' FOR UPDATE",(rid,)).fetchone()
            require(revision and review and revision['artifact_hash']==review['artifact_hash'],409,'APPROVAL_REQUIRED','需要先通过当前修订的审核。')
            if course['current_release']:
                current=db.execute('SELECT version FROM shuku_business.releases WHERE id=%s',(course['current_release'],)).fetchone()
                require(tuple(map(int,version.split('.')))>tuple(map(int,current['version'].split('.'))),409,'VERSION_ORDER','新版本号需高于当前版本。')
            # Verify every immutable referenced object before changing the live pointer.
            for obj in revision['files'].values():
                require(len(self.bucket.read(obj['sha256']))==obj['size'],503,'FILE_CORRUPT','课程文件不完整，保留原正式版。')
            release=db.execute('INSERT INTO shuku_business.releases VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *',(uuid4(),cid,rid,version,note,uid,self.clock())).fetchone()
            published_title=json.loads(self.bucket.read(revision['files']['project.json']['sha256']))['title']
            db.execute("UPDATE shuku_business.courses SET status='published',current_release=%s,title=%s WHERE id=%s",(release['id'],published_title,cid))
            db.execute("UPDATE shuku_business.reviews SET status='published' WHERE revision_id=%s",(rid,))
            self.audit(db,uid,'course.publish',release['id']);return course_view(release)

    def public_courses(self):
        with self.store.transaction() as db:
            return [course_view(row) for row in db.execute("SELECT c.id,c.title,c.description,c.category,c.module_id,r.version,r.revision_id FROM shuku_business.courses c JOIN shuku_business.releases r ON r.id=c.current_release WHERE c.status='published' ORDER BY r.created_at DESC LIMIT 100").fetchall()]
