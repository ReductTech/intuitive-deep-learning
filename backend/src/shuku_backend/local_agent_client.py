#!/usr/bin/env python3
"""Local authoring client, Python standard library only. No ZIP or account password."""
import argparse
from hashlib import sha256
import json
import base64
import mimetypes
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.error import HTTPError
from urllib.parse import urlsplit,quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
from uuid import uuid4

EXTENSIONS={'.tsx','.ts','.jsx','.js','.css','.json','.svg','.md','.txt'}
MEDIA={'.png','.jpg','.jpeg','.webp','.gif','.avif','.woff','.woff2','.ttf','.otf','.mp3','.wav','.mp4','.webm','.glb','.gltf','.bin'}
REPOSITORIES={'https://github.com/reduct-shuku/course-template.git','https://github.com/reduct-shuku/intuitive-deep-learning.git'}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise RuntimeError('服务器重定向已停止；请检查术库地址，不向其他地址转发凭证。')


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write(path,value):
    target=Path(path);temporary=target.with_suffix(target.suffix+'.tmp')
    temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
    temporary.replace(target)


def origin(value):
    url=urlsplit(value)
    if url.scheme not in ('https','http') or not url.hostname or url.username or url.password or url.path not in ('','/') or url.query or url.fragment:
        raise ValueError('请填写完整的术库地址，不包含路径、凭证或查询参数。')
    if url.scheme=='http' and url.hostname not in ('localhost','127.0.0.1','::1'):
        raise ValueError('公网连接必须使用 HTTPS。')
    return value.rstrip('/')


def request(site,path,token,body=None,key=None):
    headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}
    if key:headers['Idempotency-Key']=key
    data=None if body is None else json.dumps(body,ensure_ascii=False).encode()
    req=Request(origin(site)+'/api/shuku'+path,data=data,headers=headers)
    try:
        with build_opener(NoRedirect()).open(req,timeout=60) as response:return json.load(response)
    except HTTPError as error:
        try:message=json.load(error).get('error','请求失败')
        except (ValueError,UnicodeDecodeError):message='请求失败，请稍后重试。'
        raise RuntimeError(str(error.code)+'：'+message) from None


def binary_request(site,cid,token,name=None,data=None,digest=None):
    headers={'Authorization':'Bearer '+token}
    path='/courses/'+cid+'/assets'
    if data is not None:
        headers.update({'Content-Type':'application/octet-stream','X-Shuku-Asset-Path':quote(name,safe='')})
    else:path+='/'+digest
    req=Request(origin(site)+'/api/shuku'+path,data=data,headers=headers)
    try:
        with build_opener(NoRedirect()).open(req,timeout=60) as response:
            if data is not None:return json.load(response)['asset']
            content=response.read(32*1024*1024+1)
            if len(content)>32*1024*1024 or sha256(content).hexdigest()!=digest:raise ValueError('素材下载校验失败。')
            return content
    except HTTPError as error:raise RuntimeError('素材传输失败（'+str(error.code)+'），请稍后重试。') from None


def source_path(name):
    path=Path(name)
    if not name or not name.isprintable() or any(c in name for c in ':<>"|*?#%') or chr(92) in name or path.is_absolute() or any(p in ('','.','..') or p.startswith('.') or p.rstrip(' .')!=p for p in name.split('/')) or path.suffix.lower() not in EXTENSIONS|MEDIA:
        raise ValueError('源码路径不安全：'+name)
    target=Path('source')/path
    if target.is_symlink() or not target.resolve().is_relative_to(Path('source').resolve()):
        raise ValueError('源码路径不能指向目录之外。')
    return target


def checkout(repository,commit,destination,paths=None):
    if repository not in REPOSITORIES or not re.fullmatch('[0-9a-f]{40}',commit):
        raise ValueError('只能准备固定版本的术库公共工程。')
    if destination.exists():raise RuntimeError('准备目录已存在，请保留原目录并处理后重试。')
    environment={**os.environ,'GIT_TERMINAL_PROMPT':'0'}
    subprocess.run(['git','clone','--filter=blob:none','--no-checkout',repository,str(destination)],check=True,timeout=180,env=environment)
    subprocess.run(['git','-C',str(destination),'fetch','--depth=1','origin',commit],check=True,timeout=180,env=environment)
    if paths:subprocess.run(['git','-C',str(destination),'sparse-checkout','set',*paths],check=True,timeout=180,env=environment)
    subprocess.run(['git','-C',str(destination),'checkout','--detach',commit],check=True,timeout=180,env=environment)
    actual=subprocess.check_output(['git','-C',str(destination),'rev-parse','HEAD'],text=True).strip()
    if actual!=commit:raise RuntimeError('下载版本与所选基础版本不一致。')


