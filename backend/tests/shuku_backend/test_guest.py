from uuid import uuid4
from test_http import api,login


def test_guest_entry_expires_existing_account_without_creating_user(api):
    request,app=api
    cookie=login(request,'admin')
    with app.store.transaction() as db:before=db.execute('SELECT count(*) AS n FROM shuku_users').fetchone()['n']
    assert request('POST','/auth/guest',{},cookie=cookie,origin='https://other')[0]==403
    assert request('GET','/auth/me',cookie=cookie)[0]==200
    code,body,expired=request('POST','/auth/guest',{},cookie=cookie)
    assert code==200 and body=={'guest':True} and 'Max-Age=0' in expired
    assert request('GET','/auth/me',cookie=cookie)[0]==401
    assert request('GET','/public/courses')[0]==200
    for path in ['/courses','/review-inbox','/profile','/personal','/messages']:
        assert request('GET',path)[0]==401
    with app.store.transaction() as db:assert db.execute('SELECT count(*) AS n FROM shuku_users').fetchone()['n']==before
    assert request('POST','/auth/guest',{'user_id':'admin'})[0]==400
    assert request('POST','/auth/guest',{})[0]==200
    assert request('GET','/auth/me',cookie=login(request,'xiaoman'))[0]==200


def test_guests_cannot_create_contribute_edit_publish_or_mutate_personal_data(api):
    request,app=api
    cid=str(uuid4());wid=str(uuid4())
    request('POST','/auth/guest',{})
    paths=['/courses',f'/courses/{cid}/workspaces',f'/courses/{cid}/revisions',f'/courses/{cid}/submit',f'/courses/{cid}/publish',f'/workspaces/{wid}/submit',f'/courses/{cid}/remove',f'/courses/{cid}/visibility','/profile','/personal/favorites','/personal/study','/messages/read-all','/github/identity/start']
    for path in paths:
        code,_,_=request('POST',path,{},cookie='shuku_idl_session='+'f'*64,extra={'X-Shuku-Guest':'1','X-Shuku-Account':'admin'})
        assert code==401,path
    with app.store.transaction() as db:
        assert db.execute('SELECT count(*) AS n FROM shuku_courses').fetchone()['n']==0
