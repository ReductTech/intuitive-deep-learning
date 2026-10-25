from dataclasses import replace
from pathlib import Path
from uuid import uuid4
import json
import pytest
from cryptography.fernet import Fernet
from shuku_backend.github_identity import GitHubIdentity
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from test_http import api, login


class Device:
    def __init__(self):
        self.result={'access_token':'private-user-token','refresh_token':'private-refresh','expires_in':300}
        self.remote={'id':12345,'login':'octocat'};self.polls=0;self.revoked=[];self.fail_user=False;self.fail_revoke=False
    def start(self):return {'device_code':'private-device-code','user_code':'ABCD-EFGH','interval':5,'expires_in':900}
    def poll(self,code):assert code=='private-device-code';self.polls+=1;return self.result
    def user(self,token):
        if self.fail_user:raise BusinessError(502,'GITHUB_UNAVAILABLE','稍后重试')
        return self.remote
    def refresh(self,token):assert token=='private-refresh';return {'access_token':'refreshed-token','expires_in':300}
    def revoke(self,token):
        if self.fail_revoke:raise BusinessError(502,'GITHUB_UNAVAILABLE','稍后重试')
        self.revoked.append(token)


@pytest.fixture
def binding(store,tmp_path):
    store.seed_demo();clock=[1000.];key=tmp_path/'key';key.write_bytes(Fernet.generate_key());client=Device()
    config={'clientId':'Iv1.test','clientSecretPath':str(tmp_path/'secret')}
    identity=GitHubIdentity(store,lambda:clock[0],config,key,client)
    return identity,client,clock,key,config


def bind(identity,clock,uid):
    flow=identity.action(uid,'start',{});clock[0]+=5
    return flow,identity.action(uid,'poll',{'flow_id':flow['flow_id']})


def test_binding_pending_slowdown_restart_encryption_and_roles(binding):
    identity,client,clock,key,config=binding;uid=DEMO_USERS[0][0]
    assert not identity.status(uid)['connected']
    flow=identity.action(uid,'start',{});assert identity.action(uid,'start',{})==flow
    assert 'device_code' not in json.dumps(flow)
    assert identity.action(uid,'poll',{'flow_id':flow['flow_id']})['pending'] and client.polls==0
    clock[0]+=5;client.result={'error':'slow_down'}
    assert identity.action(uid,'poll',{'flow_id':flow['flow_id']})['interval']==10
    clock[0]+=10;client.result={'error':'authorization_pending'}
    assert identity.action(uid,'poll',{'flow_id':flow['flow_id']})['pending']
    clock[0]+=10;client.result={'access_token':'private-user-token','expires_in':300}
    restored=GitHubIdentity(identity.store,identity.clock,config,key,client)
    result=restored.action(uid,'poll',{'flow_id':flow['flow_id']})
    assert result['complete'] and result['identity']['login']=='octocat' and result['authorized']
    with identity.store.transaction() as db:
        row=db.execute('SELECT credentials FROM shuku_business.github_identities WHERE user_id=%s',(uid,)).fetchone()
        assert 'private-user-token' not in row['credentials']
        assert identity.store.user_in(db,uid)['role']=='creator'
    assert restored.action(uid,'poll',{'flow_id':flow['flow_id']})['complete']
    assert client.polls==3
    # Invalid key fails closed; no plaintext or cross-account decryption fallback.
    wrong=key.with_name('wrong');wrong.write_bytes(Fernet.generate_key())
    wrong_identity=GitHubIdentity(identity.store,identity.clock,config,wrong,client)
    with pytest.raises(BusinessError,match='凭证无法恢复'):wrong_identity.verify(uid)


