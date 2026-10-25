"""Provider contracts + MySQL transactions; no external credentials required."""
import copy
import hashlib
import hmac
import json
from uuid import uuid4
from urllib.parse import unquote,parse_qs,urlsplit
import pytest
from shuku_backend.github_sync import GitHubSync
from shuku_backend.adapters.github import GitHubError,blob_sha
from shuku_backend.errors import BusinessError
from test_workflow import workflow,save_ready,approve
from test_collaboration import workspace,suggestion,accept,CONTRIBUTOR

BASE='1'*40


class FakeGitHub:
    def __init__(self):
        self.meta={'id':987,'name':'integration-test','owner':{'login':'tests'},'full_name':'tests/integration-test','default_branch':'main','private':True}
        self.refs={'heads/main':BASE};self.trees={'base-tree':[]};self.commits={BASE:{'sha':BASE,'tree':{'sha':'base-tree'},'parents':[]}}
        self.pulls=[];self.releases={};self.issues=[];self.calls=[];self.fail_after=None;self.blobs={}

    def call(self,repo,method,path='',data=None,missing=False):
        self.calls.append((method,path,copy.deepcopy(data)))
        result=self.dispatch(method,path,data,missing)
        if self.fail_after and self.fail_after==(method,urlsplit(path).path):
            self.fail_after=None;raise GitHubError()
        return copy.deepcopy(result)

    def dispatch(self,method,path,data,missing):
        parsed=urlsplit(path);path=unquote(parsed.path);query=parse_qs(parsed.query)
        if path=='':
            if method=='DELETE':self.meta=None;return {}
            if method=='PATCH':self.meta.update(data)
            return self.meta
        if path.startswith('/git/ref/'):
            key=path[len('/git/ref/'):];sha=self.refs.get(key)
            if not sha:
                if missing:return None
                raise GitHubError(404)
            return {'object':{'sha':sha,'type':'commit'}}
        if path=='/git/refs':
            self.refs[data['ref'][5:]]=data['sha'];return {'object':{'sha':data['sha'],'type':'commit'}}
        if path.startswith('/git/refs/'):
            self.refs.pop(path[len('/git/refs/'):],None);return {}
        if path=='/git/blobs':
            content=__import__('base64').b64decode(data['content']);sha=blob_sha(content);self.blobs[sha]=content;return {'sha':sha}
        if path.startswith('/git/blobs/'):
            sha=path.split('/')[-1];content=self.blobs[sha];return {'sha':sha,'size':len(content),'encoding':'base64','content':__import__('base64').b64encode(content).decode()}
        if path.startswith('/git/trees/'):
            return {'tree':self.trees[path.split('/')[-1]],'truncated':False}
        if path=='/git/trees':
            tree={v['path']:v for v in self.trees[data['base_tree']]}
            for entry in data['tree']:
                if entry['sha']:tree[entry['path']]=entry
                else:tree.pop(entry['path'],None)
            sha=hashlib.sha1(json.dumps(tree,sort_keys=True).encode()).hexdigest();self.trees[sha]=list(tree.values());return {'sha':sha}
        if path.startswith('/git/commits/'):return self.commits[path.split('/')[-1]]
        if path=='/git/commits':
            sha=hashlib.sha1(json.dumps(data,sort_keys=True).encode()).hexdigest()
            self.commits[sha]={'sha':sha,'tree':{'sha':data['tree']},'parents':[{'sha':s} for s in data['parents']]};return {'sha':sha}
        if path=='/pulls':
            if method=='GET':
                head=query.get('head',[None])[0]
                return [p for p in self.pulls if not head or head.endswith(':'+p['head']['ref'])]
            sha=self.refs['heads/'+data['head']];p={'number':len(self.pulls)+1,'title':data['title'],'body':data['body'],'user':{'login':'author'},'state':'open','merged':False,'head':{'sha':sha,'ref':data['head'],'repo':self.meta},'base':{'sha':self.refs['heads/main'],'ref':'main','repo':self.meta}}
            self.pulls.append(p);return p
        if path.startswith('/pulls/'):
            parts=path.split('/');p=self.pulls[int(parts[2])-1]
            if len(parts)>3:
                assert data['sha']==p['head']['sha'];sha=hashlib.sha1((p['head']['sha']+'merge').encode()).hexdigest()
                self.commits[sha]={'sha':sha,'parents':[{'sha':self.refs['heads/main']},{'sha':p['head']['sha']}],'tree':self.commits[p['head']['sha']]['tree']}
                self.refs['heads/main']=sha;p.update(merged=True,state='closed',merge_commit_sha=sha);return {'merged':True,'sha':sha}
            if method=='PATCH':p.update(data)
            return p
        if path.startswith('/compare/'):return {'status':'identical'}
        if path.startswith('/releases/tags/'):return self.releases.get(path.split('/')[-1])
        if path=='/releases':
            self.releases[data['tag_name']]={**data,'id':len(self.releases)+1};return self.releases[data['tag_name']]
        if path=='/issues':
            if method=='GET':return self.issues
            result={**data,'number':len(self.issues)+1,'state':'open'};self.issues.append(result);return result
        if path.startswith('/issues/'):return self.issues[int(path.split('/')[-1])-1]
        raise AssertionError((method,path,data))


