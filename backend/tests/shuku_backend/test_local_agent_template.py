"""Local engineering preparation is deterministic, non-destructive and cookie-free."""
import base64
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import shutil
import pytest
from shuku_backend.local_agent import LocalAgent,AUTHORING
from shuku_backend.source import validate_source
from shuku_backend.errors import BusinessError


@pytest.fixture
def client():
    script=Path(__file__).resolve().parents[2]/'src/shuku_backend/local_agent_client.py'
    spec=importlib.util.spec_from_file_location('template_client',script);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


def snapshot(native=None):
    project={'version':1,'id':'course','courseId':'custom-course','title':'需要创作的课程','duration':20,'style':'简洁','outlineConfirmed':False,
             'pages':[{'id':'first','format':'react','sourceEntry':'Lesson.tsx','title':'第一课','goal':'','summary':'','note':'','ready':False,'designed':False,'revisions':[],'messages':[]}],
             'source':{'files':{'Lesson.tsx':'export default ()=> <h1>开始创作</h1>'}}}
    return {'project':project,'course':{'title':project['title'],'description':'已有课程简介','category':'人工智能'},'authoring':AUTHORING,
            'native_source':native,'expected_revision':None,'expected_draft':None}


def test_prompts_distinguish_creation_and_private_workspace_and_wait():
    course={'id':'course','title':'标题','description':'简介','category':'分类'}
    agent=object.__new__(LocalAgent)
    agent.origin='https://example.test'
    for base,label in [(None,'课程创作说明'),({'version':'1.0.0'},'私有工作区共创说明')]:
        prompt=agent.instructions(course,'secret-token',base)
        assert label in prompt and '简介' in prompt and '分类' in prompt
        assert AUTHORING['repository'] in prompt and AUTHORING['commit'] in prompt
        assert 'environment/' in prompt and 'runtime/' in prompt and 'prepare' in prompt
        assert '等待具体要求' in prompt and '不构建、打包、上传或保存修订' in prompt
        assert '不需要个人 Fork' in prompt and '修订接口' in prompt
        assert 'git switch' not in prompt and '个人仓库：' not in prompt
        assert 'repositoryName' in prompt and 'outlines.json' in prompt
        assert '改名' in prompt and '80' in prompt


def fake_framework(repository,commit,destination,paths=None):
    assert repository==AUTHORING['repository'] and commit==AUTHORING['commit']
    for name in ('creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/README.md','README.md','UPLOAD.md'):
        path=destination/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('framework',encoding='utf-8')


def test_prepare_gets_full_framework_metadata_and_never_saves_or_overwrites(client,tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);calls=[]
    def request(site,path,token,*args):calls.append(path);return snapshot()
    monkeypatch.setattr(client,'request',request);monkeypatch.setattr(client,'checkout',fake_framework)
    client.prepare('https://example.test','course','token')
    for path in ('creator-skills/SKILL.md','creator-skills/shared/react/index.ts','environment/frontend/package.json','runtime/README.md'):
        assert Path(path).is_file()
    assert client.read('shuku-course.json')['description']=='已有课程简介'
    state=client.read('shuku-state.json');assert state['module']=='modules/ShukuCourse'
    assert len(calls)==1 and calls[0].endswith('/project')
    source=Path('courses/modules/ShukuCourse/Lesson.tsx');source.write_text('keep my edits')
    with pytest.raises(RuntimeError,match='保留'):client.prepare('https://example.test','course','token')
    assert source.read_text()=='keep my edits' and len(calls)==1
    assert 'api_token' in Path('.gitignore').read_text()


