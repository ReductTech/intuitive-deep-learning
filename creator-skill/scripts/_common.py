"""Small shared path and metadata helpers for authoring commands."""
from pathlib import Path
import json
import os
import sys

SCRIPTS = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("IDL_REPOSITORY_ROOT", str(SCRIPTS.parents[1]))).resolve()
sys.path[:0] = [str(ROOT / "backend/src"), str(SCRIPTS)]


def read_modules(root=ROOT):
    for path in sorted((root / "modules").glob("*/outlines.json")):
        document = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(document, dict): raise ValueError(f"Invalid outline: {path}")
        yield path.parent, document


def resolve_module(requested, root=ROOT):
    matches=[(directory,doc) for directory,doc in read_modules(root) if requested.lower() in {
        directory.name.lower(), str(doc.get("id",directory.name)).lower(), str(doc.get("moduleIdentity",{}).get("id","")).lower()}]
    if len(matches)!=1: raise ValueError(f"Expected one module matching {requested!r}; found {len(matches)}")
    return matches[0]