def test_pending_checkpoint_unique_account_and_cancel(binding):
    identity,client,clock,_,_=binding;owner=DEMO_USERS[1][0];other=DEMO_USERS[2][0]
    flow=identity.action(owner,'start',{});clock[0]+=5;client.fail_user=True
    with pytest.raises(BusinessError):identity.action(owner,'poll',{'flow_id':flow['flow_id']})
    assert client.polls==1
    client.fail_user=False
    assert identity.action(owner,'poll',{'flow_id':flow['flow_id']})['complete'] and client.polls==1
    other_flow=identity.action(other,'start',{});clock[0]+=5
    with pytest.raises(BusinessError) as error:identity.action(other,'poll',{'flow_id':other_flow['flow_id']})
    assert error.value.code=='GITHUB_ALREADY_BOUND'
    assert not identity.status(other)['connected'] and identity.status(owner)['connected']
    identity.action(other,'cancel',{'flow_id':other_flow['flow_id']})
    assert client.revoked==['private-user-token']
    with pytest.raises(BusinessError):identity.action(other,'poll',{'flow_id':other_flow['flow_id']})


def test_revoke_failure_preserves_binding_refresh_and_disconnect(binding):
    identity,client,clock,_,_=binding;uid=DEMO_USERS[0][0]
    bind(identity,clock,uid)
    clock[0]+=260;assert identity.verify(uid)['id']==12345
    client.fail_revoke=True
    with pytest.raises(BusinessError):identity.action(uid,'disconnect',{'confirm':True,'expected_id':12345})
    assert identity.status(uid)['connected']
    client.fail_revoke=False
    with pytest.raises(BusinessError):identity.action(uid,'disconnect',{'confirm':True,'expected_id':99})
    assert identity.action(uid,'disconnect',{'confirm':True,'expected_id':12345})['connected'] is False
    assert client.revoked==['refreshed-token']
    with identity.store.transaction() as db:
        assert identity.store.user_in(db,uid)['role']=='learner'
        assert db.execute('SELECT count(*) AS n FROM shuku_business.github_identity_flows').fetchone()['n']==0


def test_reauthorization_expiry_rejection_and_identity_mismatch(binding):
    identity,client,clock,_,_=binding;uid=DEMO_USERS[2][0]
    flow,_=bind(identity,clock,uid);clock[0]+=60
    second=identity.action(uid,'start',{});clock[0]+=5;client.remote={'id':54321,'login':'other'}
    with pytest.raises(BusinessError) as error:identity.action(uid,'poll',{'flow_id':second['flow_id']})
    assert error.value.code=='GITHUB_ACCOUNT_MISMATCH'
    assert identity.status(uid)['identity']['id']==12345
    with pytest.raises(BusinessError):identity.action(uid,'poll',{'flow_id':flow['flow_id']})
    client.remote={'id':12345,'login':'renamed'}
    assert identity.action(uid,'poll',{'flow_id':second['flow_id']})['identity']['login']=='renamed'
    clock[0]+=900
    third=identity.action(uid,'start',{});clock[0]+=5;client.result={'error':'access_denied'}
    with pytest.raises(BusinessError):identity.action(uid,'poll',{'flow_id':third['flow_id']})
    with pytest.raises(BusinessError):identity.action(uid,'poll',{'flow_id':third['flow_id']})
    assert identity.status(uid)['connected']
    assert not identity.status(uid)['authorized']


def test_reauthorization_revokes_previous_token_and_keeps_admin(binding):
    identity,client,clock,_,_=binding;uid=DEMO_USERS[2][0]
    bind(identity,clock,uid);clock[0]+=60
    client.result={'access_token':'replacement-token','expires_in':300}
    bind(identity,clock,uid)
    assert client.revoked==['private-user-token']
    identity.action(uid,'disconnect',{'confirm':True,'expected_id':12345})
    assert client.revoked[-1]=='replacement-token'
    with identity.store.transaction() as db:assert identity.store.user_in(db,uid)['role']=='admin'


