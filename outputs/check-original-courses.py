from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
skill = root.parent / 'creator-skill'
shuku = root.parent / 'Shuku'
sys.path.insert(0, str(skill / 'scripts'))
from common.image_policy import inspect_image, IMAGE_SUFFIXES
from media.prepare_videos import dimensions, verify

ffprobe = next((Path.home() / 'AppData/Local/Microsoft/WinGet/Packages').rglob('ffprobe.exe'))
report = {'images': [], 'media': [], 'types': [], 'build': 'unverified', 'browser': 'unverified'}
modules = sorted(p for p in (root / 'modules').iterdir() if (p / 'outlines.json').is_file())
for module in modules:
    for file in module.rglob('*'):
        if not file.is_file():
            continue
        if file.suffix.lower() in IMAGE_SUFFIXES:
            try:
                info = inspect_image(file.name, file.read_bytes())
                report['images'].append({'path': file.relative_to(root).as_posix(), 'status': 'passed', **info})
            except Exception as error:
                report['images'].append({'path': file.relative_to(root).as_posix(), 'status': 'failed', 'error': str(error)})
        if file.suffix.lower() in {'.mp4', '.m4a'}:
            result = subprocess.run([str(ffprobe), '-v','error','-show_streams','-show_format','-of','json',str(file)],capture_output=True,text=True,encoding='utf-8')
            try:
                doc = json.loads(result.stdout)
                if result.returncode:
                    raise ValueError(result.stderr)
                if file.suffix == '.mp4':
                    verify(doc, doc, dimensions(next(s for s in doc['streams'] if s['codec_type']=='video')))
                else:
                    assert len(doc['streams']) == 1 and doc['streams'][0]['codec_name'] == 'aac' and doc['streams'][0]['profile'] == 'LC'
                report['media'].append({'path':file.relative_to(root).as_posix(),'status':'passed'})
            except Exception as error:
                report['media'].append({'path':file.relative_to(root).as_posix(),'status':'failed','error':str(error)})
print(json.dumps({'images':len(report['images']),'imageErrors':sum(i['status']=='failed' for i in report['images']),
                  'mediaErrors':[i for i in report['media'] if i['status']=='failed']}),flush=True)

if '--media-only' in sys.argv:
    saved = json.loads((root/'outputs/original-course-checks.json').read_text(encoding='utf-8'))
    report['types'] = saved['types']
    (root/'outputs/original-course-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    raise SystemExit(0)

def types(module):
    doc = json.loads((module / 'outlines.json').read_text(encoding='utf-8-sig'))
    if not (doc.get('entry') or doc.get('ppt',{}).get('entry')):
        return {'module':module.name,'status':'not-applicable'}
    result = subprocess.run(['node',str(skill / 'scripts/checks/typecheck_course.mjs'),str(root),module.name,str(shuku)],
                            capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=300)
    try:
        data = json.loads(result.stdout)
    except ValueError:
        data = {'status':'error','message':result.stderr[-4000:]}
    return {'module':module.name,'exitCode':result.returncode,**data}

with ThreadPoolExecutor(max_workers=2) as pool:
    jobs = [pool.submit(types,module) for module in modules]
    for job in as_completed(jobs):
        row = job.result()
        report['types'].append(row)
        (root/'outputs/original-course-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print('Typecheck '+row['module']+': '+row['status'],flush=True)
