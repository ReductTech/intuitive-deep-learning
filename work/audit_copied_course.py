from pathlib import Path
import re,hashlib,json
repo=Path.cwd();root=repo/'modules/Creator-Guide/components/workflow/copied-course';asset=repo/'assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/convolution-course';sourceAsset=repo/'assets/38cd1c79-d8b7-462a-b208-a567c5cd89c4'
issues=[]
for file in root.rglob('*'):
    if not file.is_file() or file.suffix not in ['.ts','.tsx','.css']:continue
    text=file.read_text(encoding='utf-8')
    for bad in ['38cd1c79-d8b7-462a-b208-a567c5cd89c4','Convolution-Kernel-Intro','modules-legacy','localStorage','sessionStorage']:
        if bad in text:issues.append([str(file),bad])
    for path in re.findall(r'''(?:from\s+|import\s*)['"](\.[^'"]+)['"]''',text):
        target=(file.parent/path).resolve()
        if not (target.is_relative_to(root) or target.is_relative_to(repo/'modules/shared')):issues.append([str(file),'outside import',path])
    for path in re.findall(r'''moduleAssetUrl\([^,\n]+,\s*['"]workflow/convolution-course/([^'"]+)['"]''',text):
        if not (asset/path).is_file():issues.append([str(file),'missing asset',path])
files=[p for p in sourceAsset.rglob('*') if p.is_file()]
for file in files:
    clone=asset/file.relative_to(sourceAsset)
    if not clone.exists() or hashlib.sha256(file.read_bytes()).digest()!=hashlib.sha256(clone.read_bytes()).digest():issues.append(['asset mismatch',str(file)])
print(json.dumps({'copiedAssets':len(files),'bytes':sum(p.stat().st_size for p in files),'issues':issues},ensure_ascii=False,indent=2))
assert not issues

