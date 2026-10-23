from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import FILE_REFERENCE_LOCK
from test_collaboration import published,workspace,suggestion,accept,CONTRIBUTOR
from test_workflow import workflow,save_ready
from test_http import api


def execute(app):
    assert app.worker.run_once()
    return app.workflow.governance


def test_admin_hide_restore_preserves_versions_and_blocks_republishing(published):
    app,c,p,owner,admin,release,old=published;g=app.workflow.governance
    with pytest.raises(BusinessError):g.visibility(owner,c['id'],{'action':'hide'})
    g.visibility(admin,c['id'],{'action':'hide'});g.visibility(admin,c['id'],{'action':'hide'})
    assert app.workflow.public_courses()==[] and app.workflow.collaboration.releases(c['id'])==[]
    with pytest.raises(BusinessError):app.workflow.file(None,old['id'],'index.html')
    with pytest.raises(BusinessError):app.workflow.publish(owner,c['id'],{'revision_id':old['id'],'version':'1.0.0'})
    assert app.workflow.file(owner,old['id'],'index.html')[0]
    g.visibility(admin,c['id'],{'action':'restore'})
    assert app.workflow.public_courses()[0]['revision_id']==old['id']
    assert app.workflow.file(None,old['id'],'index.html')[0]


def test_workspace_delete_preserves_merged_contribution_and_official_shared_files(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial);accept(app,k,owner)
    merged=app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']});execute(app)
    app.workflow.publish(owner,c['id'],{'revision_id':merged['revision_id'],'version':'1.0.1'})
    with app.store.transaction() as db:
        source=db.execute('SELECT files FROM shuku_business.revisions WHERE id=%s',(revision['id'],)).fetchone()['files']
        shared=app.bucket.put(b'shared object')
        from psycopg.types.json import Jsonb
        for rid in (revision['id'],merged['revision_id']):db.execute("UPDATE shuku_business.revisions SET files=files||%s WHERE id=%s",(Jsonb({'static/shared':{**shared,'mime':'application/octet-stream'}}),rid))
    removal=app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})
    with pytest.raises(BusinessError):app.workflow.revision(CONTRIBUTOR,revision['id'])
    execute(app)
    assert app.workflow.collaboration.workspaces(CONTRIBUTOR)==[]
    assert app.workflow.governance.listing(CONTRIBUTOR)[0]['state']=='succeeded'
    assert app.workflow.collaboration.history(owner,c['id'])['ranking'][0]['score']==8
    assert app.workflow.file(None,merged['revision_id'],'index.html')[0]
    assert app.bucket.read(shared['sha256'])==b'shared object'
    assert not app.bucket.path(source['project.json']['sha256']).exists()
    with app.store.transaction() as db:
        assert db.execute('SELECT revision_id FROM shuku_business.contributions WHERE id=%s',(k['id'],)).fetchone()['revision_id'] is None
        assert db.execute('SELECT 1 FROM shuku_business.revisions WHERE course_id=%s',(wid,)).fetchone() is None
    assert app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})==removal


def test_permanent_course_delete_removes_related_records_but_not_other_course_files(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);suggestion(app,wid,initial)
    other=app.store.create_course(owner,{'module_id':c['module_id'],'title':'保留课程'},app.clock())
    keep=save_ready(app,other,p,owner)
    with pytest.raises(BusinessError):app.workflow.governance.request(owner,'course',c['id'],{'confirm':True})
    with pytest.raises(BusinessError):app.workflow.governance.request(admin,'course',c['id'],{})
    with ThreadPoolExecutor(max_workers=2) as pool:receipts=list(pool.map(lambda _:app.workflow.governance.request(admin,'course',c['id'],{'confirm':True}),range(2)))
    assert receipts[0]==receipts[1]
    assert app.workflow.public_courses()==[]
    execute(app)
    with app.store.transaction() as db:
        for table,column in [('courses','id'),('revisions','course_id'),('reviews','course_id'),('releases','course_id'),('course_managers','course_id')]:
            assert db.execute(f'SELECT 1 FROM shuku_business.{table} WHERE {column}=ANY(%s::uuid[])',([c['id'],wid],)).fetchone() is None
        assert db.execute('SELECT 1 FROM shuku_business.workspaces WHERE target_course_id=%s',(c['id'],)).fetchone() is None
        assert db.execute('SELECT 1 FROM shuku_business.contributions WHERE target_course_id=%s',(c['id'],)).fetchone() is None
    assert app.workflow.file(owner,keep['id'],'index.html')[0]


