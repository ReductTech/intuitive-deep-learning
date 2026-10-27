from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json
from uuid import uuid4
import pytest
from shuku_backend.application import create_application
from shuku_backend.settings import Settings
from shuku_backend.storage import DEMO_USERS
from shuku_backend.errors import BusinessError


@pytest.fixture
def workflow(store,tmp_path):
    store.seed_demo();root=Path(__file__).resolve().parents[3]
    app=create_application(Settings(store.database_url,tmp_path/'bucket','http://localhost:5175','test-password',source_root=root,port=0))
    module=next(item for item in app.workflow.modules() if item['pages'])
    uid=DEMO_USERS[1][0];admin=DEMO_USERS[2][0]
    course=store.create_course(uid,{'module_id':module['id'],'title':'私有课程'},app.clock())
    project={'version':1,'id':str(uuid4()),'courseId':module['alias'],'title':'私有课程','duration':30,'style':'简洁教学','outlineConfirmed':True,'pages':[{'id':str(uuid4()),'format':'text','title':'第一课','goal':'理解一个概念','summary':'真实课程内容','note':'','ready':True,'designed':True,'revisions':[],'messages':[]}]}
    try:yield app,course,project,uid,admin
    finally:app.close()


def save_ready(app,course,project,uid,expected=None):
    result=app.workflow.save(uid,course['id'],{'project':project,'expected_revision':expected})
    assert app.worker.run_once()
    revision=app.workflow.revision(uid,result['id'])
    assert revision['state']=='ready'
    return revision


def approve(app,course,revision,uid,admin):
    review=app.workflow.submit(uid,course['id'],{'revision_id':revision['id']})
    app.workflow.decide(admin,review['id'],{'decision':'approved','revision_id':revision['id'],'note':'内容核对通过'})


