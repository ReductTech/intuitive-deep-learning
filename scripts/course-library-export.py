"""Export committed course content into the independent, one-way distribution repo."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess

SOURCE='ReductTech/intuitive-deep-learning'
TARGET='reduct-shuku/intuitive-deep-learning'
ROOTS=('modules','assets','creator-skill')
INPUTS=(*ROOTS,'package.json','scripts','.github')
WORKFLOW='.github/workflows/course-library-sync.yml'


def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args])


def blob(content):
    return hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()


def export(source,target):
    source=Path(source).resolve();target=Path(target).resolve()
    if source==target or source in target.parents or target in source.parents:raise ValueError('Repositories must be separate')
    if Path(git(target,'rev-parse','--show-toplevel').decode().strip()).resolve()!=target:raise ValueError('Target must be a repository root')
    if git(target,'status','--porcelain','--untracked-files=all'):raise ValueError('Target has independent local changes')
    commit=git(source,'rev-parse','HEAD').decode().strip()
    old_path=target/'.course-files.json'
    old=json.loads(old_path.read_text()) if old_path.exists() else {'files':{}}
    previous=old['files']
    for name,info in previous.items():
        safe_name(name)
        file=target/name
        if file.is_symlink() or not file.is_file() or blob(file.read_bytes())!=info['blob']:raise ValueError('Independent target change: '+name)
    files=dict(previous);modules=[];changed=[]

    def put(name,content,mode='100644'):
        safe_name(name);file=target/name
        for parent in file.parents:
            if parent==target:break
            if parent.is_symlink():raise ValueError('Linked target directory: '+name)
        expected=blob(content)
        if file.exists() and name not in previous:raise ValueError('Unmanaged target file: '+name)
        if not file.exists() or blob(file.read_bytes())!=expected:
            file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(content);file.chmod(0o755 if mode=='100755' else 0o644);changed.append(name)
        files[name]={'blob':expected,'mode':mode}

    records=git(source,'ls-tree','-rz','--full-tree',commit,'--',*ROOTS,WORKFLOW,'scripts/course-library-export.py').split(b'\0')
    process=subprocess.Popen(['git','-C',str(source),'cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    try:
        for record in records:
            if not record:continue
            meta,name=record.split(b'\t',1);mode,kind,sha=meta.decode().split();name=name.decode()
            safe_name(name)
            if kind!='blob' or mode not in ('100644','100755'):raise ValueError('Unsupported course link or object: '+name)
            process.stdin.write(sha.encode()+b'\n');process.stdin.flush()
            header=process.stdout.readline().decode().split()
            if len(header)!=3 or header[1]!='blob' or int(header[2])>32*1024*1024:raise ValueError('Invalid or oversized course object: '+name)
            content=process.stdout.read(int(header[2]));process.stdout.read(1)
            if blob(content)!=sha:raise ValueError('Incomplete course object: '+name)
            put(name,content,mode)
            if name.count('/')==2 and name.startswith('modules/') and name.endswith('/outlines.json'):
                outline=json.loads(content)
                modules.append({'directory':name.split('/')[1],'id':outline.get('id'),'uuid':outline.get('moduleIdentity',{}).get('id'),'title':outline.get('title'),'entry':outline.get('entry'),'ppt':outline.get('ppt')})
    finally:
        process.stdin.close();process.stdout.close();process.wait()
    if not modules:raise ValueError('No registered courses exported')
    package=json.loads(git(source,'show',commit+':package.json'))
    roots={}
    for record in git(source,'ls-tree','-z',commit,'--',*INPUTS).split(b'\0'):
        if record:
            meta,name=record.split(b'\t',1);roots[name.decode()]=meta.decode().split()[2]
    def json_file(name,value):put(name,(json.dumps(value,ensure_ascii=False,indent=2,sort_keys=True)+'\n').encode())
    json_file('package.json',{'name':'@reduct-shuku/intuitive-deep-learning-courses','private':True,'version':'1.0.0','peerDependencies':package.get('dependencies',{})})
    json_file('course-library.json',{'schema':1,'repository':TARGET,'modules':sorted(modules,key=lambda m:m['directory']),'runtime':{'shared':'modules/shared','assets':'modules/*/assets','creatorSkill':'creator-skill','platformApiRequired':True}})
    json_file('source-lock.json',{'schema':1,'repository':SOURCE,'branch':'develop','commit':commit,'inputs':roots,'policy':'add-update-only'})
    put('README.md',f'''# 术库课程分发仓库

编辑源：[ReductTech/intuitive-deep-learning · develop/modules](https://github.com/{SOURCE}/tree/develop/modules)。请在源仓库编辑；这里仅用于课程同步、分发和平台读取。

`main` 包含课程、共享教学组件、课程自带素材及创作规范；原先默认分支保存在 `back`，不强推、不合并两边项目历史。

同步任务约每五分钟检查一次，GitHub 调度可能延迟，也可在 Actions 中手动运行。新增和修改自动同步，本轮不自动删除历史课程文件；目标独立改动会停止同步并报错。

- `modules/`：课程源码、目录与共享组件。
- `modules/<课程>/assets/`：该课程的图片、视频、缩略图和数据；上线通过 OSS/CDN 访问。
- `creator-skill/`：课程创作规范。
- `course-library.json`：课程和运行依赖清单。
- `source-lock.json`：确切来源提交及内容输入版本。

课程需要 React、相应第三方依赖和平台的计算 API；登录、业务数据库、审核和发布后端不在本仓库。平台使用 `IDL_COURSE_LIBRARY_ROOT` 和 `SHUKU_COURSE_ROOT` 指向同一固定提交快照，更新源码后重新构建前端。
'''.encode())
    # The manifest cannot contain its own hash. It is committed alongside the snapshot.
    (target/'.course-files.json').write_text(json.dumps({'schema':1,'files':files},ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    return {'source_commit':commit,'courses':len(modules),'changed':len(changed)}


def safe_name(name):
    parts=PurePosixPath(name).parts
    if not parts or name.startswith('/') or '\\' in name or '..' in parts or any(p in ('.git','node_modules','api_token') or p.startswith('.env') or p.endswith(('.pem','.key')) for p in parts):raise ValueError('Unsafe course path: '+name)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',required=True);parser.add_argument('--target',required=True)
    args=parser.parse_args();print(json.dumps(export(args.source,args.target)))
