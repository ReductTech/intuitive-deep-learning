"""Real MySQL draft recovery, concurrency, authorization and revision isolation."""
import copy
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import pytest
from shuku_backend import drafts
from shuku_backend.errors import BusinessError
from shuku_backend.migrations import expected_markers, BASELINE, BASELINE_CHECKSUM, CATALOG_VERSION, CATALOG_CHECKSUM, LIBRARY_VERSION, LIBRARY_CHECKSUM
from test_workflow import workflow, save_ready, approve
from test_http import api, login


def payload(project, head=None, version=None):
    return {'project':project, 'expected_revision':head, 'expected_draft':version}


def test_incomplete_draft_roundtrip_no_build_and_permissions(workflow):
    app, course, project, uid, admin = workflow
    project=copy.deepcopy(project)
    project['outlineConfirmed']=False
    project['pages'][0]['outline']={'guided':{'phase':'outline','audience':'初学者','description':'课程简介'}}
    project['outlineDraftMarkdown']='# 未完成的大纲\n## 还在考虑🙂'
    project['source']={'files':{'Lesson.tsx':'export default function {'}}
    first=drafts.save(app.workflow,uid,course['id'],payload(project))
    assert drafts.read(app.workflow,uid,course['id'])['draft']['project']==project
    assert drafts.read(app.workflow,admin,course['id'])['draft']['version']==first['version']
    with app.store.transaction() as db:
        assert db.execute('SELECT head_revision FROM shuku_courses WHERE id=%s',(course['id'],)).fetchone()['head_revision'] is None
        assert db.execute('SELECT count(*) AS n FROM shuku_revisions').fetchone()['n']==0
        assert db.execute('SELECT count(*) AS n FROM shuku_tasks').fetchone()['n']==0
    from shuku_backend.storage import DEMO_USERS
    for action in (lambda:drafts.read(app.workflow,DEMO_USERS[0][0],course['id']),
                   lambda:drafts.save(app.workflow,DEMO_USERS[0][0],course['id'],payload(project))):
        with pytest.raises(BusinessError):action()
    second=drafts.save(app.workflow,uid,course['id'],payload(project,version=first['version']))
    assert second['version']!=first['version']


def test_drafts_never_invalidate_review_and_revision_consumes_only_matching_version(workflow):
    app,course,project,uid,admin=workflow
    revision=save_ready(app,course,project,uid)
    approve(app,course,revision,uid,admin)
    project=copy.deepcopy(project);project['pages'][0]['summary']='只存在草稿的新内容'
    draft=drafts.save(app.workflow,uid,course['id'],payload(project,revision['id']))
    assert app.workflow.revision(uid,revision['id'])['review']['status']=='approved'
    with pytest.raises(BusinessError) as e:
        app.workflow.save(uid,course['id'],{**payload(project,revision['id']),'expected_draft':'wrong'})
    assert e.value.code=='DRAFT_CONFLICT'
    saved=app.workflow.save(uid,course['id'],payload(project,revision['id'],draft['version']))
    assert saved['id']!=revision['id']
    assert drafts.read(app.workflow,uid,course['id'])['draft'] is None
    with pytest.raises(BusinessError) as e:
        drafts.save(app.workflow,uid,course['id'],payload(project,revision['id'],draft['version']))
    assert e.value.code=='REVISION_CONFLICT'
    next_draft=drafts.save(app.workflow,uid,course['id'],payload(project,saved['id']))
    assert next_draft['base_revision']==saved['id']


def test_two_tabs_cannot_overwrite_each_other(workflow):
    app,course,project,uid,_=workflow
    def save(_):
        try:return drafts.save(app.workflow,uid,course['id'],payload(project))
        except BusinessError as error:return error.code
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(save,range(2)))
    assert len([x for x in results if isinstance(x,dict)])==1
    assert 'DRAFT_CONFLICT' in results
    assert drafts.read(app.workflow,uid,course['id'])['draft']


def test_removed_course_rejects_saves_and_cleans_draft(workflow):
    app,course,project,uid,admin=workflow
    drafts.save(app.workflow,uid,course['id'],payload(project))
    result=app.workflow.governance.request(uid,'course',course['id'],{'confirm':True})
    with pytest.raises(BusinessError):drafts.save(app.workflow,uid,course['id'],payload(project))
    for _ in range(10):
        if not app.worker.run_once():break
    with app.store.transaction() as db:
        assert not db.execute('SELECT 1 FROM shuku_editor_drafts WHERE course_id=%s',(course['id'],)).fetchone()
        assert not db.execute('SELECT 1 FROM shuku_courses WHERE id=%s',(course['id'],)).fetchone()


def test_http_draft_auth_and_origin_validation(api):
    request,app=api
    owner=login(request,'xiaoman');learner=login(request,'linzhi')
    from uuid import uuid4
    cid=request('POST','/courses',{'module_id':str(uuid4()),'title':'草稿 API'},cookie=owner)[1]['course']['id']
    path='/courses/'+cid+'/draft'
    assert request('GET',path)[0]==401
    assert request('GET',path,cookie=learner)[0]==403
    assert request('GET',path,cookie=owner)[1]=={'draft':None}
    p={'version':1,'title':'','pages':[{'id':'one','title':'','goal':'','summary':'','note':'','revisions':[],'messages':[]}]}
    body=payload(p)
    assert request('POST',path,body,cookie=owner,origin='https://evil.example')[0]==403
    assert request('POST',path,{**body,'unknown':True},cookie=owner)[0]==400
    status,saved,_=request('POST',path,body,cookie=owner)
    assert status==200
    assert request('GET',path,cookie=owner)[1]['draft']['project']==p
    assert request('POST',path,body,cookie=owner)[0]==409
    assert request('POST',path,{**body,'expected_draft':saved['version']},cookie=owner)[0]==200


def test_upgrade_003_to_004_preserves_business_rows_and_is_repeatable(store):
    store.seed_demo()
    with store.engine.begin() as db:
        before=db.exec_driver_sql('SELECT count(*) FROM shuku_users').scalar()
        db.exec_driver_sql('DROP TABLE shuku_editor_drafts')
        db.exec_driver_sql("DELETE FROM shuku_schema_migrations WHERE version NOT IN ('001_mysql_sqlalchemy','002_remote_course_catalog','003_official_library_courses')")
    with pytest.raises(RuntimeError):store.ready()
    store.migrate();store.migrate();store.ready()
    with store.engine.connect() as db:
        assert db.exec_driver_sql('SELECT count(*) FROM shuku_users').scalar()==before
        assert {r.version:r.checksum for r in db.exec_driver_sql('SELECT * FROM shuku_schema_migrations')}==expected_markers()


