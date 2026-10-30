from uuid import uuid4
import pytest
from shuku_backend.adapters.jianlun import JianlunIdentityResult
from shuku_backend.errors import BusinessError
from test_http import api,login


def test_jianlun_result_preserves_uuid_and_keeps_token_out_of_repr():
    uid=str(uuid4());value=JianlunIdentityResult.from_response({'user_id':123,'user_name':'课程作者','uuid':uid,'token':'private-upstream-token'})
    assert (value.user_id,value.user_name,value.uuid)==('123','课程作者',uid)
    assert value.token=='private-upstream-token' and value.token not in repr(value)
    for bad in [{},{'user_id':123,'user_name':'name','uuid':'bad','token':'private-upstream-token'}]:
        with pytest.raises(BusinessError):JianlunIdentityResult.from_response(bad)


def test_reserved_phone_routes_never_simulate_sms_or_grant_a_session(api):
    request,app=api
    phone='13800138000'
    for path,body in [('/auth/sms-code',{'phone':phone}),('/auth/phone-login',{'method':'sms','phone':phone,'code':'123456'}),('/auth/phone-login',{'method':'password','phone':phone,'password':'anything'})]:
        status,data,cookie=request('POST',path,body)
        assert status==503 and data['code']=='JIANLUN_NOT_CONNECTED' and not cookie
    assert request('GET','/auth/me')[0]==401
    with app.store.transaction() as db:assert db.execute('SELECT count(*) AS n FROM shuku_sessions').fetchone()['n']==0
    assert request('POST','/auth/sms-code',{'phone':'123'})[0]==400
    assert request('POST','/auth/sms-code',{'phone':phone},origin='https://other')[0]==403
    assert request('POST','/auth/phone-login',{'method':'sms','phone':phone,'code':'123456','uuid':str(uuid4())})[0]==400
    assert request('POST','/auth/phone-login',{'method':'sms','phone':phone,'code':'bad'})[0]==400
    assert request('POST','/auth/phone-login',{'method':'password','phone':phone,'password':''})[0]==400
    cookie=login(request,'xiaoman')
    assert request('GET','/auth/me',cookie=cookie)[0]==200
