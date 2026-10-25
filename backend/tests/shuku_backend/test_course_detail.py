import json
import threading
from http.client import HTTPConnection
import pytest
from shuku_backend.errors import BusinessError
from test_workflow import workflow,save_ready,approve
from test_collaboration import published,workspace,suggestion,accept


def test_public_detail_current_release_creator_and_contributors(published):
    app,c,p,owner,admin,release,old=published
    first=app.workflow.public_course(c['id'])
    assert first['course']['creator']=='小满'
    assert first['releases'][0]['current'] is True
    assert first['contributors']==[{'name':'小满','score':0,'count':0}]
    wid,initial=workspace(app,c);contribution,revision=suggestion(app,wid,initial);accept(app,contribution,owner)
    merged=app.workflow.collaboration.merge(owner,contribution['id'],{'revision_id':revision['id']});assert app.worker.run_once()
    app.workflow.publish(owner,c['id'],{'revision_id':merged['revision_id'],'version':'1.0.1','note':'补充公开教学例子'})
    detail=app.workflow.public_course(c['id'])
    assert detail['course']['revision_id']==merged['revision_id']
    assert [r['version'] for r in detail['releases']]==['1.0.1','1.0.0']
    assert detail['releases'][0]['note']=='补充公开教学例子'
    assert detail['contributors'][0]=={'name':'林知','score':8,'count':1}
    serialized=json.dumps(detail)
    for private in ('private-original-chat','private-contributor-chat','owner_id','reviewer_id','request_hash','credentials'):
        assert private not in serialized
    draft=dict(p);draft['title']='尚未公开的新标题';save_ready(app,c,draft,owner,merged['revision_id'])
    assert app.workflow.public_course(c['id'])['course']['title']==detail['course']['title']


def test_detail_http_is_public_but_drafts_hidden_and_removing_courses_are_not(published):
    app,c,p,owner,admin,release,old=published
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    def get(cid):
        connection=HTTPConnection(*server.server_address,timeout=5)
        connection.request('GET','/api/shuku/public/courses/'+cid)
        response=connection.getresponse();body=json.loads(response.read());status=response.status;connection.close();return status,body
    try:
        assert get(c['id'])[0]==200
        private=app.store.create_course(owner,{'module_id':c['module_id'],'title':'私有草稿'},app.clock())
        assert get(private['id'])[0]==404
        assert get('invalid-id')[0]==400
        app.workflow.governance.visibility(admin,c['id'],{'action':'hide'})
        assert get(c['id'])[0]==404
        app.workflow.governance.visibility(admin,c['id'],{'action':'restore'})
        assert get(c['id'])[0]==200
        with app.store.transaction() as db:db.execute('UPDATE shuku_courses SET deleting=true WHERE id=%s',(c['id'],))
        assert get(c['id'])[0]==404
    finally:server.shutdown();server.server_close();thread.join()