def test_identity_http_requires_login_csrf_and_same_account(api,tmp_path):
    request,app=api
    assert request('GET','/github/identity')[0]==401
    owner=login(request,'xiaoman');other=login(request,'admin')
    uid=DEMO_USERS[1][0];headers={'X-Shuku-Account':uid}
    assert request('GET','/github/identity',cookie=owner)[1]['available'] is False
    assert request('POST','/github/identity/start',{},cookie=owner,extra=headers)[0]==503
    clock=[1000.];key=tmp_path/'key';key.write_bytes(Fernet.generate_key());client=Device()
    app.github_identity=GitHubIdentity(app.store,lambda:clock[0],{'clientId':'test','clientSecretPath':'unused'},key,client)
    assert request('POST','/github/identity/start',{},cookie=owner)[0]==409
    assert request('POST','/github/identity/start',{},cookie=owner,extra=headers,origin='https://evil')[0]==403
    assert request('POST','/github/identity/start',{'github_id':12345},cookie=owner,extra=headers)[0]==400
    code,flow,_=request('POST','/github/identity/start',{},cookie=owner,extra=headers);assert code==200
    clock[0]+=5
    assert request('POST','/github/identity/poll',{'flow_id':flow['flow_id']},cookie=other,extra={'X-Shuku-Account':DEMO_USERS[2][0]})[0]==409
    result=request('POST','/github/identity/poll',{'flow_id':flow['flow_id']},cookie=owner,extra=headers)
    assert result[0]==200 and result[1]['complete']
    assert 'private-' not in json.dumps(result[1])
    assert request('GET','/github/identity',cookie=other)[1]['connected'] is False
    assert request('POST','/github/identity/disconnect',{'confirm':True,'expected_id':12345},cookie=owner,extra=headers)[0]==200


def test_device_transport_uses_fixed_hosts_and_token_only_revocation(tmp_path):
    from shuku_backend.adapters.github_identity import GitHubDevice
    secret=tmp_path/'secret';secret.write_text('private-secret')
    client=GitHubDevice({'clientId':'test','clientSecretPath':str(secret)})
    calls=[]
    client.call=lambda *args,**kwargs:calls.append((args,kwargs)) or {}
    client.start();client.poll('code');client.user('user-token');client.refresh('refresh-token');client.revoke('user-token')
    assert calls[0][0][1]=='https://github.com/login/device/code'
    assert calls[2][0][1]=='https://api.github.com/user'
    assert calls[-1][0][1]=='https://api.github.com/applications/test/token'
    assert calls[-1][0][0]=='DELETE'


def test_transport_fast_failure_and_sanitized_diagnostics(tmp_path,caplog):
    from urllib.error import URLError,HTTPError
    from shuku_backend.adapters.github_identity import GitHubDevice
    from email.message import Message
    client=GitHubDevice({'clientId':'test'})
    class Broken:
        def open(self,request,timeout):
            assert timeout==4
            raise URLError(TimeoutError('private-proxy-password'))
    client.opener=Broken()
    with pytest.raises(BusinessError) as failure:client.start()
    assert failure.value.status==503 and failure.value.code=='GITHUB_TIMEOUT'
    assert 'private-proxy-password' not in caplog.text+str(failure.value)
    assert 'github.com' in caplog.text
    class Limited:
        def open(self,request,timeout):
            headers=Message();headers['Retry-After']='60'
            raise HTTPError(request.full_url,429,'private-token',headers,None)
    client.opener=Limited()
    with pytest.raises(BusinessError) as failure:client.start()
    assert failure.value.status==429 and failure.value.code=='GITHUB_RATE_LIMIT'


def test_network_failure_keeps_flow_for_retry(binding):
    identity,client,clock,_,_=binding;uid=DEMO_USERS[1][0]
    flow=identity.action(uid,'start',{});clock[0]+=5
    original=client.poll
    client.poll=lambda code:(_ for _ in ()).throw(BusinessError(503,'GITHUB_TIMEOUT','连接超时'))
    with pytest.raises(BusinessError):identity.action(uid,'poll',{'flow_id':flow['flow_id']})
    assert identity.action(uid,'start',{})['flow_id']==flow['flow_id']
    client.poll=original
    assert identity.action(uid,'poll',{'flow_id':flow['flow_id']})['complete']