def copy_missing(source,destination):
    for path in sorted(source.rglob('*')):
        if path.is_symlink():raise ValueError('课程工程不能包含符号链接。')
        if path.is_file():
            target=destination/path.relative_to(source)
            if target.exists() or target.is_symlink():raise RuntimeError('已保留本地文件，不覆盖：'+str(target))
            target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)


def prepare(site,cid,token):
    # Never re-clone, reset or refresh over an existing authoring project.
    if any(Path(p).exists() or Path(p).is_symlink() for p in ('project.json','shuku-state.json','shuku-course.json','source')):
        raise RuntimeError('本地项目已存在，已保留原文件。请继续原工程；比较远程版本时使用新目录。')
    result=request(site,'/local-agent/courses/'+cid+'/project',token)
    framework=result['authoring']
    for key in ('creator-skills','environment','runtime'):
        if Path(key).is_symlink():raise ValueError('创作框架不能使用符号链接。')
    if not all(Path(key).is_dir() for key in ('creator-skills','environment','runtime')):
        with tempfile.TemporaryDirectory(prefix='shuku-framework-') as folder:
            repo=Path(folder)/'template';checkout(framework['repository'],framework['commit'],repo)
            for key in ('creator-skills','environment','runtime'):
                if not Path(key).exists():copy_missing(repo/key,Path(key))
            for key in ('README.md','UPLOAD.md','AGENTS.md','courses/README.md'):
                if (repo/key).is_file() and not Path(key).exists():
                    Path(key).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(repo/key,key)
    project=result['project'];native=result.get('native_source')
    restored_module=project.get('authoringModule')
    if restored_module:
        if not re.fullmatch(r'modules/[A-Za-z0-9_-]+',restored_module) or restored_module+'/outlines.json' not in project.get('source',{}).get('files',{}):raise ValueError('保存的标准课程工程目录无效。')
    project['authoringVersion']=framework['commit']
    state={'origin':origin(site),'course':cid,'expected_revision':result['expected_revision'],'expected_draft':result['expected_draft'],
           'layout':'template-v1','authoring':framework,'asset_hashes':{},'binary_assets':bool(result.get('binary_assets') or 'sourceAssets' in project)}
    if native:
        directory=Path(native['module'])
        if len(directory.parts)!=2 or directory.parts[0]!='modules' or not re.fullmatch('[A-Za-z0-9_-]+',directory.parts[1]):raise ValueError('原课程目录不安全。')
        asset=native['asset_id']
        if not re.fullmatch('[A-Za-z0-9_-]+',asset):raise ValueError('原课程素材目录不安全。')
        # Do not collide with an example of the same name in course-template.
        local_module='modules/Shuku-'+cid
        target=Path('courses')/local_module
        if target.exists():raise RuntimeError('原课程目录已存在，保留本地文件。')
        with tempfile.TemporaryDirectory(prefix='shuku-base-') as folder:
            repo=Path(folder)/'base';checkout(native['repository'],native['commit'],repo,[native['module'],'assets/'+asset])
            if not restored_module:copy_missing(repo/directory,target)
            assets=repo/'assets'/asset
            if assets.is_dir():copy_missing(assets,Path('courses/assets')/asset)
        state['module']=local_module;state['native_source']=native
        # Original relative shared imports must resolve to the downloaded template framework.
        for file in target.rglob('*') if not restored_module else []:
            if file.suffix in {'.tsx','.ts','.jsx','.js','.css'}:
                text=file.read_text(encoding='utf-8')
                text=re.sub(r'([\x22\x27])(?:\.\./)+shared/',r'\1@shared/',text)
                file.write_text(text,encoding='utf-8')
        for file in (Path('courses/assets')/asset).rglob('*') if (Path('courses/assets')/asset).exists() else []:
            if file.is_file():state['asset_hashes'][file.relative_to(Path('courses')).as_posix()]=sha256(file.read_bytes()).hexdigest()
        if not project.get('source'):
            original=read(target/'outlines.json')
            original_pages={p['id']:p for p in original['pages']}
            original['pages']=[{**original_pages.get(p.get('nativeId',p['id']),{}),'id':p['id'],'title':p['title'],'goal':p['goal'],'summary':p['summary'],'sourceScene':p.get('nativeId',p['id'])} for p in project['pages']]
            write(target/'outlines.json',original)
    if restored_module:
        state['module']=restored_module
        files=project['source']['files'];modules=set()
        for name,text in files.items():
            source_path(name);file=Path('courses')/name;file.parent.mkdir(parents=True,exist_ok=True)
            data=base64.b64decode(text.split(',',1)[1],validate=True) if file.suffix.lower() in MEDIA else text.encode('utf-8')
            if file.exists() and state['asset_hashes'].get(name)!=sha256(file.read_bytes()).hexdigest():raise RuntimeError('已保留本地文件，不覆盖：'+name)
            if file.suffix.lower() in {'.tsx','.ts','.jsx','.js','.css'}:
                data=re.sub(r'([\x22\x27])(?:\.\./)+shared/',r'\1@shared/',data.decode('utf-8')).encode('utf-8')
            file.write_bytes(data)
            if name.startswith('modules/'):modules.add('/'.join(name.split('/')[:2]))
            if name.startswith('assets/'):state.setdefault('asset_ids',[]).append(name.split('/')[1])
        state['extra_modules']=sorted(modules-{restored_module});state['asset_ids']=sorted(set(state.get('asset_ids',[])))
    elif not native or project.get('source'):
        # Isolate this course from any examples present in the template checkout.
        state['module']='modules/ShukuCourse'
        target=Path('courses')/state['module']
        if target.exists():raise RuntimeError('课程目录已存在，保留本地文件。')
        target.mkdir(parents=True)
        files=project.get('source',{}).get('files',{})
        for name,text in files.items():
            source_path(name);file=target/name;file.parent.mkdir(parents=True,exist_ok=True)
            if file.suffix.lower() in MEDIA:file.write_bytes(base64.b64decode(text.split(',',1)[1],validate=True))
            else:file.write_text(text,encoding='utf-8')
            # moduleAssetUrl uses the template public directory during local preview.
            if name.startswith('assets/'):
                public=Path('courses')/name;public.parent.mkdir(parents=True,exist_ok=True)
                if public.exists() and public.read_bytes()!=file.read_bytes() and state['asset_hashes'].get(name)!=sha256(public.read_bytes()).hexdigest():raise RuntimeError('已有本地素材不同，已保留原文件：'+name)
                public.write_bytes(file.read_bytes())
                state.setdefault('asset_ids',[])
                if name.split('/')[1] not in state['asset_ids']:state['asset_ids'].append(name.split('/')[1])
        # Only register existing saved content. Fresh courses remain an empty scaffold.
        pages=project['pages'];imports=[];scenes=[]
        for i,page in enumerate(pages):
            if page.get('sourceEntry'):
                imports.append('import Page'+str(i)+' from '+json.dumps('./'+page['sourceEntry'])+';')
                render='()=> <Page'+str(i)+'/>'
            elif page.get('nativeId') and native:
                base_outline=read(Path('courses')/local_module/'outlines.json')
                imports.append('import {deck as Base'+str(i)+'} from '+json.dumps('../'+Path(local_module).name+'/'+base_outline['ppt']['entry'])+';')
                render='()=>Base'+str(i)+'.scenes.find(s=>s.id==='+json.dumps(page['nativeId'])+').render({complete:()=>{},reset:()=>{},isComplete:false})'
                state['extra_modules']=[local_module]
            else:
                # Keep saved text lessons too; do not silently omit an existing page.
                name='Text'+str(i)+'.tsx'
                (target/name).write_text('export default ()=> <article><h1>{'+json.dumps(page['title'],ensure_ascii=False)+'}</h1><p>{'+json.dumps(page['summary'],ensure_ascii=False)+'}</p></article>',encoding='utf-8')
                imports.append('import Page'+str(i)+' from '+json.dumps('./'+name)+';');render='()=> <Page'+str(i)+'/>'
            scenes.append('{id:'+json.dumps(page['id'])+',title:'+json.dumps(page['title'],ensure_ascii=False)+',section:'+json.dumps(page.get('section','课程内容'),ensure_ascii=False)+',render:'+render+'}')
        deck_name='ShukuManagedPpt';guide_name='ShukuManagedGuide'
        while (target/(deck_name+'.tsx')).exists():deck_name+='Next'
        while (target/(guide_name+'.tsx')).exists():guide_name+='Next'
        (target/(deck_name+'.tsx')).write_text("import {SceneDeck} from '@shared/react/presentation';\n"+'\n'.join(imports)+'\nexport const deck={id:'+json.dumps(project['courseId'])+',title:'+json.dumps(project['title'],ensure_ascii=False)+',subtitle:"",scenes:['+','.join(scenes)+']};\nexport function '+deck_name+'(){return <SceneDeck catalog={[deck]} moduleId='+json.dumps(project['courseId'])+' assetId='+json.dumps(cid)+' progressKey='+json.dumps('shuku-local:'+cid)+'/>}',encoding='utf-8')
        (target/(guide_name+'.tsx')).write_text(('export {default as '+guide_name+'} from '+json.dumps('./'+project['sourceGuideEntry'])+';') if project.get('sourceGuideEntry') else ('export {'+deck_name+' as '+guide_name+"} from './"+deck_name+"';"),encoding='utf-8')
        write(target/'outlines.json',{'id':project['courseId'],'title':project['title'],'description':result['course']['description'],
              'moduleIdentity':{'id':cid},'entry':guide_name+'.tsx','ppt':{'entry':deck_name+'.tsx'},'pages':[{'id':p['id'],'title':p['title'],'goal':p['goal'],'summary':p['summary']} for p in pages]})
    for name,obj in project.get('sourceAssets',{}).items():
        source_path(name);target=Path('courses')/name
        if target.exists() or target.is_symlink():raise RuntimeError('本地素材已存在，已保留原文件：'+name)
        data=binary_request(site,cid,token,digest=obj['sha256'])
        if len(data)!=obj['size']:raise ValueError('素材大小校验失败。')
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        state['asset_hashes'][name]=obj['sha256']
        if name.startswith('assets/'):state.setdefault('asset_ids',[]).append(name.split('/')[1])
    write('project.json',project);write('shuku-state.json',state);write('shuku-course.json',result['course'])
    ignore=Path('.gitignore');rules=ignore.read_text(encoding='utf-8') if ignore.exists() else ''
    for name in ('api_token','shuku-state.json','project.json','.shuku/'):
        if name not in rules.splitlines():rules+='\n'+name
    ignore.write_text(rules.rstrip()+'\n',encoding='utf-8')
    print('准备完成：'+str(Path.cwd())+'。课程目录：courses/'+state['module']+'。已保留完整规范、公共组件、检查工具和预览环境。请等待用户提出具体创作要求。')


