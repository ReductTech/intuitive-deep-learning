from pathlib import Path
from hashlib import sha256
import json
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root.parent / 'creator-skill/scripts'))
from common.image_policy import inspect_image

report_file = root / 'outputs/images-in-place.json'
report = json.loads(report_file.read_text(encoding='utf-8'))
refs = json.loads((root / 'outputs/image-reference-checks.json').read_text(encoding='utf-8'))
imports = json.loads((root / 'outputs/asset-import-checks.json').read_text(encoding='utf-8'))
assert report['complete'] and not report['errors']
assert refs['applied'] and not refs['blocked'] and not imports['errors']
removals = []
for row in report['images']:
    if row['status'] != 'converted':
        continue
    source, target = root / row['source'], root / row['target']
    assert source.resolve().is_relative_to((root / 'modules').resolve())
    assert target.resolve().is_relative_to((root / 'modules').resolve())
    assert 'shared' not in source.relative_to(root).parts
    assert sha256(target.read_bytes()).hexdigest() == row['targetSha256'], target
    inspect_image(target.as_posix(), target.read_bytes())
    if source != target:
        assert sha256(source.read_bytes()).hexdigest() == row['sourceSha256'], source
        removals.append(source)
for source in removals:
    source.unlink()
report['oldFormatsRemoved'] = len(removals)
report['netBytesSaved'] = sum(row.get('beforeBytes',0)-row.get('afterBytes',0) for row in report['images'])
report_file.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'converted':sum(row['status']=='converted' for row in report['images']),
                  'removedOldFormats':len(removals),'netBytesSaved':report['netBytesSaved']}))
