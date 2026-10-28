#!/usr/bin/env python3
"""Local authoring client, Python standard library only. No ZIP or account password."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from uuid import uuid4

EXTENSIONS={'.tsx','.ts','.jsx','.js','.css','.json','.svg'}


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


def source_path(name):
    path=Path(name)
    if not name or ':' in name or chr(92) in name or path.is_absolute() or any(p in ('','.','..') or p.startswith('.') for p in name.split('/')) or path.suffix.lower() not in EXTENSIONS:
        raise ValueError('源码路径不安全：'+name)
    target=Path('source')/path
    if target.is_symlink() or not target.resolve().is_relative_to(Path('source').resolve()):
        raise ValueError('源码路径不能指向目录之外。')
    return target


def pull(site,cid,token):
    if Path('project.json').exists() or Path('shuku-state.json').exists() or Path('source').exists() or Path('source').is_symlink():
        raise RuntimeError('本地项目已存在，已保留原文件。请沿用此目录，或在新目录读取服务器版本进行比较。')
    result=request(site,'/local-agent/courses/'+cid+'/project',token)
    project=result['project']
    for name in project.get('source',{}).get('files',{}):source_path(name)
    write('project.json',project)
    write('shuku-state.json',{'origin':origin(site),'course':cid,'expected_revision':result['expected_revision'],'expected_draft':result['expected_draft']})
    for name,text in project.get('source',{}).get('files',{}).items():
        path=source_path(name);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')
    print('课程已读取。源码在 source/，页面、大纲和设置在 project.json。')


def push(state,token):
    project=read('project.json')
    if project.get('source') is not None:
        files={}
        folder=Path('source')
        if not folder.is_dir() or folder.is_symlink():raise RuntimeError('缺少安全的 source/ 目录。')
        for path in sorted(folder.rglob('*')):
            if path.is_symlink():raise ValueError('源码不能包含符号链接。')
            if path.is_file():
                name=path.relative_to(folder).as_posix();source_path(name)
                files[name]=path.read_text(encoding='utf-8')
        project['source']={'files':files}
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
    parser.add_argument('action',choices=['pull','push','status'])
    args=parser.parse_args(argv)
    token=Path('api_token').read_text(encoding='utf-8').strip()
    if args.action=='pull':
        if not args.origin or not args.course:parser.error('首次读取需要 --origin 和 --course')
        pull(origin(args.origin),args.course,token)
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
    except (OSError,ValueError,RuntimeError) as error:
        print(str(error),file=sys.stderr);sys.exit(1)
