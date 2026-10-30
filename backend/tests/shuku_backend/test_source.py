from copy import deepcopy
from uuid import uuid4
import pytest
from shuku_backend.source import validate_source
from shuku_backend.errors import BusinessError
from test_workflow import workflow,save_ready,approve


def react_project(project):
    project=deepcopy(project);page=project['pages'][0]
    page.update(format='react',sourceEntry='Lesson.tsx')
    project['source']={'files':{'Lesson.tsx':"import React,{useState} from 'react';import './lesson.css';export default function Lesson(){const [n,setN]=useState(0);return <button className='counter' onClick={()=>setN(n+1)}>Count {n}</button>}",'lesson.css':'.counter { color: rgb(7, 80, 120); }'}}
    return project


@pytest.mark.parametrize('path',['../escape.tsx','/root.tsx','x\\a.tsx','.env','node_modules/a.tsx','a/../x.tsx','a%2fb.tsx'])
def test_reject_unsafe_source_paths(path):
    p={'pages':[{'format':'react','sourceEntry':'Lesson.tsx'}],'source':{'files':{'Lesson.tsx':'export default ()=>null',path:'bad'}}}
    with pytest.raises(BusinessError):validate_source(p)


def test_custom_source_save_publish_and_failed_edit_preserves_release(workflow):
    app,_,project,uid,admin=workflow
    module_id=str(uuid4());course=app.store.create_course(uid,{'module_id':module_id,'title':'全新 React 课程'},app.clock())
    project=react_project(project);project['courseId']='custom-'+module_id
    revision=save_ready(app,course,project,uid)
    assert app.workflow.revision(uid,revision['id'])['project']['source']==project['source']
    html=app.workflow.file(uid,revision['id'],'index.html')[0]
    assert b'Count' in html and b'counter' in html and b'<script' in html
    with pytest.raises(BusinessError):app.workflow.file(None,revision['id'],'index.html')
    with pytest.raises(BusinessError):app.workflow.file(uid,revision['id'],'sources/Lesson.tsx')
    approve(app,course,revision,uid,admin)
    app.workflow.publish(uid,course['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    assert app.workflow.file(None,revision['id'],'index.html')[0]==html
    improved=deepcopy(project);improved['source']['files']['lesson.css']='.counter { color: green; }'
    second=save_ready(app,course,improved,uid,revision['id']);approve(app,course,second,uid,admin)
    app.workflow.publish(uid,course['id'],{'revision_id':second['id'],'version':'1.1.0'})
    assert app.workflow.file(None,revision['id'],'index.html')[0]==html
    bad=deepcopy(project);bad['source']['files']['Lesson.tsx']="import fs from 'node:fs';export default ()=>fs.readFileSync('/etc/passwd');"
    result=app.workflow.save(uid,course['id'],{'project':bad,'expected_revision':second['id']})
    assert app.worker.run_once()
    failed=app.workflow.revision(uid,result['id'])
    assert failed['state']=='building' and '源码构建失败' in failed['build_error']
    assert app.workflow.file(None,revision['id'],'index.html')[0]==html
    assert app.workflow.public_courses()[0]['revision_id']==second['id']


def test_external_source_tree_is_validated_and_runtime_changes_stay_blocked():
    import json
    from test_github import FakeGitHub,BASE
    from shuku_backend.github_sync import GitHubSync
    from shuku_backend.adapters.github import blob_sha
    fake=FakeGitHub();head='a'*40
    project={'version':1,'id':'project','courseId':'custom','title':'新课程','duration':30,'style':'简洁','outlineConfirmed':True,'pages':[{'id':'page','format':'react','sourceEntry':'Lesson.tsx','title':'第一课','goal':'','summary':'','ready':True,'designed':True}]}
    contents={'courses/project.json':json.dumps(project).encode(),'courses/sources/Lesson.tsx':b'export default ()=>null;'}
    nodes=[]
    for path,content in contents.items():
        sha=blob_sha(content);fake.blobs[sha]=content;nodes.append({'path':path,'type':'blob','mode':'100644','sha':sha,'size':len(content)})
    fake.trees['source-tree']=nodes;fake.commits[head]={'tree':{'sha':'source-tree'}}
    call=lambda method,path:fake.call(None,method,path)
    imported=GitHubSync.external_project(None,None,{'base_sha':BASE,'head_sha':head},call)
    assert imported['source']['files']=={'Lesson.tsx':'export default ()=>null;'}
    fake.trees['source-tree'].append({'path':'courses/bundle.js','type':'blob','mode':'100644','sha':'b'*40})
    with pytest.raises(BusinessError) as error:GitHubSync.external_project(None,None,{'base_sha':BASE,'head_sha':head},call)
    assert error.value.code=='UNSUPPORTED_REMOTE_SOURCE'


def test_source_copied_to_workspace_and_reported_in_diff(workflow):
    app,course,project,uid,admin=workflow
    project=react_project(project);revision=save_ready(app,course,project,uid);approve(app,course,revision,uid,admin)
    app.workflow.publish(uid,course['id'],{'revision_id':revision['id'],'version':'1.0.0'})
    from shuku_backend.storage import DEMO_USERS
    learner=DEMO_USERS[0][0];workspace=app.workflow.collaboration.create(learner,course['id'],{})
    assert app.worker.run_once()
    head=app.store.course(learner,workspace['id'])['head_revision']
    saved=app.workflow.revision(learner,head)
    assert saved['project']['source']==project['source']
    changed=deepcopy(saved['project']);changed['source']['files']['lesson.css']='.counter { color: red; }'
    next_revision=save_ready(app,{'id':workspace['id']},changed,learner,head)
    with app.store.transaction() as db:diff=app.workflow.collaboration.difference(db,revision['id'],next_revision['id'])
    assert diff['source_files']==[{'path':'lesson.css','kind':'modified'}]
