#!/usr/bin/env python3
"""Inventory module assets and optionally detect duplicate content.

Reads: The selected module and its module-owned assets directory.
Writes: None. Duplicate files are reported, never removed.
"""

from pathlib import Path
import argparse
import hashlib
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import ROOT, resolve_module, emit_result, report_error
from module_assets import asset_directory
from checks.validate_module import validate_modules


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--module", required=True, help="module directory, slug or UUID"
    )
    parser.add_argument(
        "--duplicates",
        action="store_true",
        help="stream SHA-256 hashes; may take time on large asset folders",
    )
    return parser


def inspect_assets(repository: Path, module: str, duplicates: bool = False) -> dict:
    """Return inventory, duplicate groups and validation errors without changing assets."""
    directory, outline = resolve_module(module, repository)
    asset_root = asset_directory(repository, outline["moduleIdentity"]["id"])
    files = (
        sorted(
            path
            for path in asset_root.rglob("*")
            if path.is_file() and path.resolve().is_relative_to(asset_root.resolve())
        )
        if asset_root.is_dir()
        else []
    )
    groups = {}
    if duplicates:
        for path in files:
            digest = hashlib.sha256()
            with path.open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
            groups.setdefault(digest.hexdigest(), []).append(
                path.relative_to(asset_root).as_posix()
            )
    return {
        "module": directory.name,
        "uuid": outline["moduleIdentity"]["id"],
        "files": len(files),
        "bytes": sum(path.stat().st_size for path in files),
        "duplicateGroups": [paths for paths in groups.values() if len(paths) > 1],
        "errors": validate_modules(repository, module),
        "limitations": "Duplicates may be intentional. Dynamic references require runtime checks; no unused-file deletion is performed.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = inspect_assets(ROOT, args.module, args.duplicates)
        emit_result(result, status="failed" if result["errors"] else "passed")
        return 1 if result["errors"] else 0
    except (ValueError, OSError) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())
