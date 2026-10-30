"""Local authoring exercises the real revision/build/review path and a closed token scope."""
from copy import deepcopy
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import re
from uuid import uuid4
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,save_ready,approve
from test_http import api,login


def secret(brief):
    return re.search(r'API Token：(shu_local_[A-Za-z0-9_-]+)',brief['text'])[1]


def body(snapshot):
    return {k:snapshot[k] for k in ('project','expected_revision','expected_draft')}


def test_local_create_uses_private_source_and_reuses_review_release(workflow):
    app,_,_,uid,admin=workflow;agent=app.workflow.local_agent
    result=agent.create(uid,{'title':'本地新课','module_id':str(uuid4()),'category':'人工智能'})
    cid=result['course']['id'];token=secret(result);snapshot=agent.snapshot(token,cid)
    assert snapshot['expected_revision'] is None and snapshot['expected_draft'] is None
    assert snapshot['project']['courseId'].startswith('custom-')
    snapshot['project']['source']['files']['Lesson.tsx']="import {useState} from 'react'; export default function Lesson(){const [n,setN]=useState(0);return <button onClick={()=>setN(n+1)}>Local counter {n}</button>}"
    snapshot['project']['outlineConfirmed']=True
    snapshot['project']['pages'][0].update(ready=True,designed=True,title='真实互动')
    saved=agent.save(token,cid,'request-local-0001',body(snapshot))
    assert agent.save(token,cid,'request-local-0001',body(snapshot))['id']==saved['id']
    app.worker.run_once()
    revision=agent.revision(token,saved['id'])
    assert revision['state']=='ready'
    bundle=app.workflow.file(uid,saved['id'],'index.html')[0]
    assert b'Local counter' in bundle
    assert app.workflow.public_courses()==[]
    approve(app,{'id':cid},revision,uid,admin)
    app.workflow.publish(uid,cid,{'revision_id':saved['id'],'version':'1.0.0'})
    assert app.workflow.public_course(cid)['course']['id']==cid
    assert app.store.course(uid,cid)['local_agent']
    with app.store.transaction() as db:
        row=db.execute('SELECT * FROM shuku_agent_credentials WHERE id=%s',(result['token_id'],)).fetchone()
        assert row['token_hash']==sha256(token.encode()).hexdigest()
        assert token not in json.dumps(row)


def test_credentials_are_scoped_revocable_expiring_and_owner_only(workflow):
    app,course,_,uid,admin=workflow;agent=app.workflow.local_agent;cid=course['id']
    token=secret(agent.issue(uid,cid))
    with pytest.raises(BusinessError):agent.issue(admin,cid)
    other=app.store.create_course(admin,{'title':'他人课程','module_id':str(uuid4())},app.clock())
    with pytest.raises(BusinessError,match='指定课程'):agent.snapshot(token,other['id'])
    listing=agent.listing(uid)
    assert token not in json.dumps(listing) and len(listing['credentials'])==1
    with pytest.raises(BusinessError):agent.revoke(admin,listing['credentials'][0]['id'])
    agent.revoke(uid,listing['credentials'][0]['id'])
    with pytest.raises(BusinessError,match='失效'):agent.snapshot(token,cid)
    brief=agent.issue(uid,cid);token=secret(brief)
    now=agent.clock;agent.clock=lambda:brief['expires_at']+1
    with pytest.raises(BusinessError,match='失效'):agent.snapshot(token,cid)
    agent.clock=now
    with app.store.transaction() as db:db.execute('UPDATE shuku_users SET active=false WHERE id=%s',(uid,))
    with pytest.raises(BusinessError):agent.snapshot(token,cid)


def test_retries_changed_payload_and_web_draft_conflicts(workflow):
    from shuku_backend import drafts
    app,course,project,uid,_=workflow;agent=app.workflow.local_agent;cid=course['id']
    token=secret(agent.issue(uid,cid))
    data={'project':project,'expected_revision':None,'expected_draft':None}
    drafts.save(app.workflow,uid,cid,data)
    with pytest.raises(BusinessError,match='草稿'):agent.save(token,cid,'retry-conflict-0001',data)
    snapshot=agent.snapshot(token,cid)
    assert snapshot['project']==project and snapshot['expected_draft']
    saved=agent.save(token,cid,'retry-conflict-0001',body(snapshot))
    assert agent.save(token,cid,'retry-conflict-0001',body(snapshot))['id']==saved['id']
    changed=deepcopy(body(snapshot));changed['project']['title']='另一个内容'
    with pytest.raises(BusinessError,match='不同内容'):agent.save(token,cid,'retry-conflict-0001',changed)
    app.worker.run_once()
    with pytest.raises(BusinessError,match='更新'):agent.save(token,cid,'retry-conflict-0002',data)
    with app.store.transaction() as db:
        assert db.execute('SELECT COUNT(*) AS n FROM shuku_agent_requests WHERE course_id=%s',(cid,)).fetchone()['n']==1
        assert not db.execute('SELECT 1 FROM shuku_editor_drafts WHERE course_id=%s',(cid,)).fetchone()


