"""Generate and validate stable module UUIDs without signing keys."""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import uuid
from pathlib import Path
from typing import Any

from idl_backend.config import repository_root

ROOT = repository_root()
MODULES_DIR = ROOT / "modules"
IDENTITY_FIELD = "moduleIdentity"
IDENTITY_VERSION = 1


class IdentityError(ValueError):
    """Raised for missing, malformed, or duplicate module identities."""


def validate_identity(identity: Any, outline_path: Path) -> str:
    if (
        not isinstance(identity, dict)
        or not {"version", "id"} <= identity.keys()
        or identity.keys() - {"version", "id", "signature"}
    ):
        raise IdentityError(f"{outline_path}: Invalid moduleIdentity structure.")
    if type(identity["version"]) is not int or identity["version"] != IDENTITY_VERSION:
        raise IdentityError(f"{outline_path}: Invalid identity version.")
    module_id = identity["id"]
    try:
        parsed = uuid.UUID(module_id) if isinstance(module_id, str) else None
    except ValueError as exc:
        raise IdentityError(f"{outline_path}: Invalid module UUID.") from exc
    if parsed is None or str(parsed) != module_id or parsed.version != 4:
        raise IdentityError(f"{outline_path}: Invalid module UUID; expected a canonical lowercase UUID v4.")
    # Legacy signatures are ignored and removed by the generation command.
    return module_id


def register_identity(identity: Any, outline_path: Path, seen: dict[str, Path]) -> str:
    module_id = validate_identity(identity, outline_path)
    if module_id in seen:
        raise IdentityError(f"Duplicate course UUID {module_id}: {seen[module_id]} and {outline_path}")
    seen[module_id] = outline_path
    return module_id


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
            action = "Removed legacy signature"
        else:
            module_id = str(uuid.uuid4())
            while module_id in seen:
                module_id = str(uuid.uuid4())
            document[IDENTITY_FIELD] = {"version": IDENTITY_VERSION, "id": module_id}
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