def test_cleanup_failure_retry_reuses_receipt_and_handles_already_removed_object(published,monkeypatch):
    app,c,p,owner,admin,release,old=published;g=app.workflow.governance
    request=g.request(admin,'course',c['id'],{'confirm':True})
    remove=app.bucket.remove;seen=[]
    def fail_after_unlink(digest):
        remove(digest);seen.append(digest);raise OSError('simulated disk error')
    monkeypatch.setattr(app.bucket,'remove',fail_after_unlink)
    # One final attempt produces a visible terminal failure without retry waiting.
    with app.store.transaction() as db:db.execute("UPDATE shuku_business.tasks SET max_attempts=1 WHERE kind='governance.remove'")
    execute(app);assert seen
    assert g.listing(admin)[0]['state']=='failed'
    with pytest.raises(BusinessError):g.retry(CONTRIBUTOR,request['id'],{})
    monkeypatch.setattr(app.bucket,'remove',remove)
    from shuku_backend.application import create_application
    # A fresh service instance must resume from PostgreSQL, not process memory.
    restarted=create_application(app.settings)
    try:
        assert restarted.workflow.governance.retry(admin,request['id'],{})==request
        execute(restarted)
        assert restarted.workflow.governance.listing(admin)[0]['state']=='succeeded'
        assert restarted.workflow.governance.request(admin,'course',c['id'],{'confirm':True})==request
    finally:restarted.close()


def test_deletion_cancels_queued_build_and_recreating_deleted_workspace_is_possible(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c)
    pending=app.workflow.save(CONTRIBUTOR,wid,{'project':initial['project'],'expected_revision':initial['id']})
    with pytest.raises(BusinessError):app.workflow.governance.request(owner,'workspace',wid,{'confirm':True})
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})
    execute(app)
    with app.store.transaction() as db:assert db.execute('SELECT status FROM shuku_business.tasks WHERE idempotency_key=%s',('build:'+pending['id'],)).fetchone()['status']=='failed'
    new=app.workflow.collaboration.create(CONTRIBUTOR,c['id'],{})
    assert new['id']!=wid


def test_running_related_build_defers_without_consuming_attempt_and_is_fenced(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c)
    app.workflow.save(CONTRIBUTOR,wid,{'project':initial['project'],'expected_revision':initial['id']})
    task=app.store.claim(['revision.build'],app.clock())
    app.workflow.governance.request(admin,'course',c['id'],{'confirm':True})
    execute(app)
    with app.store.transaction() as db:
        removal=db.execute("SELECT attempts,status,error_code FROM shuku_business.tasks WHERE kind='governance.remove'").fetchone()
    assert removal['status']=='queued' and removal['attempts']==0 and removal['error_code']=='WAITING_FOR_RELATED_TASKS'
    with pytest.raises(BusinessError):app.workflow.build(task,lambda state:None)
    app.store.finish(task['id'],task['lease_token'],app.clock(),error='RESOURCE_REMOVED')
    with app.store.transaction() as db:db.execute("UPDATE shuku_business.tasks SET available_at=0 WHERE kind='governance.remove'")
    execute(app);assert app.workflow.governance.listing(admin)[0]['state']=='succeeded'


