from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.personal import PersonalLearning
from shuku_backend.storage import DEMO_USERS
from test_http import api,login
from test_workflow import workflow,save_ready,approve
from test_collaboration import published

LEARNER=DEMO_USERS[0][0]


def position(key,version,page,expected=0,mode='guide'):
    return dict(resource=key,version=version,page_id=page,mode=mode,completed=[page],expected_version=expected)


def test_account_scope_restart_and_idempotent_favorites(published):
    app,c,p,owner,admin,release,r=published
    service=app.workflow.personal;key='course:'+c['id'];rid=r['id'];page=p['pages'][0]['id']
    for _ in range(2):service.favorite(LEARNER,dict(resource=key,saved=True))
    assert service.listing(LEARNER)['favorites']==[key]
    assert service.listing(LEARNER)['favorite_courses'][0]['id']==c['id']
    assert service.listing(owner)['favorites']==[]
    first=service.save(LEARNER,position(key,rid,page))
    assert first['state_version']==1
    other_instance=PersonalLearning(app.workflow)
    assert other_instance.state(LEARNER,key,rid)['state']['completed']==[page]
    assert other_instance.state(owner,key,rid)['state'] is None
    assert other_instance.listing(LEARNER)['history'][0]['version']==rid
    service.favorite(LEARNER,dict(resource=key,saved=False));service.favorite(LEARNER,dict(resource=key,saved=False))
    assert service.listing(LEARNER)['favorites']==[]


def test_history_versions_do_not_follow_latest_release(published):
    app,c,p,owner,admin,release,old=published
    service=app.workflow.personal;key='course:'+c['id'];page=p['pages'][0]['id']
    service.save(LEARNER,position(key,old['id'],page,mode='ppt'))
    p['pages'][0]['summary']='新版'
    new=save_ready(app,c,p,owner,old['id']);approve(app,c,new,owner,admin)
    app.workflow.publish(owner,c['id'],{'revision_id':new['id'],'version':'1.0.1'})
    assert app.workflow.public_courses()[0]['revision_id']==new['id']
    recent=service.listing(LEARNER)['history'][0]
    assert recent['version']==old['id'] and recent['mode']=='ppt'
    assert service.state(LEARNER,key,new['id'])['state'] is None
    service.save(LEARNER,position(key,new['id'],page))
    assert service.listing(LEARNER)['history'][0]['version']==new['id']
    assert service.state(LEARNER,key,old['id'])['state']['mode']=='ppt'


def test_concurrent_devices_do_not_overwrite_newer_state(published):
    app,c,p,*_=published;service=app.workflow.personal
    key='course:'+c['id'];rid=app.workflow.public_courses()[0]['revision_id'];page=p['pages'][0]['id']
    def save(mode):
        try:return service.save(LEARNER,position(key,rid,page,mode=mode))['state_version']
        except BusinessError as error:return error.code
    with ThreadPoolExecutor(max_workers=2) as pool:out=list(pool.map(save,['guide','ppt']))
    assert sorted(map(str,out))==['1','LEARNING_CHANGED']
    with pytest.raises(BusinessError) as caught:service.save(LEARNER,position(key,rid,page))
    assert caught.value.code=='LEARNING_CHANGED'


def test_no_draft_forged_pages_or_private_source_leaks(published):
    app,c,p,owner,admin,release,r=published;service=app.workflow.personal
    key='course:'+c['id'];page=p['pages'][0]['id']
    context=service.context(key,r['id'])
    assert 'messages' not in str(context) and 'private-original' not in str(context)
    with pytest.raises(BusinessError):service.context('course:'+c['id'].upper(),r['id'])
    with pytest.raises(BusinessError):service.save(LEARNER,position(key,r['id'],'forged'))
    with pytest.raises(BusinessError):service.save(LEARNER,{**position(key,r['id'],page),'user_id':owner})
    draft=save_ready(app,c,p,owner,r['id'])
    with pytest.raises(BusinessError):service.context(key,draft['id'])
    other=app.store.create_course(owner,{'module_id':c['module_id'],'title':'草稿'},app.clock())
    with pytest.raises(BusinessError):service.favorite(LEARNER,{'resource':'course:'+other['id'],'saved':True})
    with pytest.raises(BusinessError):service.context('course:'+str(uuid4()),r['id'])


