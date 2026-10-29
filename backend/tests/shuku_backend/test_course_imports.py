import base64
import io
import json
import zipfile
from copy import deepcopy
from pathlib import Path
from uuid import uuid4
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.database import JsonValue
from shuku_backend.storage import DEMO_USERS
from shuku_backend.adapters.github import GitHubError
from test_workflow import workflow
from test_github import FakeGitHub,BASE
from test_course_package import package
from test_local_agent_template import client,fake_framework
from test_http import api,login


class ImportGitHub(FakeGitHub):
    def installation_call(self,installation,method,path,data=None,missing=False):
        assert installation==123
        if path.startswith('/orgs/'):
            self.meta.update(name=data['name'],description=data['description'],owner={'login':'tests'},private=data['private'])
            self.commits[BASE]['message']='Initial README'
            return deepcopy(self.meta)
        if path=='/repositories/987':return deepcopy(self.meta)
        if not self.meta:return None
        if not self.meta.get('description'):
            assert method=='GET' and missing
            return None
        prefix='/repos/tests/'+self.meta['name'];assert path.startswith(prefix)
        route=path[len(prefix):]
        return self.call({},method,route,data,missing)

    def call(self,repo,method,path='',data=None,missing=False):
        if method=='PATCH' and path=='/git/refs/heads/main':
            self.refs['heads/main']=data['sha']
            if self.fail_after==('PATCH',path):self.fail_after=None;raise GitHubError()
            return {'object':{'sha':data['sha']}}
        if method=='GET' and path.startswith('/git/trees/'):
            value=path.split('/')[-1].split('?')[0]
            if value in self.commits:value=self.commits[value]['tree']['sha']
            return {'tree':deepcopy(self.trees[value]),'truncated':False}
        result=super().call(repo,method,path,data,missing)
        if method=='POST' and path=='/git/commits':self.commits[result['sha']]['message']=data['message']
        return result


@pytest.fixture
def importing(workflow):
    app,course,project,uid,admin=workflow
    fake=ImportGitHub();app.workflow.github.client=fake
    app.workflow.github.config.update(owner='tests',installationId=123)
    return app,uid,fake


def zip_content(files=None):
    content=io.BytesIO()
    with zipfile.ZipFile(content,'w') as z:
        for name,data in (files or package()).items():z.writestr(name,data)
    content.seek(0);return content


def drain(app):
    for _ in range(30):
        with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
        if not app.worker.run_once():return
    raise AssertionError('Task chain did not settle')


def inspect_zip(app,uid):
    service=app.workflow.imports
    tid=service.create(uid,str(uuid4()),{'type':'zip'},zip_content())['id'];drain(app)
    report=service.status(uid,tid)
    assert report['state']=='succeeded' and report['candidates'][0]['page_count']==1,report
    assert report['phase']=='inspecting' and not report['course_id']
    return tid,report


