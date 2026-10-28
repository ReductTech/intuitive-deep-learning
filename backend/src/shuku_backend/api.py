from .review_inbox import listing as review_inbox
from .admin import listing as admin_listing
"""Standalone same-origin HTTP API. No changes to idl_backend HTTP handlers."""
from hashlib import sha256
from http.cookies import SimpleCookie, CookieError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote, parse_qs
import json
import re
import threading
from .errors import BusinessError, require
from .source import SANDBOX_CSP

COOKIE="shuku_idl_session"
PRESENTATION_SLOT=threading.BoundedSemaphore(1)


def token_from(cookie):
    jar=SimpleCookie()
    try:jar.load(cookie or "")
    except CookieError:return ""
    value=jar[COOKIE].value if COOKIE in jar else ""
    return value if re.fullmatch(r"[a-f0-9]{64}",value) else ""


def token_hash(token):
    return sha256(token.encode()).hexdigest()


class Server(ThreadingHTTPServer):
    daemon_threads=False
    block_on_close=True
    def __init__(self,address,handler):
        self.slots=threading.BoundedSemaphore(16)
        super().__init__(address,handler)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            request.close()
            return
        try:super().process_request(request,client_address)
        except BaseException:
            self.slots.release()
            raise

    def process_request_thread(self,request,client_address):
        try:super().process_request_thread(request,client_address)
        finally:self.slots.release()


