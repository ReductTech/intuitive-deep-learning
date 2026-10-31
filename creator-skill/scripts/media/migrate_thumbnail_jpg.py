#!/usr/bin/env python3
"""Normalize course thumbnail directories to 320x180 JPEG, preserving legacy URL aliases.

Existing JPGs take precedence, so freshly captured pages are never replaced by
stale PNGs. Ordinary course images and scratch screenshots are left untouched.
"""
import argparse
import json
from pathlib import Path
from PIL import Image
try:
    from media.thumbnail_profiles import THUMBNAIL_SIZE, save_thumbnail
except ModuleNotFoundError:
    from thumbnail_profiles import THUMBNAIL_SIZE, save_thumbnail

ROOT = Path(__file__).resolve().parents[3]
THUMBNAIL_DIRS = {'scenedeck-thumbnails', 'course-thumbnails'}


def migrate(root=ROOT):
    index_file = root / 'modules/shared/asset-index.json'
    runtime_file = root / 'modules/shared/react/asset-formats.json'
    index = json.loads(index_file.read_text(encoding='utf-8'))
    runtime = json.loads(runtime_file.read_text(encoding='utf-8'))
    # Match scripts/module-assets.mjs: newer courses may not yet be in the
    # checked-in roots table, but their outline UUID owns their assets.
    for outline in (root / 'modules').glob('*/outlines.json'):
        identity = json.loads(outline.read_text(encoding='utf-8')).get('moduleIdentity', {}).get('id')
        assets = outline.parent / 'assets'
        if identity and assets.is_dir():
            index.setdefault('roots', {})[identity] = assets.relative_to(root).as_posix()
    aliases = index.setdefault('formats', {})
    files = sorted({p.resolve() for p in (root / 'modules').rglob('*')
                    if p.is_file() and 'assets' in p.parts and '_scratchpad' not in p.parts
                    and THUMBNAIL_DIRS.intersection(p.parts)
                    and p.suffix.lower() in {'.png', '.jpeg', '.webp', '.jpg'}})
    converted = removed = 0
    # Write and validate every replacement before deleting any original.
    for source in files:
        target = source.with_suffix('.jpg')
        if not target.exists():
            with Image.open(source) as image:
                save_thumbnail(image, target)
            converted += 1
        with Image.open(target) as image:
            resized = image.copy() if image.size != THUMBNAIL_SIZE else None
        if resized is not None:
            save_thumbnail(resized, target)
        with Image.open(target) as image:
            assert image.format == 'JPEG', target
            image.verify()
    for target in sorted({p.with_suffix('.jpg') for p in files}):
        for namespace, directory in index['roots'].items():
            asset_root = (root / directory).resolve()
            if not target.is_relative_to(asset_root):
                continue
            relative = target.relative_to(asset_root).as_posix()
            for extension in ('.png', '.jpeg', '.webp'):
                key = namespace + '/' + str(Path(relative).with_suffix(extension)).replace('\\', '/')
                aliases[key] = runtime[key] = relative
    # Canonicalize previous aliases, including historical aliases with other names.
    for mapping in (aliases, runtime):
        for key, value in list(mapping.items()):
            if THUMBNAIL_DIRS.intersection(Path(value).parts):
                namespace = key.split('/')[0]
                directory = index['roots'].get(namespace)
                canonical = str(Path(value).with_suffix('.jpg')).replace('\\', '/')
                if directory and (root / directory / canonical).is_file():
                    mapping[key] = canonical
    index_file.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    runtime_file.write_text(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    for source in files:
        if source.suffix.lower() != '.jpg':
            assert source.is_relative_to((root / 'modules').resolve())
            source.unlink()
            removed += 1
    return {'thumbnailCount': len({p.with_suffix('.jpg') for p in files}),
            'converted': converted, 'removedOldFiles': removed}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    print(json.dumps(migrate(), ensure_ascii=False))