def test_reference_writers_exclude_cleanup_and_shared_objects_survive(published):
    app,c,p,owner,admin,release,old=published
    app.workflow.governance.request(admin,'course',c['id'],{'confirm':True})
    task=app.store.claim(['governance.remove'],app.clock())
    other=app.store.create_course(owner,{'module_id':c['module_id'],'title':'并发复用文件'},app.clock())
    with app.store.transaction() as db:obj=db.execute('SELECT files FROM shuku_business.revisions WHERE id=%s',(old['id'],)).fetchone()['files']['project.json']
    from psycopg.types.json import Jsonb
    import psycopg
    with app.store.transaction() as writer:
        writer.execute('SELECT pg_advisory_xact_lock_shared(%s)',(FILE_REFERENCE_LOCK,))
        writer.execute("INSERT INTO shuku_business.revisions VALUES (%s,%s,%s,'test','ready',%s,NULL,%s)",(uuid4(),other['id'],owner,Jsonb({'project.json':obj}),app.clock()))
        with pytest.raises(psycopg.errors.LockNotAvailable):app.workflow.governance.run(task,lambda state:None)
    app.store.finish(task['id'],task['lease_token'],app.clock(),error='LOCK_BUSY')
    with app.store.transaction() as db:db.execute("UPDATE shuku_business.tasks SET available_at=0 WHERE id=%s",(task['id'],))
    execute(app);assert app.workflow.governance.listing(admin)[0]['state']=='succeeded'
    assert app.bucket.read(obj['sha256'])


def test_governance_http_permissions_csrf_and_draft_restore(api):
    from test_http import login
    request,app=api
    owner=login(request,'xiaoman');admin=login(request,'admin');learner=login(request,'linzhi')
    cid=request('POST','/courses',{'module_id':str(uuid4()),'title':'HTTP 治理测试'},cookie=owner)[1]['course']['id']
    path='/courses/'+cid
    assert request('POST',path+'/visibility',{'action':'hide'},cookie=owner)[0]==403
    assert request('POST',path+'/visibility',{'action':'hide'},cookie=admin)[0]==200
    assert request('POST',path+'/visibility',{'action':'restore'},cookie=admin)[1]['course']['status']=='draft'
    assert request('POST',path+'/remove',{'confirm':True},cookie=admin,origin='https://other')[0]==403
    assert request('POST',path+'/remove',{},cookie=admin)[0]==400
    assert request('POST',path+'/remove',{'confirm':True},cookie=learner)[0]==403
    code,body,_=request('POST',path+'/remove',{'confirm':True},cookie=admin);assert code==202
    assert request('GET','/removals',cookie=owner)[1]['removals']==[]
    assert request('GET','/removals')[0]==401
    assert request('POST','/removals/'+body['id']+'/retry',{},cookie=learner)[0]==404
    execute(app)
    assert request('GET',path,cookie=admin)[0]==404
    assert request('GET','/removals',cookie=admin)[1]['removals'][0]['state']=='succeeded'


def test_deleted_workspace_cannot_be_approved_or_newly_merged(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial);accept(app,k,owner)
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})
    with pytest.raises(BusinessError):app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    execute(app)
    assert app.workflow.collaboration.history(owner,c['id'])['ranking']==[]


def test_overlapping_workspace_and_course_removals_finish_independently(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c)
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})
    app.workflow.governance.request(admin,'course',c['id'],{'confirm':True})
    execute(app);execute(app)
    assert all(r['state']=='succeeded' for r in app.workflow.governance.listing(admin))


def test_deleting_workspace_waits_for_started_merge_and_retains_retry_access(published):
    app,c,p,owner,admin,release,old=published
    wid,initial=workspace(app,c);k,revision=suggestion(app,wid,initial);accept(app,k,owner)
    merged=app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True})
    assert app.workflow.collaboration.listing(owner)[0]['id']==k['id']
    detail=app.workflow.collaboration.detail(owner,k['id'])
    assert detail['diff']['pages']==[] and detail['preview_url']==''
    assert app.workflow.collaboration.merge(owner,k['id'],{'revision_id':revision['id']})==merged
    execute(app);execute(app)
    assert app.workflow.governance.listing(CONTRIBUTOR)[0]['state']=='succeeded'
    assert app.workflow.revision(owner,merged['revision_id'])['state']=='ready'
    assert app.workflow.collaboration.history(owner,c['id'])['ranking'][0]['score']==8
