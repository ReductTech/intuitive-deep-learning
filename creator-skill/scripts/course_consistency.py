#!/usr/bin/env python3
"""Compare approved outline with actual Guide, SceneDeck and speaker notes; no source rewriting."""
from pathlib import Path
import argparse
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from _common import ROOT, resolve_module
from capture_slides import browser_session, capture_url


def compare_course(outline,snapshot):
    errors=[];warnings=[]
    expected=[page["id"] for page in outline["pages"]]
    scenes=snapshot.get("scenes")
    guide=snapshot.get("guideIds")
    if not isinstance(scenes,list) or any(not isinstance(scene,dict) or not isinstance(scene.get("id"),str) for scene in scenes):
        return {"errors":["Runtime scenes must be an array of objects with IDs"],"warnings":[]}
    actual=[scene["id"] for scene in scenes]
    if actual!=expected: errors.append(f"PPT order differs: expected {expected}, got {actual}")
    if len(set(actual))!=len(actual): errors.append("Duplicate PPT scene IDs")
    if not isinstance(guide,list) or guide!=expected: errors.append(f"Guide order differs or is unavailable: expected {expected}, got {guide}")
    by_id={scene["id"]:scene for scene in scenes}
    normalize=lambda value:" ".join(str(value).split())
    for page in outline["pages"]:
        scene=by_id.get(page["id"])
        if not scene: continue
        if scene.get("title")!=page.get("title"): warnings.append(f"{page['id']}: outline and PPT titles differ")
        if normalize(page.get("snippet","")) and normalize(scene.get("notesText",""))!=normalize(page["snippet"]): warnings.append(f"{page['id']}: speaker notes differ from the outline or are unavailable")
    return {"errors":errors,"warnings":warnings}


def runtime_snapshot(context,base_url,outline):
    page=context.new_page()
    try:
        page.goto(capture_url(base_url,outline.get("id") or outline["path"].split("/")[-1]),wait_until="domcontentloaded",timeout=60000)
        page.locator("[data-scene-deck-capture]").wait_for(timeout=60000)
        snapshot=page.evaluate("""async path => {
            const {activeModules}=await import('/src/app/modules.tsx');
            const module=activeModules.find(item=>item.path===path);
            if(!module?.pptDeck) throw Error('No runtime deck metadata for this module');
            return {scenes:module.pptDeck.scenes.map(scene=>({id:scene.id,title:scene.title,notesText:(module.getPptNotes?.(scene.id) || []).map(note=>note.text).join(' ')}))};
        }""",outline["path"])
        page.goto(base_url+outline["path"],wait_until="domcontentloaded",timeout=60000)
        flow=page.locator('.edu-lesson-flow').first
        flow.wait_for(timeout=15000)
        key=flow.get_attribute('data-state-key')
        if not key: raise ValueError("Guide does not expose a LessonFlow state key")
        page.evaluate("""({key,ids})=>localStorage.setItem(key,JSON.stringify({visibleCount:1000000,completedIds:ids,completed:false}))""",{"key":key,"ids":[p["id"] for p in outline["pages"]]})
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("count => document.querySelectorAll('.edu-lesson-flow-step').length >= Math.min(2,count)",arg=len(outline["pages"]),timeout=15000)
        page.wait_for_timeout(500)
        snapshot["guideIds"]=page.locator('.edu-lesson-flow-step').evaluate_all("elements=>elements.map(element=>element.dataset.stepId)")
        return snapshot
    finally: page.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--module",required=True)
    parser.add_argument("--base-url",help="running Vite URL; omit to start a temporary Vite")
    parser.add_argument("--snapshot",type=Path,help="compare a previously captured runtime snapshot without a browser")
    parser.add_argument("--save-snapshot",type=Path)
    args=parser.parse_args()
    try:
        _,outline=resolve_module(args.module)
        if args.snapshot: snapshot=json.loads(args.snapshot.read_text(encoding="utf-8-sig"))
        else:
            with browser_session(args.base_url,reset_storage=False) as (context,address): snapshot=runtime_snapshot(context,address,outline)
        result=compare_course(outline,snapshot)
        if args.save_snapshot:
            args.save_snapshot.parent.mkdir(parents=True,exist_ok=True)
            args.save_snapshot.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding="utf-8")
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 1 if result["errors"] else 0
    except Exception as exc:
        print(f"Course comparison could not complete: {exc}",file=sys.stderr);return 2


if __name__=="__main__": raise SystemExit(main())
