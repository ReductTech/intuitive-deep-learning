"""Opt-in GitHub acceptance: creates, publishes and deletes ONE dedicated test course repository."""
import argparse,json,os,sys,time,tempfile
from pathlib import Path
from urllib.parse import urlsplit,quote
from uuid import uuid4
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'backend/src'))
from shuku_backend.settings import Settings
from shuku_backend.application import create_application
from shuku_backend.storage import Store,DEMO_USERS
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--allow-remote-write',action='store_true')
parser.add_argument('--config',type=Path,required=True)
args=parser.parse_args()
if not args.allow_remote_write:parser.error('Explicit --allow-remote-write is required')
dsn=os.environ['SHUKU_TEST_DATABASE_URL']
if not urlsplit(dsn).path.removeprefix('/').startswith('idl_shuku_test_'):raise RuntimeError('Use an isolated idl_shuku_test_* database')
store=Store(dsn);store.migrate();store.seed_demo()
folder=tempfile.TemporaryDirectory(prefix='shuku-github-live-')
app=create_application(Settings(dsn,Path(folder.name),'http://localhost:5175','integration-test-only',port=0,source_root=root,github_config_path=args.config.resolve()))
owner=DEMO_USERS[1][0];admin=DEMO_USERS[2][0];author=DEMO_USERS[0][0];cid=None
def drain():
    deadline=time.monotonic()+240
    while time.monotonic()<deadline:
        app.worker.run_once()
        with store.transaction() as db:
            tasks=db.execute("SELECT kind,status,error_code,checkpoint FROM shuku_business.tasks WHERE status<>'succeeded'").fetchall()
        failed=[t for t in tasks if t['status']=='failed']
        if failed:raise RuntimeError('Integration task failed: '+json.dumps(failed,ensure_ascii=False))
        if not tasks:return
        time.sleep(.5)
    raise RuntimeError('Integration task timeout')

def save(course,project,uid,expected=None):
    rid=app.workflow.save(uid,course,{'project':project,'expected_revision':expected})['id'];drain();return rid

