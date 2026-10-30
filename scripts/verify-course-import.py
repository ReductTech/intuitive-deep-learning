"""Read-only package acceptance check; never creates courses or remote repositories."""
import argparse
import hashlib
import json
import mimetypes
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend/src'))
from shuku_backend.course_package import read_zip,normalize,candidates
from shuku_backend.github_course_source import GitHubCourseSource


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    source=parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--zip',type=Path);source.add_argument('--github')
    parser.add_argument('--out',type=Path,required=True);parser.add_argument('--selection');parser.add_argument('--build',action='store_true')
    args=parser.parse_args();out=args.out.resolve()
    if out.exists():parser.error('Output must be a new directory; existing work is preserved.')
    if args.zip:
        with args.zip.open('rb') as content:files=read_zip(content)
        source={'type':'zip','sha256':hashlib.sha256(args.zip.read_bytes()).hexdigest()}
    else:
        client=GitHubCourseSource();source=client.pin(args.github)
        print('Pinned source commit:',source['commit'],flush=True)
        files=client.load(source,lambda state:None);source['type']='github'
    out.mkdir(parents=True)
    text={name:data.decode('utf-8-sig') for name,data in files.items() if Path(name).suffix.lower() in ('.ts','.tsx','.js','.jsx')}
    manifest=out/'inspection.json';manifest.write_text(json.dumps(text),encoding='utf8')
    by_file=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/inspect-course-package.mjs'),str(manifest),'--by-file']))
    choice=args.selection or (candidates(files)[0] if len(candidates(files))==1 else None)
    prefix=str(Path(choice).parent).replace(chr(92),'/') if choice else ''
    ids={pid for name,items in by_file.items() if prefix=='.' or name.startswith(prefix+'/') for pid in items}
    result=normalize(files,choice,ids);assets={};(out/'binary').mkdir()
    for name,data in result['assets'].items():
        digest=hashlib.sha256(data).hexdigest();(out/'binary'/digest).write_bytes(data)
        assets[name]={'sha256':digest,'size':len(data),'mime':mimetypes.guess_type(name)[0] or 'application/octet-stream'}
    project={'version':1,'id':str(uuid4()),'courseId':'custom-'+str(uuid4()),'title':result['summary']['title'],'duration':30,
             'style':'简洁教学','outlineConfirmed':True,'pages':result['pages'],'source':{'files':result['files']},
             'sourceFormatVersion':2,'sourceAssets':assets,'sourceGuideEntry':result['guide'],'authoringModule':result['module'],
             'authoringVersion':json.loads((ROOT/'local-authoring.lock.json').read_text())['commit'],'importOrigin':source}
    (out/'project.json').write_text(json.dumps(project,ensure_ascii=False),encoding='utf8')
    (out/'report.json').write_text(json.dumps(result['summary'],ensure_ascii=False,indent=2),encoding='utf8')
    manifest.unlink()
    if args.build:subprocess.run(['node',str(ROOT/'scripts/build-shuku-preview.mjs'),'--course-root',str(ROOT),'--project',str(out/'project.json'),'--asset-root',str(out/'binary'),'--revision',project['id'],'--outdir',str(out/'dist')],check=True,cwd=ROOT)
    print(json.dumps(result['summary'],ensure_ascii=False),flush=True)


if __name__=='__main__':main()