def handler_for(app):
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            self.request.settimeout(5)
            super().setup()

        def log_message(self,*args):
            pass  # No request/query/body logging: credentials remain private.

        def send_json(self,status,value,cookie=None):
            body=json.dumps(value,ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type","application/json; charset=utf-8")
            self.send_header("Content-Length",str(len(body)))
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            if cookie:self.send_header("Set-Cookie",cookie)
            self.end_headers()
            self.wfile.write(body)

        def send_client(self,value):
            body=value.encode()
            self.send_response(200)
            self.send_header('Content-Type','text/plain; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.end_headers();self.wfile.write(body)

        def cookie(self,token,expire=False):
            value=f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/api/shuku; Max-Age={0 if expire else 43200}"
            return value+("; Secure" if app.settings.origin.startswith("https://") else "")

        def body(self,limit=65536,agent=False):
            require((self.headers.get("Origin")==app.settings.origin or agent and not self.headers.get("Origin")) and self.headers.get("Sec-Fetch-Site")!="cross-site",403,"CROSS_SITE","不允许跨站操作。")
            require(not self.headers.get("Transfer-Encoding"),400,"INVALID_INPUT","不支持该请求编码。")
            require(self.headers.get("Content-Type","").split(";",1)[0].lower()=="application/json",415,"JSON_REQUIRED","请使用 JSON 请求。")
            try:size=int(self.headers.get("Content-Length","0"))
            except ValueError:raise BusinessError(400,"INVALID_INPUT","请求长度不正确。")
            require(0<size<=limit,413,"BODY_LIMIT","请求体过大或为空。")
            try:body=json.loads(self.rfile.read(size))
            except (ValueError,UnicodeDecodeError):raise BusinessError(400,"INVALID_JSON","JSON 格式不正确。")
            require(isinstance(body,dict),400,"INVALID_INPUT","请使用 JSON 对象。")
            return body

        def do_GET(self):self.dispatch()
        def do_POST(self):self.dispatch()

        def dispatch(self):
            try:
                url=urlsplit(self.path)
                path=url.path
                if self.command=='POST' and path=='/api/shuku/github/webhook':
                    require(not self.headers.get('Transfer-Encoding') and self.headers.get('Content-Type','').split(';',1)[0]=='application/json',415,'JSON_REQUIRED','请使用 JSON 请求。')
                    try:size=int(self.headers.get('Content-Length','0'))
                    except ValueError:size=0
                    require(0<size<=1024*1024,413,'BODY_LIMIT','Webhook 请求体过大或为空。')
                    return self.send_json(202,app.workflow.github.webhook(self.headers,self.rfile.read(size)))
                query=parse_qs(url.query,keep_blank_values=True)
                admin_path=re.fullmatch(r'/api/shuku/admin/(courses|contributions|reports|records)',path)
                allowed_query=self.command=='GET' and ((path in ('/api/shuku/messages','/api/shuku/personal') and set(query)=={'cursor'} and len(query['cursor'])==1 and query['cursor'][0]) or (admin_path and set(query)<={'page','group'} and all(len(values)==1 for values in query.values()) and ('group' not in query or admin_path[1]=='courses')))
                inbox_query=self.command=='GET' and path=='/api/shuku/review-inbox' and set(query)<={'stage','course','q','page'} and all(len(values)==1 for values in query.values())
                require(not url.query or allowed_query or inbox_query,400,'INVALID_INPUT','该接口不接受这些查询参数。')
                bearer=self.headers.get('Authorization')
                if bearer is not None:
                    require(bearer.startswith('Bearer '),401,'AGENT_UNAUTHORIZED','请使用本地创作凭证。')
                    raw=bearer[7:]
                    require((not self.headers.get('Origin') or self.headers.get('Origin')==app.settings.origin) and self.headers.get('Sec-Fetch-Site')!='cross-site',403,'CROSS_SITE','不允许跨站操作。')
                    snapshot=re.fullmatch(r'/api/shuku/local-agent/courses/([^/]+)/project',path)
                    save_agent=re.fullmatch(r'/api/shuku/courses/([^/]+)/revisions',path)
                    read_agent=re.fullmatch(r'/api/shuku/revisions/([^/]+)',path)
                    if self.command=='GET' and snapshot:return self.send_json(200,app.workflow.local_agent.snapshot(raw,snapshot[1]))
                    if self.command=='POST' and save_agent:return self.send_json(202,app.workflow.local_agent.save(raw,save_agent[1],self.headers.get('Idempotency-Key'),self.body(16*1024*1024,agent=True)))
                    if self.command=='GET' and read_agent:return self.send_json(200,app.workflow.local_agent.revision(raw,read_agent[1]))
                    if self.command=='GET' and path=='/api/shuku/local-agent/client':
                        return self.send_client(app.workflow.local_agent.client(raw))
                    raise BusinessError(403,'AGENT_SCOPE','本地创作凭证不能执行此操作。')
                if self.command=="GET" and path=="/api/shuku/health":
                    app.store.ready()
                    return self.send_json(200,{"ok":True,"service":"shuku_backend"})
                if self.command=="GET" and path=="/api/shuku/public/courses":
                    return self.send_json(200,{"courses":app.workflow.public_courses()})
                library_course=re.fullmatch(r"/api/shuku/public/library/([A-Za-z0-9_-]+)",path)
                if self.command=="GET" and library_course:
                    return self.send_json(200,{'course':app.workflow.library.course(library_course[1])})
                public_course=re.fullmatch(r"/api/shuku/public/courses/([^/]+)",path)
                if self.command=="GET" and public_course:
                    return self.send_json(200,app.workflow.public_course(public_course[1]))
                releases=re.fullmatch(r"/api/shuku/public/courses/([^/]+)/releases",path)
                if self.command=="GET" and releases:
                    return self.send_json(200,{'releases':app.workflow.collaboration.releases(releases[1])})
                learning=re.fullmatch(r"/api/shuku/public/revisions/([^/]+)",path)
                if self.command=='GET' and learning:
                    return self.send_json(200,app.workflow.feedback.learning(learning[1]))
                study=re.fullmatch(r"/api/shuku/public/study/([^/]+)/([^/]+)",path)
                if self.command=='GET' and study:
                    return self.send_json(200,app.workflow.personal.context(unquote(study[1]),unquote(study[2])))
                player_status=re.fullmatch(r"/api/shuku/revisions/([^/]+)/player",path)
                if self.command=='GET' and player_status:
                    try:viewer=app.store.session_user(token_hash(token_from(self.headers.get('Cookie'))),app.clock())['id']
                    except BusinessError:viewer=None
                    result=app.workflow.player.status(viewer,player_status[1])
                    return self.send_json(200 if result['state']=='ready' else 202,result)
                file_route=re.fullmatch(r"/api/shuku/revisions/([^/]+)/(player/)?files/(.+)",path)
                if self.command=="GET" and file_route:
                    try:viewer=app.store.session_user(token_hash(token_from(self.headers.get("Cookie"))),app.clock())["id"]
                    except BusinessError:viewer=None
                    content,mime=(app.workflow.player.file if file_route[2] else app.workflow.file)(viewer,file_route[1],unquote(file_route[3]))
                    sandboxed=app.workflow.sandboxed(viewer,file_route[1])
                    from .organization_catalog import STATIC_CSP
                    external=app.workflow.external(viewer,file_route[1])
                    self.send_response(200)
                    self.send_header("Content-Type",mime)
                    self.send_header("Content-Length",str(len(content)))
                    self.send_header("Cache-Control","private, no-store")
                    self.send_header("X-Content-Type-Options","nosniff")
                    self.send_header("Content-Security-Policy",STATIC_CSP if external else SANDBOX_CSP if sandboxed else "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'")
                    self.end_headers();self.wfile.write(content);return
                raw_token=token_from(self.headers.get("Cookie"))
                if self.command=='POST' and path=='/api/shuku/auth/sms-code':
                    from .adapters.jianlun import phone_number
                    body=self.body(4096)
                    require(set(body)=={'phone'},400,'INVALID_INPUT','请仅填写手机号。')
                    return self.send_json(200,app.phone_identity.send_code(phone_number(body['phone']),self.client_address[0],app.clock()))
                if self.command=='POST' and path=='/api/shuku/auth/phone-login':
                    from .adapters.jianlun import phone_number
                    body=self.body(4096);method=body.get('method')
                    require(method in ('sms','password'),400,'INVALID_INPUT','请选择验证码登录或密码登录。')
                    key='code' if method=='sms' else 'password'
                    require(set(body)=={'method','phone',key},400,'INVALID_INPUT','登录字段不正确。')
                    phone=phone_number(body['phone']);credential=body[key]
                    require(isinstance(credential,str) and (bool(re.fullmatch(r'[0-9]{4,8}',credential)) if method=='sms' else 0<len(credential)<=256),400,'INVALID_INPUT','请检查验证码或密码。')
                    user,token=app.phone_identity.login_phone(method,phone,credential,self.client_address[0],token_hash(raw_token),app.clock())
                    return self.send_json(200,{'user':user},self.cookie(token))
                if self.command=="POST" and path=="/api/shuku/auth/login":
                    body=self.body()
                    require(not set(body)-{"username","password"},400,"INVALID_INPUT","不支持额外登录字段。")
                    user,token=app.identity.login(body.get("username"),body.get("password"),self.client_address[0],token_hash(raw_token),app.clock())
                    return self.send_json(200,{"user":user},self.cookie(token))
                if self.command=='POST' and path=='/api/shuku/auth/guest':
                    require(not self.body(),400,'INVALID_INPUT','游客入口不接受账号信息。')
                    app.store.remove_session(token_hash(raw_token))
                    return self.send_json(200,{'guest':True},self.cookie('',True))
                if self.command=="POST" and path=="/api/shuku/auth/logout":
                    self.body()
                    app.store.remove_session(token_hash(raw_token))
                    return self.send_json(200,{"message":"已退出登录"},self.cookie("",True))
                user=app.store.session_user(token_hash(raw_token),app.clock())
                if path=='/api/shuku/local-agent/credentials' and self.command=='GET':
                    return self.send_json(200,app.workflow.local_agent.listing(user['id']))
                if path=='/api/shuku/local-agent/courses' and self.command=='POST':
                    return self.send_json(201,app.workflow.local_agent.create(user['id'],self.body()))
                local_brief=re.fullmatch(r'/api/shuku/local-agent/courses/([^/]+)/brief',path)
                if local_brief and self.command=='POST':
                    require(not self.body(),400,'INVALID_INPUT','创作指令不接受额外字段。')
                    return self.send_json(201,app.workflow.local_agent.issue(user['id'],local_brief[1]))
                local_revoke=re.fullmatch(r'/api/shuku/local-agent/credentials/([^/]+)/revoke',path)
                if local_revoke and self.command=='POST':
                    require(not self.body(),400,'INVALID_INPUT','撤销不接受额外字段。')
                    return self.send_json(200,app.workflow.local_agent.revoke(user['id'],local_revoke[1]))
                if self.command=='POST' and path=='/api/shuku/courses/import-presentation':
                    require(user['role'] in ('creator','admin'),403,'FORBIDDEN','当前账号没有创建权限。')
                    require(self.headers.get('Origin')==app.settings.origin and self.headers.get('Sec-Fetch-Site')!='cross-site',403,'CROSS_SITE','不允许跨站操作。')
                    require(not self.headers.get('Transfer-Encoding'),400,'INVALID_INPUT','不支持该请求编码。')
                    require(PRESENTATION_SLOT.acquire(blocking=False),429,'IMPORT_BUSY','正在处理其他课件，请稍后重试。')
                    try:
                        from .presentations import read_upload,import_course,MAX_UPLOAD
                        try:size=int(self.headers.get('Content-Length','0'))
                        except ValueError:size=0
                        require(0<size<=MAX_UPLOAD+65536,413,'PRESENTATION_LIMIT','请选择 100 MB 以内的 PPTX 文件。')
                        self.connection.settimeout(60)
                        content_type=self.headers.get('Content-Type','')
                        data,content,filename=read_upload(content_type,self.rfile,size)
                        try:return self.send_json(201,import_course(app.workflow,user['id'],data,content,filename))
                        finally:content.close()
                    finally:PRESENTATION_SLOT.release()
                if self.command=='GET' and path=='/api/shuku/github/identity':
                    return self.send_json(200,app.github_identity.status(user['id']))
                identity_route=re.fullmatch(r'/api/shuku/github/identity/(start|poll|cancel|disconnect)',path)
                if self.command=='POST' and identity_route:
                    require(self.headers.get('X-Shuku-Account')==user['id'],409,'ACCOUNT_CHANGED','登录账号已切换，请刷新页面后继续。')
                    return self.send_json(200,app.github_identity.action(user['id'],identity_route[1],self.body(4096)))
                if path=='/api/shuku/admin/catalog' and self.command=='GET':
                    return self.send_json(200,app.workflow.catalog.listing(user['id']))
                if path=='/api/shuku/admin/catalog/scan' and self.command=='POST':
                    require(not self.body(),400,'INVALID_INPUT','扫描不接受额外参数。')
                    return self.send_json(202,app.workflow.catalog.request_scan(user['id']))
                catalog_decision=re.fullmatch(r'/api/shuku/admin/catalog/([0-9]+)/decision',path)
                if catalog_decision and self.command=='POST':
                    return self.send_json(202,app.workflow.catalog.decision(user['id'],catalog_decision[1],self.body()))
                if self.command=='GET' and admin_path:
                    return self.send_json(200,admin_listing(app,user['id'],admin_path[1],query.get('page',['1'])[0],query.get('group',[None])[0]))
                if self.command=='GET' and path=='/api/shuku/review-inbox':
                    return self.send_json(200,review_inbox(app,user['id'],query))
                if self.command=="GET" and path=="/api/shuku/auth/me":
                    return self.send_json(200,{"user":user})
                if path=='/api/shuku/profile' and self.command in ('GET','POST'):
                    if self.command=='GET':
                        return self.send_json(200,app.store.profile(user['id']))
                    require(self.headers.get('X-Shuku-Account')==user['id'],409,'ACCOUNT_CHANGED','登录账号已切换，请刷新页面后继续。')
                    return self.send_json(200,app.store.save_profile(user['id'],self.body(),app.clock()))
                if self.command=='POST' and path in ('/api/shuku/personal/study','/api/shuku/personal/favorites'):
                    require(self.headers.get('X-Shuku-Account') in (None,user['id']),409,'ACCOUNT_CHANGED','登录账号已切换，请刷新页面后继续。')
                if self.command=='GET' and path=='/api/shuku/personal':
                    return self.send_json(200,app.workflow.personal.listing(user['id'],query.get('cursor',[None])[0]))
                study=re.fullmatch(r"/api/shuku/personal/study/([^/]+)/([^/]+)",path)
                if self.command=='GET' and study:
                    return self.send_json(200,app.workflow.personal.state(user['id'],unquote(study[1]),unquote(study[2])))
                if self.command=='POST' and path=='/api/shuku/personal/study':
                    return self.send_json(200,app.workflow.personal.save(user['id'],self.body()))
                if self.command=='POST' and path=='/api/shuku/personal/favorites':
                    return self.send_json(200,app.workflow.personal.favorite(user['id'],self.body()))
                feedback=app.workflow.feedback
                if self.command=='GET' and path=='/api/shuku/github/reviews':
                    return self.send_json(200,{'courses':app.workflow.github.review_courses(user['id'])})
                github=re.fullmatch(r'/api/shuku/courses/([^/]+)/github(?:/(bind|provision|retry|reconcile|external-decision))?',path)
                if github:
                    sync=app.workflow.github;cid=github[1]
                    if self.command=='GET' and not github[2]:return self.send_json(200,sync.status(user['id'],cid))
                    if self.command=='POST':
                        body=self.body()
                        if github[2]=='bind':return self.send_json(200,sync.bind(user['id'],cid,body))
                        if github[2]=='provision':return self.send_json(202,sync.provision_request(user['id'],cid))
                        if github[2]=='retry':return self.send_json(202,sync.retry(user['id'],cid,body.get('job_id')))
                        if github[2]=='external-decision':return self.send_json(202,sync.external_decision(user['id'],cid,body))
                        if github[2]=='reconcile':
                            with app.store.transaction() as db:
                                app.workflow.owner(db,user['id'],cid)
                                jid=sync.queue(db,cid,'reconcile',str(__import__('uuid').uuid4()),{},user['id'])
                            return self.send_json(202,{'job_id':jid})
                if self.command=='GET' and path=='/api/shuku/messages':
                    return self.send_json(200,feedback.messages(user['id'],query.get('cursor',[None])[0]))
                if self.command=='POST' and path=='/api/shuku/messages/read-all':
                    return self.send_json(200,feedback.read_all(user['id'],self.body()))
                message=re.fullmatch(r"/api/shuku/messages/([^/]+)/read",path)
                if self.command=='POST' and message:
                    return self.send_json(200,feedback.read(user['id'],message[1],self.body()))
                report=re.fullmatch(r"/api/shuku/revisions/([^/]+)/feedback",path)
                if self.command=='POST' and report:
                    return self.send_json(201,feedback.submit(user['id'],report[1],self.body()))
                report=re.fullmatch(r"/api/shuku/feedback/([^/]+)(?:/(status))?",path)
                if report:
                    if self.command=='GET' and not report[2]:return self.send_json(200,feedback.detail(user['id'],report[1]))
                    if self.command=='POST' and report[2]:return self.send_json(200,feedback.update(user['id'],report[1],self.body()))
                governance=app.workflow.governance
                if self.command=="GET" and path=="/api/shuku/removals":
                    return self.send_json(200,{'removals':governance.listing(user['id'])})
                removal=re.fullmatch(r"/api/shuku/removals/([^/]+)/retry",path)
                if self.command=="POST" and removal:
                    return self.send_json(202,governance.retry(user['id'],removal[1],self.body()))
                management=re.fullmatch(r"/api/shuku/(courses|workspaces)/([^/]+)/(visibility|remove)",path)
                if self.command=="POST" and management:
                    if management[3]=='visibility':
                        require(management[1]=='courses',404,'NOT_FOUND','接口不存在。')
                        return self.send_json(200,{'course':governance.visibility(user['id'],management[2],self.body())})
                    return self.send_json(202,governance.request(user['id'],'course' if management[1]=='courses' else 'workspace',management[2],self.body()))
                collaboration=app.workflow.collaboration
                if self.command=="GET" and path=="/api/shuku/workspaces":
                    return self.send_json(200,{'workspaces':collaboration.workspaces(user['id'])})
                if self.command=="GET" and path=="/api/shuku/contributions":
                    return self.send_json(200,{'contributions':collaboration.listing(user['id'])})
                workspace=re.fullmatch(r"/api/shuku/workspaces/([^/]+)/submit",path)
                if self.command=="POST" and workspace:
                    return self.send_json(200,collaboration.submit(user['id'],workspace[1],self.body()))
                contribution=re.fullmatch(r"/api/shuku/contributions/([^/]+)(?:/(decision|merge))?",path)
                if contribution:
                    if self.command=="GET" and not contribution[2]:return self.send_json(200,collaboration.detail(user['id'],contribution[1]))
                    if self.command=="POST" and contribution[2]=='decision':return self.send_json(200,collaboration.decide(user['id'],contribution[1],self.body()))
                    if self.command=="POST" and contribution[2]=='merge':return self.send_json(202,collaboration.merge(user['id'],contribution[1],self.body()))
                co_course=re.fullmatch(r"/api/shuku/courses/([^/]+)/(workspaces|contributions)",path)
                if co_course:
                    if self.command=="POST" and co_course[2]=='workspaces':return self.send_json(201,collaboration.create(user['id'],co_course[1],self.body()))
                    if self.command=="GET" and co_course[2]=='contributions':return self.send_json(200,collaboration.history(user['id'],co_course[1]))
                if self.command=="GET" and path=="/api/shuku/modules":
                    return self.send_json(200,{"modules":[{k:v for k,v in m.items() if k not in ('directory','entry','pages')} for m in app.workflow.modules()]})
                if self.command=="GET" and path=="/api/shuku/reviews":
                    return self.send_json(200,{"reviews":app.workflow.reviews(user['id'])})
                draft_route=re.fullmatch(r"/api/shuku/courses/([^/]+)/draft",path)
                if draft_route:
                    from . import drafts
                    if self.command=='GET':return self.send_json(200,drafts.read(app.workflow,user['id'],draft_route[1]))
                    if self.command=='POST':return self.send_json(200,drafts.save(app.workflow,user['id'],draft_route[1],self.body(16*1024*1024)))
                revision_route=re.fullmatch(r"/api/shuku/revisions/([^/]+)",path)
                if self.command=="GET" and revision_route:
                    return self.send_json(200,app.workflow.revision(user['id'],revision_route[1]))
                review_route=re.fullmatch(r"/api/shuku/reviews/([^/]+)/decision",path)
                if self.command=="POST" and review_route:
                    return self.send_json(200,app.workflow.decide(user['id'],review_route[1],self.body()))
                command=re.fullmatch(r"/api/shuku/courses/([^/]+)/(revisions|submit|publish)",path)
                if self.command=="POST" and command:
                    if command[2]=='revisions':return self.send_json(202,app.workflow.save(user['id'],command[1],self.body(16*1024*1024)))
                    if command[2]=='submit':return self.send_json(200,app.workflow.submit(user['id'],command[1],self.body()))
                    return self.send_json(200,{'release':app.workflow.publish(user['id'],command[1],self.body())})
                if path=="/api/shuku/courses":
                    if self.command=="GET":return self.send_json(200,{"courses":app.courses.list(user)})
                    return self.send_json(201,{"course":app.courses.create(user,self.body())})
                if self.command=="GET" and path.startswith("/api/shuku/courses/"):
                    return self.send_json(200,{"course":app.courses.get(user,path.removeprefix("/api/shuku/courses/"))})
                raise BusinessError(404,"NOT_FOUND","接口不存在。")
            except BusinessError as error:
                self.send_json(error.status,{"error":str(error),"code":error.code})
            except (BrokenPipeError,ConnectionResetError,TimeoutError):
                pass
            except Exception:
                self.send_json(503,{"error":"服务暂时不可用，请稍后重试。","code":"SERVICE_UNAVAILABLE"})
    return Handler