def test_local_co_creation_pins_base_and_changes_only_workspace(workflow):
    app,course,project,uid,admin=workflow
    first=save_ready(app,course,project,uid);approve(app,course,first,uid,admin)
    release=app.workflow.publish(uid,course['id'],{'revision_id':first['id'],'version':'1.0.0'})
    wid=app.workflow.collaboration.create(DEMO_USERS[0][0],course['id'],{'base_release_id':release['id']})['id']
    app.worker.run_once()
    agent=app.workflow.local_agent;brief=agent.issue(DEMO_USERS[0][0],wid);token=secret(brief)
    assert '基础发布版本：1.0.0' in brief['text']
    snapshot=agent.snapshot(token,wid)
    assert app.workflow.collaboration.workspaces(DEMO_USERS[0][0])[0]['local_agent']
    assert snapshot['workspace']['base_release_id']==release['id']
    snapshot['project']['pages'][0]['summary']='本地共创补充'
    saved=agent.save(token,wid,'workspace-local-001',body(snapshot));app.worker.run_once()
    assert agent.revision(token,saved['id'])['state']=='ready'
    app.workflow.collaboration.submit(DEMO_USERS[0][0],wid,{'revision_id':saved['id'],'summary':'补充解释'})
    assert app.store.course(uid,course['id'])['head_revision']==first['id']
    assert app.store.course(uid,course['id'])['current_release']==release['id']


def test_http_bearer_allowlist_and_session_management(api):
    request,app=api
    owner=login(request,'xiaoman');other=login(request,'admin')
    # Source-less fixture can still create a course, then use a fake module catalog for snapshots.
    app.workflow.modules=lambda root=None:[]
    created=request('POST','/local-agent/courses',{'title':'本地 HTTP','module_id':str(uuid4())},cookie=owner)
    assert created[0]==201
    brief=created[1];cid=brief['course']['id'];token=secret(brief)
    auth={'Authorization':'Bearer '+token}
    assert request('GET','/local-agent/courses/'+cid+'/project',origin='',extra=auth)[0]==200
    for method,path,data in [('GET','/auth/me',None),('GET','/courses',None),('POST','/courses/'+cid+'/publish',{}),('POST','/local-agent/courses',{}),('POST','/local-agent/courses/'+cid+'/brief',{})]:
        assert request(method,path,data,extra=auth)[0]==403
    assert request('GET','/local-agent/courses/'+cid+'/project',origin='https://attacker.invalid',extra=auth)[0]==403
    assert request('POST','/local-agent/courses/'+cid+'/brief',{},cookie=other)[0]==403
    assert request('POST','/local-agent/credentials/'+brief['token_id']+'/revoke',{},cookie=owner)[0]==200
    assert request('GET','/local-agent/courses/'+cid+'/project',extra=auth)[0]==401


def test_migration_adds_local_tables_from_previous_catalog_baseline(store):
    from shuku_backend.migrations import VERSION
    with store.engine.connect() as db:
        db.exec_driver_sql('DROP TABLE shuku_agent_requests')
        db.exec_driver_sql('DROP TABLE shuku_agent_credentials')
        db.exec_driver_sql("DELETE FROM shuku_schema_migrations WHERE version=%s",(VERSION,));db.commit()
    with pytest.raises(RuntimeError):store.ready()
    store.migrate();store.ready()


def test_client_preserves_files_and_rejects_redirects_and_unsafe_source(tmp_path,monkeypatch):
    script=Path(__file__).resolve().parents[2]/'src/shuku_backend/local_agent_client.py'
    spec=importlib.util.spec_from_file_location('local_client',script);client=importlib.util.module_from_spec(spec);spec.loader.exec_module(client)
    monkeypatch.chdir(tmp_path)
    Path('project.json').write_text('keep')
    with pytest.raises(RuntimeError):client.pull('http://localhost:5173',str(uuid4()),'token')
    assert Path('project.json').read_text()=='keep'
    for name in ('../escape.tsx','/escape.tsx','source/.secret.tsx','bad'+chr(92)+'x.tsx', 'bad:stream.tsx'):
        with pytest.raises(ValueError):client.source_path(name)
    with pytest.raises(ValueError):client.origin('http://public.example')
    with pytest.raises(RuntimeError):client.NoRedirect().redirect_request(None,None,None,None,None,None)


