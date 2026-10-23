#!/usr/bin/env python3
"""Generate missing module UUIDs or check them without installing the backend package."""
from __future__ import annotations

import sys as _sys
from pathlib import Path as _Path
_TOOL_ROOT = _Path(__file__).resolve().parents[2]
_sys.path[:0] = [str(_TOOL_ROOT / "backend/src"), str(_TOOL_ROOT / "creator-skill/scripts"), str(_Path(__file__).resolve().parent)]

import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
import uuid

TOOL_REPOSITORY = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(TOOL_REPOSITORY / "backend/src"))
from idl_backend.contracts.identity import IDENTITY_FIELD, IDENTITY_VERSION, IdentityError, register_identity

ROOT = Path(os.environ.get("IDL_REPOSITORY_ROOT", str(TOOL_REPOSITORY))).resolve()
MODULES_DIR = ROOT / "modules"


def new_identity(existing_ids):
    module_id = str(uuid.uuid4())
    while module_id in existing_ids:
        module_id = str(uuid.uuid4())
    return {"version": IDENTITY_VERSION, "id": module_id}


def _atomic_write(path: Path, content: str) -> None:
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
            temporary_path = Path(temporary.name)
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def process_outlines(check_only: bool = False) -> int:
    paths = sorted(MODULES_DIR.glob("*/outlines.json"))
    if not paths:
        raise IdentityError(f"No module outlines found: {MODULES_DIR}")
    loaded = []
    seen: dict[str, Path] = {}
    for path in paths:
        try:
            document = json.loads(path.read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise IdentityError(f"Cannot read outline {path}: {exc}") from exc
        if not isinstance(document, dict):
            raise IdentityError(f"{path}: Outline must be a JSON object.")
        has_identity = IDENTITY_FIELD in document
        if has_identity:
            register_identity(document[IDENTITY_FIELD], path, seen)
        loaded.append((path, document, has_identity))

    if check_only:
        for path, _, has_identity in loaded:
            print(f"{'Valid' if has_identity else 'Missing'}: {path.relative_to(ROOT)}")
        return 1 if any(not entry[2] for entry in loaded) else 0

    # Validate every existing identity before writing any file.
    for path, document, has_identity in loaded:
        if has_identity:
            identity = document[IDENTITY_FIELD]
            if "signature" not in identity:
                continue
            del identity["signature"]
            action = "Normalized module identity"
        else:
            document[IDENTITY_FIELD] = new_identity(seen)
            register_identity(document[IDENTITY_FIELD], path, seen)
            action = "Generated UUID"
        serialized = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
        _atomic_write(path, serialized)
        print(f"{action}: {path.relative_to(ROOT)} -> {document[IDENTITY_FIELD]['id']}")
    return 0


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Generate missing module UUIDs and check format and uniqueness.")
    parser.add_argument("--check", action="store_true", help="Check for malformed, duplicate or missing UUIDs without writing files.")
    args = parser.parse_args()
    try:
        return process_outlines(check_only=args.check)
    except IdentityError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