def test_confirm_is_idempotent_creates_private_source_and_preserves_edit_roundtrip(importing):
    app,uid,fake=importing;service=app.workflow.imports;tid,report=inspect_zip(app,uid)
    data={'selection':report['candidates'][0]['key'],'title':'新的独立课程'}
    result=service.confirm(uid,tid,data);assert service.confirm(uid,tid,data)==result
    with pytest.raises(BusinessError):service.confirm(uid,tid,{**data,'title':'另一个请求'})
    drain(app);status=service.status(uid,tid)
    assert status['state']=='succeeded' and status['phase']=='initializing',status
    cid=result['course_id'];course=app.store.course(uid,cid)
    assert course['status']=='draft' and course['owner_id']==uid and course['current_release'] is None
    assert not app.workflow.public_courses()
    project=app.workflow.revision(uid,result['revision_id'])['project']
    assert project['courseId']=='custom-'+course['module_id'] and course['module_id']!='original-uuid'
    assert project['sourceAssets']['assets/original-uuid/font.woff2']['size']==4
    tree=fake.trees[fake.commits[fake.refs['heads/main']]['tree']['sha']]
    names={v['path'] for v in tree}
    assert 'courses/sources/modules/Demo/Guide.tsx' in names and 'courses/sources/assets/original-uuid/font.woff2' in names
    assert all('node_modules' not in n and 'shared/' not in n for n in names)
    assert 'course.manifest.json' in names
    from shuku_backend.course_package import normalize
    roundtrip=normalize({v['path']:fake.blobs[v['sha']] for v in tree},implemented_ids=['one'])
    assert roundtrip['assets']['assets/original-uuid/font.woff2']==b'font'
    assert roundtrip['files']['licenses/LICENSE.txt']=='MIT'
    assert roundtrip['summary']['title']==data['title']

    assert fake.meta['private'] and not fake.pulls and not fake.releases
    with pytest.raises(BusinessError) as error:
        app.workflow.save(uid,cid,{'project':{**project,'importOrigin':{'type':'forged'}},'expected_revision':result['revision_id']})
    assert error.value.code=='IMPORT_ORIGIN_CHANGED'
    project['title']='网页继续修改'
    saved=app.workflow.save(uid,cid,{'project':project,'expected_revision':result['revision_id']});drain(app)
    again=app.workflow.revision(uid,saved['id'])
    assert again['state']=='ready' and again['project']['sourceAssets']==project['sourceAssets']
    with app.store.transaction() as db:before=db.execute('SELECT COUNT(*) AS n FROM shuku_courses').fetchone()['n']
    assert service.confirm(uid,tid,data)==result
    with app.store.transaction() as db:assert db.execute('SELECT COUNT(*) AS n FROM shuku_courses').fetchone()['n']==before
    assert app.store.course(uid,cid)['head_revision']==saved['id']


def test_source_is_pinned_across_failure_restart_and_retry(importing):
    app,uid,_=importing;service=app.workflow.imports
    class Source:
        pins=0;loads=[]
        def pin(self,url,checkpoint=None):self.pins+=1;return {'owner':'tests','repository':'source','commit':'a'*40,'path':'modules/Demo'}
        def load(self,source,checkpoint):
            self.loads.append(source['commit'])
            if len(self.loads)==1:raise BusinessError(503,'GITHUB_SOURCE_TIMEOUT','timeout')
            return package()
    source=Source();service.source=source
    tid=service.create(uid,str(uuid4()),{'type':'github','url':'https://github.com/tests/source/tree/main/modules/Demo'})['id']
    app.worker.run_once();drain(app)
    assert service.status(uid,tid)['state']=='succeeded'
    assert source.pins==1 and source.loads==['a'*40,'a'*40]


def test_lost_remote_ref_response_is_reconciled_without_duplicate_commit(importing):
    app,uid,fake=importing;service=app.workflow.imports;tid,report=inspect_zip(app,uid)
    service.confirm(uid,tid,{'selection':report['candidates'][0]['key']});fake.fail_after=('PATCH','/git/refs/heads/main');drain(app)
    assert service.status(uid,tid)['state']=='succeeded'
    assert len(fake.commits)==2


