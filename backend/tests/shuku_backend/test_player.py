from uuid import uuid4
from hashlib import sha256
from shuku_backend.database import JsonValue
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,save_ready,approve


def test_original_player_is_authorized_cached_and_preserves_release(workflow):
    app,course,project,uid,admin=workflow
    project['pages'][0]['messages']=[{'role':'user','text':'private-chat-must-not-leak'}]
    project['pages'][0]['outline']={'snippet':'approved-narration-must-be-retained'}
    revision=save_ready(app,course,project,uid);rid=revision['id']
    with app.store.transaction() as db:
        original=db.execute('SELECT files,artifact_hash FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()
    with pytest.raises(BusinessError):app.workflow.player.status(None,rid)
    with pytest.raises(BusinessError):app.workflow.player.status(DEMO_USERS[0][0],rid)
    # Previously rendered releases must get a new player after narration ships.
    legacy_key='player:shuku-managed-slide-v5:'+rid
    legacy_result={'revision_id':rid,'renderer':'shuku-managed-slide-v5','files':{}}
    with app.store.transaction() as db:
        db.execute("INSERT INTO shuku_tasks(id,kind,status,resource_key,idempotency_key,request_hash,payload,result,available_at,created_at) VALUES (%s,'revision.player','succeeded',%s,%s,%s,%s,%s,%s,%s)",(str(uuid4()),'course:'+course['id'],legacy_key,sha256(legacy_key.encode()).hexdigest(),JsonValue({'revision_id':rid}),JsonValue(legacy_result),app.clock(),app.clock()))
    assert app.workflow.player.status(uid,rid)['state']=='queued'
    assert app.workflow.player.status(uid,rid)['state']=='queued'
    with app.store.transaction() as db:
        assert db.execute("SELECT count(*) AS n FROM shuku_tasks WHERE kind='revision.player' AND idempotency_key=%s",(app.workflow.player.key(rid),)).fetchone()['n']==1
    assert app.worker.run_once()
    assert app.workflow.player.status(uid,rid)['state']=='ready'
    html,mime=app.workflow.player.file(uid,rid,'index.html')
    assert mime=='text/html' and b'/player/files/bundle.js' in html
    code,_=app.workflow.player.file(uid,rid,'bundle.js')
    assert b'cw-app' in code and b'private-chat-must-not-leak' not in code
    assert b'shukuPage' in code, 'managed previews reuse the compiled page without nesting another player'
    assert b'cw-smart-narration' in code and b'approved-narration-must-be-retained' in code
    with app.store.transaction() as db:
        assert db.execute('SELECT result FROM shuku_tasks WHERE idempotency_key=%s',(legacy_key,)).fetchone()['result']==legacy_result
    for path in ('../project.json','project.json','sources/Lesson.tsx'):
        with pytest.raises(BusinessError):app.workflow.player.file(uid,rid,path)
    with pytest.raises(BusinessError):app.workflow.player.file(None,rid,'bundle.js')
    with app.store.transaction() as db:
        assert db.execute('SELECT files,artifact_hash FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()==original
    approve(app,course,revision,uid,admin)
    app.workflow.publish(uid,course['id'],{'revision_id':rid,'version':'1.0.0'})
    assert app.workflow.player.file(None,rid,'index.html')[0]==html
    with app.store.transaction() as db:db.execute("UPDATE shuku_courses SET status='hidden' WHERE id=%s",(course['id'],))
    with pytest.raises(BusinessError):app.workflow.player.file(None,rid,'index.html')


def test_player_cache_is_cleaned_with_course_and_keeps_shared_files(workflow):
    app,course,project,uid,admin=workflow
    first=save_ready(app,course,project,uid);rid=first['id']
    app.workflow.player.status(uid,rid);assert app.worker.run_once()
    second=app.store.create_course(uid,{'module_id':course['module_id'],'title':'另一课程'},app.clock())
    other=save_ready(app,second,project,uid)
    app.workflow.player.status(uid,other['id']);assert app.worker.run_once()
    with app.store.transaction() as db:
        files=db.execute('SELECT result FROM shuku_tasks WHERE idempotency_key=%s',(app.workflow.player.key(rid),)).fetchone()['result']['files']
        shared=db.execute('SELECT result FROM shuku_tasks WHERE idempotency_key=%s',(app.workflow.player.key(other['id']),)).fetchone()['result']['files']
    removal=app.workflow.governance.request(admin,'course',course['id'],{'confirm':True})
    assert app.worker.run_once()
    with pytest.raises(BusinessError):app.workflow.player.file(uid,rid,'index.html')
    with app.store.transaction() as db:
        assert db.execute('SELECT state FROM shuku_removals WHERE id=%s',(removal['id'],)).fetchone()['state']=='succeeded'
        assert db.execute('SELECT result FROM shuku_tasks WHERE idempotency_key=%s',(app.workflow.player.key(rid),)).fetchone()['result'] is None
    shared_shas={v['sha256'] for v in shared.values()}
    for obj in files.values():
        if obj['sha256'] in shared_shas:assert app.bucket.read(obj['sha256'])
        else:
            with pytest.raises(FileNotFoundError):app.bucket.read(obj['sha256'])
    assert app.workflow.player.file(uid,other['id'],'index.html')[0]


def test_player_http_permissions_and_content_policy(workflow):
    from http.client import HTTPConnection
    import json
    import threading
    app,course,project,uid,admin=workflow
    revision=save_ready(app,course,project,uid);rid=revision['id']
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def get(path,cookie=''):
        connection=HTTPConnection(*server.server_address,timeout=10)
        connection.request('GET','/api/shuku'+path,headers={'Cookie':cookie})
        response=connection.getresponse();result=response.status,response.read(),dict(response.getheaders());connection.close();return result
    try:
        assert get('/revisions/'+rid+'/player')[0]==404
        connection=HTTPConnection(*server.server_address,timeout=10)
        connection.request('POST','/api/shuku/auth/login',body=json.dumps({'username':'xiaoman','password':'test-password'}),headers={'Content-Type':'application/json','Origin':app.settings.origin})
        response=connection.getresponse();assert response.status==200;cookie=response.getheader('Set-Cookie').split(';')[0];response.read();connection.close()
        assert get('/revisions/'+rid+'/player',cookie)[0]==202
        assert app.worker.run_once()
        assert get('/revisions/'+rid+'/player',cookie)[0]==200
        status,content,headers=get('/revisions/'+rid+'/player/files/index.html',cookie)
        assert status==200 and b'bundle.js' in content
        assert headers['Cache-Control']=='private, no-store'
        assert "frame-ancestors 'self'" in headers['Content-Security-Policy']
        # SavedPagePreview selects a slide through this query. The HTML request
        # must reach the normal file authorization and retain its content policy.
        for entry in ('/files/index.html','/player/files/index.html'):
            route='/revisions/'+rid+entry
            status,page,policy=get(route+'?shukuPage='+project['pages'][0]['id'],cookie)
            assert status==200, page
            assert b'<!doctype html>' in page.lower()
            assert policy['Cache-Control']=='private, no-store'
            assert "frame-ancestors 'self'" in policy['Content-Security-Policy']
            assert get(route+'?shukuPage='+project['pages'][0]['id'])[0]==404
            for suffix in ('?shukuPage=', '?shukuPage=first&shukuPage=second',
                           '?shukuPage=first&extra=1', '?shukuPage='+('x'*257),
                           '?shukuPage=%00'):
                assert get(route+suffix,cookie)[0]==400
        # A preview parameter must not broaden other API or asset routes.
        for route in ('/courses','/revisions/'+rid+'/player',
                      '/revisions/'+rid+'/files/bundle.js',
                      '/revisions/'+rid+'/player/files/bundle.js'):
            assert get(route+'?shukuPage=first',cookie)[0]==400
        assert get('/revisions/'+rid+'/player/files/index.html')[0]==404
        assert get('/revisions/'+rid+'/player/files/project.json',cookie)[0]==404
    finally:server.shutdown();server.server_close();thread.join()


def test_player_failure_retries_same_task_without_changing_course_release(workflow,monkeypatch):
    from shuku_backend import player as module
    from copy import deepcopy
    app,course,project,uid,admin=workflow
    revision=save_ready(app,course,project,uid);rid=revision['id']
    with pytest.raises(BusinessError):app.workflow.player.retry(DEMO_USERS[0][0],rid,{})
    approve(app,course,revision,uid,admin)
    release=app.workflow.publish(uid,course['id'],{'revision_id':rid,'version':'1.0.0'})
    def snapshot():
        with app.store.transaction() as db:
            return deepcopy((db.execute('SELECT files,artifact_hash,state FROM shuku_revisions WHERE id=%s',(rid,)).fetchone(),db.execute('SELECT current_release,head_revision,status FROM shuku_courses WHERE id=%s',(course['id'],)).fetchone(),db.execute('SELECT * FROM shuku_releases WHERE id=%s',(release['id'],)).fetchone()))
    original=snapshot();player=app.workflow.player;actual=module.run_build
    assert player.status(uid,rid)['state']=='queued'
    with app.store.transaction() as db:
        task=db.execute('SELECT id FROM shuku_tasks WHERE idempotency_key=%s',(player.key(rid),)).fetchone();tid=task['id']
        db.execute('UPDATE shuku_tasks SET max_attempts=1 WHERE id=%s',(tid,))
    def fail(*args,**kwargs):raise BusinessError(422,'BUILD_TIMEOUT','test timeout')
    monkeypatch.setattr(module,'run_build',fail);assert app.worker.run_once()
    result=player.status(uid,rid)
    assert result['state']=='failed' and result['error_code']=='BUILD_TIMEOUT' and result['can_retry']
    assert not player.status(None,rid)['can_retry']
    assert player.retry(uid,rid,{})['state']=='queued'
    assert player.retry(uid,rid,{})['state']=='queued','duplicate retry must not create another task'
    monkeypatch.setattr(module,'run_build',lambda *a,**k:(1,b'',b'private compiler details'))
    assert app.worker.run_once();result=player.status(uid,rid)
    assert result['error_code']=='SOURCE_BUILD_FAILED' and '源码' in result['message']
    assert 'private compiler' not in str(result) and snapshot()==original
    # Unconfirmed process cleanup is terminal, even when attempts remain.
    player.retry(uid,rid,{})
    with app.store.transaction() as db:db.execute('UPDATE shuku_tasks SET max_attempts=3 WHERE id=%s',(tid,))
    def blocked(*args,**kwargs):raise BusinessError(503,'BUILD_CLEANUP_FAILED','cleanup not confirmed')
    monkeypatch.setattr(module,'run_build',blocked);assert app.worker.run_once()
    result=player.status(uid,rid)
    assert result['state']=='failed' and not result['can_retry']
    with pytest.raises(BusinessError) as error:player.retry(uid,rid,{})
    assert error.value.code=='BUILD_CLEANUP_FAILED'
    # An administrator has verified the old process is gone. This is test data only.
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET error_code='BUILD_TIMEOUT' WHERE id=%s",(tid,))
    player.retry(uid,rid,{});monkeypatch.setattr(module,'run_build',actual)
    assert app.worker.run_once() and player.status(uid,rid)['state']=='ready'
    with app.store.transaction() as db:
        tasks=db.execute('SELECT id,status FROM shuku_tasks WHERE idempotency_key=%s',(player.key(rid),)).fetchall()
    assert tasks==[{'id':tid,'status':'succeeded'}] and snapshot()==original


def test_player_retry_http_auth_csrf_and_idempotency(workflow,monkeypatch):
    from http.client import HTTPConnection
    import json,threading
    app,course,project,uid,admin=workflow
    revision=save_ready(app,course,project,uid);rid=revision['id'];player=app.workflow.player
    player.status(uid,rid)
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET status='failed',error_code='BUILD_TIMEOUT' WHERE idempotency_key=%s",(player.key(rid),))
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def request(path,body,cookie='',origin=None):
        conn=HTTPConnection(*server.server_address,timeout=90)
        conn.request('POST','/api/shuku'+path,body=json.dumps(body),headers={'Content-Type':'application/json','Origin':origin or app.settings.origin,'Cookie':cookie})
        reply=conn.getresponse();result=reply.status,json.loads(reply.read()),reply.getheader('Set-Cookie');conn.close();return result
    try:
        path='/revisions/'+rid+'/player/retry'
        assert request(path,{})[0]==401
        code,_,cookie=request('/auth/login',{'username':'linzhi','password':'test-password'});assert code==200
        assert request(path,{},cookie.split(';')[0])[0]==404
        code,_,cookie=request('/auth/login',{'username':'xiaoman','password':'test-password'});assert code==200;cookie=cookie.split(';')[0]
        assert request(path,{},cookie,origin='https://other.test')[0]==403
        assert request(path,{'force':True},cookie)[0]==400
        assert request(path,{},cookie)[0]==202 and request(path,{},cookie)[1]['state']=='queued'
    finally:server.shutdown();server.server_close();thread.join()
