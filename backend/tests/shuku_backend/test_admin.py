from uuid import uuid4
from test_http import api,login
from test_collaboration import published,workspace,suggestion,accept
from test_workflow import workflow
from shuku_backend.admin import listing


def test_admin_http_permissions_pagination_and_private_fields(api):
    request,app=api
    assert request('GET','/admin/courses')[0]==401
    learner=login(request,'linzhi');creator=login(request,'xiaoman');admin=login(request,'admin')
    for tab in ('courses','contributions','reports','records'):
        for cookie in (learner,creator):assert request('GET','/admin/'+tab,cookie=cookie)[0]==403
        code,data,_=request('GET','/admin/'+tab,cookie=admin)
        assert code==200 and data['total']==0 and data['items']==[]
    for page in ('0','-1','abc','10001','1&page=2'):
        assert request('GET','/admin/courses?page='+page,cookie=admin)[0]==400
    assert request('GET','/admin/courses?token=x',cookie=admin)[0]==400
    uid=request('GET','/auth/me',cookie=creator)[1]['user']['id']
    for i in range(23):app.store.create_course(uid,{'title':'课程 '+str(i),'module_id':str(uuid4())},app.clock())
    first=request('GET','/admin/courses?page=1',cookie=admin)[1]
    second=request('GET','/admin/courses?page=2',cookie=admin)[1]
    assert first['total']==23 and len(first['items'])==20 and len(second['items'])==3
    assert not {r['id'] for r in first['items']} & {r['id'] for r in second['items']}
    assert all(not {'email','password','token','files','project'} & set(r) for r in first['items'])
    cid=first['items'][0]['id']
    assert request('POST','/courses/'+cid+'/visibility',{'action':'hide'},cookie=creator)[0]==403
    assert request('POST','/courses/'+cid+'/remove',{'confirm':True},cookie=learner)[0]==403
    assert request('POST','/courses/'+cid+'/visibility',{'action':'hide'},cookie=admin)[0]==200
    assert request('POST','/courses/'+cid+'/visibility',{'action':'restore'},cookie=admin)[0]==200
    records=request('GET','/admin/records',cookie=admin)[1]
    assert records['total']>=25 and any(r['action']=='course.restore' for r in records['items'])


def test_admin_contributions_and_ranking(published):
    app,c,p,owner,admin,release,old=published
    fid=app.workflow.feedback.submit(owner,old['id'],{'request_key':str(uuid4()),'message':'课程内容需要补充','location':'第 1 页'})['id']
    reports=listing(app,admin,'reports','1')
    assert reports['total']==1 and reports['items'][0]['id']==fid
    assert reports['items'][0]['message']=='课程内容需要补充' and reports['items'][0]['version']=='1.0.0'
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial)
    pending=listing(app,admin,'contributions','1')
    assert pending['total']==1 and pending['items'][0]['status']=='pending' and pending['ranking']==[]
    accept(app,k,owner)
    app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    assert app.worker.run_once()
    result=listing(app,admin,'contributions','1')
    assert result['ranking'][0]['score']==8 and result['ranking'][0]['merged_count']==1
