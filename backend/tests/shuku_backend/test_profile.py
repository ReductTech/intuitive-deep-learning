from test_http import api,login


def test_profile_edit_persistence_isolation_and_validation(api):
    request,app=api
    assert request('GET','/profile')[0]==401
    owner=login(request,'xiaoman');other=login(request,'linzhi')
    original=request('GET','/profile',cookie=owner)[1]
    uid=original['user']['id'];headers={'X-Shuku-Account':uid}
    payload={'display_name':'课程作者','bio':'简介\n第二行','email':'author@example.com'}
    assert original['email']=='' and original['updated_at'] is None
    assert request('POST','/profile',payload,cookie=owner)[0]==409
    assert request('POST','/profile',payload,cookie=owner,extra={'X-Shuku-Account':'other'})[0]==409
    assert request('POST','/profile',payload,cookie=owner,extra=headers,origin='https://other')[0]==403
    code,saved,_=request('POST','/profile',payload,cookie=owner,extra=headers)
    assert code==200 and saved['user']['display_name']=='课程作者'
    assert saved['user']['role']==original['user']['role'] and saved['user']['id']==uid
    assert saved['email']==payload['email'] and saved['bio']==payload['bio'] and saved['updated_at']
    # New login reads PostgreSQL, not a browser cache.
    renewed=login(request,'xiaoman')
    assert request('GET','/profile',cookie=renewed)[1]==saved
    assert request('GET','/auth/me',cookie=renewed)[1]['user']['display_name']=='课程作者'
    assert request('GET','/profile',cookie=other)[1]['email']==''
    for changes in ({'role':'admin'},{'user_id':uid},{'display_name':'  '},{'bio':'a'*501},{'email':'bad address'},{'email':123}):
        assert request('POST','/profile',{**payload,**changes},cookie=renewed,extra=headers)[0]==400
    assert request('GET','/profile',cookie=renewed)[1]==saved
    assert request('POST','/profile',{**payload,'bio':'','email':''},cookie=renewed,extra=headers)[1]['email']==''
