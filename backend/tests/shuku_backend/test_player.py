import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,save_ready,approve


def test_original_player_is_authorized_cached_and_preserves_release(workflow):
    app,course,project,uid,admin=workflow
    project['pages'][0]['messages']=[{'role':'user','text':'private-chat-must-not-leak'}]
    revision=save_ready(app,course,project,uid);rid=revision['id']
    with app.store.transaction() as db:
        original=db.execute('SELECT files,artifact_hash FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()
    with pytest.raises(BusinessError):app.workflow.player.status(None,rid)
    with pytest.raises(BusinessError):app.workflow.player.status(DEMO_USERS[0][0],rid)
    assert app.workflow.player.status(uid,rid)['state']=='queued'
    assert app.workflow.player.status(uid,rid)['state']=='queued'
    with app.store.transaction() as db:
        assert db.execute("SELECT count(*) AS n FROM shuku_tasks WHERE kind='revision.player'").fetchone()['n']==1
    assert app.worker.run_once()
    assert app.workflow.player.status(uid,rid)['state']=='ready'
    html,mime=app.workflow.player.file(uid,rid,'index.html')
    assert mime=='text/html' and b'/player/files/bundle.js' in html
    code,_=app.workflow.player.file(uid,rid,'bundle.js')
    assert b'cw-app' in code and b'private-chat-must-not-leak' not in code
    assert b'shukuPage' in code, 'managed previews reuse the compiled page without nesting another player'
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