@pytest.fixture
def connected(workflow):
    app,c,p,owner,admin=workflow;fake=FakeGitHub()
    sync=GitHubSync(app.workflow,{'webhookSecret':'test-webhook'},fake);app.workflow.github=sync
    app.worker.handlers['github.sync']=sync.run
    sync.bind(admin,c['id'],{'repository_id':987,'owner':'tests','name':'integration-test','installation_id':123,'allow_destroy':True})
    revision=save_ready(app,c,p,owner)
    return app,c,p,owner,admin,fake,sync,revision


def drain(app,limit=15):
    for _ in range(limit):
        if not app.worker.run_once():break


def first_release(context):
    app,c,p,owner,admin,fake,sync,revision=context
    approve(app,c,revision,owner,admin)
    result=app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0','note':'首版'})
    assert result['pending'];drain(app)
    with app.store.transaction() as db:
        state=db.execute('SELECT status FROM shuku_tasks WHERE kind=%s',('github.sync',)).fetchall()
    assert all(row['status']=='succeeded' for row in state),state
    assert app.workflow.public_courses()[0]['version']=='1.0.0'


def test_remote_release_verified_before_local_public_pointer_and_branch_cleanup(connected):
    first_release(connected)
    app,c,p,owner,admin,fake,sync,revision=connected
    assert len(fake.pulls)==1 and fake.pulls[0]['merged']
    assert fake.refs['tags/v1.0.0']==fake.pulls[0]['merge_commit_sha']
    assert not any(k.startswith('heads/shuku-review/') for k in fake.refs)
    assert fake.meta['private'] is False
    assert all('private-' not in str(call) for call in fake.calls)


def test_only_changed_files_upload_and_local_merge_waits_for_remote_truth(connected):
    first_release(connected)
    app,c,p,owner,admin,fake,sync,revision=connected
    wid,initial=workspace(app,c);k,saved=suggestion(app,wid,initial);drain(app)
    accept(app,k,owner)
    result=app.workflow.collaboration.merge(owner,k['id'],{'revision_id':saved['id']})
    assert result['status']=='merging'
    # The build queues a remote merge, defers, then remote merge can execute.
    assert app.worker.run_once();assert app.worker.run_once()
    with app.store.transaction() as db:
        row=db.execute('SELECT status FROM shuku_contributions WHERE id=%s',(k['id'],)).fetchone()
        assert row['status']=='merging'
        db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app)
    assert app.workflow.collaboration.detail(owner,k['id'])['status']=='merged'
    # Official revision retains GitHub mapping even after private source removal.
    app.workflow.governance.request(CONTRIBUTOR,'workspace',wid,{'confirm':True});drain(app)
    released=app.workflow.publish(owner,c['id'],{'revision_id':result['revision_id'],'version':'1.0.1','note':'更新'})
    assert released['pending'];drain(app)
    assert app.workflow.public_courses()[0]['version']=='1.0.1'
    assert len(fake.pulls)==2  # Publishing a merge never creates another PR.


@pytest.mark.parametrize('failure',[('POST','/pulls'),('PUT','/pulls/1/merge'),('POST','/releases')])
def test_ambiguous_timeout_reconciles_without_duplicate_remote_writes(connected,failure):
    app,c,p,owner,admin,fake,sync,revision=connected
    approve(app,c,revision,owner,admin);fake.fail_after=failure
    result=app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0','note':'首版'})
    app.worker.run_once()
    assert app.workflow.public_courses()==[]
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app)
    assert app.workflow.public_courses()[0]['version']=='1.0.0'
    assert len(fake.pulls)==len(fake.releases)==1


