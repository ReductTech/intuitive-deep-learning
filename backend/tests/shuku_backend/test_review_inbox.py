from uuid import uuid4
from urllib.parse import urlencode
from test_http import api,login
from test_workflow import workflow,save_ready
from test_collaboration import published,workspace,suggestion,accept,CONTRIBUTOR
from shuku_backend.review_inbox import listing


def feed(app,uid,stage='all',**kwargs):
    return listing(app,uid,{k:[v] for k,v in {'stage':stage,**kwargs}.items()})


def test_course_review_to_publish_and_history(workflow):
    app,c,p,owner,admin=workflow
    r=save_ready(app,c,p,owner);review=app.workflow.submit(owner,c['id'],{'revision_id':r['id']})
    assert feed(app,admin)['counts']=={'pending':1,'merge':0,'publish':0,'all':1}
    assert feed(app,owner)['counts']['pending']==0  # Cannot approve one's own course.
    assert feed(app,CONTRIBUTOR)['items']==[]
    app.workflow.decide(admin,review['id'],{'decision':'approved','revision_id':r['id']})
    assert feed(app,owner,'publish')['counts']['publish']==1
    app.workflow.governance.visibility(admin,c['id'],{'action':'hide'})
    assert feed(app,owner)['counts']['publish']==0
    app.workflow.governance.visibility(admin,c['id'],{'action':'restore'})
    assert feed(app,owner)['counts']['publish']==1
    app.workflow.publish(owner,c['id'],{'revision_id':r['id'],'version':'1.0.0'})
    result=feed(app,owner)
    assert result['counts']['publish']==0 and result['items'][0]['status']=='published'
    assert feed(app,owner,q='not-matched')['counts']['all']==0
    assert feed(app,owner,course=str(uuid4()))['items']==[]
    assert feed(app,owner,q='小满')['total']==1


def test_contribution_review_merge_publish_scoping(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,r=suggestion(app,wid,initial)
    assert feed(app,owner,'pending')['counts']['pending']==1
    assert feed(app,CONTRIBUTOR)['items']==[]
    app.workflow.governance.visibility(admin,c['id'],{'action':'hide'})
    assert feed(app,owner)['counts']['pending']==0
    app.workflow.governance.visibility(admin,c['id'],{'action':'restore'})
    accept(app,k,owner)
    assert feed(app,owner,'merge')['counts']['merge']==1
    merging=app.workflow.collaboration.merge(owner,k['id'],{'revision_id':r['id']})
    result=feed(app,owner,'merge')
    assert result['total']==1 and result['counts']['merge']==0 and result['items'][0]['status']=='merging'
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_tasks SET status='failed' WHERE idempotency_key=%s",('build:'+merging['revision_id'],))
    assert feed(app,owner,'merge')['counts']['merge']==1
    app.workflow.collaboration.merge(owner,k['id'],{'revision_id':r['id']})
    assert feed(app,owner,'merge')['counts']['merge']==0
    assert app.worker.run_once()
    ready=feed(app,owner,'publish')
    assert ready['total']==1 and ready['counts']['publish']==1
    assert ready['items'][0]['revision_id']==merging['revision_id']
    app.workflow.publish(owner,c['id'],{'revision_id':merging['revision_id'],'version':'1.0.1'})
    assert feed(app,owner)['counts']['publish']==0
    # Deleting the private workspace does not erase accepted history.
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True});assert app.worker.run_once()
    assert any(i['kind']=='contribution' and i['status']=='merged' for i in feed(app,owner)['items'])


def test_inbox_api_validation_and_external_pr(api):
    request,app=api
    assert request('GET','/review-inbox')[0]==401
    admin=login(request,'admin');learner=login(request,'linzhi');creator=login(request,'xiaoman')
    uid=request('GET','/auth/me',cookie=creator)[1]['user']['id']
    cid=app.store.create_course(uid,{'title':'外部课程','module_id':str(uuid4())},app.clock())['id']
    with app.store.transaction() as db:
        db.execute('INSERT INTO shuku_github_repositories VALUES (%s,1,1,\'example\',\'course\',\'main\',\'sha\',false,1)',(cid,))
        db.execute("INSERT INTO shuku_github_external_prs(course_id,number,head_sha,base_sha,title,author,state,updated_at) VALUES (%s,2,'head','base','补充概念','other','open',1)",(cid,))
    result=request('GET','/review-inbox?stage=pending',cookie=creator)[1]
    assert result['counts']['pending']==1 and result['items'][0]['kind']=='github'
    assert request('GET','/review-inbox?stage=all',cookie=learner)[1]['items']==[]
    for query in ('stage=wrong','page=0','page=x','course=bad','stage=all&stage=pending','role=admin','page=10001'):
        assert request('GET','/review-inbox?'+query,cookie=admin)[0]==400
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_github_external_prs SET review_state='approved' WHERE course_id=%s",(cid,))
    assert request('GET','/review-inbox?stage=merge',cookie=creator)[1]['counts']['merge']==1
    assert request('GET','/review-inbox?'+urlencode({'stage':'all','q':'补充'}),cookie=creator)[1]['total']==1
    rid=str(uuid4())
    with app.store.transaction() as db:
        db.execute("INSERT INTO shuku_revisions VALUES (%s,%s,%s,'hash','ready','{}','artifact',1)",(rid,cid,uid))
        db.execute('UPDATE shuku_courses SET head_revision=%s WHERE id=%s',(rid,cid))
        db.execute("INSERT INTO shuku_reviews(id,revision_id,course_id,status,artifact_hash,created_at) VALUES (%s,%s,%s,'pending','artifact',1)",(uuid4(),rid,cid))
        db.execute("INSERT INTO shuku_github_revisions(revision_id,course_id,base_sha,branch,pr_number) VALUES (%s,%s,'base','review',2)",(rid,cid))
    # A local suggestion mirrored as a PR must not become a second actionable item.
    dedup=request('GET','/review-inbox?stage=all',cookie=creator)[1]
    assert dedup['total']==1 and dedup['items'][0]['kind']=='course' and dedup['counts']['pending']==0
    with app.store.transaction() as db:
        for i in range(23):db.execute("INSERT INTO shuku_github_external_prs(course_id,number,head_sha,base_sha,title,author,state,updated_at) VALUES (%s,%s,'head','base','分页建议','other','open',%s)",(cid,i+10,i+2))
    first=request('GET','/review-inbox?stage=all&page=1',cookie=creator)[1]
    second=request('GET','/review-inbox?stage=all&page=2',cookie=creator)[1]
    assert first['total']==24 and len(first['items'])==20 and len(second['items'])==4
    assert not {i['id'] for i in first['items']} & {i['id'] for i in second['items']}
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_courses SET deleting=true WHERE id=%s",(cid,))
    assert request('GET','/review-inbox',cookie=creator)[1]['counts']['all']==0