def template_project(state,project,upload=None):
    directory=Path('courses')/state['module'];outline=read(directory/'outlines.json')
    entry=outline.get('ppt',{}).get('entry')
    if not isinstance(entry,str) or not entry.endswith(('.tsx','.jsx','.ts','.js')):raise ValueError('请在 outlines.json 设置 ppt.entry 并导出 deck。')
    source_path(state['module']+'/'+entry)
    files={};binary_assets={}
    def add(name,data):
        if Path(name).suffix.lower() in MEDIA and state.get('binary_assets'):
            obj=project.get('sourceAssets',{}).get(name)
            if not obj or obj['sha256']!=sha256(data).hexdigest() or obj['size']!=len(data):
                if upload is None:raise ValueError('新素材需要通过 push 上传。')
                obj=upload(name,data)
            binary_assets[name]=obj
        elif Path(name).suffix.lower() in MEDIA:files[name]='data:'+(mimetypes.guess_type(name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(data).decode()
        else:files[name]=data.decode('utf-8')
    for module in [state['module'],*state.get('extra_modules',[]),'licenses']:
        for file in sorted((Path('courses')/module).rglob('*')):
            if file.is_symlink():raise ValueError('课程不能包含符号链接。')
            if file.is_file() and file.suffix.lower() in EXTENSIONS|MEDIA:
                name=file.relative_to(Path('courses')).as_posix();source_path(name)
                add(name,file.read_bytes())
    # Only this course's material directory is delivered, not other template examples.
    own_asset=state.get('native_source',{}).get('asset_id') or outline.get('moduleIdentity',{}).get('id') or state['course']
    if not isinstance(own_asset,str) or not re.fullmatch('[A-Za-z0-9_-]{1,100}',own_asset):raise ValueError('课程素材标识不安全。')
    for asset in {own_asset,*state.get('asset_ids',[])}:
        if not re.fullmatch('[A-Za-z0-9_-]{1,100}',asset):raise ValueError('课程素材标识不安全。')
        assets=Path('courses/assets')/asset
        for file in sorted(assets.rglob('*')) if assets.exists() else []:
            if file.is_symlink():raise ValueError('素材不能包含符号链接。')
            if not file.is_file():continue
            name=file.relative_to(Path('courses')).as_posix()
            data=file.read_bytes()
            if name not in project.get('sourceAssets',{}) and file.suffix.lower() not in {'.json','.svg'} and state.get('asset_hashes',{}).get(name)==sha256(data).hexdigest():continue
            source_path(name)
            add(name,data)
    existing={p['id']:p for p in project['pages']};pages=[]
    for item in outline.get('pages',[]):
        pid=item['id'];prior=existing.get(pid,{})
        page={**prior,'id':pid,'format':'react','title':item['title'],'goal':item.get('goal',prior.get('goal','')),'summary':item.get('summary',prior.get('summary','')),
              'note':prior.get('note',''),'ready':True,'designed':True,'revisions':prior.get('revisions',[]),'messages':prior.get('messages',[])}
        page.pop('nativeId',None)
        wrapper='entries/'+sha256(pid.encode()).hexdigest()[:20]+'.tsx'
        files[wrapper]='import {deck} from '+json.dumps('../'+state['module']+'/'+entry)+';export default function Page(){const scene=deck.scenes.find(s=>s.id==='+json.dumps(item.get('sourceScene',pid))+');if(!scene)throw new Error("页面不在 deck 中");return scene.render({complete:()=>{},reset:()=>{},isComplete:false});}'
        page['sourceEntry']=wrapper;pages.append(page)
    if not pages:raise ValueError('请先完成课程内容，并在 outlines.json 登记页面。')
    guide_entry=None
    if outline.get('entry'):
        guide=state['module']+'/'+outline['entry'];source_path(guide)
        if guide not in files:raise ValueError('自学页面入口不存在。')
        name=Path(outline['entry']).stem
        guide_entry='entries/shuku-guide.tsx'
        files[guide_entry]='import React from "react";import * as guide from '+json.dumps('../'+guide)+';export default function Guide(){const Component=guide['+json.dumps(name)+']||guide['+json.dumps(name[:1].upper()+name[1:])+']||guide.default;if(!Component)throw new Error("自学页面没有导出组件");return React.createElement(Component);}'
    # Keep immutable identity and nativeSnapshot; web/local optimistic locks are unchanged.
    if len(files)>500 or sum(len(v.encode()) for v in files.values())>12*1024*1024:raise ValueError('本次源码与新素材超过 500 文件或 12 MiB；请压缩素材后重试。')
    title=outline.get('title',project['title'])
    baseline=project.get('source',{}).get('files',{}).get(state['module']+'/outlines.json')
    if baseline:
        try:
            if json.loads(baseline).get('title')==title:title=project['title']
        except (ValueError,AttributeError):pass
    return {**project,**({'sourceAssets':binary_assets} if state.get('binary_assets') else {}),**({'repositoryName':outline['repositoryName']} if 'repositoryName' in outline else {}),'authoringModule':state['module'],'title':title,'pages':pages,'source':{'files':files},**({'sourceGuideEntry':guide_entry} if guide_entry else {})}


def pull(site,cid,token):
    if Path('project.json').exists() or Path('shuku-state.json').exists() or Path('source').exists() or Path('source').is_symlink():
        raise RuntimeError('本地项目已存在，已保留原文件。请沿用此目录，或在新目录读取服务器版本进行比较。')
    result=request(site,'/local-agent/courses/'+cid+'/project',token)
    project=result['project']
    for name in project.get('source',{}).get('files',{}):source_path(name)
    write('project.json',project)
    write('shuku-state.json',{'origin':origin(site),'course':cid,'expected_revision':result['expected_revision'],'expected_draft':result['expected_draft'],'binary_assets':True})
    for name,text in project.get('source',{}).get('files',{}).items():
        path=source_path(name);path.parent.mkdir(parents=True,exist_ok=True)
        if path.suffix.lower() in MEDIA:path.write_bytes(base64.b64decode(text.split(',',1)[1],validate=True))
        else:path.write_text(text,encoding='utf-8')
    for name,obj in project.get('sourceAssets',{}).items():
        path=source_path(name);path.parent.mkdir(parents=True,exist_ok=True)
        data=binary_request(site,cid,token,digest=obj['sha256'])
        if len(data)!=obj['size']:raise ValueError('素材大小校验失败。')
        path.write_bytes(data)
    print('课程已读取。源码在 source/，页面、大纲和设置在 project.json。')


def push(state,token):
    project=read('project.json')
    if state.get('layout')=='template-v1':project=template_project(state,project,upload=lambda name,data:binary_request(state['origin'],state['course'],token,name,data))
    elif project.get('source') is not None:
        files={};assets={}
        folder=Path('source')
        if not folder.is_dir() or folder.is_symlink():raise RuntimeError('缺少安全的 source/ 目录。')
        for path in sorted(folder.rglob('*')):
            if path.is_symlink():raise ValueError('源码不能包含符号链接。')
            if path.is_file():
                name=path.relative_to(folder).as_posix();source_path(name)
                if state.get('binary_assets') and path.suffix.lower() in MEDIA:
                    data=path.read_bytes();obj=project.get('sourceAssets',{}).get(name)
                    if not obj or obj['sha256']!=sha256(data).hexdigest() or obj['size']!=len(data):obj=binary_request(state['origin'],state['course'],token,name,data)
                    assets[name]=obj
                else:files[name]=path.read_text(encoding='utf-8')
        project['source']={'files':files}
        if state.get('binary_assets'):project['sourceAssets']=assets
    body={'project':project,'expected_revision':state['expected_revision'],'expected_draft':state['expected_draft']}
    digest=sha256(json.dumps(body,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
    pending=state.get('pending')
    if not pending or pending['hash']!=digest:
        state['pending']={'key':str(uuid4()),'hash':digest};write('shuku-state.json',state)
    result=request(state['origin'],'/courses/'+state['course']+'/revisions',token,body,state['pending']['key'])
    state.update(expected_revision=result['id'],expected_draft=None);state.pop('pending',None)
    write('shuku-state.json',state);write('project.json',project)
    print('修订已保存：'+result['id']+'。使用 status 查询构建结果。')


def main(argv=None):
    parser=argparse.ArgumentParser(description='术库本地 Agent 创作')
    parser.add_argument('--origin');parser.add_argument('--course')
    parser.add_argument('action',choices=['prepare','pull','push','status'])
    args=parser.parse_args(argv)
    token=Path('api_token').read_text(encoding='utf-8').strip()
    if args.action in ('prepare','pull'):
        if not args.origin or not args.course:parser.error('首次读取需要 --origin 和 --course')
        (prepare if args.action=='prepare' else pull)(origin(args.origin),args.course,token)
    else:
        state=read('shuku-state.json')
        if args.origin and origin(args.origin)!=state['origin'] or args.course and args.course!=state['course']:
            raise ValueError('参数与本地课程不一致。')
        if args.action=='push':push(state,token)
        else:
            if not state.get('expected_revision'):raise RuntimeError('课程还没有已保存修订。')
            result=request(state['origin'],'/revisions/'+state['expected_revision'],token)
            print({'building':'正在构建','ready':'预览已就绪','failed':'构建失败'}.get(result['state'],result['state']))
            if result.get('build_error'):print(result['build_error'])
            print(state['origin']+'/my-courses/editor?course='+state['course'])
            if result['state']=='failed':return 1
    return 0


if __name__=='__main__':
    try:sys.exit(main())
    except subprocess.SubprocessError:
        print('工程准备或构建失败，请检查 Git/Node 环境和网络。已有本地文件已保留。',file=sys.stderr);sys.exit(1)
    except (OSError,ValueError,RuntimeError) as error:
        print(str(error),file=sys.stderr);sys.exit(1)
