from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import json
import subprocess

root = Path(__file__).resolve().parents[1]
modules = sorted(path for path in (root/'modules').iterdir() if (path/'outlines.json').is_file())
report = root/'outputs/submission-typechecks.json'

def check(module):
    outline = json.loads((module/'outlines.json').read_text(encoding='utf-8-sig'))
    if not (outline.get('entry') or outline.get('ppt',{}).get('entry')):
        return {'module':module.name,'title':outline['title'],'status':'not-applicable','reason':'Outline-only draft'}
    process = subprocess.run(['node',str(root/'outputs/typecheck-original-course.mjs'),str(root),module.name,str(root.parent/'Shuku')],
                             capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=300)
    return {'module':module.name,'title':outline['title'],'exitCode':process.returncode,**json.loads(process.stdout)}

rows = []
with ThreadPoolExecutor(max_workers=2) as pool:
    for result in as_completed([pool.submit(check,module) for module in modules]):
        row = result.result()
        rows.append(row)
        report.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
        print(row['module']+': '+row['status'],flush=True)
print(json.dumps({'passed':sum(row['status']=='passed' for row in rows),'failed':[row for row in rows if row['status'] not in {'passed','not-applicable'}]},ensure_ascii=False),flush=True)