def test_foreign_tag_blocks_release_and_preserves_old_public_version(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    approve(app,c,revision,owner,admin);fake.refs['tags/v1.0.0']='9'*40
    app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    drain(app)
    assert app.workflow.public_courses()==[] and fake.refs['tags/v1.0.0']=='9'*40


def test_restore_unpublished_course_keeps_repository_private(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    app.workflow.governance.visibility(admin,c['id'],{'action':'hide'});drain(app)
    app.workflow.governance.visibility(admin,c['id'],{'action':'restore'});drain(app)
    assert fake.meta['private'] is True and not app.workflow.public_courses()


def test_concurrent_versions_and_edits_are_blocked_during_remote_publication(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    approve(app,c,revision,owner,admin)
    first=app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    assert first==app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    with pytest.raises(BusinessError) as error:app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.1'})
    assert error.value.code=='RELEASE_BUSY'
    with pytest.raises(BusinessError):app.workflow.save(owner,c['id'],{'project':p,'expected_revision':revision['id']})


def test_webhook_signature_replay_repository_scope_and_timer_deduplication(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    raw=json.dumps({'repository':{'id':987},'installation':{'id':123}}).encode()
    headers={'X-GitHub-Delivery':str(uuid4()),'X-GitHub-Event':'pull_request','X-Hub-Signature-256':'sha256='+hmac.new(b'test-webhook',raw,hashlib.sha256).hexdigest()}
    with pytest.raises(BusinessError):sync.webhook({**headers,'X-Hub-Signature-256':'bad'},raw)
    sync.webhook(headers,raw);sync.webhook(headers,raw)
    with pytest.raises(BusinessError):sync.webhook(headers,raw+b' ')
    sync.tick();sync.tick()
    assert len(sync.status(owner,c['id'])['jobs'])==2
    drain(app)
    with pytest.raises(BusinessError):sync.status(CONTRIBUTOR,c['id'])


def test_feedback_issue_retry_and_external_state_reconciliation(connected):
    first_release(connected)
    app,c,p,owner,admin,fake,sync,revision=connected
    fake.fail_after=('POST','/issues')
    fid=app.workflow.feedback.submit(CONTRIBUTOR,revision['id'],{'request_key':str(uuid4()),'message':'公式需要核对'})['id']
    drain(app)
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app);assert len(fake.issues)==1
    assert app.workflow.feedback.detail(owner,fid)['github_number']==1
    fake.issues[0]['state']='closed';sync.tick();drain(app)
    detail=app.workflow.feedback.detail(owner,fid)
    assert detail['github_state']=='closed' and detail['status']=='open'  # GitHub state never silently overrides a manager reply.


def test_remote_delete_failure_keeps_local_records_and_retry_finishes(connected):
    first_release(connected)
    app,c,p,owner,admin,fake,sync,revision=connected
    # Explicitly disable destructive authority: local cleanup must not precede remote validation.
    with app.store.transaction() as db:db.execute('UPDATE shuku_github_repositories SET allow_destroy=false')
    receipt=app.workflow.governance.request(admin,'course',c['id'],{'confirm':True});app.worker.run_once()
    with app.store.transaction() as db:
        assert db.execute('SELECT id FROM shuku_courses WHERE id=%s',(c['id'],)).fetchone()
        db.execute('UPDATE shuku_github_repositories SET allow_destroy=true')
        db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app)
    assert fake.meta is None
    with app.store.transaction() as db:assert not db.execute('SELECT id FROM shuku_courses WHERE id=%s',(c['id'],)).fetchone()


def test_new_content_upload_uses_git_blob_hash_and_deletion_entries(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    with app.store.transaction() as db:
        row=db.execute('SELECT * FROM shuku_revisions WHERE id=%s',(revision['id'],)).fetchone()
    files=sync.export(row);fake.trees['base-tree']=[{'path':name,'sha':blob_sha(content),'type':'blob','mode':'100644'} for name,content in files.items()]
    fake.trees['base-tree'].append({'path':'courses/old.txt','sha':'f'*40,'type':'blob','mode':'100644'})
    approve(app,c,revision,owner,admin);app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0'});drain(app)
    assert not any(method=='POST' and path=='/git/blobs' for method,path,_ in fake.calls)
    entries=next(data['tree'] for method,path,data in fake.calls if method=='POST' and path=='/git/trees')
    assert entries==[{'path':'courses/old.txt','mode':'100644','type':'blob','sha':None}]


def test_external_pull_notifies_managers_once_and_new_head_invalidates_approval(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    pr={'number':20,'title':'外部课程建议','user':{'login':'external'},'state':'open','head':{'sha':'a'*40,'ref':'external','repo':{'id':888}},'base':{'sha':BASE,'ref':'main','repo':fake.meta}}
    fake.pulls.append(pr);sync.tick();drain(app)
    assert len(app.workflow.feedback.messages(owner)['messages'])==1
    assert not app.workflow.feedback.messages(CONTRIBUTOR)['messages']
    assert sync.review_courses(owner)[0]['id']==c['id']
    with pytest.raises(BusinessError):sync.external_decision(CONTRIBUTOR,c['id'],{'number':20,'head_sha':'a'*40,'decision':'approved'})
    sync.external_decision(owner,c['id'],{'number':20,'head_sha':'a'*40,'decision':'approved'})
    fake.pulls[0]['head']['sha']='b'*40
    with app.store.transaction() as db:sync.queue(db,c['id'],'reconcile','new-head',{},owner)
    drain(app)
    assert sync.status(owner,c['id'])['external_prs'][0]['review_state']=='pending'
    assert len(app.workflow.feedback.messages(owner)['messages'])==2
    with pytest.raises(BusinessError):sync.external_decision(owner,c['id'],{'number':20,'head_sha':'a'*40,'decision':'merge'})
    assert not any(method=='DELETE' for method,_,_ in fake.calls)
    with app.store.transaction() as db:
        db.execute('UPDATE shuku_users SET active=false WHERE id=%s',(owner,))
        sync.queue(db,c['id'],'reconcile','fallback-manager',{},admin)
    fake.pulls[0]['head']['sha']='c'*40;drain(app)
    assert app.workflow.feedback.messages(admin)['messages'][0]['kind']=='github_pr'


def test_jwt_rs256_and_transport_does_not_follow_redirects_or_leak_token(tmp_path):
    from shuku_backend.adapters.github import GitHub
    from cryptography.hazmat.primitives.asymmetric import rsa,padding
    from cryptography.hazmat.primitives import serialization,hashes
    import base64
    key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    path=tmp_path/'test.pem';path.write_bytes(key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()))
    client=GitHub('123',path,lambda:1000);token=client.jwt();header,payload,signature=token.split('.')
    decode=lambda value:base64.urlsafe_b64decode(value+'='*(-len(value)%4))
    assert json.loads(decode(payload))=={'iat':940,'exp':1480,'iss':'123'}
    key.public_key().verify(decode(signature),(header+'.'+payload).encode(),padding.PKCS1v15(),hashes.SHA256())
    from urllib.error import HTTPError
    class Transport:
        def open(self,request,timeout):
            assert request.full_url=='https://api.github.com/test' and timeout==8
            assert request.headers['Authorization']=='Bearer secret-test-only'
            raise HTTPError(request.full_url,302,'secret-test-only',{},None)
    client.opener=Transport()
    with pytest.raises(GitHubError) as error:client.request('GET','/test','secret-test-only')
    assert 'secret-test-only' not in str(error.value)


from test_http import api,login


def test_http_webhook_accepts_signed_body_without_cookie_but_rejects_unsigned_and_csrf(api):
    request,app=api;app.workflow.github.config={'webhookSecret':'test-webhook'}
    body={'repository':{'id':987},'installation':{'id':123}}
    raw=json.dumps(body).encode();headers={'X-GitHub-Delivery':str(uuid4()),'X-GitHub-Event':'pull_request','X-Hub-Signature-256':'sha256='+hmac.new(b'test-webhook',raw,hashlib.sha256).hexdigest()}
    assert request('POST','/github/webhook',body,origin='',extra=headers)[0]==202
    assert request('POST','/github/webhook',body,origin='')[0]==403
    admin=login(request,'admin')
    assert request('POST','/courses/'+str(uuid4())+'/github/provision',{},cookie=admin,origin='https://other')[0]==403


def test_external_merge_is_verified_but_does_not_publish_untrusted_content(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    head='a'*40
    remote=copy.deepcopy(p);remote['pages'][0]['summary']='来自外部 PR 的新内容'
    content=json.dumps(remote).encode();sha=blob_sha(content);fake.blobs[sha]=content
    fake.trees['external-tree']=[{'path':'courses/project.json','sha':sha,'type':'blob','mode':'100644'}]
    fake.commits[head]={'sha':head,'tree':{'sha':'external-tree'},'parents':[{'sha':BASE}]}
    fake.pulls.append({'number':1,'title':'外部建议','user':{'login':'external'},'state':'open','merged':False,'head':{'sha':head,'ref':'contributors-work','repo':{'id':888}},'base':{'sha':BASE,'ref':'main','repo':fake.meta}})
    sync.tick();drain(app)
    sync.external_decision(owner,c['id'],{'number':1,'head_sha':head,'decision':'approved'})
    queued=sync.external_decision(owner,c['id'],{'number':1,'head_sha':head,'decision':'merge'})
    fake.fail_after=('PUT','/pulls/1/merge');drain(app)
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET available_at=0 WHERE status='queued'")
    drain(app)
    assert sync.status(owner,c['id'])['external_prs'][0]['review_state']=='merged'
    assert not app.workflow.public_courses()
    assert not any(method=='DELETE' for method,_,_ in fake.calls)
    imported=app.store.course(owner,c['id'])['head_revision']
    assert imported!=revision['id'] and app.workflow.revision(owner,imported)['project']['pages'][0]['summary']=='来自外部 PR 的新内容'
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_tasks SET status='failed' WHERE id=(SELECT task_id FROM shuku_github_jobs WHERE id=%s)",(queued['job_id'],))
    sync.retry(owner,c['id'],queued['job_id']);drain(app)
    assert app.store.course(owner,c['id'])['head_revision']==imported
    approve(app,c,app.workflow.revision(owner,imported),owner,admin)
    assert app.workflow.publish(owner,c['id'],{'revision_id':imported,'version':'1.0.0'})['pending'];drain(app)
    assert app.workflow.public_courses()[0]['revision_id']==imported
    assert len(fake.pulls)==2  # Compile and verify the runtime separately; never publish stale remote JS.


def test_external_executable_changes_are_rejected_before_remote_merge(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    head='a'*40;fake.trees['external-tree']=[{'path':'courses/bundle.js','sha':'b'*40,'type':'blob','mode':'100644'}]
    fake.commits[head]={'sha':head,'tree':{'sha':'external-tree'},'parents':[{'sha':BASE}]}
    fake.pulls.append({'number':1,'title':'不受支持的源码修改','user':{'login':'external'},'state':'open','merged':False,'head':{'sha':head,'ref':'external-code','repo':{'id':888}},'base':{'sha':BASE,'ref':'main','repo':fake.meta}})
    sync.tick();drain(app)
    sync.external_decision(owner,c['id'],{'number':1,'head_sha':head,'decision':'approved'})
    sync.external_decision(owner,c['id'],{'number':1,'head_sha':head,'decision':'merge'});drain(app)
    assert not fake.pulls[0]['merged']
    assert app.store.course(owner,c['id'])['head_revision']==revision['id']


def test_deletion_recovers_repository_created_before_a_lost_binding(workflow):
    app,c,p,owner,admin=workflow
    class ProvisionGitHub:
        def __init__(self):self.remote=None;self.fail=True
        def installation_call(self,installation,method,path,data=None,missing=False):
            if method=='POST':
                self.remote={**data,'id':988,'owner':{'login':'tests'},'default_branch':'main'}
                if self.fail:self.fail=False;raise GitHubError()
            if method=='DELETE':self.remote=None
            return self.remote
    fake=ProvisionGitHub();sync=GitHubSync(app.workflow,{'owner':'tests','installationId':123},fake)
    app.workflow.github=sync;app.worker.handlers['github.provision']=sync.provision
    sync.provision_request(owner,c['id']);app.worker.run_once()
    assert fake.remote
    with app.store.transaction() as db:assert not sync.repo(db,c['id'])
    app.workflow.governance.request(admin,'course',c['id'],{'confirm':True});drain(app)
    assert fake.remote is None
    with app.store.transaction() as db:assert not db.execute('SELECT 1 FROM shuku_courses WHERE id=%s',(c['id'],)).fetchone()


def test_bound_courses_never_fall_back_to_local_publish_without_provider(connected):
    app,c,p,owner,admin,fake,sync,revision=connected
    approve(app,c,revision,owner,admin);sync.client=None
    with pytest.raises(BusinessError) as error:app.workflow.publish(owner,c['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    assert error.value.code=='GITHUB_NOT_CONFIGURED' and not app.workflow.public_courses()
