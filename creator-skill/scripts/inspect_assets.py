#!/usr/bin/env python3
"""Read-only per-module inventory and optional duplicate hashes; never delete resources."""
from pathlib import Path
import argparse
import hashlib
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from _common import ROOT,resolve_module
from validate_module import validate_modules


def inspect_assets(repository,module,duplicates=False):
    directory,outline=resolve_module(module,repository)
    asset_root=repository/"assets"/outline["moduleIdentity"]["id"]
    files=sorted(path for path in asset_root.rglob("*") if path.is_file() and path.resolve().is_relative_to(asset_root.resolve())) if asset_root.is_dir() else []
    groups={}
    if duplicates:
        for path in files:
            digest=hashlib.sha256()
            with path.open('rb') as stream:
                for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
            groups.setdefault(digest.hexdigest(),[]).append(path.relative_to(asset_root).as_posix())
    return {"module":directory.name,"uuid":outline["moduleIdentity"]["id"],"files":len(files),"bytes":sum(path.stat().st_size for path in files),"duplicateGroups":[paths for paths in groups.values() if len(paths)>1],"errors":validate_modules(repository,module),"limitations":"Duplicates may be intentional. Dynamic references require runtime checks; no unused-file deletion is performed."}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--module',required=True)
    parser.add_argument('--duplicates',action='store_true',help='stream SHA-256 hashes; may take time on large asset folders')
    args=parser.parse_args()
    try:
        result=inspect_assets(ROOT,args.module,args.duplicates)
        print(json.dumps(result,ensure_ascii=False,indent=2));return 1 if result['errors'] else 0
    except (ValueError,OSError) as exc:print(f'Asset inspection failed: {exc}',file=sys.stderr);return 2


if __name__=='__main__':raise SystemExit(main())