def test_prepare_original_source_pins_commit_and_packs_real_changes(client,tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);native={'repository':'https://github.com/reduct-shuku/intuitive-deep-learning.git','commit':'a'*40,'module':'modules/Original','asset_id':'asset'}
    data=snapshot(native);data['project']['nativeSnapshot']='a'*40
    data['project']['pages'][0].pop('sourceEntry');data['project']['pages'][0].update(nativeId='first');data['project'].pop('source')
    data['expected_revision']='base';data['expected_draft']='web-draft'
    monkeypatch.setattr(client,'request',lambda *args:deepcopy(data));calls=[]
    def checkout(repo,commit,destination,paths=None):
        calls.append((repo,commit,paths))
        if repo==AUTHORING['repository']:return fake_framework(repo,commit,destination)
        assert commit=='a'*40 and paths==['modules/Original','assets/asset']
        module=destination/'modules/Original';module.mkdir(parents=True)
        (module/'deck.tsx').write_text("import {Button} from '../../shared/react';export const deck={scenes:[{id:'first',render:()=> <Button>original</Button>}]}")
        client.write(module/'outlines.json',{'title':'原课程','ppt':{'entry':'deck.tsx'},'pages':[{'id':'first','title':'原页面','section':'原章节','snippet':'原讲稿'}]})
        assets=destination/'assets/asset';assets.mkdir(parents=True);(assets/'photo.png').write_bytes(b'original large material')
    monkeypatch.setattr(client,'checkout',checkout)
    client.prepare('https://example.test','course','token')
    assert len(calls)==2 and calls[1][1]=='a'*40
    original=client.read(Path('courses')/client.read('shuku-state.json')['module']/'outlines.json')
    assert original['pages'][0]['section']=='原章节' and original['pages'][0]['snippet']=='原讲稿'
    state=client.read('shuku-state.json');assert state['expected_revision']=='base' and state['expected_draft']=='web-draft'
    assert Path('courses/assets/asset/photo.png').read_bytes()==b'original large material'
    file=Path('courses')/state['module']/'deck.tsx'
    assert "from '@shared/react'" in file.read_text()
    file.write_text(file.read_text().replace('original','locally changed'))
    packed=client.template_project(state,client.read('project.json'))
    assert packed['nativeSnapshot']=='a'*40 and packed['courseId']==data['project']['courseId']
    assert 'locally changed' in packed['source']['files'][state['module']+'/deck.tsx']
    assert 'assets/asset/photo.png' not in packed['source']['files'],'unchanged large assets reuse the frozen baseline'
    assert packed['pages'][0]['id']=='first' and not packed['pages'][0].get('nativeId')
    validate_source(packed)


def test_material_validation_rejects_host_paths_html_and_bad_encoding():
    project=snapshot()['project'];files=project['source']['files']
    files['assets/course/photo.png']='data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\n').decode()
    files['assets/course/课程封面.png']=files['assets/course/photo.png']
    validate_source(project)
    for value in ('/etc/passwd','https://example.test/image.png','data:text/html;base64,PGgxPg==','data:image/png;base64,%%%'):
        files['assets/course/photo.png']=value
        with pytest.raises(BusinessError):validate_source(project)


def test_client_checkout_blocks_arbitrary_remote_and_non_fixed_version(client,tmp_path):
    for repo,commit in [('https://attacker.invalid/repo','a'*40),(AUTHORING['repository'],'main')]:
        with pytest.raises(ValueError):client.checkout(repo,commit,tmp_path/'download')


def test_frozen_public_media_streams_without_private_cookie_and_blocks_sources(tmp_path):
    from types import SimpleNamespace
    from http.client import HTTPConnection
    from http.server import ThreadingHTTPServer
    import threading
    from shuku_backend.api import handler_for
    root=tmp_path/'snapshot';folder=root/'assets/asset';folder.mkdir(parents=True)
    (folder/'photo.png').write_bytes(b'\x89PNG\r\n\x1a\n')
    (folder/'secret.ts').write_text('not public')
    flow=SimpleNamespace(native_root=lambda commit:root,modules=lambda root:[{'id':'asset'}])
    local=object.__new__(LocalAgent)
    local.flow=flow
    app=SimpleNamespace(workflow=SimpleNamespace(local_agent=local))
    server=ThreadingHTTPServer(('127.0.0.1',0),handler_for(app));thread=threading.Thread(target=server.serve_forever);thread.start()
    def get(name):
        c=HTTPConnection(*server.server_address);c.request('GET','/api/shuku/public/library-assets/'+('a'*40)+'/asset/'+name)
        response=c.getresponse();value=response.status,response.read(),dict(response.getheaders());c.close();return value
    try:
        status,data,headers=get('photo.png')
        assert status==200 and data==b'\x89PNG\r\n\x1a\n'
        assert headers['Access-Control-Allow-Origin']=='*' and headers['Content-Security-Policy']=="sandbox; default-src 'none'"
        for name in ('secret.ts','%2e%2e/secret.ts','photo.png?token=bad'):
            assert get(name)[0] in (400,404)
    finally:server.shutdown();server.server_close();thread.join()


