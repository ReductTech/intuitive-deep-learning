"""Exercise real template/native files without a live account or production writes."""
import argparse
from copy import deepcopy
import importlib.util
import json
import os
from pathlib import Path
import shutil
from uuid import UUID

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('authoring_client',ROOT/'backend/src/shuku_backend/local_agent_client.py')
client=importlib.util.module_from_spec(spec);spec.loader.exec_module(client)
parser=argparse.ArgumentParser();parser.add_argument('--native-root',type=Path,required=True);parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args();native_root=args.native_root.resolve();output=args.output.resolve()
lock=json.loads((ROOT/'local-authoring.lock.json').read_text(encoding='utf-8'))
template=ROOT/'.authoring-template'/lock['commit']
output.mkdir(parents=True,exist_ok=True)


def checkout(repo,commit,destination,paths=None):
    # Fixtures were exported from these exact committed, public snapshots.
    if repo==lock['repository']:
        assert commit==lock['commit']
        for name in ('creator-skills','environment','runtime'):
            shutil.copytree(template/name,destination/name)
        for name in ('README.md','UPLOAD.md'):shutil.copyfile(template/name,destination/name)
    else:
        assert repo=='https://github.com/reduct-shuku/intuitive-deep-learning.git' and commit=='10774328363c364d6316ec7ee0783d572d237fc6'
        for name in paths:
            if (native_root/name).exists():shutil.copytree(native_root/name,destination/name)


def prepare(name,data):
    directory=output/name;directory.mkdir()
    os.chdir(directory);client.request=lambda *a,**k:deepcopy(data);client.checkout=checkout
    client.prepare('https://example.test',data['course_id'],'fixture-token')
    return directory,client.read('shuku-state.json')


page={'id':'first','format':'react','sourceEntry':'Lesson.tsx','title':'第一课','goal':'理解知识','summary':'已有内容','note':'','ready':False,'designed':False,'revisions':[],'messages':[]}
project={'version':1,'id':'project','courseId':'custom-fixture','title':'完整创作工程','duration':20,'style':'简洁教学','outlineConfirmed':True,'pages':[page],
         'source':{'files':{'Lesson.tsx':'export default ()=> <h1>开始创作</h1>'}}}
snapshot={'course_id':'11111111-1111-4111-8111-111111111111','project':project,'course':{'title':project['title'],'description':'课程简介','category':'人工智能'},'authoring':lock,'native_source':None,'expected_revision':None,'expected_draft':None}
directory,state=prepare('new',snapshot)
lesson=Path('courses')/state['module']/'Lesson.tsx'
lesson.write_text("import {useState} from 'react';import {Typography,Button} from '@shared/react';import {moduleAssetUrl} from '@shared/react/assets';export default function Lesson(){const [n,setN]=useState(0);return <main className='bg-[#123456] p-8'><Typography as='h1' variant='h1'>完整模板组件</Typography><Button variant='primary' onClick={()=>setN(n+1)}>互动 {n}</Button><img alt='普通素材' src={moduleAssetUrl('11111111-1111-4111-8111-111111111111','photo.png')}/></main>}",encoding='utf-8')
assets=Path('courses/assets')/state['course'];assets.mkdir(parents=True)
import base64
(assets/'photo.png').write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0V8AAAAASUVORK5CYII='))
packed=client.template_project(state,client.read('project.json'));client.write(output/'new-project.json',packed)
assert len(packed['source']['files'])<20 and '开始创作' not in packed['source']['files'][state['module']+'/Lesson.tsx']

outline=json.loads((native_root/'modules/Neuron-Guide/outlines.json').read_text(encoding='utf-8'))
native={'repository':'https://github.com/reduct-shuku/intuitive-deep-learning.git','commit':'10774328363c364d6316ec7ee0783d572d237fc6','module':'modules/Neuron-Guide','asset_id':outline['moduleIdentity']['id']}
native_project={**project,'courseId':outline['id'],'title':outline['title'],'nativeSnapshot':native['commit'],'pages':[{**page,'id':p['id'],'nativeId':p['id'],'title':p['title']} for p in outline['pages']]}
native_project.pop('source')
for p in native_project['pages']:p.pop('format');p.pop('sourceEntry')
directory,state=prepare('native',{**snapshot,'project':native_project,'native_source':native,'expected_revision':'frozen-base','expected_draft':'saved-web-draft'})
files=list((Path('courses')/state['module']).rglob('*.tsx'))
changed=False
for file in files:
    text=file.read_text(encoding='utf-8')
    if '只有 302 个神经元' in text:
        file.write_text(text.replace('只有 302 个神经元','本地共创验证：302 个神经元'),encoding='utf-8');changed=True
assert changed,'Expected real original lesson text'
packed=client.template_project(state,client.read('project.json'));client.write(output/'native-project.json',packed)
assert packed['nativeSnapshot']==native['commit'] and len(packed['pages'])==len(outline['pages'])
assert all(p['format']=='react' and not p.get('nativeId') for p in packed['pages'])
print('PASS full template/new-course and pinned native source/material preparation, original page modification and source delivery')
