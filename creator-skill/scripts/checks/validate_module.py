#!/usr/bin/env python3
"""Read-only checks for course metadata, UUIDs, entries and literal asset references."""
from __future__ import annotations

import sys as _sys
from pathlib import Path as _Path
_TOOL_ROOT = _Path(__file__).resolve().parents[3]
_sys.path[:0] = [str(_TOOL_ROOT / "backend/src"), str(_TOOL_ROOT / "creator-skill/scripts"), str(_Path(__file__).resolve().parent)]

import argparse
import json
from pathlib import Path
import re
import sys

from module_identity import ROOT, IdentityError, register_identity


def contained_file(base: Path, relative: str) -> bool:
    path = (base / relative).resolve()
    return path.is_relative_to(base.resolve()) and path.is_file()


def validate_modules(repository: Path, requested: str | None = None) -> list[str]:
    errors: list[str] = []
    seen: dict[str, Path] = {}
    loaded = []
    paths = sorted((repository / "modules").glob("*/outlines.json"))
    if not paths:
        return [f"No module outlines found under {repository / 'modules'}"]
    for path in paths:
        try:
            document = json.loads(path.read_text(encoding="utf-8-sig"))
            if not isinstance(document, dict):
                raise ValueError("outline must be an object")
            if "moduleIdentity" not in document:
                raise IdentityError("Missing moduleIdentity")
            module_id = register_identity(document["moduleIdentity"], path, seen)
            loaded.append((path, document, module_id))
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f"{path}: {exc}")
    selected = [item for item in loaded if requested is None or requested.lower() in
                {item[0].parent.name.lower(), str(item[1].get("id", "")).lower(), item[2]}]
    if requested and not selected:
        errors.append(f"Unknown module: {requested}")
    slugs: dict[str, Path] = {}
    for path, doc, module_id in loaded:
        slug = doc.get("id")
        if isinstance(slug, str) and slug:
            if slug in slugs:
                errors.append(f"Duplicate module slug {slug}: {slugs[slug]} and {path}")
            slugs[slug] = path
    for path, doc, module_id in selected:
        directory = path.parent
        label = directory.name
        for key in (("id", "title") if "id" in doc else ("title",)):
            if not isinstance(doc.get(key), str) or not doc[key].strip():
                errors.append(f"{label}: missing nonempty {key}")
        if doc.get("path") != "/modules/" + directory.name.lower():
            errors.append(f"{label}: path must match /modules/{directory.name.lower()}")
        entries = [doc.get("entry")]
        ppt = doc.get("ppt")
        if ppt is not None:
            if not isinstance(ppt, dict):
                errors.append(f"{label}: ppt must be an object")
            else:
                entries.append(ppt.get("entry"))
        for entry in entries:
            if (not isinstance(entry, str) or Path(entry).name != entry
                    or not entry.endswith(".tsx") or not contained_file(directory, entry)):
                errors.append(f"{label}: entry must name an existing root TSX file: {entry!r}")
        pages = doc.get("pages")
        if not isinstance(pages, list) or not pages:
            errors.append(f"{label}: pages must be a nonempty array")
        else:
            page_ids = set()
            for number, page in enumerate(pages, 1):
                if not isinstance(page, dict):
                    errors.append(f"{label}: page {number} must be an object")
                    continue
                page_id = page.get("id")
                if not isinstance(page_id, str) or not page_id.strip():
                    errors.append(f"{label}: page {number} has no valid id")
                elif page_id in page_ids:
                    errors.append(f"{label}: duplicate page id {page_id}")
                else:
                    page_ids.add(page_id)
                if not isinstance(page.get("title"), str) or not page["title"].strip():
                    errors.append(f"{label}: page {number} has no title")
        local_assets = directory / "assets"
        if local_assets.is_dir() and any(p.is_file() for p in local_assets.rglob("*")):
            errors.append(f"{label}: move module-local assets to assets/{module_id}/")
        for source in directory.rglob("*"):
            if source.suffix not in {".ts", ".tsx", ".css"}:
                continue
            text = source.read_text(encoding="utf-8-sig")
            if re.search(r"(?:from\s*|import\s*\(|fetch\s*\()\s*['\"][^'\"]*modules-legacy", text):
                errors.append(f"{source}: legacy runtime dependency")
            for asset_id in re.findall(r'assetId=[\"\']([^\"\']+)[\"\']', text):
                if asset_id != module_id:
                    errors.append(f"{source}: assetId must be {module_id}, got {asset_id}")
            for match in re.finditer(r"moduleAssetUrl\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]", text):
                asset_id, relative = match.groups()
                if asset_id != module_id:
                    errors.append(f"{source}: moduleAssetUrl UUID must be {module_id}, got {asset_id}")
                elif not contained_file(repository / "assets" / module_id, relative):
                    # Atlas consumers use virtual image names; validate the referenced sheet instead.
                    mapped = False
                    asset_root = repository / "assets" / module_id
                    if re.search(r"atlasCropUrl\(\s*$", text[max(0, match.start() - 40):match.start()]):
                        index_path = asset_root / "image-atlases/index.json"
                        if index_path.is_file():
                            index = json.loads(index_path.read_text(encoding="utf-8-sig"))
                            region = index.get(relative) if isinstance(index, dict) else None
                            mapped = isinstance(region, dict) and isinstance(region.get("sheet"), str) and contained_file(asset_root, region["sheet"])
                    if not mapped:
                        errors.append(f"{source}: missing or escaping asset: {relative}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", type=Path, default=ROOT)
    parser.add_argument("--module", help="directory name, module slug or UUID; identity uniqueness is always checked globally")
    args = parser.parse_args()
    try:
        errors = validate_modules(args.repository.resolve(), args.module)
    except (OSError, UnicodeError) as exc:
        print(f"Cannot complete validation: {exc}", file=sys.stderr)
        return 2
    for error in errors:
        print(f"[error] {error}")
    print(f"Module checks: {len(errors)} error(s). Dynamic resource expressions and rendering require separate checks.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
