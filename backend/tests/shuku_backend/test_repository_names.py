"""Name ownership, publication order and crash recovery; never contacts GitHub."""
import copy
from types import SimpleNamespace
import pytest
from shuku_backend.repository_names import RepositoryNames,repository_name
from shuku_backend.errors import BusinessError
from shuku_backend.adapters.github import GitHubError
from shuku_backend.github_sync import GitHubSync
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,save_ready,approve
from test_github import FakeGitHub,drain


@pytest.mark.parametrize('value,expected',[(' Deep-Learning-101 ','deep-learning-101'),('a','a'),('a'*80,'a'*80)])
def test_normalized_names(value,expected):
    assert repository_name(value)==expected


@pytest.mark.parametrize('value',[None,1,'','123','../course','two words','中文','a_b','a.b','a--b','a-','a'*81])
def test_invalid_names(value):
    with pytest.raises(BusinessError) as error:repository_name(value)
    assert error.value.code=='INVALID_REPOSITORY_NAME'


class NamingGitHub(FakeGitHub):
    def __init__(self):
        super().__init__();self.occupied={'occupied'};self.lose_rename=False;self.race=False;self.unavailable=False

    def installation_call(self,installation,method,path,data=None,missing=False):
        assert installation==123 and method=='GET'
        self.calls.append((method,path,copy.deepcopy(data)))
        if self.unavailable:raise GitHubError(503)
        if path=='/repositories/987':return copy.deepcopy(self.meta)
        assert path.startswith('/repos/tests/')
        name=path.rsplit('/',1)[1]
        if name==self.meta['name']:return copy.deepcopy(self.meta)
        if name in self.occupied:return {'id':999,'name':name}
        assert missing;return None

    def call(self,repo,method,path='',data=None,missing=False):
        if repo['name']!=self.meta['name']:raise GitHubError(301)
        if method=='PATCH' and path=='' and data.get('name'):
            if self.race:self.race=False;raise GitHubError(422)
            if self.lose_rename:self.lose_rename=False;self.fail_after=('PATCH','')
        return super().call(repo,method,path,data,missing)


def test_availability_checks_installation_scope_and_never_accepts_network_failure():
    fake=NamingGitHub();sync=SimpleNamespace(store=None,flow=None,client=fake,config={'owner':'tests','installationId':123})
    names=RepositoryNames(sync);repo={'name':'integration-test','owner':'tests','repository_id':987,'installation_id':123,'allow_destroy':True}
    assert names.editable(repo)
    assert names.available(repo,'new-course') and names.available(repo,'integration-test')
    assert not names.available(repo,'occupied')
    fake.unavailable=True
    with pytest.raises(BusinessError) as error:names.available(repo,'new-course')
    assert error.value.code=='REPOSITORY_NAME_CHECK_FAILED'
    assert not names.editable({**repo,'allow_destroy':False})
    assert not names.editable({**repo,'owner':'personal-fork'})
    for remote in ({'id':999,'owner':{'login':'tests'},'name':'wrong'},{'id':987,'owner':{'login':'other-owner'},'name':'wrong'}):
        with pytest.raises(BusinessError) as error:names.remember(repo,remote)
        assert error.value.code=='REPOSITORY_CHANGED'


def test_verified_legacy_release_finishes_without_a_new_name_requirement():
    sync=object.__new__(GitHubSync);sync.repo=lambda db,cid:{'name':'course-uuid'}
    sync.remote_revision=lambda db,rid:rid
    mapping={'release_id':42,'release_version':'1.0.0','release_note':'existing release'}
    db=SimpleNamespace(execute=lambda *args:SimpleNamespace(fetchone=lambda:mapping))
    assert sync.release_gate(db,'owner','course','revision','1.0.0','existing release') is None
    with pytest.raises(BusinessError) as error:sync.release_gate(db,'owner','course','revision','1.0.0','different note')
    assert error.value.code=='VERSION_EXISTS'


