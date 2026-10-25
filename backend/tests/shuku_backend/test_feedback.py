from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import json
import threading
from http.client import HTTPConnection
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.application import create_application
from test_collaboration import published,CONTRIBUTOR
from test_workflow import workflow,save_ready,approve


def report(app,rid,text='这一页的例子有误',key=None):
    return app.workflow.feedback.submit(CONTRIBUTOR,rid,{'request_key':key or str(uuid4()),'message':text,'location':'第 1 页'})


def test_feedback_notifies_active_course_managers_once_and_survives_restart(published):
    app,c,p,owner,admin,release,old=published
    manager=str(uuid4())
    with app.store.transaction() as db:
        db.execute("INSERT INTO shuku_users VALUES (%s,'manager','课程管理者','creator',true)",(manager,))
        db.execute('INSERT INTO shuku_course_managers VALUES (%s,%s)',(c['id'],manager))
        db.execute('INSERT INTO shuku_course_managers VALUES (%s,%s)',(c['id'],owner))
    key=str(uuid4())
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:report(app,old['id'],key=key),range(2)))
    assert results[0]==results[1]
    assert app.workflow.feedback.messages(owner)['unread_count']==1
    assert app.workflow.feedback.messages(manager)['unread_count']==1
    assert app.workflow.feedback.messages(admin)['messages']==[]
    assert app.workflow.feedback.messages(CONTRIBUTOR)['messages']==[]
    with pytest.raises(BusinessError) as error:report(app,old['id'],'不同内容',key)
    assert error.value.code=='IDEMPOTENCY_CONFLICT'
    restarted=create_application(app.settings)
    try:
        assert restarted.workflow.feedback.messages(owner)['unread_count']==1
        assert restarted.workflow.feedback.detail(CONTRIBUTOR,results[0]['id'])['version']=='1.0.0'
    finally:restarted.close()


def test_feedback_status_reply_and_read_are_independent_and_recipient_scoped(published):
    app,c,p,owner,admin,release,old=published;f=app.workflow.feedback
    fid=report(app,old['id'])['id'];mid=f.messages(owner)['messages'][0]['id']
    with pytest.raises(BusinessError):f.read(CONTRIBUTOR,mid,{})
    f.read(owner,mid,{})
    assert f.messages(owner)['unread_count']==0 and f.detail(owner,fid)['status']=='open'
    first=f.messages(owner)['messages'][0]['read_at'];f.read(owner,mid,{})
    assert f.messages(owner)['messages'][0]['read_at']==first
    with pytest.raises(BusinessError):f.update(CONTRIBUTOR,fid,{'status':'resolved','reply':'伪造处理','expected_version':0})
    data={'status':'resolved','reply':'已核对并修正','expected_version':0}
    assert f.update(owner,fid,data)==f.update(owner,fid,data)
    assert f.messages(CONTRIBUTOR)['unread_count']==1
    assert c['title'] in f.messages(CONTRIBUTOR)['messages'][0]['title']
    assert f.detail(CONTRIBUTOR,fid)['reply']=='已核对并修正'
    outsider=str(uuid4())
    with app.store.transaction() as db:db.execute("INSERT INTO shuku_users VALUES (%s,'outsider','其他学习者','learner',true)",(outsider,))
    with pytest.raises(BusinessError):f.detail(outsider,fid)
    with pytest.raises(BusinessError):f.update(owner,fid,{'status':'in_progress','reply':'过期处理','expected_version':0})
    assert f.messages(CONTRIBUTOR)['unread_count']==1


def test_messages_cursor_pages_and_mark_all_only_affect_recipient(published):
    app,c,p,owner,admin,release,old=published;f=app.workflow.feedback
    fid=report(app,old['id'])['id']
    with app.store.transaction() as db:
        db.execute('DELETE FROM shuku_messages')
        # Identical timestamps exercise the UUID tie-breaker in cursor pagination.
        for i in range(41):db.execute("INSERT INTO shuku_messages(id,recipient_id,feedback_id,event_key,kind,title,summary,created_at) VALUES (%s,%s,%s,%s,'feedback_received','问题','描述',100)",(uuid4(),owner,fid,str(i)))
        f.notify(db,[admin],fid,'other-recipient','feedback_received','其他消息','不受影响')
    first=f.messages(owner);second=f.messages(owner,first['next_cursor']);third=f.messages(owner,second['next_cursor'])
    assert [len(page['messages']) for page in (first,second,third)]==[20,20,1]
    assert len({m['id'] for page in (first,second,third) for m in page['messages']})==41
    assert first['unread_count']==third['unread_count']==41
    with pytest.raises(BusinessError):f.messages(owner,f.messages(admin)['messages'][0]['id'])
    assert f.read_all(owner,{})['updated']==41
    assert f.read_all(owner,{})['updated']==0
    assert f.messages(owner)['unread_count']==0 and f.messages(admin)['unread_count']==1
    assert f.detail(owner,fid)['status']=='open'


