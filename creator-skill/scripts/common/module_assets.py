"""Resolve module-owned files while retaining stable OSS UUID namespaces."""
import json
from pathlib import Path


def asset_roots(root):
    root = Path(root)
    index = root / 'modules/shared/asset-index.json'
    roots = json.loads(index.read_text(encoding='utf-8'))['roots'] if index.is_file() else {}
    for outline in (root / 'modules').glob('*/outlines.json'):
        uid = json.loads(outline.read_text(encoding='utf-8-sig')).get('moduleIdentity', {}).get('id')
        if uid:
            roots[uid] = (outline.parent / 'assets').relative_to(root).as_posix()
    return roots


def asset_directory(root, uid):
    root = Path(root).resolve()
    relative = asset_roots(root).get(uid)
    target = (root / relative).resolve() if relative else root / 'assets' / uid
    legacy = root / 'assets' / uid
    if not target.exists() and legacy.is_dir():
        target = legacy
    if not target.is_relative_to(root):
        raise ValueError('Asset directory leaves repository')
    return target


def object_relative(root, file):
    root, file = Path(root).resolve(), Path(file).resolve()
    # Prefer canonical ownership; aliases can point into a legacy subtree.
    for uid, relative in asset_roots(root).items():
        directory = (root / relative).resolve()
        if file.is_relative_to(directory):
            return uid + '/' + file.relative_to(directory).as_posix()
    raise ValueError('File is not in a registered module assets directory: ' + str(file))


def object_relatives(root, file):
    root, file = Path(root).resolve(), Path(file).resolve()
    return [uid+'/'+file.relative_to((root/relative).resolve()).as_posix()
            for uid,relative in asset_roots(root).items()
            if file.is_relative_to((root/relative).resolve())]


def asset_relative(root, uid, name):
    index = Path(root) / 'modules/shared/asset-index.json'
    formats = json.loads(index.read_text(encoding='utf-8'))['formats'] if index.is_file() else {}
    return formats.get(uid+'/'+name, name)