def test_private_save_build_review_publish_and_public_player(workflow):
    app,course,project,uid,admin=workflow
    project['pages'][0]['messages']=[{'role':'user','text':'private-author-notes'}]
    project['pages'][0]['designImageId']='draft'
    project['designImages']={'draft':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='}
    revision=save_ready(app,course,project,uid)
    assert b'private-author-notes' not in app.workflow.file(uid,revision['id'],'bundle.js')[0]
    assert app.workflow.public_courses()==[]
    with pytest.raises(BusinessError):app.workflow.file(None,revision['id'],'index.html')
    with pytest.raises(BusinessError):app.workflow.revision(DEMO_USERS[0][0],revision['id'])
    html,mime=app.workflow.file(uid,revision['id'],'index.html')
    assert b'bundle.js' in html and mime=='text/html'
    with pytest.raises(BusinessError):app.workflow.publish(uid,course['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    approve(app,course,revision,uid,admin)
    release=app.workflow.publish(uid,course['id'],{'revision_id':revision['id'],'version':'1.0.0','note':'首版'})
    assert release==app.workflow.publish(uid,course['id'],{'revision_id':revision['id'],'version':'1.0.0','note':'首版'})
    assert app.workflow.file(None,revision['id'],'index.html')[0]==html
    with pytest.raises(BusinessError):app.workflow.file(None,revision['id'],'images/draft.png')
    assert app.workflow.public_courses()[0]['revision_id']==revision['id']
    assert app.store.courses(DEMO_USERS[0][0])==[]
    with pytest.raises(BusinessError):app.store.course(DEMO_USERS[0][0],course['id'])
    with pytest.raises(BusinessError):app.workflow.file(None,revision['id'],'../project.json')
    with app.store.transaction() as db:db.execute("UPDATE shuku_courses SET status='hidden' WHERE id=%s",(course['id'],))
    with pytest.raises(BusinessError):app.workflow.file(None,revision['id'],'index.html')


def test_new_revision_invalidates_approval_and_preserves_old_version(workflow):
    app,course,project,uid,admin=workflow
    first=save_ready(app,course,project,uid);approve(app,course,first,uid,admin)
    old=app.workflow.publish(uid,course['id'],{'revision_id':first['id'],'version':'1.0.0'})
    project['pages'][0]['summary']='第二版内容'
    project['title']='尚未批准的课程名称'
    second=save_ready(app,course,project,uid,first['id'])
    review=app.workflow.submit(uid,course['id'],{'revision_id':second['id']})
    app.workflow.decide(admin,review['id'],{'decision':'rejected','revision_id':second['id'],'note':'补充示例'})
    with pytest.raises(BusinessError):app.workflow.publish(uid,course['id'],{'revision_id':second['id'],'version':'1.0.1'})
    third=save_ready(app,course,project,uid,second['id']);approve(app,course,third,uid,admin)
    project['pages'][0]['summary']='审核后的新修改'
    fourth=save_ready(app,course,project,uid,third['id'])
    with pytest.raises(BusinessError):app.workflow.publish(uid,course['id'],{'revision_id':third['id'],'version':'1.0.1'})
    assert app.workflow.public_courses()[0]['revision_id']==first['id']
    assert app.workflow.public_courses()[0]['title']=='私有课程'
    assert app.workflow.file(None,first['id'],'index.html')[0]
    approve(app,course,fourth,uid,admin)
    with app.store.transaction() as db:row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(fourth['id'],)).fetchone()
    digest=row['files']['project.json']['sha256'];path=app.bucket.path(digest);original=path.read_bytes();path.write_bytes(b'corrupt')
    try:
        with pytest.raises(ValueError):app.workflow.publish(uid,course['id'],{'revision_id':fourth['id'],'version':'1.0.1'})
    finally:path.write_bytes(original)
    assert app.workflow.public_courses()[0]['revision_id']==first['id']
    app.workflow.publish(uid,course['id'],{'revision_id':fourth['id'],'version':'1.0.1'})
    assert app.workflow.file(None,first['id'],'index.html')[0]


def test_concurrent_save_and_spoofed_project_are_rejected(workflow):
    app,course,project,uid,admin=workflow
    def save(_):
        try:return app.workflow.save(uid,course['id'],{'project':project,'expected_revision':None})
        except BusinessError as error:return error.code
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(save,range(2)))
    assert sum(isinstance(x,dict) for x in results)==1 and 'REVISION_CONFLICT' in results
    head=next(x['id'] for x in results if isinstance(x,dict))
    bad=json.loads(json.dumps(project));bad['pages'][0].pop('format')
    with pytest.raises(BusinessError) as error:app.workflow.save(uid,course['id'],{'project':bad,'expected_revision':head})
    assert error.value.code=='UNSUPPORTED_PAGE'


def test_admin_cannot_review_own_course(workflow):
    app,course,project,uid,admin=workflow
    own=app.store.create_course(admin,{'module_id':course['module_id'],'title':'管理员课程'},app.clock())
    revision=save_ready(app,own,project,admin);review=app.workflow.submit(admin,own['id'],{'revision_id':revision['id']})
    with pytest.raises(BusinessError) as error:app.workflow.decide(admin,review['id'],{'decision':'approved','revision_id':revision['id']})
    assert error.value.code=='SELF_REVIEW'


def test_native_page_is_bundled_with_its_assets(workflow):
    app,course,project,uid,admin=workflow
    module=next(m for m in app.workflow.modules() if m['alias']=='neuron-guide')
    course=app.store.create_course(uid,{'module_id':module['id'],'title':'神经元课程'},app.clock())
    project['courseId']=module['alias']
    page=project['pages'][0];page.pop('format');page['nativeId']='nematode-response'
    revision=save_ready(app,course,project,uid)
    js,mime=app.workflow.file(uid,revision['id'],'bundle.js')
    assert b'RuntimePlayer' in js and len(js)>10000
    utilities,mime=app.workflow.file(uid,revision['id'],'utilities.css')
    assert b'display: grid' in utilities and b'.grid' in utilities
