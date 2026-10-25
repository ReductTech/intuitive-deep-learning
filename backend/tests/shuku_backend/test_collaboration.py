import json
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,save_ready,approve

CONTRIBUTOR=DEMO_USERS[0][0]


@pytest.fixture
def published(workflow):
    app,course,project,owner,admin=workflow
    project['pages'][0]['messages']=[{'role':'user','text':'private-original-chat'}]
    project['pages'][0]['note']='private-original-note'
    revision=save_ready(app,course,project,owner);approve(app,course,revision,owner,admin)
    release=app.workflow.publish(owner,course['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    return app,course,project,owner,admin,release,revision


def workspace(app,course):
    wid=app.workflow.collaboration.create(CONTRIBUTOR,course['id'],{})['id']
    assert app.worker.run_once()
    with app.store.transaction() as db:rid=str(db.execute('SELECT head_revision FROM shuku_courses WHERE id=%s',(wid,)).fetchone()['head_revision'])
    return wid,app.workflow.revision(CONTRIBUTOR,rid)


def suggestion(app,wid,revision):
    revision['project']['pages'][0]['summary']='新增一个实际教学例子'
    revision['project']['pages'][0]['messages']=[{'role':'user','text':'private-contributor-chat'}]
    revision['project']['pages'][0]['note']='private-contributor-note'
    saved=save_ready(app,{'id':wid},revision['project'],CONTRIBUTOR,revision['id'])
    data={'revision_id':saved['id'],'summary':'补充教学例子'}
    contribution=app.workflow.collaboration.submit(CONTRIBUTOR,wid,data)
    assert app.workflow.collaboration.submit(CONTRIBUTOR,wid,data)['id']==contribution['id']
    return contribution,saved


def accept(app,k,reviewer):
    return app.workflow.collaboration.decide(reviewer,k['id'],{'revision_id':k['revision_id'],'decision':'approved','score':8,'note':'示例清楚'})


def test_workspace_is_private_idempotent_and_does_not_copy_author_notes(published):
    app,c,p,owner,admin,release,old=published
    with ThreadPoolExecutor(max_workers=2) as pool:ids=list(pool.map(lambda _:app.workflow.collaboration.create(CONTRIBUTOR,c['id'],{})['id'],range(2)))
    assert ids[0]==ids[1]
    assert app.worker.run_once()
    wid=ids[0];course=app.store.course(CONTRIBUTOR,wid)
    assert course['workspace']['base_release_id']==release['id']
    rev=app.workflow.revision(CONTRIBUTOR,course['head_revision'])
    assert 'private-original' not in json.dumps(rev['project'])
    assert app.store.courses(CONTRIBUTOR)==[]
    with pytest.raises(BusinessError):app.store.course(owner,wid)
    with pytest.raises(BusinessError):app.workflow.file(owner,rev['id'],'index.html')
    with pytest.raises(BusinessError):app.workflow.file(None,rev['id'],'index.html')
    with pytest.raises(BusinessError):app.workflow.submit(CONTRIBUTOR,wid,{'revision_id':rev['id']})
    with pytest.raises(BusinessError):app.workflow.publish(CONTRIBUTOR,wid,{'revision_id':rev['id'],'version':'1.0.0'})
    with pytest.raises(BusinessError) as error:app.workflow.collaboration.submit(CONTRIBUTOR,wid,{'revision_id':rev['id'],'summary':'未修改'})
    assert error.value.code=='NO_CHANGES'


def test_full_contribution_review_merge_publish_history_and_ranking(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial)
    assert app.workflow.file(owner,revision['id'],'index.html')[0]
    assert 'private-contributor' not in json.dumps(app.workflow.revision(owner,revision['id'])['project'])
    detail=app.workflow.collaboration.detail(owner,k['id'])
    assert detail['diff']['pages'][0]['kind']=='modified'
    assert detail['base_version']=='1.0.0'
    accept(app,k,owner)
    merged=app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    assert merged==app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    assert app.workflow.public_courses()[0]['revision_id']==old['id']
    with pytest.raises(BusinessError):app.workflow.file(None,merged['revision_id'],'index.html')
    assert app.worker.run_once()
    # Runtime code is frozen at approval, not rebuilt from potentially changed module sources.
    approved_js=app.workflow.file(CONTRIBUTOR,revision['id'],'bundle.js')[0]
    official_js=app.workflow.file(owner,merged['revision_id'],'bundle.js')[0]
    assert official_js==approved_js.replace(('/api/shuku/revisions/'+revision['id']+'/files/').encode(),('/api/shuku/revisions/'+merged['revision_id']+'/files/').encode())
    assert app.workflow.collaboration.detail(owner,k['id'])['status']=='merged'
    official=app.workflow.revision(owner,merged['revision_id'])
    assert official['review']['status']=='approved'
    assert app.workflow.public_courses()[0]['version']=='1.0.0'
    app.workflow.publish(owner,c['id'],{'revision_id':merged['revision_id'],'version':'1.0.1'})
    assert app.workflow.file(None,merged['revision_id'],'bundle.js')[0]
    assert app.workflow.file(None,old['id'],'index.html')[0]
    history=app.workflow.collaboration.history(CONTRIBUTOR,c['id'])
    assert history['ranking'][0]['score']==8 and history['ranking'][0]['count']==1
    assert history['contributions'][0]['version']=='1.0.1'
    assert history['contributions'][0]['reviewer_id']==owner
    assert history['contributions'][0]['merger_id']==owner


def test_new_changes_invalidate_approval_score_and_returned_feedback(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial)
    app.workflow.collaboration.decide(owner,k['id'],{'revision_id':revision['id'],'decision':'rejected','note':'请增加例子'})
    assert app.workflow.collaboration.detail(CONTRIBUTOR,k['id'])['note']=='请增加例子'
    revision['project']['pages'][0]['summary']+='，并解释原因'
    second=save_ready(app,{'id':wid},revision['project'],CONTRIBUTOR,revision['id'])
    k=app.workflow.collaboration.submit(CONTRIBUTOR,wid,{'revision_id':second['id'],'summary':'补充原因'})
    accept(app,k,owner)
    second['project']['pages'][0]['summary']+='。新增修改'
    save_ready(app,{'id':wid},second['project'],CONTRIBUTOR,second['id'])
    assert app.workflow.collaboration.detail(owner,k['id'])['status']=='superseded'
    with pytest.raises(BusinessError):app.workflow.collaboration.merge(owner,k['id'],{'revision_id':second['id']})
    assert app.workflow.collaboration.history(owner,c['id'])['ranking']==[]


def test_self_review_unauthorized_manager_and_stale_target_cannot_merge(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial)
    for method,data in [(app.workflow.collaboration.decide,{'revision_id':revision['id'],'decision':'approved','score':10}),(app.workflow.collaboration.merge,{'revision_id':revision['id']})]:
        with pytest.raises(BusinessError):method(CONTRIBUTOR,k['id'],data)
    outsider=str(uuid4())
    with app.store.transaction() as db:db.execute("INSERT INTO shuku_users VALUES (%s,'outsider','无权用户','creator',true)",(outsider,))
    with pytest.raises(BusinessError):app.workflow.collaboration.detail(outsider,k['id'])
    with pytest.raises(BusinessError):accept(app,k,outsider)
    accept(app,k,owner)
    p['pages'][0]['summary']='官方的其他待发布修改';save_ready(app,c,p,owner,old['id'])
    with pytest.raises(BusinessError) as error:app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    assert error.value.code=='BASE_CHANGED'
    assert app.workflow.public_courses()[0]['revision_id']==old['id']


def test_explicit_course_manager_and_failed_merge_retry(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial)
    manager=str(uuid4())
    with app.store.transaction() as db:
        db.execute("INSERT INTO shuku_users VALUES (%s,'manager','课程管理者','creator',true)",(manager,))
        db.execute('INSERT INTO shuku_course_managers VALUES (%s,%s)',(c['id'],manager))
    assert app.workflow.file(manager,revision['id'],'index.html')[0]
    accept(app,k,manager)
    result=app.workflow.collaboration.merge(manager,k['id'],{'revision_id':revision['id']})
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET status='failed',attempts=max_attempts,error_code='BUILD_FAILED' WHERE idempotency_key=%s",('build:'+result['revision_id'],))
    assert app.workflow.public_courses()[0]['revision_id']==old['id']
    assert app.workflow.collaboration.detail(manager,k['id'])['merge_task']['status']=='failed'
    retry=app.workflow.collaboration.merge(manager,k['id'],{'revision_id':revision['id']})
    assert retry==result and app.worker.run_once()
    assert app.workflow.collaboration.detail(manager,k['id'])['status']=='merged'
    assert app.workflow.revision(manager,result['revision_id'])['review']['status']=='approved'


def test_http_contribution_routes_and_csrf(published):
    import threading
    from http.client import HTTPConnection
    app,c,p,owner,admin,release,old=published
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def request(method,path,data=None,cookie='',origin=app.settings.origin):
        conn=HTTPConnection(*server.server_address,timeout=10)
        conn.request(method,'/api/shuku'+path,body=json.dumps(data) if data is not None else None,headers={'Content-Type':'application/json','Origin':origin,'Cookie':cookie})
        response=conn.getresponse();result=(response.status,json.loads(response.read()),response.getheader('Set-Cookie'));conn.close();return result
    try:
        _,_,cookie=request('POST','/auth/login',{'username':'linzhi','password':'test-password'});cookie=cookie.split(';')[0]
        assert request('GET','/public/courses/'+c['id']+'/releases')[1]['releases'][0]['current']
        assert request('POST','/courses/'+c['id']+'/workspaces',{},cookie,origin='https://other')[0]==403
        code,body,_=request('POST','/courses/'+c['id']+'/workspaces',{},cookie);assert code==201
        assert request('GET','/workspaces',cookie=cookie)[1]['workspaces'][0]['id']==body['id']
        assert request('GET','/contributions',cookie=cookie)[1]['contributions']==[]
        assert request('GET','/courses/'+c['id']+'/contributions',cookie=cookie)[1]['ranking']==[]
    finally:server.shutdown();server.server_close();thread.join()


def test_preexisting_official_draft_is_not_overwritten(published):
    app,c,p,owner,admin,release,old=published
    p['pages'][0]['summary']='提交共创之前已存在的官方草稿'
    pending=save_ready(app,c,p,owner,old['id'])
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial);accept(app,k,owner)
    with pytest.raises(BusinessError) as error:app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    assert error.value.code=='BASE_CHANGED'
    assert app.store.course(owner,c['id'])['head_revision']==pending['id']
