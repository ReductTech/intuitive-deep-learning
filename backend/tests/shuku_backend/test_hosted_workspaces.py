"""Hosted branches use only the App; no personal GitHub identity is needed."""
import copy
from urllib.parse import unquote
import pytest
from shuku_backend.github_sync import GitHubSync
from shuku_backend.hosted_workspaces import NAME,MARKER
from shuku_backend.errors import BusinessError
from shuku_backend.adapters.github import GitHubError
from test_github import FakeGitHub,BASE
from test_collaboration import published,CONTRIBUTOR
from test_workflow import workflow


class HostedGitHub:
    def __init__(self):
        self.remote=None;self.git=FakeGitHub();self.calls=[];self.fail_after_patch=False
    def installation_call(self,installation,method,path,data=None,missing=False):
        assert installation==123;self.calls.append((method,path))
        if method=='POST':
            assert path=='/orgs/tests/repos' and data['private'] is True
            self.remote={**data,'id':999,'name':NAME,'owner':{'login':'tests'},'default_branch':'main'}
        elif '/git/ref/' in path:return {'object':{'sha':BASE}}
        return copy.deepcopy(self.remote)
    def call(self,repo,method,path='',data=None,missing=False):
        assert repo['name']==NAME and repo['repository_id']==999
        self.calls.append((method,path))
        if method=='PATCH' and path.startswith('/git/refs/heads/'):
            assert data['force'] is False
            key=unquote(path[len('/git/refs/'):]);self.git.refs[key]=data['sha']
            if self.fail_after_patch:self.fail_after_patch=False;raise GitHubError()
            return {'object':{'sha':data['sha']}}
        return self.git.call(repo,method,path,data,missing)


def enable(app):
    fake=HostedGitHub();sync=GitHubSync(app.workflow,{'owner':'tests','installationId':123},fake);app.workflow.github=sync
    app.worker.handlers['github.workspace']=sync.hosted.run
    return fake,sync


def drain(app):
    for _ in range(30):
        if not app.worker.run_once():
            with app.store.transaction() as db:
                pending=db.execute("SELECT 1 FROM shuku_tasks WHERE status='queued'").fetchone()
                if pending:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
            if not pending:return
    raise AssertionError('Task queue did not finish')


def current(app,wid):
    with app.store.transaction() as db:
        jobs=db.execute("SELECT * FROM shuku_tasks WHERE kind='github.workspace' AND resource_key=%s ORDER BY created_at DESC,id DESC",('course:'+wid,)).fetchall()
    return jobs


def test_unbound_user_private_branch_retries_and_only_changed_blobs(published):
    app,c,p,owner,admin,release,old=published;fake,sync=enable(app)
    with app.store.transaction() as db:assert not db.execute('SELECT 1 FROM shuku_github_identities WHERE user_id=%s',(CONTRIBUTOR,)).fetchone()
    wid=app.workflow.collaboration.create(CONTRIBUTOR,c['id'],{})['id'];fake.fail_after_patch=True;drain(app)
    job=current(app,wid)[0];assert job['status']=='succeeded';branch=CONTRIBUTOR+'/'+wid
    assert job['result']['branch']==branch and fake.remote['private'] is True
    assert len([x for x in fake.calls if x==('POST','/orgs/tests/repos')])==1
    assert fake.git.refs['heads/'+branch]==job['result']['commit_sha'] and fake.git.refs['heads/main']==BASE
    assert app.workflow.github.status(CONTRIBUTOR,wid)['hosting']=='private-workspace'
    before=len(fake.git.blobs);course=app.store.course(CONTRIBUTOR,wid);revision=app.workflow.revision(CONTRIBUTOR,course['head_revision']);revision['project']['pages'][0]['summary']='只修改这一页'
    saved=app.workflow.save(CONTRIBUTOR,wid,{'project':revision['project'],'expected_revision':revision['id']});drain(app)
    assert current(app,wid)[0]['status']=='succeeded' and len(fake.git.blobs)>before
    assert fake.git.refs['heads/main']==BASE
    assert len(fake.git.blobs)-before<6  # Reuse unchanged build assets.
    with pytest.raises(BusinessError):app.workflow.github.status(owner,wid)
    # Teaching exports exclude private conversations, even in the private repository.
    assert all(b'private-original' not in data for data in fake.git.blobs.values())
    other=app.workflow.collaboration.create(owner,c['id'],{})['id'];drain(app);other_branch=owner+'/'+other
    assert other_branch in [key[6:] for key in fake.git.refs if key.startswith('heads/')]
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True});drain(app)
    assert 'heads/'+branch not in fake.git.refs and 'heads/'+other_branch in fake.git.refs and fake.remote is not None


def test_public_or_foreign_shared_repository_is_never_written(published):
    app,c,p,owner,admin,release,old=published;fake,sync=enable(app)
    fake.remote={'id':999,'owner':{'login':'tests'},'name':NAME,'private':False,'description':MARKER,'default_branch':'main'}
    wid=app.workflow.collaboration.create(CONTRIBUTOR,c['id'],{})['id'];drain(app)
    assert current(app,wid)[0]['status']=='failed'
    assert current(app,wid)[0]['error_code']=='WORKSPACE_REPOSITORY_CHANGED'
    assert not any(method in ('POST','PATCH') and '/git/' in path for method,path in fake.calls)
    fake.remote['private']=True;sync.retry(CONTRIBUTOR,wid,str(current(app,wid)[0]['id']));drain(app)
    assert current(app,wid)[0]['status']=='succeeded'


def test_external_branch_change_blocks_sync_and_cleanup(published):
    app,c,p,owner,admin,release,old=published;fake,sync=enable(app)
    wid=app.workflow.collaboration.create(CONTRIBUTOR,c['id'],{})['id'];drain(app);branch=CONTRIBUTOR+'/'+wid
    fake.git.refs['heads/'+branch]='f'*40
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True});drain(app)
    with app.store.transaction() as db:
        row=db.execute("SELECT t.status,t.error_code FROM shuku_removals r JOIN shuku_tasks t ON t.id=r.task_id WHERE r.resource_id=%s",(wid,)).fetchone()
        assert row['status']=='failed' and row['error_code']=='WORKSPACE_BRANCH_CHANGED'
        assert db.execute('SELECT 1 FROM shuku_courses WHERE id=%s',(wid,)).fetchone()
    assert fake.git.refs['heads/'+branch]=='f'*40


def test_course_creation_queues_app_provisioning_without_identity(workflow):
    app,c,p,owner,admin=workflow;fake,sync=enable(app)
    created=app.store.create_course(owner,{'module_id':c['module_id'],'title':'无 GitHub 账号的新课程'},app.clock(),sync)
    with app.store.transaction() as db:
        assert not db.execute('SELECT 1 FROM shuku_github_identities WHERE user_id=%s',(owner,)).fetchone()
        assert db.execute("SELECT 1 FROM shuku_tasks WHERE kind='github.provision' AND resource_key=%s",('course:'+created['id'],)).fetchone()