def test_asset_authorization_cancel_and_expiry_protect_other_references(importing):
    app,uid,_=importing;service=app.workflow.imports;tid,report=inspect_zip(app,uid)
    with pytest.raises(BusinessError):service.status(DEMO_USERS[0][0],tid)
    assert service.cancel(uid,tid)['state']=='cancelled'
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET status='failed',attempts=max_attempts,error_code='SIMULATED_CLEANUP_FAILURE' WHERE idempotency_key=%s",('import-cleanup:'+tid,))
    assert service.status(uid,tid)['cleanup_state']=='failed'
    service.retry(uid,tid);drain(app)
    assert service.status(uid,tid)['cleanup_state']=='succeeded' and service.status(uid,tid)['state']=='cancelled'
    with pytest.raises(BusinessError):service.confirm(uid,tid,{'selection':report['candidates'][0]['key']})
    other,report=inspect_zip(app,uid);result=service.confirm(uid,other,{'selection':report['candidates'][0]['key']});drain(app)
    project=app.workflow.revision(uid,result['revision_id'])['project'];old=project['sourceAssets']['modules/Demo/assets/image.png']
    forged={**project,'sourceAssets':{**project['sourceAssets'],'other.png':old}}
    with pytest.raises(BusinessError) as error:app.workflow.save(uid,result['course_id'],{'project':forged,'expected_revision':result['revision_id']})
    assert error.value.code=='SOURCE_ASSET_FORBIDDEN'
    # Two staged uploads to the same name may coexist; either authorized version can be saved.
    name='modules/Demo/assets/new.png'
    asset=service.upload_asset(uid,result['course_id'],name,b'first')['asset'];service.upload_asset(uid,result['course_id'],name,b'second')
    project['sourceAssets'][name]=asset
    app.workflow.save(uid,result['course_id'],{'project':project,'expected_revision':result['revision_id']});drain(app)
    expiring,_=inspect_zip(app,uid)
    with app.store.transaction() as db:db.execute('UPDATE shuku_tasks SET created_at=%s WHERE id=%s',(app.clock()-90000,expiring))
    service.next_expiry=0;service.maintenance();drain(app)
    assert service.status(uid,expiring)['state']=='expired'
    assert app.bucket.read(old['sha256'])  # Identical media is still used by the confirmed course.


def test_agent_restores_and_pushes_raw_assets_without_base64_expansion(client,tmp_path,monkeypatch):
    import hashlib
    from shuku_backend.course_package import normalize
    from shuku_backend.local_agent import AUTHORING
    n=normalize(package(),implemented_ids=['one']);raw=n['assets'];assets={name:{'sha256':hashlib.sha256(data).hexdigest(),'size':len(data),'mime':'image/png' if name.endswith('.png') else 'font/woff2'} for name,data in raw.items()}
    project={'version':1,'courseId':'custom-test','title':'Agent 往返','duration':30,'style':'简洁','outlineConfirmed':True,'pages':n['pages'],
             'source':{'files':n['files']},'sourceAssets':assets,'sourceGuideEntry':n['guide'],'authoringModule':n['module'],'authoringVersion':AUTHORING['commit']}
    snapshot={'project':project,'course':{'title':project['title'],'description':'','category':'测试'},'authoring':AUTHORING,'native_source':None,'expected_revision':'old','expected_draft':None}
    monkeypatch.chdir(tmp_path);monkeypatch.setattr(client,'checkout',fake_framework);monkeypatch.setattr(client,'request',lambda *args,**kwargs:snapshot)
    monkeypatch.setattr(client,'binary_request',lambda site,cid,token,**kwargs:next(data for name,data in raw.items() if assets[name]['sha256']==kwargs['digest']))
    client.prepare('https://example.test','course','token');state=client.read('shuku-state.json')
    result=client.template_project(state,project)
    assert result['sourceAssets']==assets and all(not value.startswith('data:') for value in result['source']['files'].values())
    assert result['source']['files']['licenses/LICENSE.txt']=='MIT'
    assert result['title']==project['title']
    renamed={**project,'title':'Web rename'}
    assert client.template_project(state,renamed)['title']=='Web rename'
    outline_path=Path('courses',state['module'],'outlines.json')
    outline=client.read(outline_path);outline['title']='Agent rename';client.write(outline_path,outline)
    assert client.template_project(state,renamed)['title']=='Agent rename'

    name='modules/Demo/assets/image.png';Path('courses',name).write_bytes(b'changed')
    uploads=[]
    def upload(path,data):uploads.append((path,data));return {**assets[path],'sha256':hashlib.sha256(data).hexdigest(),'size':len(data)}
    result=client.template_project(state,project,upload=upload)
    assert uploads==[(name,b'changed')] and result['sourceAssets'][name]['size']==7