def test_local_delete_cleans_credentials_and_idempotency_records(workflow):
    app,course,project,uid,_=workflow;cid=course['id'];agent=app.workflow.local_agent
    token=secret(agent.issue(uid,cid))
    agent.save(token,cid,'delete-course-0001',{'project':project,'expected_revision':None,'expected_draft':None})
    app.worker.run_once()
    app.workflow.governance.request(uid,'course',cid,{'confirm':True})
    with pytest.raises(BusinessError):agent.snapshot(token,cid)
    app.worker.run_once()
    with app.store.transaction() as db:
        assert not db.execute('SELECT 1 FROM shuku_agent_requests WHERE course_id=%s',(cid,)).fetchone()
        assert not db.execute('SELECT 1 FROM shuku_agent_credentials WHERE course_id=%s',(cid,)).fetchone()
        assert not db.execute('SELECT 1 FROM shuku_courses WHERE id=%s',(cid,)).fetchone()


def test_client_network_retry_reuses_request_and_preserves_conflicting_local_work(tmp_path,monkeypatch):
    script=Path(__file__).resolve().parents[2]/'src/shuku_backend/local_agent_client.py'
    spec=importlib.util.spec_from_file_location('retry_client',script);client=importlib.util.module_from_spec(spec);spec.loader.exec_module(client)
    monkeypatch.chdir(tmp_path);project={'source':{'files':{'Lesson.tsx':'old'}}}
    client.write('project.json',project);Path('source').mkdir();Path('source/Lesson.tsx').write_text('new')
    state={'origin':'http://localhost:5173','course':str(uuid4()),'expected_revision':None,'expected_draft':'draft-v1'}
    keys=[]
    def send(site,path,token,body,key):
        keys.append(key);assert body['project']['source']['files']['Lesson.tsx']=='new'
        if len(keys)==1:raise OSError('network interrupted after server commit')
        return {'id':'saved-revision','replayed':True}
    monkeypatch.setattr(client,'request',send)
    with pytest.raises(OSError):client.push(state,'secret')
    assert client.read('shuku-state.json')['pending']['key']==keys[0]
    client.push(client.read('shuku-state.json'),'secret')
    assert keys[0]==keys[1]
    saved=client.read('shuku-state.json')
    assert saved['expected_revision']=='saved-revision' and saved['expected_draft'] is None
    def conflict(*args,**kwargs):raise RuntimeError('409：草稿发生变化')
    monkeypatch.setattr(client,'request',conflict)
    Path('source/Lesson.tsx').write_text('keep my work')
    with pytest.raises(RuntimeError):client.push(saved,'secret')
    assert Path('source/Lesson.tsx').read_text()=='keep my work'


def test_downloaded_client_performs_cookie_free_http_pull_push_and_status(workflow,tmp_path):
    from http.client import HTTPConnection
    import subprocess
    import sys
    import threading
    app,_,_,uid,_=workflow
    agent=app.workflow.local_agent
    created=agent.create(uid,{'title':'本地助手端到端','module_id':str(uuid4())})
    cid=created['course']['id'];token=secret(created)
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    try:
        host,port=server.server_address;site='http://'+host+':'+str(port)
        connection=HTTPConnection(host,port,timeout=5)
        connection.request('GET','/api/shuku/local-agent/client',headers={'Authorization':'Bearer '+token})
        response=connection.getresponse()
        assert response.status==200 and response.getheader('Content-Type').startswith('text/plain')
        script=tmp_path/'shuku-local-agent.py';script.write_bytes(response.read());connection.close()
        (tmp_path/'api_token').write_text(token)
        def run(*args):
            result=subprocess.run([sys.executable,str(script),*args],cwd=tmp_path,capture_output=True,text=True,timeout=20)
            assert result.returncode==0,result.stderr
            assert token not in result.stdout+result.stderr
            return result.stdout
        run('--origin',site,'--course',cid,'pull')
        project=json.loads((tmp_path/'project.json').read_text())
        project['pages'][0].update(title='Local browser counter',ready=True,designed=True)
        project['outlineConfirmed']=True
        (tmp_path/'project.json').write_text(json.dumps(project))
        (tmp_path/'source/Lesson.tsx').write_text("import {useState} from 'react';export default function Lesson(){const [n,setN]=useState(0);return <button onClick={()=>setN(n+1)}>Local client {n}</button>}")
        run('push');assert app.worker.run_once()
        assert '预览已就绪' in run('status')
        snapshot=agent.snapshot(token,cid)
        assert 'Local client' in snapshot['project']['source']['files']['Lesson.tsx']
        connection=HTTPConnection(host,port,timeout=5)
        connection.request('POST','/api/shuku/courses/'+cid+'/publish',body='{}',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
        response=connection.getresponse();assert response.status==403;response.read();connection.close()
    finally:
        server.shutdown();server.server_close();thread.join()