def test_hide_restore_and_permanent_delete_cleanup(published):
    app,c,p,owner,admin,release,r=published;service=app.workflow.personal;key='course:'+c['id']
    service.favorite(LEARNER,dict(resource=key,saved=True));service.save(LEARNER,position(key,r['id'],p['pages'][0]['id']))
    app.workflow.governance.visibility(admin,c['id'],{'action':'hide'})
    assert not service.listing(LEARNER)['history'][0]['available']
    assert service.listing(LEARNER)['favorite_courses']==[]
    with pytest.raises(BusinessError):service.state(LEARNER,key,r['id'])
    app.workflow.governance.visibility(admin,c['id'],{'action':'restore'})
    assert service.listing(LEARNER)['history'][0]['available']
    # FK cleanup covers revisions and courses even when the durable deletion worker runs.
    result=app.workflow.governance.request(admin,'course',c['id'],{'confirm':True})
    for _ in range(10):
        app.worker.run_once()
        if not service.listing(LEARNER)['history']:break
    assert service.listing(LEARNER)['history']==[]
    assert service.listing(LEARNER)['favorites']==[]


def test_builtin_catalog_and_cursor_account_boundary(workflow):
    app,*_=workflow;service=app.workflow.personal
    modules=app.workflow.modules();module=modules[0];key='module:'+module['alias']
    service.favorite(LEARNER,{'resource':key,'saved':True})
    service.save(LEARNER,position(key,'builtin',module['pages'][0]))
    assert service.state(LEARNER,key,'builtin')['state']['mode']=='guide'
    with pytest.raises(BusinessError):service.context('module:../../etc','builtin')
    with pytest.raises(BusinessError):service.context(key,'some-old-version')
    # Use trusted catalog entries with synthetic timestamps to exercise a full history page.
    with app.store.transaction() as db:
        for i in range(25):
            db.execute("INSERT INTO shuku_business.learning_states VALUES (%s,%s,'builtin',NULL,NULL,'page','ppt','[]',1,%s)",(LEARNER,'module:missing'+str(i),i+1))
    first=service.listing(LEARNER);second=service.listing(LEARNER,first['next_cursor'])
    assert len(first['history'])==20 and len(second['history'])==6
    assert not set(r['resource'] for r in first['history'])&set(r['resource'] for r in second['history'])
    assert service.listing(DEMO_USERS[1][0],first['next_cursor'])['history']==[]
    with pytest.raises(BusinessError):service.listing(LEARNER,'["bad"]')


def test_personal_http_auth_csrf_validation_and_scoped_records(api):
    request,app=api;app.workflow.root=Path(__file__).resolve().parents[3]
    module=app.workflow.modules()[0];key='module:'+module['alias'];encoded=key.replace(':','%3A')
    assert request('GET','/personal')[0]==401
    assert request('POST','/personal/favorites',{'resource':key,'saved':True})[0]==401
    assert request('GET','/public/study/'+encoded+'/builtin')[0]==200
    learner=login(request,'linzhi');owner=login(request,'xiaoman')
    assert request('POST','/personal/favorites',{'resource':key,'saved':True},cookie=learner,origin='https://other')[0]==403
    assert request('POST','/personal/favorites',{'resource':key,'saved':True},cookie=learner)[0]==200
    data=position(key,'builtin',module['pages'][0])
    assert request('POST','/personal/study',data,cookie=learner,extra={'X-Shuku-Account':DEMO_USERS[1][0]})[0]==409
    assert request('POST','/personal/favorites',{'resource':key,'saved':False},cookie=learner,extra={'X-Shuku-Account':DEMO_USERS[1][0]})[0]==409
    assert request('POST','/personal/study',data,cookie=learner,extra={'X-Shuku-Account':LEARNER})[0]==200
    assert request('GET','/personal/study/'+encoded+'/builtin',cookie=learner)[1]['state']['state_version']==1
    assert request('GET','/personal/study/'+encoded+'/builtin',cookie=owner)[1]['state'] is None
    assert request('POST','/personal/study',data,cookie=learner)[0]==409
    assert request('GET','/personal?user_id='+LEARNER,cookie=owner)[0]==400
    assert request('POST','/personal/study',{**data,'expected_version':True},cookie=learner)[0]==400