def test_feedback_rejects_private_and_hidden_versions_but_keeps_original_release(published):
    app,c,p,owner,admin,release,old=published;f=app.workflow.feedback
    p['pages'][0]['summary']='新版本'
    draft=save_ready(app,c,p,owner,old['id'])
    with pytest.raises(BusinessError):report(app,draft['id'])
    approve(app,c,draft,owner,admin);app.workflow.publish(owner,c['id'],{'revision_id':draft['id'],'version':'1.0.1'})
    fid=report(app,old['id'])['id']
    assert f.detail(owner,fid)['version']=='1.0.0' and f.learning(old['id'])['version']=='1.0.0'
    app.workflow.governance.visibility(admin,c['id'],{'action':'hide'})
    with pytest.raises(BusinessError):report(app,old['id'])
    f.update(owner,fid,{'status':'in_progress','reply':'课程下架期间继续核对','expected_version':0})
    assert f.detail(CONTRIBUTOR,fid)['status']=='in_progress'


def test_feedback_rate_limit_is_atomic_under_parallel_submissions(published):
    app,c,p,owner,admin,release,old=published
    def submit(i):
        try:return report(app,old['id'],str(i))
        except BusinessError as e:return e.code
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(submit,range(11)))
    assert sum(isinstance(r,dict) for r in results)==10 and results.count('FEEDBACK_LIMIT')==1
    assert app.workflow.feedback.messages(owner)['unread_count']==10


def test_feedback_fallback_and_transaction_rollback_without_active_manager(published):
    app,c,p,owner,admin,release,old=published
    with app.store.transaction() as db:db.execute('UPDATE shuku_users SET active=false WHERE id=%s',(owner,))
    report(app,old['id'])
    assert app.workflow.feedback.messages(admin)['unread_count']==1
    with app.store.transaction() as db:db.execute('UPDATE shuku_users SET active=false WHERE id=%s',(admin,))
    with pytest.raises(BusinessError):report(app,old['id'])
    with app.store.transaction() as db:assert db.execute('SELECT count(*) AS n FROM shuku_feedback').fetchone()['n']==1


def test_course_removal_cascades_feedback_and_messages(published):
    app,c,p,owner,admin,release,old=published
    report(app,old['id']);app.workflow.governance.request(admin,'course',c['id'],{'confirm':True})
    assert app.worker.run_once()
    with app.store.transaction() as db:
        assert db.execute('SELECT count(*) AS n FROM shuku_feedback').fetchone()['n']==0
        assert db.execute('SELECT count(*) AS n FROM shuku_messages').fetchone()['n']==0


def test_feedback_http_auth_csrf_validation_pagination_and_read(published):
    app,c,p,owner,admin,release,old=published
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def request(method,path,data=None,cookie='',origin=app.settings.origin):
        conn=HTTPConnection(*server.server_address,timeout=10)
        conn.request(method,'/api/shuku'+path,body=json.dumps(data) if data is not None else None,headers={'Cookie':cookie,'Origin':origin,'Content-Type':'application/json'})
        response=conn.getresponse();result=(response.status,json.loads(response.read()),response.getheader('Set-Cookie'));conn.close();return result
    try:
        assert request('GET','/public/revisions/'+old['id'])[1]['version']=='1.0.0'
        data={'request_key':str(uuid4()),'message':'课程问题'};path='/revisions/'+old['id']+'/feedback'
        assert request('POST',path,data)[0]==401
        learner=request('POST','/auth/login',{'username':'linzhi','password':'test-password'})[2].split(';')[0]
        manager=request('POST','/auth/login',{'username':'xiaoman','password':'test-password'})[2].split(';')[0]
        assert request('POST',path,data,learner,origin='https://other')[0]==403
        assert request('POST',path,{**data,'reporter_id':owner},learner)[0]==400
        code,body,_=request('POST',path,data,learner);assert code==201
        messages=request('GET','/messages',cookie=manager)[1];mid=messages['messages'][0]['id']
        assert request('GET','/messages?limit=10000',cookie=manager)[0]==400
        assert request('GET','/messages?cursor='+mid,cookie=manager)[0]==200
        assert request('POST','/messages/'+mid+'/read',{},learner)[0]==404
        assert request('POST','/messages/'+mid+'/read',{},manager)[1]['unread_count']==0
        assert request('GET','/feedback/'+body['id'],cookie=manager)[1]['message']=='课程问题'
        assert request('POST','/feedback/'+body['id']+'/status',{'status':[],'reply':'','expected_version':0},manager)[0]==400
        assert request('POST','/messages/read-all',{},manager)[1]['updated']==0
    finally:server.shutdown();server.server_close();thread.join()
