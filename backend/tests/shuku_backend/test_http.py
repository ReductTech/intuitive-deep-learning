from http.client import HTTPConnection
import json
import threading
from uuid import uuid4
import pytest
from shuku_backend.application import create_application
from shuku_backend.settings import Settings


@pytest.fixture
def api(store,tmp_path):
    store.seed_demo()
    settings=Settings(store.database_url,tmp_path/'bucket','http://localhost:5173','test-password',port=0)
    app=create_application(settings)
    server=app.server()
    thread=threading.Thread(target=server.serve_forever);thread.start()
    def request(method,path,body=None,cookie='',origin='http://localhost:5173',extra=None):
        connection=HTTPConnection(*server.server_address,timeout=5)
        headers={'Cookie':cookie,'Origin':origin,'Content-Type':'application/json',**(extra or {})}
        raw=None if body is None else json.dumps(body)
        connection.request(method,'/api/shuku'+path,body=raw,headers=headers)
        response=connection.getresponse();result=(response.status,json.loads(response.read()),response.getheader('Set-Cookie'));connection.close();return result
    try:yield request,app
    finally:server.shutdown();server.server_close();thread.join();app.close()


def login(request,name):
    code,data,cookie=request('POST','/auth/login',{'username':name,'password':'test-password'})
    assert code==200
    return cookie.split(';')[0]


def test_http_login_cookie_csrf_logout_and_rotation(api):
    request,app=api
    assert request('GET','/health')[0]==200
    assert request('GET','/auth/me')[0]==401
    assert request('POST','/auth/login',{'username':'admin','password':'test-password'},origin='https://other')[0]==403
    assert request('POST','/auth/login',{'username':'admin','password':'test-password','role':'admin'})[0]==400
    code,data,cookie=request('POST','/auth/login',{'username':'linzhi','password':'test-password'})
    assert code==200 and 'HttpOnly' in cookie and 'SameSite=Strict' in cookie and 'Max-Age=43200' in cookie
    first=cookie.split(';')[0]
    assert request('GET','/auth/me',cookie=first)[1]['user']['username']=='linzhi'
    second=request('POST','/auth/login',{'username':'admin','password':'test-password'},cookie=first)[2].split(';')[0]
    assert request('GET','/auth/me',cookie=first)[0]==401
    assert request('POST','/auth/logout',{},cookie=second)[0]==200
    assert request('GET','/auth/me',cookie=second)[0]==401


def test_http_private_drafts_and_role_permissions(api):
    request,app=api
    owner=login(request,'xiaoman');learner=login(request,'linzhi');admin=login(request,'admin')
    data={'module_id':str(uuid4()),'title':'测试课程','description':'课程简介','category':'人工智能'}
    assert request('POST','/courses',data,cookie=learner)[0]==403
    assert request('POST','/courses',{**data,'owner_id':'forged'},cookie=owner)[0]==400
    code,body,_=request('POST','/courses',data,cookie=owner)
    assert code==201 and body['course']['status']=='draft'
    cid=body['course']['id']
    assert request('GET','/courses/'+cid,cookie=owner)[0]==200
    assert request('GET','/courses/'+cid,cookie=learner)[0]==404
    assert request('GET','/courses/'+cid,cookie=admin)[0]==200
    assert request('GET','/courses',cookie=learner)[1]['courses']==[]
    assert len(request('GET','/courses',cookie=owner)[1]['courses'])==1
    assert request('GET','/courses/not-a-uuid',cookie=owner)[0]==404
    assert request('POST','/courses',{**data,'module_id':'bad'},cookie=owner)[0]==400
    with app.store.transaction() as db:
        assert db.execute("SELECT count(*) AS n FROM shuku_audit WHERE action='course.create'").fetchone()['n']==1


def test_http_database_failure_and_request_validation(api,monkeypatch):
    request,app=api
    assert request('POST','/auth/login',[],origin='http://localhost:5173')[0]==400
    assert request('POST','/auth/login',{},extra={'Content-Type':'text/plain'})[0]==415
    assert request('POST','/auth/login',{'username':'x','password':'x'*70000})[0]==413
    def unavailable():raise RuntimeError('private-database-credentials')
    monkeypatch.setattr(app.store,'ready',unavailable)
    code,body,_=request('GET','/health')
    assert code==503 and body['code']=='SERVICE_UNAVAILABLE'
    assert 'private-database-credentials' not in json.dumps(body)


def test_https_cookie_and_same_role_draft_isolation(api):
    from dataclasses import replace
    request,app=api
    other_id=str(uuid4())
    with app.store.transaction() as db:
        db.execute("INSERT INTO shuku_users VALUES (%s,'other-creator','另一作者','creator',true)",(other_id,))
    owner=login(request,'xiaoman');other=login(request,'other-creator')
    code,body,_=request('POST','/courses',{'module_id':str(uuid4()),'title':'私有草稿'},cookie=owner)
    assert code==201
    assert request('GET','/courses/'+body['course']['id'],cookie=other)[0]==404
    assert request('GET','/courses',cookie=other)[1]['courses']==[]
    app.settings=replace(app.settings,origin='https://localhost:5173')
    code,_,cookie=request('POST','/auth/login',{'username':'admin','password':'test-password'},origin='https://localhost:5173')
    assert code==200 and '; Secure' in cookie