def test_plain_agent_pull_push_preserves_binary_objects(client,tmp_path,monkeypatch):
    import hashlib
    monkeypatch.chdir(tmp_path)
    raw=b'image';obj={'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw),'mime':'image/png'}
    project={'source':{'files':{'Lesson.tsx':'export default ()=>null'}},'sourceAssets':{'image.png':obj}}
    snapshot={'project':project,'expected_revision':'old','expected_draft':None}
    saves=[]
    def request(site,path,token,body=None,key=None):
        if body is None:return snapshot
        saves.append(body);return {'id':'new'}
    monkeypatch.setattr(client,'request',request)
    monkeypatch.setattr(client,'binary_request',lambda *args,**kwargs:raw)
    client.pull('https://example.test','course','token')
    assert Path('source/image.png').read_bytes()==raw
    client.push(client.read('shuku-state.json'),'token')
    assert saves[0]['project']['sourceAssets']=={'image.png':obj}
    assert 'image.png' not in saves[0]['project']['source']['files']


def test_independent_remote_changes_are_preserved_then_retry_reuses_course(importing):
    app,uid,fake=importing;service=app.workflow.imports;tid,report=inspect_zip(app,uid)
    result=service.confirm(uid,tid,{'selection':report['candidates'][0]['key']})
    # Finish the two dependencies, before allowing initialization to run.
    for _ in range(2):assert app.worker.run_once()
    changed='9'*40;fake.refs['heads/main']=changed;fake.commits[changed]={'tree':{'sha':'base-tree'},'message':'Independent change','parents':[]}
    drain(app)
    assert service.status(uid,tid)['error_code']=='REMOTE_CHANGED' and fake.refs['heads/main']==changed
    fake.refs['heads/main']=BASE;service.retry(uid,tid);drain(app)
    assert service.status(uid,tid)['state']=='succeeded' and service.status(uid,tid)['course_id']==result['course_id']


def test_failed_import_build_can_use_an_explicitly_corrected_revision_on_retry(importing):
    app,uid,_=importing;service=app.workflow.imports;files=package()
    files['modules/Demo/Deck.tsx']=b'import fs from "node:fs";export const deck={scenes:[{id:"one",render:()=>fs.readFileSync("secret")}]}';
    tid=service.create(uid,str(uuid4()),{'type':'zip'},zip_content(files))['id'];drain(app)
    report=service.status(uid,tid);result=service.confirm(uid,tid,{'selection':report['candidates'][0]['key']});drain(app)
    assert service.status(uid,tid)['state']=='failed'
    project=app.workflow.revision(uid,result['revision_id'])['project'];project['source']['files']['modules/Demo/Deck.tsx']=package()['modules/Demo/Deck.tsx'].decode()
    fixed=app.workflow.save(uid,result['course_id'],{'project':project,'expected_revision':result['revision_id']});drain(app)
    service.retry(uid,tid);drain(app)
    status=service.status(uid,tid)
    assert status['state']=='succeeded' and status['revision_id']==fixed['id']
    assert app.store.course(uid,result['course_id'])['head_revision']==fixed['id']


def test_import_http_auth_idempotency_upload_and_asset_scope(api):
    from http.client import HTTPConnection
    import threading
    request,app=api;app.workflow.root=Path(__file__).resolve().parents[3];owner=login(request,'xiaoman');learner=login(request,'linzhi')
    key=str(uuid4());headers={'Idempotency-Key':key}
    data={'type':'github','url':'https://github.com/org/repo/tree/main/modules/Demo'}
    assert request('POST','/course-imports',data,cookie=learner,extra=headers)[0]==403
    code,task,_=request('POST','/course-imports',data,cookie=owner,extra=headers)
    assert code==202 and request('POST','/course-imports',data,cookie=owner,extra=headers)[1]==task
    assert request('GET','/course-imports/'+task['id'],cookie=learner)[0]==404
    assert request('POST','/course-imports/'+task['id']+'/cancel',{},cookie=owner)[0]==200
    course=request('POST','/courses',{'title':'Assets','module_id':str(uuid4())},cookie=owner)[1]['course']
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def binary(method,path,content=None,cookie=owner,extra=None):
        connection=HTTPConnection(*server.server_address,timeout=30)
        connection.request(method,'/api/shuku'+path,body=content,headers={'Origin':app.settings.origin,'Cookie':cookie,**(extra or {})})
        response=connection.getresponse();value=(response.status,response.read());connection.close();return value
    try:
        uploaded=binary('POST','/course-imports/zip',zip_content().read(),extra={'Content-Type':'application/zip','Idempotency-Key':str(uuid4())})
        assert uploaded[0]==202
        value=binary('POST','/courses/'+course['id']+'/assets',b'image',extra={'Content-Type':'application/octet-stream','X-Shuku-Asset-Path':'modules%2FDemo%2Fimage.png'})
        assert value[0]==201
        sha=json.loads(value[1])['asset']['sha256'];path='/courses/'+course['id']+'/assets/'+sha
        assert binary('GET',path)==(200,b'image')
        assert binary('GET',path,cookie=learner)[0]==403
    finally:server.shutdown();server.server_close();thread.join()


def test_course_removal_cleans_import_and_staged_files_without_deleting_shared_assets(importing):
    app,uid,fake=importing;service=app.workflow.imports;tid,report=inspect_zip(app,uid)
    result=service.confirm(uid,tid,{'selection':report['candidates'][0]['key']});drain(app)
    protected,_=inspect_zip(app,uid)
    project=app.workflow.revision(uid,result['revision_id'])['project']
    shared=project['sourceAssets']['modules/Demo/assets/image.png']['sha256']
    temporary=service.upload_asset(uid,result['course_id'],'unused.png',b'unused')['asset']['sha256']
    app.workflow.governance.request(uid,'course',result['course_id'],{'confirm':True});drain(app)
    assert service.status(uid,tid)['state']=='removed'
    assert service.status(uid,protected)['state']=='succeeded'
    assert app.bucket.read(shared) and not app.bucket.path(temporary).exists()


def test_replayed_inspection_registers_the_same_bucket_objects(importing):
    app,uid,_=importing;service=app.workflow.imports
    tid=service.create(uid,str(uuid4()),{'type':'zip'},zip_content())['id']
    task=app.store.claim(['course.import.inspect'],app.clock())
    checkpoint=lambda state:app.store.checkpoint(tid,task['lease_token'],app.clock(),state)
    first=service.inspect(task,checkpoint);before=sorted(p.name for p in (app.bucket.root/'sha256').rglob('*') if p.is_file())
    second=service.inspect(task,checkpoint)
    assert first==second
    assert before==sorted(p.name for p in (app.bucket.root/'sha256').rglob('*') if p.is_file())
    app.store.finish(tid,task['lease_token'],app.clock(),result=second)


def test_invalid_asset_does_not_leave_unregistered_objects(importing):
    app,uid,_=importing;service=app.workflow.imports;files=package();files['modules/Demo/assets/empty.png']=b''
    tid=service.create(uid,str(uuid4()),{'type':'zip'},zip_content(files))['id']
    before=sorted(p.name for p in (app.bucket.root/'sha256').rglob('*') if p.is_file())
    drain(app)
    assert service.status(uid,tid)['state']=='failed'
    assert before==sorted(p.name for p in (app.bucket.root/'sha256').rglob('*') if p.is_file())
    service.cancel(uid,tid);drain(app)
    assert not [p for p in (app.bucket.root/'sha256').rglob('*') if p.is_file()]


def test_partial_bucket_write_is_registered_and_can_be_cancelled(importing,monkeypatch):
    app,uid,_=importing;service=app.workflow.imports
    tid=service.create(uid,str(uuid4()),{'type':'zip'},zip_content())['id']
    original=app.bucket.put
    def fail_after_write(content):
        original(content)
        raise OSError('simulated storage interruption')
    monkeypatch.setattr(app.bucket,'put',fail_after_write)
    assert app.worker.run_once()
    monkeypatch.setattr(app.bucket,'put',original)
    assert service.status(uid,tid)['state']=='queued'
    service.cancel(uid,tid);drain(app)
    assert not [p for p in (app.bucket.root/'sha256').rglob('*') if p.is_file()]
