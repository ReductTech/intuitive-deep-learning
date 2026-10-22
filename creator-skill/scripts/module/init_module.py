#!/usr/bin/env python3
"""Initialize a course skeleton from an approved outline; never overwrite a module."""
from pathlib import Path
import argparse
import json
import re
import sys
import tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from _common import ROOT, read_modules
from module.module_identity import new_identity, register_identity


def plan_module(root, directory, outline):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", directory): raise ValueError("Invalid module directory name")
    target=root/"modules"/directory
    if target.exists(): raise ValueError(f"Module already exists: {target}")
    doc=json.loads(json.dumps(outline))
    if not isinstance(doc,dict) or not isinstance(doc.get("title"),str) or not doc["title"].strip(): raise ValueError("Outline needs a title")
    if "moduleIdentity" in doc: raise ValueError("Remove copied moduleIdentity before initializing a new course")
    pages=doc.get("pages")
    if not isinstance(pages,list) or not pages: raise ValueError("Outline needs a nonempty pages array")
    ids=set()
    for page in pages:
        if not isinstance(page,dict) or not isinstance(page.get("id"),str) or not page["id"].strip() or not isinstance(page.get("title"),str) or not page["title"].strip(): raise ValueError("Every page needs nonempty id and title")
        if page["id"] in ids: raise ValueError(f"Duplicate page ID: {page['id']}")
        ids.add(page["id"])
    seen={}
    for existing,metadata in read_modules(root): register_identity(metadata.get("moduleIdentity"),existing/"outlines.json",seen)
    doc.update({"id":doc.get("id") or directory.lower(),"path":"/modules/"+directory.lower(),"entry":"GuidePage.tsx","ppt":{"entry":"CoursePpt.tsx","path":"/scenedeck/","player":False},"moduleIdentity":new_identity(seen)})
    if any(metadata.get("id", existing.name)==doc["id"] for existing,metadata in read_modules(root)): raise ValueError("Duplicate module slug")
    if not isinstance(doc["id"],str) or not doc["id"].strip(): raise ValueError("Invalid module slug")
    if (root/"assets"/doc["moduleIdentity"]["id"]).exists(): raise ValueError("Generated UUID asset directory already exists")
    guide='''import { useRef, type ReactNode } from 'react';
import { Button, LessonFlow, ModuleShell } from '../shared/react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import { scenes } from './course';
import outline from './outlines.json';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
function Canvas({children}:{children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null); const scale=useSceneScale(ref);
  return <div ref={ref} style={{width:'100%',aspectRatio:'16 / 9',position:'relative'}}><div className="course-page-surface course-shell" style={{width:1600,height:900,transform:`scale(${scale})`,transformOrigin:'top left'}}>{children}</div></div>;
}
const steps=scenes.map((scene,index)=>({id:scene.id,completesLesson:index===scenes.length-1,render:(context:Parameters<typeof scene.render>[0])=><><Canvas>{scene.render(context)}</Canvas><Button onClick={context.complete}>继续</Button></>}));
export function GuidePage(){return <ModuleShell title={outline.title} subtitle={outline.description || ''}><LessonFlow steps={steps} persistenceKey={outline.moduleIdentity.id+':guide'}/></ModuleShell>;}
'''
    course='''import { ContentBlock } from '../shared/react';
import type { SceneDefinition, SpeakerNote } from '../shared/react/presentation';
import outline from './outlines.json';
// Engineering scaffold only. Implement each page after its design is confirmed.
export const scenes:SceneDefinition[]=outline.pages.map(page=>({id:page.id,title:page.title,section:'',render:()=> <ContentBlock title={page.title}/> }));
export function getPptNotes(id:string):SpeakerNote[]{const page=outline.pages.find(page=>page.id===id);return page?.snippet?[{text:page.snippet,selectors:[]}]:[];}
'''
    # Ensure optional source fields are present so generated JSON inference stays valid.
    doc.setdefault("description","")
    if not isinstance(doc["description"],str):raise ValueError("Description must be a string")
    for page in doc["pages"]:
        page.setdefault("snippet","")
        if not isinstance(page["snippet"],str):raise ValueError("Page snippet must be a string")
    ppt='''import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import outline from './outlines.json';
import { scenes, getPptNotes } from './course';
export { getPptNotes };
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:outline.description,scenes};
export function CoursePpt(){return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={outline.moduleIdentity.id+':ppt'} getNotes={getPptNotes}/>;}
'''
    return doc,{"outlines.json":json.dumps(doc,ensure_ascii=False,indent=2)+"\n","GuidePage.tsx":guide,"CoursePpt.tsx":ppt,"course.tsx":course}


def initialize(root,directory,outline,dry_run=False):
    doc,files=plan_module(root,directory,outline)
    if not dry_run:
        work=root/"work";work.mkdir(exist_ok=True)
        (root/"modules").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="module-init-",dir=work) as temporary:
            stage=Path(temporary).resolve()
            if not stage.is_relative_to(work.resolve()): raise ValueError("Staging directory escaped workspace")
            for name,content in files.items(): (stage/name).write_text(content,encoding="utf-8")
            asset_target=root/"assets"/doc["moduleIdentity"]["id"]
            asset_target.mkdir(parents=True,exist_ok=False)
            try:
                # On Windows, rename fails if another process created the destination.
                stage.rename(root/"modules"/directory)
            except OSError:
                asset_target.rmdir()  # only the empty directory just created by this run
                raise
    return {"module":directory,"uuid":doc["moduleIdentity"]["id"],"files":list(files),"dry_run":dry_run}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory",required=True)
    parser.add_argument("--outline",type=Path,required=True)
    parser.add_argument("--repository",type=Path,default=ROOT)
    parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args()
    try:
        print(json.dumps(initialize(args.repository.resolve(),args.directory,json.loads(args.outline.read_text(encoding="utf-8-sig")),args.dry_run),ensure_ascii=False))
        return 0
    except (OSError,ValueError) as exc:
        print(f"Initialization failed: {exc}",file=sys.stderr);return 1


if __name__=="__main__": raise SystemExit(main())
