"""Standard template source uses the same immutable save/review/workspace gates."""
from copy import deepcopy
from uuid import uuid4
from shuku_backend.local_agent import AUTHORING
from shuku_backend.storage import DEMO_USERS
from test_workflow import workflow,approve
from test_local_agent import secret,body


def test_template_source_materials_publish_and_private_co_creation(workflow):
    app,_,_,uid,admin=workflow;agent=app.workflow.local_agent
    created=agent.create(uid,{'module_id':str(uuid4()),'title':'完整模板课程','description':'既有简介','category':'人工智能'})
    cid=created['course']['id'];token=secret(created);snapshot=agent.snapshot(token,cid)
    assert snapshot['authoring']==AUTHORING and snapshot['course']['description']=='既有简介'
    value=snapshot['project'];value['authoringVersion']=AUTHORING['commit'];value['outlineConfirmed']=True;value['sourceGuideEntry']='Lesson.tsx'
    value['pages'][0].update(ready=True,designed=True)
    value['source']['files']={
        'Lesson.tsx':"import {Typography,Button} from '@shared/react';import image from './assets/课程封面.png';export default ()=> <main className='bg-[#123456]'><Typography as='h1' variant='h1'>Template actual lesson</Typography><Button>真实组件</Button><img src={image}/></main>",
        'assets/课程封面.png':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='}
    saved=agent.save(token,cid,'template-real-00001',body(snapshot));assert app.worker.run_once()
    revision=agent.revision(token,saved['id']);assert revision['state']=='ready'
    assert b'Template actual lesson' in app.workflow.file(uid,saved['id'],'index.html')[0]
    assert app.workflow.public_courses()==[]
    approve(app,{'id':cid},revision,uid,admin)
    released=app.workflow.publish(uid,cid,{'revision_id':saved['id'],'version':'1.0.0'})
    learner=DEMO_USERS[0][0]
    wid=app.workflow.collaboration.create(learner,cid,{'base_release_id':released['id']})['id'];assert app.worker.run_once()
    brief=agent.issue(learner,wid);local_token=secret(brief);local=agent.snapshot(local_token,wid)
    assert local['project']['authoringVersion']==AUTHORING['commit'] and local['project']['sourceGuideEntry']=='Lesson.tsx'
    assert '私有工作区共创' in brief['text'] and local['workspace']['base_release_id']==released['id']
    local['project']['source']['files']['Lesson.tsx']=local['project']['source']['files']['Lesson.tsx'].replace('Template actual lesson','Private source improvement')
    changed=agent.save(local_token,wid,'template-private-00001',body(local));assert app.worker.run_once()
    assert agent.revision(local_token,changed['id'])['state']=='ready'
    contribution=app.workflow.collaboration.submit(learner,wid,{'revision_id':changed['id'],'summary':'修改真实源码'})
    diff=app.workflow.collaboration.detail(learner,contribution['id'])['diff']
    assert not diff['pages'] and not diff['settings'] and diff['source_files']==[{'path':'Lesson.tsx','kind':'modified'}]
    assert app.store.course(uid,cid)['head_revision']==saved['id']
    assert app.store.course(uid,cid)['current_release']==released['id']
