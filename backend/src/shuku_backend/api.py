"""Standalone same-origin HTTP API. No changes to idl_backend HTTP handlers."""
from hashlib import sha256
from http.cookies import SimpleCookie, CookieError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
import json
import re
import threading
from .errors import BusinessError, require

COOKIE="shuku_session"


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

        def cookie(self,token,expire=False):
            value=f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/api/shuku; Max-Age={0 if expire else 43200}"
            return value+("; Secure" if app.settings.origin.startswith("https://") else "")

        def body(self,limit=65536):
            require(self.headers.get("Origin")==app.settings.origin and self.headers.get("Sec-Fetch-Site")!="cross-site",403,"CROSS_SITE","不允许跨站操作。")
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
                require(not url.query,400,"INVALID_INPUT","该接口不接受查询参数。")
                path=url.path
                if self.command=="GET" and path=="/api/shuku/health":
                    app.store.ready()
                    return self.send_json(200,{"ok":True,"service":"shuku_backend"})
                if self.command=="GET" and path=="/api/shuku/public/courses":
                    return self.send_json(200,{"courses":app.workflow.public_courses()})
                file_route=re.fullmatch(r"/api/shuku/revisions/([^/]+)/files/(.+)",path)
                if self.command=="GET" and file_route:
                    try:viewer=app.store.session_user(token_hash(token_from(self.headers.get("Cookie"))),app.clock())["id"]
                    except BusinessError:viewer=None
                    content,mime=app.workflow.file(viewer,file_route[1],unquote(file_route[2]))
                    self.send_response(200)
                    self.send_header("Content-Type",mime)
                    self.send_header("Content-Length",str(len(content)))
                    self.send_header("Cache-Control","private, no-store")
                    self.send_header("X-Content-Type-Options","nosniff")
                    self.send_header("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'")
                    self.end_headers();self.wfile.write(content);return
                raw_token=token_from(self.headers.get("Cookie"))
                if self.command=="POST" and path=="/api/shuku/auth/login":
                    body=self.body()
                    require(not set(body)-{"username","password"},400,"INVALID_INPUT","不支持额外登录字段。")
                    user,token=app.identity.login(body.get("username"),body.get("password"),self.client_address[0],token_hash(raw_token),app.clock())
                    return self.send_json(200,{"user":user},self.cookie(token))
                if self.command=="POST" and path=="/api/shuku/auth/logout":
                    self.body()
                    app.store.remove_session(token_hash(raw_token))
                    return self.send_json(200,{"message":"已退出登录"},self.cookie("",True))
                user=app.store.session_user(token_hash(raw_token),app.clock())
                if self.command=="GET" and path=="/api/shuku/auth/me":
                    return self.send_json(200,{"user":user})
                if self.command=="GET" and path=="/api/shuku/modules":
                    return self.send_json(200,{"modules":[{k:v for k,v in m.items() if k not in ('directory','entry','pages')} for m in app.workflow.modules()]})
                if self.command=="GET" and path=="/api/shuku/reviews":
                    return self.send_json(200,{"reviews":app.workflow.reviews(user['id'])})
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
