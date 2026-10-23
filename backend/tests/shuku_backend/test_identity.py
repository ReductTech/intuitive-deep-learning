from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import pytest
from shuku_backend.adapters.identity import DemoIdentity
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS


def hashed(token):return sha256(token.encode()).hexdigest()


def test_demo_login_rotation_restart_logout_expiry(store):
    store.seed_demo();provider=DemoIdentity(store,"test-password")
    user,token=provider.login(" LINZHI ","test-password","peer","",1000)
    assert user['id']==DEMO_USERS[0][0] and user['role']=='learner'
    assert store.session_user(hashed(token),1001)==user
    # A restarted provider has a new password salt; durable sessions remain usable.
    restarted=DemoIdentity(store,"test-password")
    _,second=restarted.login("xiaoman","test-password","peer",hashed(token),1002)
    with pytest.raises(BusinessError):store.session_user(hashed(token),1003)
    assert store.session_user(hashed(second),1003)['username']=='xiaoman'
    with pytest.raises(BusinessError):store.session_user(hashed(second),1002+43200)
    store.remove_session(hashed(second))
    with pytest.raises(BusinessError):store.session_user(hashed(second),1003)
    with store.transaction() as db:
        assert not db.execute("SELECT 1 FROM shuku_business.sessions WHERE token_hash=%s",(second,)).fetchone()


def test_failed_attempts_persist_and_limit_concurrent_logins(store):
    store.seed_demo();provider=DemoIdentity(store,"test-password")
    def attempt(_):
        try:provider.login("linzhi","wrong","peer","",1000)
        except BusinessError as error:return error.status
    with ThreadPoolExecutor(max_workers=3) as pool:
        outcomes=list(pool.map(attempt,range(12)))
    assert sorted(outcomes)==[401]*10+[429]*2
    with pytest.raises(BusinessError) as error:provider.login("linzhi","test-password","peer","",1001)
    assert error.value.status==429
    assert provider.login("linzhi","test-password","peer","",1061)[0]['username']=='linzhi'


def test_unknown_user_inactive_user_and_bad_input(store):
    store.seed_demo();provider=DemoIdentity(store,"test-password")
    for username,password in [('missing','test-password'),('linzhi','wrong')]:
        with pytest.raises(BusinessError) as error:provider.login(username,password,'peer','',1000)
        assert error.value.code=='INVALID_CREDENTIALS'
    _,token=provider.login('linzhi','test-password','peer','',1000)
    with store.transaction() as db:db.execute("UPDATE shuku_business.users SET active=false WHERE username='linzhi'")
    with pytest.raises(BusinessError):store.session_user(hashed(token),1001)
    with pytest.raises(BusinessError):provider.login('linzhi','test-password','peer','',1000)
    with pytest.raises(BusinessError) as error:provider.login({},'password','peer','',1000)
    assert error.value.status==400


def test_concurrent_success_keeps_accounts_stable(store):
    store.seed_demo();provider=DemoIdentity(store,'test-password')
    with ThreadPoolExecutor(max_workers=3) as pool:
        results=list(pool.map(lambda _:provider.login('xiaoman','test-password','same-peer','',1000),range(3)))
    assert {user['id'] for user,token in results}=={DEMO_USERS[1][0]}
    assert len({token for user,token in results})==3
    for user,token in results:assert store.session_user(hashed(token),1001)['id']==user['id']
