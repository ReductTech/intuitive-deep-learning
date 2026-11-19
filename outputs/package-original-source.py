"""Archive the original source inventory directly; never stage source copies."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root.parent / 'creator-skill/scripts'))
from module.source_checks import inspect_collection
from common.image_policy import inspect_image, IMAGE_SUFFIXES
from common.skzip import MAX_FILE_BYTES, MAX_BYTES, MAX_FILES

files, source_report = inspect_collection([root])
(root/'outputs/submission-source-checks.json').write_text(json.dumps(source_report, ensure_ascii=False, indent=2), encoding='utf-8')
assert source_report['status'] == 'passed', 'Source checks failed'
types = json.loads((root/'outputs/submission-typechecks.json').read_text(encoding='utf-8'))
builds = json.loads((root/'outputs/build-validation.json').read_text(encoding='utf-8'))
assert len(types) == 31 and sum(row['status'] == 'passed' for row in types) == 30
assert all(row['status'] in {'passed', 'not-applicable'} for row in types)
assert len(builds['courses']) == 30 and all(row['status'] == 'passed' for row in builds['courses'])
assert builds['stagingDirectoriesCreated'] is False

registry = json.loads((root/'course-styles.json').read_text(encoding='utf-8'))
transport_registry = dict(registry)
transport_registry['styles'] = source_report['styleRegistry']['styles']
assert registry['default_style'] in {style['id'] for style in transport_registry['styles']}
registry_bytes = (json.dumps(transport_registry, ensure_ascii=False, indent=2)+'\n').encode('utf-8')

image_count = 0
records = []
for name, path in sorted(files.items()):
    data = path.read_bytes()
    assert len(data) <= MAX_FILE_BYTES, name
    if path.suffix.lower() in IMAGE_SUFFIXES:
        inspect_image(name, data)
        image_count += 1
    records.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
assert len(records)+1 < MAX_FILES
assert sum(row['bytes'] for row in records)+len(registry_bytes) <= MAX_BYTES

destination = root/'outputs/intuitive-deep-learning-source.zip'
if destination.exists():
    destination = destination.with_name('intuitive-deep-learning-source-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.zip')
with zipfile.ZipFile(destination, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for row in records:
        path = files[row['path']]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256'], 'Source changed: '+str(path)
        archive.write(path, row['path'])
    archive.writestr('course-styles.json', registry_bytes)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(files) | {'course-styles.json'}
    for row in records:
        assert hashlib.sha256(archive.read(row['path'])).hexdigest() == row['sha256'], row['path']
    assert archive.read('course-styles.json') == registry_bytes

report = {
    'createdAt': datetime.now(timezone.utc).isoformat(),
    'archive': str(destination), 'source': str(root),
    'stagingDirectoriesCreated': False, 'sourceCopiedForConversion': False,
    'sourceChecks': 'passed', 'typechecks': {'passed': 30, 'outlineOnlyDrafts': 1, 'failed': 0},
    'builds': {'passed': 30, 'failed': 0, 'report': 'build-validation.json'},
    'imageChecks': {'passed': image_count},
    'zipIntegrity': 'CRC and SHA-256 verified against original files',
    'bytes': destination.stat().st_size, 'expandedBytes': sum(row['bytes'] for row in records)+len(registry_bytes),
    'files': len(records)+1, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
    'styleRegistry': transport_registry,
    'researchCourse': {'publishedPages': 6, 'preservedDraftPages': 26, 'originalPageOrderPreserved': True},
    'serverAdmissionSecurityBuildThumbnailsAndContentReview': 'not performed; independent server checks required',
    'uploaded': False, 'sourceFiles': records,
}
destination.with_suffix('.report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({key: value for key, value in report.items() if key != 'sourceFiles'}, ensure_ascii=False), flush=True)