def test_saved_source_materials_and_generated_deck_do_not_overwrite_content(client,tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);data=snapshot()
    data['project']['source']['files'].update({
        'ShukuManagedPpt.tsx':'export const original = "keep existing source";',
        'assets/course/课程封面.png':'data:image/png;base64,'+base64.b64encode(b'original image bytes').decode()})
    monkeypatch.setattr(client,'request',lambda *args:deepcopy(data));monkeypatch.setattr(client,'checkout',fake_framework)
    client.prepare('https://example.test','course','token')
    target=Path('courses/modules/ShukuCourse');outline=client.read(target/'outlines.json')
    assert outline['ppt']['entry']=='ShukuManagedPptNext.tsx'
    assert (target/'ShukuManagedPpt.tsx').read_text()=='export const original = "keep existing source";'
    assert Path('courses/assets/course/课程封面.png').read_bytes()==b'original image bytes'
    packed=client.template_project(client.read('shuku-state.json'),client.read('project.json'))
    assert packed['sourceGuideEntry'] in packed['source']['files']
    assert packed['source']['files']['assets/course/课程封面.png']==data['project']['source']['files']['assets/course/课程封面.png']
    validate_source(packed)


def test_server_authoring_version_matches_operator_lock():
    lock=Path(__file__).resolve().parents[3]/'local-authoring.lock.json'
    assert json.loads(lock.read_text(encoding='utf-8'))==AUTHORING


def test_private_workspaces_keep_the_framework_but_strip_author_notes():
    from shuku_backend.collaboration import teaching
    project=snapshot()['project'];project['authoringVersion']=AUTHORING['commit'];project['sourceGuideEntry']='Lesson.tsx'
    project['pages'][0]['note']='private notes';project['pages'][0]['messages']=[{'role':'user','text':'private chat'}]
    copied=teaching(project)
    assert copied['authoringVersion']==AUTHORING['commit'] and copied['sourceGuideEntry']=='Lesson.tsx'
    assert copied['source']==project['source'] and copied['source'] is not project['source']
    assert copied['pages'][0]['note']=='' and copied['pages'][0]['messages']==[]


def test_guide_entry_must_be_a_submitted_component():
    project=snapshot()['project'];project['sourceGuideEntry']='../../server.py'
    with pytest.raises(BusinessError):validate_source(project)
    project['sourceGuideEntry']='Lesson.tsx';validate_source(project)
    project.pop('source');project['pages'][0].pop('format')
    with pytest.raises(BusinessError):validate_source(project)


def test_saved_template_round_trip_keeps_module_paths_and_original_guide(client,tmp_path,monkeypatch):
    first=tmp_path/'first';first.mkdir();monkeypatch.chdir(first);data=snapshot()
    monkeypatch.setattr(client,'request',lambda *args:deepcopy(data));monkeypatch.setattr(client,'checkout',fake_framework)
    client.prepare('https://example.test','course','token');state=client.read('shuku-state.json')
    packed=client.template_project(state,client.read('project.json'));data['project']=packed
    second=tmp_path/'second';second.mkdir();monkeypatch.chdir(second)
    client.prepare('https://example.test','course','token');restored=client.read('shuku-state.json')
    assert restored['module']==state['module']
    repacked=client.template_project(restored,client.read('project.json'))
    assert repacked['sourceGuideEntry']==packed['sourceGuideEntry']
    assert repacked['source']==packed['source']
    assert repacked['authoringModule']==packed['authoringModule']
    validate_source(repacked)


def test_agent_suggested_repository_name_survives_upload_and_resume(client,tmp_path,monkeypatch):
    monkeypatch.chdir(tmp_path);data=snapshot()
    monkeypatch.setattr(client,'request',lambda *args:deepcopy(data));monkeypatch.setattr(client,'checkout',fake_framework)
    client.prepare('https://example.test','course','token');state=client.read('shuku-state.json')
    path=Path('courses')/state['module']/'outlines.json';outline=client.read(path)
    outline['repositoryName']='creator-skill-basics';client.write(path,outline)
    packed=client.template_project(state,client.read('project.json'))
    assert packed['repositoryName']=='creator-skill-basics'
    outline.pop('repositoryName');client.write(path,outline)
    assert client.template_project(state,packed)['repositoryName']=='creator-skill-basics'


def test_standard_module_metadata_cannot_leave_submitted_source():
    project=snapshot()['project']
    for module in ('../../host','modules/Missing',123):
        project['authoringModule']=module
        with pytest.raises(BusinessError):validate_source(project)
