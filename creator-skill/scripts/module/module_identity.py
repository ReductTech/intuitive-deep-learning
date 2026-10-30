#!/usr/bin/env python3
"""Validate module identities or generate missing UUIDs.

Reads: All modules/*/outlines.json.
Writes: Default mode fills missing identities and removes legacy signatures; --check is read-only.
"""

from __future__ import annotations


import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import ROOT, emit_result, report_error
from idl_backend.contracts.identity import (
    IDENTITY_FIELD,
    IDENTITY_VERSION,
    IdentityError,
    register_identity,
)

MODULES_DIR = ROOT / "modules"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check for malformed, duplicate or missing UUIDs without writing files.",
    )
    return parser


def new_identity(existing_ids: dict) -> dict:
    """Generate one identity without changing or replacing any existing identity."""
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


def process_outlines(
    check_only: bool = False, results: list[dict] | None = None
) -> int:
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
            print(
                f"{'Valid' if has_identity else 'Missing'}: {path.relative_to(ROOT)}",
                file=sys.stderr,
            )
            if results is not None:
                results.append(
                    {
                        "path": str(path),
                        "status": "valid" if has_identity else "missing",
                    }
                )
        return 1 if any(not entry[2] for entry in loaded) else 0

    # Validate every existing identity before writing any file.
    for path, document, has_identity in loaded:
        if has_identity:
            identity = document[IDENTITY_FIELD]
            if "signature" not in identity:
                if results is not None:
                    results.append({"path": str(path), "status": "unchanged"})
                continue
            del identity["signature"]
            action = "Normalized module identity"
        else:
            document[IDENTITY_FIELD] = new_identity(seen)
            register_identity(document[IDENTITY_FIELD], path, seen)
            action = "Generated UUID"
        serialized = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
        _atomic_write(path, serialized)
        print(
            f"{action}: {path.relative_to(ROOT)} -> {document[IDENTITY_FIELD]['id']}",
            file=sys.stderr,
        )
        if results is not None:
            results.append(
                {
                    "path": str(path),
                    "status": "created" if not has_identity else "normalized",
                }
            )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        results = []
        code = process_outlines(check_only=args.check, results=results)
        emit_result({"modules": results}, status="failed" if code else "ok")
        return code
    except (IdentityError, OSError, UnicodeError) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())