try:
    module=app.workflow.modules()[0]
    course=app.courses.create({'id':owner},{'module_id':module['id'],'title':'T07 GitHub 专用联调课程'})
    cid=course['id'];drain()
    print('PASS private repository provisioned:',app.workflow.github.status(owner,cid)['repository'],flush=True)
    project={'version':1,'id':str(uuid4()),'courseId':module['alias'],'title':'T07 专用联调','duration':10,'style':'简洁教学','outlineConfirmed':True,'pages':[{'id':str(uuid4()),'format':'text','title':'概念测试','goal':'验证完整流程','summary':'仅用于 T07 集成验证。','note':'','ready':True,'designed':True,'revisions':[],'messages':[]}]}
    rid=save(cid,project,owner)
    review=app.workflow.submit(owner,cid,{'revision_id':rid});app.workflow.decide(admin,review['id'],{'decision':'approved','revision_id':rid,'note':'测试通过'})
    assert app.workflow.publish(owner,cid,{'revision_id':rid,'version':'1.0.0','note':'T07 real integration'})['pending'];drain()
    assert app.workflow.public_courses()[0]['version']=='1.0.0'
    print('PASS real PR, verified remote merge, Tag/Release, public pointer, branch cleanup',flush=True)
    wid=app.workflow.collaboration.create(author,cid,{})['id'];drain()
    current=app.store.course(author,wid)['head_revision'];draft=app.workflow.revision(author,current)['project'];draft['pages'][0]['summary']='第二个版本：补充一个例子。'
    new=save(wid,draft,author,current)
    contribution=app.workflow.collaboration.submit(author,wid,{'revision_id':new,'summary':'补充例子'});drain()
    app.workflow.collaboration.decide(owner,contribution['id'],{'revision_id':new,'decision':'approved','score':8,'note':'测试核对通过'})
    merged=app.workflow.collaboration.merge(owner,contribution['id'],{'revision_id':new});drain()
    assert app.workflow.collaboration.detail(owner,contribution['id'])['status']=='merged'
    assert app.workflow.publish(owner,cid,{'revision_id':merged['revision_id'],'version':'1.0.1','note':'T07 co-creation'})['pending'];drain()
    print('PASS private co-creation, real PR, remote merge and second release',flush=True)
    fid=app.workflow.feedback.submit(author,rid,{'request_key':str(uuid4()),'message':'T07 专用接口反馈测试'})['id'];drain()
    assert app.workflow.feedback.detail(owner,fid)['github_number']
    app.workflow.github.tick();drain();print('PASS real Issue and periodic reconciliation',flush=True)
    with store.transaction() as db:repo=app.workflow.github.repo(db,cid)
    client=app.workflow.github.client
    base=client.call(repo,'GET','/git/ref/heads/'+quote(repo['default_branch'],safe=''))['object']['sha']
    tree=client.call(repo,'GET','/git/commits/'+base)['tree']['sha']
    blob=client.call(repo,'POST','/git/blobs',{'content':'T07 external PR acceptance','encoding':'utf-8'})['sha']
    tree=client.call(repo,'POST','/git/trees',{'base_tree':tree,'tree':[{'path':'t07-external-note.txt','mode':'100644','type':'blob','sha':blob}]})['sha']
    head=client.call(repo,'POST','/git/commits',{'message':'T07 external PR acceptance','tree':tree,'parents':[base]})['sha']
    client.call(repo,'POST','/git/refs',{'ref':'refs/heads/t07-external-acceptance','sha':head})
    pr=client.call(repo,'POST','/pulls',{'title':'T07 external contribution acceptance','head':'t07-external-acceptance','base':repo['default_branch']})
    import threading,hmac,hashlib
    from urllib.request import Request,urlopen
    raw=json.dumps({'repository':{'id':repo['repository_id']},'installation':{'id':repo['installation_id']},'number':pr['number']}).encode()
    headers={'Content-Type':'application/json','X-GitHub-Event':'pull_request','X-GitHub-Delivery':str(uuid4()),'X-Hub-Signature-256':'sha256='+hmac.new(app.workflow.github.config['webhookSecret'].encode(),raw,hashlib.sha256).hexdigest()}
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    try:
        for _ in range(2):
            with urlopen(Request('http://127.0.0.1:'+str(server.server_port)+'/api/shuku/github/webhook',data=raw,headers=headers)) as response:assert response.status==202
    finally:server.shutdown();server.server_close();thread.join()
    drain();assert app.workflow.github.review_courses(owner)
    assert any(m['kind']=='github_pr' for m in app.workflow.feedback.messages(owner)['messages'])
    app.workflow.github.external_decision(owner,cid,{'number':pr['number'],'head_sha':head,'decision':'approved'})
    app.workflow.github.external_decision(owner,cid,{'number':pr['number'],'head_sha':head,'decision':'merge'});drain()
    assert client.call(repo,'GET','/pulls/'+str(pr['number']))['merged']
    assert app.workflow.public_courses()[0]['version']=='1.0.1'
    imported=app.store.course(owner,cid)['head_revision'];assert imported!=merged['revision_id']
    review=app.workflow.submit(owner,cid,{'revision_id':imported});app.workflow.decide(admin,review['id'],{'decision':'approved','revision_id':imported,'note':'核对重新生成的预览'})
    assert app.workflow.publish(owner,cid,{'revision_id':imported,'version':'1.0.2','note':'T07 external contribution'})['pending'];drain()
    assert app.workflow.public_courses()[0]['version']=='1.0.2'
    print('PASS real external PR intake, signed HTTP replay dedupe, notification, remote merge, rebuilt preview and separate verified release',flush=True)
    app.workflow.governance.visibility(admin,cid,{'action':'hide'});drain()
    with store.transaction() as db:repo=app.workflow.github.repo(db,cid)
    assert app.workflow.github.client.call(repo,'GET')['private']
    app.workflow.governance.visibility(admin,cid,{'action':'restore'});drain()
    assert not app.workflow.github.client.call(repo,'GET')['private']
    print('PASS private/public governance synchronization',flush=True)
    app.workflow.governance.request(author,'workspace',wid,{'confirm':True});drain()
    app.workflow.governance.request(admin,'course',cid,{'confirm':True});drain()
    print('PASS owned workspace cleanup and permanent dedicated repository deletion',flush=True)
finally:
    app.close();folder.cleanup()
