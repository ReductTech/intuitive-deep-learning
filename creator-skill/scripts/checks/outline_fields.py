#!/usr/bin/env python3
"""Validate page id/title/snippet in every module outline; --fix fills missing IDs only.

No browser, server, imports of lesson code or network. Existing IDs and prose are
never overwritten. Unimplemented pages receive a persistent title-derived ID.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]

def source_ids(directory):
    result = {}
    for file in sorted(directory.glob("*.tsx")) + sorted(directory.glob("*.ts")):
        text = file.read_text(encoding="utf-8-sig")
        for match in re.finditer(r"\bid\s*:\s*['\"]([^'\"]+)['\"]\s*,\s*title\s*:\s*outline\.pages\[(\d+)\]\.title", text):
            index = int(match[2])
            if index in result and result[index] != match[1]:
                raise ValueError(f"Conflicting scene IDs at page {index + 1}: {file}")
            result[index] = match[1]
        # Explicit component list mapped into deck.scenes, used by research decks.
        if re.search(r"scenes\s*:\s*pages\.map", text):
            match = re.search(r"const\s+pages\s*=\s*\[(.*?)\]\s*;", text, re.S)
            if match:
                ids = re.findall(r"\bid\s*:\s*['\"]([^'\"]+)['\"]\s*,\s*Component\s*:", match[1])
                for index, value in enumerate(ids):
                    if index in result and result[index] != value:
                        raise ValueError(f"Conflicting scene IDs at page {index + 1}: {file}")
                    result[index] = value
    return result

def process(repository, fix=False, module=None):
    errors, changes = [], []
    modules = pages_total = 0
    for path in sorted((repository / "modules").glob("*/outlines.json")):
        doc = json.loads(path.read_text(encoding="utf-8-sig"))
        if module and module not in (path.parent.name, doc.get("id"), doc.get("moduleIdentity", {}).get("id")):
            continue
        modules += 1
        pages = doc.get("pages")
        if not isinstance(pages, list):
            errors.append(f"{path.parent.name}: pages must be an array")
            continue
        ids = source_ids(path.parent) if fix else {}
        used = {page.get("id") for page in pages if isinstance(page, dict) and isinstance(page.get("id"), str)}
        changed = False
        seen = set()
        for index, page in enumerate(pages):
            pages_total += 1
            label = f"{path.parent.name}: page {index + 1}"
            if not isinstance(page, dict):
                errors.append(label + ": must be an object")
                continue
            if fix and not (isinstance(page.get("id"), str) and page["id"].strip()):
                value = ids.get(index)
                if value is None:
                    # This fallback is only for planned, not yet implemented slides.
                    if ids and index < max(ids):
                        errors.append(label + ": scene ID cannot be resolved safely")
                        continue
                    digest = hashlib.sha256(str(page.get("title", "")).encode()).hexdigest()[:12]
                    value = "page-" + digest
                if value in used:
                    errors.append(label + ": generated ID collides: " + value)
                    continue
                page["id"] = value
                used.add(value)
                changed = True
                changes.append({"module": path.parent.name, "page": index + 1, "id": value})
            for key in ("id", "title", "snippet"):
                if not isinstance(page.get(key), str) or not page[key].strip():
                    errors.append(label + ": missing nonempty " + key)
            value = page.get("id")
            if isinstance(value, str):
                if value in seen:
                    errors.append(label + ": duplicate id " + value)
                seen.add(value)
        if changed:
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if module and not modules:
        errors.append("Unknown module: " + module)
    return {"modules": modules, "pages": pages_total, "filledIds": len(changes), "changes": changes, "errors": errors}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", type=Path, default=ROOT)
    parser.add_argument("--module")
    parser.add_argument("--fix", action="store_true", help="Fill missing IDs; never invent title/snippet prose")
    args = parser.parse_args()
    result = process(args.repository.resolve(), args.fix, args.module)
    print(json.dumps(result, ensure_ascii=False))
    return bool(result["errors"])

if __name__ == "__main__":
    raise SystemExit(main())
