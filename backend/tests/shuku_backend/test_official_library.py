"""Official source adoption and real private-workspace review/publication flow."""
import json
from pathlib import Path
import shutil
import subprocess
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import DEMO_USERS
from shuku_backend.review_inbox import listing
from test_workflow import workflow,save_ready

LEARNER=DEMO_USERS[0][0]


@pytest.fixture
def official_pending(workflow,tmp_path):
    app,_,_,owner,admin=workflow
    module=app.workflow.modules()[0];directory=Path(module['directory']).name
    cache=tmp_path/'cache';library=cache/'current';library.mkdir(parents=True)
    shutil.copytree(Path(module['directory']),library/'modules'/directory)
    shutil.copytree(app.workflow.course_root/'modules/shared',library/'modules/shared')
    assets=app.workflow.course_root/'assets'/module['id']
    if assets.exists():shutil.copytree(assets,library/'assets'/module['id'])
    (library/'course-library.json').write_text(json.dumps({'schema':1,'repository':'reduct-shuku/intuitive-deep-learning','modules':[{'directory':directory,'id':module['alias'],'uuid':module['id']}]}))
    (library/'source-lock.json').write_text(json.dumps({'repository':'ReductTech/intuitive-deep-learning'}))
    def git(*args):return subprocess.check_output(['git','-C',str(library),*args],text=True).strip()
    git('init');git('config','user.email','test@example.invalid');git('config','user.name','Test');git('add','.');git('commit','-m','source snapshot')
    app.workflow.course_root=library
    def sync():
        original=app.workflow.root;app.workflow.root=None
        try:app.workflow.library.sync()
        finally:app.workflow.root=original
    sync()
    result=app.workflow.library.bootstrap();assert result['count']==1
    cid=result['created'][0]['course_id'];rid=result['created'][0]['revision_id']
    yield app,cid,rid,admin,module,sync


@pytest.fixture
def official(official_pending):
    app,cid,rid,admin,module,sync=official_pending
    assert app.worker.run_once()
    state=app.workflow.revision(admin,rid)
    assert state['state']=='ready',state
    return official_pending


def test_adopt_once_admin_manages_v1_and_governance_cannot_resurrect(official):
    app,cid,rid,admin,module,sync=official
    detail=app.workflow.public_course(cid)
    assert detail['course']['version']=='1.0.0' and detail['course']['creator']=='管理员'
    assert detail['course']['revision_id']==rid and detail['course']['library']['module_id']==module['id']
    assert detail['releases'][0]['current'] and len(detail['releases'])==1
    assert app.workflow.library.bootstrap()['count']==0
    sync()
    courses=app.workflow.public_courses();assert len(courses)==1 and courses[0]['course_id']==cid
    with app.store.transaction() as db:
        assert db.execute('SELECT user_id FROM shuku_course_managers WHERE course_id=%s',(cid,)).fetchone()['user_id']==admin
    app.workflow.governance.visibility(admin,cid,{'action':'hide'})
    assert app.workflow.public_courses()==[]
    assert app.workflow.library.bootstrap()['count']==0
    app.workflow.governance.visibility(admin,cid,{'action':'restore'})
    app.workflow.governance.request(admin,'course',cid,{'confirm':True});assert app.worker.run_once()
    assert app.workflow.public_courses()==[] and app.workflow.library.bootstrap()['count']==0
    with app.store.transaction() as db:assert db.execute('SELECT course_id FROM shuku_library_bindings WHERE module_id=%s',(module['id'],)).fetchone()['course_id'] is None


def test_private_workspace_review_merge_publish_and_previous_release(official):
    app,cid,rid,admin,module,sync=official
    wid=app.workflow.collaboration.create(LEARNER,cid,{})['id'];assert app.worker.run_once()
    with app.store.transaction() as db:workspace=db.execute('SELECT * FROM shuku_courses WHERE id=%s',(wid,)).fetchone()
    head=workspace['head_revision'];draft=app.workflow.revision(LEARNER,head)['project']
    assert draft['nativeSnapshot']==app.workflow.library.commit
    assert app.workflow.file(LEARNER,head,'index.html')[0]
    with pytest.raises(BusinessError):app.workflow.file(DEMO_USERS[1][0],head,'index.html')
    with pytest.raises(BusinessError):app.workflow.file(None,head,'index.html')
    # A later deployment must not swap the source under an existing workspace.
    old=app.workflow.course_root;old_commit=app.workflow.library.commit
    frozen=old.parent/old_commit;old.rename(frozen)
    latest=old.parent/'latest';shutil.copytree(frozen,latest)
    (latest/'README.md').write_text('new distribution snapshot')
    subprocess.check_call(['git','-C',str(latest),'add','.'])
    subprocess.check_call(['git','-C',str(latest),'commit','-m','new snapshot'])
    app.workflow.course_root=latest;sync()
    assert app.workflow.library.commit!=old_commit
    assert app.workflow.native_root(draft['nativeSnapshot'])==frozen
    bad=json.loads(json.dumps(draft));bad['nativeSnapshot']='0'*40
    with pytest.raises(BusinessError):app.workflow.save(LEARNER,wid,{'project':bad,'expected_revision':head})
    draft['pages'][0].pop('nativeId');draft['pages'][0].update(format='text',summary='补充一个新的教学解释')
    edited=save_ready(app,{'id':wid},draft,LEARNER,head)
    contribution=app.workflow.collaboration.submit(LEARNER,wid,{'revision_id':edited['id'],'summary':'完善解释'})
    assert listing(app,admin,{})['counts']['pending']==1
    with pytest.raises(BusinessError):app.workflow.collaboration.decide(LEARNER,contribution['id'],{'revision_id':edited['id'],'decision':'approved','score':8,'note':''})
    app.workflow.collaboration.decide(admin,contribution['id'],{'revision_id':edited['id'],'decision':'approved','score':8,'note':'通过'})
    merged=app.workflow.collaboration.merge(admin,contribution['id'],{'revision_id':edited['id']});assert app.worker.run_once()
    assert listing(app,admin,{})['counts']['publish']==1
    result=app.workflow.publish(admin,cid,{'revision_id':merged['revision_id'],'version':'1.0.1','note':'完善课程'})
    assert result['version']=='1.0.1'
    assert app.workflow.file(None,rid,'index.html')[0]
    assert app.workflow.public_course(cid)['releases'][0]['version']=='1.0.1'
    assert app.workflow.library.bootstrap()['count']==0
    sync();assert len(app.workflow.public_courses())==1
    assert app.workflow.public_courses()[0]['version']=='1.0.1'


def test_initial_import_is_guarded_and_failed_build_can_resume(official_pending):
    app,cid,rid,admin,module,sync=official_pending
    project=app.workflow.revision(admin,rid)['project']
    with pytest.raises(BusinessError) as error:app.workflow.save(admin,cid,{'project':project,'expected_revision':rid})
    assert error.value.code=='INITIAL_IMPORT_BUSY'
    with pytest.raises(BusinessError):app.workflow.library.bootstrap('xiaoman')
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_tasks SET status='failed',error_code='TEST_FAILURE' WHERE idempotency_key=%s",('build:'+rid,))
    result=app.workflow.library.bootstrap();assert result['count']==0 and result['retried']==1
    assert app.worker.run_once()
    assert app.workflow.public_course(cid)['course']['revision_id']==rid
    assert app.workflow.library.bootstrap()['retried']==0
