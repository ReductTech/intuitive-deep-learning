from pathlib import Path
import json
import os

root = Path(__file__).resolve().parents[1]
converted = json.loads((root / 'outputs/images-in-place.json').read_text(encoding='utf-8'))
checks = json.loads((root / 'outputs/image-reference-checks.json').read_text(encoding='utf-8'))
maps = {}
for row in converted['images']:
    if row['status'] == 'converted' and row['source'] != row['target']:
        parts = Path(row['source']).parts
        if parts[2] == 'assets':
            maps.setdefault(parts[1], {})[Path(*parts[3:]).as_posix()] = Path(*Path(row['target']).parts[3:]).as_posix()
edits = {}
for course in checks['courses']:
    for issue in course['unresolved']:
        if issue['kind'] != 'ambiguous-path':
            continue
        candidates = issue['detail']
        assert isinstance(candidates, list), issue
        targets = {Path(maps[course['module']][name]).name for name in candidates}
        assert len(targets) == 1 and Path(issue['expression']).name == issue['expression'], issue
        file = root / 'modules' / course['module'] / issue['file']
        text = edits.get(file, file.read_bytes().decode('utf-8'))
        edits[file] = text.replace(issue['expression'], targets.pop())

module = root / 'modules/56a1d5b2-a439-4ee3-8f63-fd63ac09c741'
file = module / 'pages/EvacuationPage/landscape.ts'
text = file.read_bytes().decode('utf-8')
rows = [f"  '{p.name}': 'evacuation/models/{p.name}'," for p in sorted((module / 'assets/evacuation/models').iterdir()) if p.suffix in {'.gltf', '.glb'}]
definition = 'const landscapeModelPaths: Record<string, string> = {\n' + '\n'.join(rows) + '\n};\n'
text = text.replace('type Placement=', definition + 'type Placement=')
text = text.replace('moduleAssetUrl(`evacuation/models/${name}.${ext}`)', 'moduleAssetUrl(landscapeModelPaths[`${name}.${ext}`])')
edits[file] = text

file = root / 'modules/80396753-7fc8-4f55-9188-bddbdb828169/game/player/html.ts'
edits[file] = file.read_bytes().decode('utf-8').replace('/yuhuanong/anchor_face.jpg', '/yuhuanong/anchor_face.webp')

# Review screenshots stay in their original documentation folder too.
docs = [row for row in converted['images'] if row['status'] == 'converted' and Path(row['source']).parts[2] != 'assets']
extensions = {'.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.css', '.json', '.md', '.py', '.html'}
for module_id in {Path(row['source']).parts[1] for row in docs}:
    module = root / 'modules' / module_id
    for file in module.rglob('*'):
        if not file.is_file() or file.suffix not in extensions:
            continue
        try:
            text = edits.get(file, file.read_bytes().decode('utf-8'))
        except UnicodeDecodeError:
            continue
        original = text
        for row in docs:
            source, target = root / row['source'], root / row['target']
            if not source.is_relative_to(module):
                continue
            for old, new in [(row['source'], row['target']), (source.relative_to(module).as_posix(), target.relative_to(module).as_posix()),
                             (os.path.relpath(source, file.parent).replace('\\', '/'), os.path.relpath(target, file.parent).replace('\\', '/'))]:
                if old != new:
                    text = text.replace(old, new)
        if text != original:
            edits[file] = text
for file, text in edits.items():
    assert file.resolve().is_relative_to((root / 'modules').resolve())
    file.write_bytes(text.encode('utf-8'))
print('Updated original reference files:', len(edits))
