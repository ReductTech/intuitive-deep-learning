"""Course-scoped local clients reuse immutable revisions; never accept ZIPs or publish."""
import base64
from hashlib import sha256
import json
from pathlib import Path
import mimetypes
import re
import secrets
from uuid import uuid4
from .errors import require
from .workflow import identifier

LIFETIME=30*86400
TOKEN=re.compile(r'shu_local_[A-Za-z0-9_-]{43}')
AUTHORING={'repository':'https://github.com/reduct-shuku/course-template.git','commit':'5494acc45c2069e4bf793c0b2e95b21cfe0f18eb'}


class LocalAgent:
    def __init__(self,flow,origin):
        self.flow,self.store,self.clock,self.origin=flow,flow.store,flow.clock,origin

    def owned(self,db,uid,cid):
        course,user=self.flow.owner(db,uid,cid)
        require(str(course['owner_id'])==uid,403,'FORBIDDEN','只能为本人课程或共创工作区生成本地创作指令。')
        workspace=db.execute('SELECT target_course_id,base_release_id,deleted_at FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone()
        require(not workspace or not workspace['deleted_at'],404,'NOT_FOUND','共创工作区已删除。')
        if course['head_revision']:
            row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['head_revision'],)).fetchone()
            project=json.loads(self.flow.bucket.read(row['files']['project.json']['sha256']))
            require(not project.get('externalSnapshot'),409,'USE_GITHUB_CONTRIBUTION','此课程是静态仓库快照，请使用原有 GitHub 共创流程。')
        return course,workspace

    def public_native_asset(self,commit,asset,name):
        """Only public, pinned library media; never course buckets or source files."""
        from .source import MEDIA
        require(isinstance(asset,str) and re.fullmatch(r'[A-Za-z0-9_-]{1,100}',asset),404,'NOT_FOUND','课程素材不存在。')
        require(isinstance(name,str) and name and all(p not in ('','.','..') and not p.startswith('.') for p in name.split('/')) and not any(c in name for c in '\\:%?#'),404,'NOT_FOUND','课程素材不存在。')
        root=self.flow.native_root(commit)
        require(any(m['id']==asset for m in self.flow.modules(root)),404,'NOT_FOUND','课程素材不存在。')
        base=root/'assets'/asset;target=base/name
        require(target.suffix.lower() in MEDIA|{'.svg','.json'} and target.is_file() and not target.is_symlink() and target.resolve().is_relative_to(base.resolve()),404,'NOT_FOUND','课程素材不存在。')
        return target,mimetypes.guess_type(target.name)[0] or 'application/octet-stream'

    def issue_in(self,db,uid,cid):
        course,workspace=self.owned(db,uid,cid)
        # Serialize per account so concurrent issuance cannot exceed the limit.
        db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,)).fetchone()
        count=db.execute('SELECT COUNT(*) AS n FROM shuku_agent_credentials WHERE user_id=%s AND revoked_at IS NULL AND expires_at>%s',(uid,self.clock())).fetchone()['n']
        require(count<20,429,'TOKEN_LIMIT','最多同时保留 20 个本地创作凭证，请先撤销不用的凭证。')
        token='shu_local_'+secrets.token_urlsafe(32);tid=str(uuid4());now=self.clock()
        db.execute('INSERT INTO shuku_agent_credentials(id,user_id,course_id,token_hash,created_at,expires_at) VALUES (%s,%s,%s,%s,%s,%s)',(tid,uid,cid,sha256(token.encode()).hexdigest(),now,now+LIFETIME))
        self.flow.audit(db,uid,'agent.credential.create',tid)
        base=None
        if workspace:
            base=db.execute('SELECT version,revision_id FROM shuku_releases WHERE id=%s',(workspace['base_release_id'],)).fetchone()
        return {'token_id':tid,'expires_at':now+LIFETIME,'filename':cid+'-local-agent.txt',
                'text':self.instructions(course,token,base)}

    def create(self,uid,data):
        with self.store.transaction() as db:
            course=self.store.create_course(uid,data,self.clock(),getattr(self.flow,'github',None),db=db)
            result=self.issue_in(db,uid,course['id'])
            return {**result,'course':course}

    def issue(self,uid,cid):
        with self.store.transaction() as db:return self.issue_in(db,uid,identifier(cid))

    def listing(self,uid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            return {'credentials':db.execute('SELECT a.id,a.course_id,c.title,a.created_at,a.expires_at,a.last_used_at,a.revoked_at FROM shuku_agent_credentials a JOIN shuku_courses c ON c.id=a.course_id WHERE a.user_id=%s AND NOT c.deleting ORDER BY (a.revoked_at IS NULL AND a.expires_at>%s) DESC,a.created_at DESC LIMIT 100',(uid,self.clock())).fetchall()}

    def revoke(self,uid,tid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            row=db.execute('SELECT id FROM shuku_agent_credentials WHERE id=%s AND user_id=%s FOR UPDATE',(identifier(tid),uid)).fetchone()
            require(row,404,'NOT_FOUND','凭证不存在。')
            db.execute('UPDATE shuku_agent_credentials SET revoked_at=COALESCE(revoked_at,%s) WHERE id=%s',(self.clock(),tid))
            self.flow.audit(db,uid,'agent.credential.revoke',tid)
        return {'revoked':True}

    def authorize(self,db,raw,cid=None):
        require(isinstance(raw,str) and TOKEN.fullmatch(raw),401,'AGENT_UNAUTHORIZED','本地创作凭证无效或已失效。')
        token=db.execute('SELECT * FROM shuku_agent_credentials WHERE token_hash=%s',(sha256(raw.encode()).hexdigest(),)).fetchone()
        require(token and token['revoked_at'] is None and token['expires_at']>self.clock(),401,'AGENT_UNAUTHORIZED','本地创作凭证无效或已失效。')
        require(cid is None or str(token['course_id'])==cid,403,'AGENT_SCOPE','此凭证只能访问指定课程。')
        self.owned(db,str(token['user_id']),str(token['course_id']))
        db.execute('UPDATE shuku_agent_credentials SET last_used_at=%s WHERE id=%s',(self.clock(),token['id']))
        return token

    def snapshot(self,raw,cid):
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True)
            token=self.authorize(db,raw,identifier(cid));uid=str(token['user_id'])
            course,workspace=self.owned(db,uid,cid)
            draft=db.execute('SELECT * FROM shuku_editor_drafts WHERE course_id=%s',(cid,)).fetchone()
            head=str(course['head_revision']) if course['head_revision'] else None
            require(not draft or draft['base_revision']==head,409,'DRAFT_CONFLICT','网页草稿基于旧修订，请先在网页处理后再读取。')
            if draft:
                project=draft['payload']
            elif head:
                row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(head,)).fetchone()
                project=json.loads(self.flow.bucket.read(row['files']['project.json']['sha256']))
                project['designImages']={key:'data:'+row['files'][path]['mime']+';base64,'+base64.b64encode(self.flow.bucket.read(row['files'][path]['sha256'])).decode() for key,path in project.get('designImages',{}).items()}
            else:
                alias=self.flow.module_context(course['module_id'])['alias']
                # New local courses are independent sources, never copies of an arbitrary sample.
                project={'version':1,'id':cid,'courseId':alias,'title':course['title'],'duration':20,'style':'简洁','outlineConfirmed':False,
                         'pages':[{'id':'page-1','format':'react','sourceEntry':'Lesson.tsx','title':'第一课','goal':'','summary':'','note':'','ready':False,'designed':False,'revisions':[],'messages':[]}],
                         'source':{'files':{'Lesson.tsx':"export default function Lesson(){return <main><h1>开始创作</h1></main>}"}}}
            native=None
            if project.get('nativeSnapshot') or any(p.get('nativeId') for p in project['pages']):
                commit=project.get('nativeSnapshot')
                require(isinstance(commit,str) and re.fullmatch('[0-9a-f]{40}',commit),409,'SOURCE_SNAPSHOT_MISSING','原课程缺少固定源码版本，请先由管理员登记基础源码。')
                root=self.flow.native_root(commit);module=self.flow.module_context(course['module_id'],root)
                require(module['directory'],409,'SOURCE_SNAPSHOT_MISSING','固定版本中找不到原课程源码。')
                native={'repository':'https://github.com/reduct-shuku/intuitive-deep-learning.git','commit':commit,
                        'module':Path(module['directory']).relative_to(root).as_posix(),'asset_id':module['id']}
            return {'course_id':cid,'project':project,'course':{'title':course['title'],'description':course['description'],'category':course['category']},
                    'authoring':AUTHORING,'native_source':native,'expected_revision':head,'expected_draft':draft['version'] if draft else None,
                    'workspace':dict(workspace) if workspace else None,'editor_url':self.origin+'/my-courses/editor?course='+cid}

    def revision(self,raw,rid):
        with self.store.transaction() as db:
            token=self.authorize(db,raw)
            row=db.execute('SELECT course_id FROM shuku_revisions WHERE id=%s',(identifier(rid),)).fetchone()
            require(row and str(row['course_id'])==str(token['course_id']),404,'NOT_FOUND','修订不存在或无权访问。')
            uid=str(token['user_id'])
        return self.flow.revision(uid,rid)

    def save(self,raw,cid,key,data):
        require(isinstance(key,str) and re.fullmatch(r'[A-Za-z0-9_-]{16,100}',key),400,'IDEMPOTENCY_REQUIRED','保存时请提供 Idempotency-Key。')
        require(isinstance(data,dict) and set(data)=={'project','expected_revision','expected_draft'},400,'INVALID_INPUT','请携带项目、预期修订和预期草稿。')
        digest=sha256(json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
        with self.store.transaction() as db:
            db.file_reference_lock(shared=True)
            token=self.authorize(db,raw,identifier(cid));uid=str(token['user_id'])
            self.owned(db,uid,cid)  # The course lock serializes web/agent saves and idempotency checks.
            prior=db.execute('SELECT request_hash,revision_id FROM shuku_agent_requests WHERE course_id=%s AND request_key=%s',(cid,key)).fetchone()
            if prior:
                require(prior['request_hash']==digest,409,'IDEMPOTENCY_CONFLICT','同一请求编号不能保存不同内容。')
                return {'id':str(prior['revision_id']),'replayed':True}
            recent=db.execute('SELECT COUNT(*) AS n FROM shuku_agent_requests WHERE course_id=%s AND created_at>%s',(cid,self.clock()-60)).fetchone()['n']
            require(recent<10,429,'AGENT_RATE_LIMIT','保存过于频繁，请稍后重试。')
            require(not db.execute("SELECT 1 FROM shuku_tasks WHERE kind='revision.build' AND resource_key=%s AND status IN ('queued','running')",('course:'+cid,)).fetchone(),409,'BUILD_BUSY','上次修订仍在构建，请等待完成。')
            result=self.flow.save_in(db,uid,cid,data)
            db.execute('INSERT INTO shuku_agent_requests(course_id,request_key,request_hash,revision_id,created_at) VALUES (%s,%s,%s,%s,%s)',(cid,key,digest,result['id'],self.clock()))
            self.flow.audit(db,uid,'agent.revision.save',result['id'])
            return result

    def client(self,raw=None):
        if raw is not None:
            with self.store.transaction() as db:self.authorize(db,raw)
        return Path(__file__).with_name('local_agent_client.py').read_text(encoding='utf-8')

    def instructions(self,course,token,base):
        cid=str(course['id'])
        return '\n'.join([
            course['title']+(' · 私有工作区共创说明' if base else ' · 课程创作说明'),
            '首次收到本说明时，只执行准备阶段。标题、简介和分类是背景信息，不是立即生成课程的指令。',
            '课程信息：'+json.dumps({'course_id':cid,'title':course['title'],'description':course.get('description',''),'category':course.get('category','')},ensure_ascii=False),
            '准备阶段：',
            ('新建本次共创目录 '+cid+'，不复制模板示例；下面的 prepare 会下载所选版本的完整原课程，并补齐固定版本创作框架。已有工程时沿用，不能覆盖本地修改。') if base else ('从 '+AUTHORING['repository']+' 克隆完整标准工程到新目录 '+cid+'，切换到固定提交 '+AUTHORING['commit']+'。已有本次工程时沿用，不能覆盖本地修改。'),
            '公共创作框架：'+AUTHORING['repository']+'，固定提交：'+AUTHORING['commit']+'。',
            '必须保留 creator-skills/、environment/、runtime/：包含公共组件、设计规范、视觉正反例、参考样例、检查工具和本地预览环境，不能只下载 SKILL.md。',
            '阅读 README.md、creator-skills/SKILL.md、courses/README.md；共创还需阅读 creator-skills/collaboration/SKILL.md（如有）。准备阶段只了解结构，不启动创作流程。',
            '术库地址：'+self.origin, '课程 ID：'+cid,
            '基础发布版本：'+str(base['version']) if base else '本课程为本人私有创作。',
            '本次共创保留已选择的基础版本；不得换成官方最新版本或覆盖其他人的修改。',
            '将下方凭证单独保存为本地 api_token，文件中只放凭证；加入 .gitignore，不提交到 GitHub，不放进课程源码或截图。',
            'API Token：'+token,
            '凭证有效期 30 天，只能读取和保存本课程；不能审核、发布或管理账号。可以在个人信息中撤销。',
            '准备本地助手：使用 Authorization: Bearer <api_token 中的凭证>，GET '+self.origin+'/api/shuku/local-agent/client ，将响应保存为 shuku-local-agent.py。',
            '准备工程：python3 shuku-local-agent.py --origin '+self.origin+' --course '+cid+' prepare',
            '助手保存 project.json、shuku-state.json 和课程基本信息。新课准备本课程的 courses/modules/ 目录；共创会克隆所选固定快照中的完整原课程模块与素材，不复制官方当前最新版。已有文件不会覆盖。',
            '准备阶段不生成正文、章节、练习或交互页面，不构建、打包、上传或保存修订。完成后告知工程位置，询问用户面向谁、讲什么、希望如何设计，然后等待具体要求。',
            '收到创作要求后，与用户逐步讨论整体逻辑、模块与逐页内容。保留页面 ID、courseId 和 nativeSnapshot；仅修改用户要求的内容。',
            '收到具体要求后，在 shuku-state.json 指定的 courses/modules/ 课程目录创作，按模板规范讨论整体逻辑、模块和逐页设计。保留课程标识和未要求修改的内容，不上传模板示例课程。',
            '收到课程内容要求后，为课程拟一个简洁准确的英文仓库名（2～5 个英文单词，用小写字母、数字和连字符，以字母开头，最长 80 字符），不要附加 UUID 或随机串。标准工程写入 outlines.json 的 repositoryName；原 source 工程写入 project.json.repositoryName。首次准备阶段不提前取名。平台发布时由创建者确认并检查是否重名，Agent 不直接改名或公开 GitHub 仓库。',
            '本地预览：npm --prefix environment/frontend ci，然后 npm --prefix environment/frontend run dev。沿用模板的公共组件与视觉检查工具。',
            '标准模块用 outlines.json 登记页码和 ppt.entry，PPT 模块导出 deck；也兼容已有 source/ 工程。push 会将真实课程源码和素材转换为 IDL 修订，不只上传页面描述。',
            '支持 @shared/react、React、React DOM、three、@icon-park/react 与已安装的固定依赖；普通图片可放 courses/assets/。不安装任意依赖，不上传服务端程序、框架、node_modules 或凭证。',
            '交付采用以下修订接口，不执行 UPLOAD.md 的 ZIP 上传、不调用 /api/agent/courses/upload，不需要个人 Fork 或用户绑定 GitHub。',
            '需要保存阶段成果时：python3 shuku-local-agent.py push 。随后 python3 shuku-local-agent.py status 查询构建；失败修复后再次保存，网络重试沿用原请求编号。',
            '网页和本地同时修改出现冲突时保留本地文件，先与用户确认，不自动覆盖网页草稿。',
            '完成后回到 '+self.origin+'/my-courses/editor?course='+cid+' 预览，确认后由用户在网页提交审核或共创建议。',
        ])
