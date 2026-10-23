from pathlib import Path
import json,shutil
pages=json.loads(Path('modules/Creator-Guide/components/workflow/convolutionOutline.json').read_text(encoding='utf-8'))
source=Path('assets/38cd1c79-d8b7-462a-b208-a567c5cd89c4/scenedeck-thumbnails')
target=Path('assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/course-thumbnails');target.mkdir(exist_ok=True)
missing=[]
for p in pages:
    name=p['id']+'.png'
    if (source/name).exists():shutil.copyfile(source/name,target/name)
    else:missing.append(p['id'])
print('Missing:',missing)