def test_publish_rename_recovery_collisions_and_permissions(workflow):
    app,course,project,owner,admin=workflow;cid=course['id'];fake=NamingGitHub()
    sync=GitHubSync(app.workflow,{'owner':'tests','installationId':123,'webhookSecret':'test'},fake)
    app.workflow.github=sync;app.worker.handlers['github.sync']=sync.run
    sync.bind(admin,cid,{'repository_id':987,'owner':'tests','name':'integration-test','installation_id':123,'allow_destroy':True})
    project['repositoryName']=' Deep-Learning-Basics '
    revision=save_ready(app,course,project,owner);approve(app,course,revision,owner,admin)
    assert sync.names.info(owner,cid)['suggested_name']=='deep-learning-basics'
    with pytest.raises(BusinessError) as error:sync.names.check(DEMO_USERS[0][0],cid,{'name':'new-course'})
    assert error.value.status==403
    assert not sync.names.check(owner,cid,{'name':'occupied'})['available']
    with pytest.raises(BusinessError) as error:sync.names.request(owner,cid,{'name':'early-name','expected_name':'integration-test'})
    assert error.value.code=='PUBLISH_FIRST'
    result=app.workflow.publish(owner,cid,{'revision_id':revision['id'],'version':'1.0.0','note':'首版','repository_name':'contended-name'})
    with app.store.transaction() as db:db.execute('UPDATE shuku_tasks SET max_attempts=1 WHERE id=(SELECT task_id FROM shuku_github_jobs WHERE id=%s)',(result['job_id'],))
    fake.race=True;assert result['pending'];drain(app)
    assert fake.meta['private'] is True
    assert next(j for j in sync.status(owner,cid)['jobs'] if j['id']==result['job_id'])['error_code']=='REPOSITORY_NAME_TAKEN'
    corrected=app.workflow.publish(owner,cid,{'revision_id':revision['id'],'version':'1.0.0','note':'首版'})
    assert corrected['job_id']==result['job_id'];drain(app)
    status=sync.status(owner,cid)
    assert all(j['status']=='succeeded' for j in status['jobs']),status
    assert status['repository']['name']=='deep-learning-basics' and status['can_rename']
    assert fake.meta['id']==987 and fake.meta['private'] is False
    rename_index=next(i for i,c in enumerate(fake.calls) if c==('PATCH','',{'name':'deep-learning-basics'}))
    public_index=next(i for i,c in enumerate(fake.calls) if c==('PATCH','',{'private':False}))
    assert rename_index<public_index
    with app.store.transaction() as db:release=db.execute('SELECT current_release FROM shuku_courses WHERE id=%s',(cid,)).fetchone()['current_release']
    # A lost rename response leaves the old DB URL; retry locates the SAME repo by ID.
    fake.lose_rename=True
    job=sync.names.request(owner,cid,{'name':'neural-networks','expected_name':'deep-learning-basics'})
    assert app.worker.run_once()
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app)
    assert sync.status(owner,cid)['repository']['name']=='neural-networks'
    assert ('GET','/repositories/987',None) in fake.calls
    assert sum(c==('PATCH','',{'name':'neural-networks'}) for c in fake.calls)==1
    # Availability is advisory: GitHub can reject a name claimed after the check.
    race=sync.names.request(owner,cid,{'name':'race-name','expected_name':'neural-networks'})
    with app.store.transaction() as db:db.execute('UPDATE shuku_tasks SET max_attempts=1 WHERE id=(SELECT task_id FROM shuku_github_jobs WHERE id=%s)',(race['job_id'],))
    fake.race=True;drain(app)
    failed=next(j for j in sync.status(owner,cid)['jobs'] if j['id']==race['job_id'])
    assert failed['status']=='failed' and failed['error_code']=='REPOSITORY_NAME_TAKEN'
    assert fake.meta['name']=='neural-networks'
    with pytest.raises(BusinessError) as error:sync.names.request(owner,cid,{'name':'other-course','expected_name':'stale-name'})
    assert error.value.code=='REPOSITORY_NAME_CHANGED'
    sync.names.request(owner,cid,{'name':'course-evolution','expected_name':'neural-networks'});drain(app)
    with app.store.transaction() as db:
        row=sync.repo(db,cid);current=db.execute('SELECT current_release FROM shuku_courses WHERE id=%s',(cid,)).fetchone()
    assert row['repository_id']==987 and row['name']=='course-evolution' and current['current_release']==release
    assert sync.names.info(owner,cid)['suggested_name']=='course-evolution'
    # The HTTP routes preserve login, CSRF and owner checks.
    from http.client import HTTPConnection
    import json,threading
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def request(method,path,body=None,cookie='',origin=None):
        conn=HTTPConnection(*server.server_address,timeout=90)
        conn.request(method,'/api/shuku'+path,body=json.dumps(body) if body is not None else None,headers={'Content-Type':'application/json','Origin':origin or app.settings.origin,'Cookie':cookie})
        reply=conn.getresponse();result=reply.status,json.loads(reply.read()),reply.getheader('Set-Cookie');conn.close();return result
    try:
        path='/courses/'+cid+'/github/name'
        assert request('GET',path)[0]==401
        code,_,cookie=request('POST','/auth/login',{'username':'xiaoman','password':'test-password'})
        assert code==200;cookie=cookie.split(';')[0]
        assert request('GET',path,cookie=cookie)[1]['name']=='course-evolution'
        assert request('POST',path+'/check',{'name':'available-course'},cookie=cookie)[1]['available']
        assert request('POST',path+'/check',{'name':'available-course'},cookie=cookie,origin='https://other.test')[0]==403
        assert request('POST',path+'/check',{'name':'bad/name'},cookie=cookie)[0]==400
    finally:server.shutdown();server.server_close();thread.join()
    with app.store.transaction() as db:db.execute('UPDATE shuku_github_repositories SET allow_destroy=false WHERE course_id=%s',(cid,))
    assert not sync.status(owner,cid)['name_editable']
    with pytest.raises(BusinessError) as error:sync.names.check(owner,cid,{'name':'shared-name'})
    assert error.value.code=='REPOSITORY_NAME_UNAVAILABLE'
