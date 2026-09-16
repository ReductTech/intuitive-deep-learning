from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


MODULES_DIR = Path(__file__).resolve().parent
INDEX_PATH = MODULES_DIR / "index.json"
INFO_NAME = "info.json"
IGNORED_DIRS = {"shared", "__pycache__"}

def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return data if isinstance(data, dict) else None


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _as_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        text = str(item).strip()
        if text and text not in result:
            result.append(text)
    return result


def _module_dirs() -> list[Path]:
    result: list[Path] = []
    for item in MODULES_DIR.iterdir():
        if not item.is_dir() or item.name in IGNORED_DIRS or item.name.startswith("."):
            continue
        if (item / "index.html").exists() or (item / "module.json").exists() or (item / INFO_NAME).exists():
            result.append(item)
    return sorted(result, key=lambda path: path.name.lower())


def _old_index_by_id() -> dict[str, dict[str, Any]]:
    old_index = _read_json(INDEX_PATH) or {}
    result: dict[str, dict[str, Any]] = {}
    for module in old_index.get("modules", []):
        if not isinstance(module, dict):
            continue
        module_id = str(module.get("id") or "").strip()
        if module_id:
            result[module_id] = module
    return result


def _info_from_sources(module_dir: Path, old_modules: dict[str, dict[str, Any]]) -> dict[str, Any]:
    module_id = module_dir.name
    old = old_modules.get(module_id, {})
    module_json = _read_json(module_dir / "module.json") or {}
    title = old.get("title") or module_json.get("title") or module_json.get("sourceName") or module_id
    summary = old.get("summary") or module_json.get("description") or old.get("use_when") or ""

    return {
        "id": module_id,
        "title": str(title),
        "use_when": str(old.get("use_when") or summary),
        "summary": str(summary),
        "prerequisites": _as_string_list(old.get("prerequisites") or module_json.get("prerequisites")),
    }


def init_missing_infos() -> dict[str, Any]:
    old_modules = _old_index_by_id()
    created: list[str] = []
    kept: list[str] = []

    for module_dir in _module_dirs():
        info_path = module_dir / INFO_NAME
        if info_path.exists():
            kept.append(module_dir.name)
            continue
        _write_json(info_path, _info_from_sources(module_dir, old_modules))
        created.append(module_dir.name)

    return {"ok": True, "created": created, "kept": kept}


def _normalize_info(module_dir: Path, info: dict[str, Any]) -> dict[str, Any]:
    module_id = str(info.get("id") or module_dir.name).strip()
    title = str(info.get("title") or module_id).strip()
    summary = str(info.get("summary") or info.get("description") or "").strip()
    use_when = str(info.get("use_when") or summary).strip()

    return {
        "id": module_id,
        "title": title,
        "use_when": use_when,
        "summary": summary,
        "prerequisites": _as_string_list(info.get("prerequisites") or info.get("前置知识")),
    }


def build_index(*, init_missing: bool = False, write: bool = True) -> dict[str, Any]:
    if init_missing:
        init_missing_infos()

    modules: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    for module_dir in _module_dirs():
        info_path = module_dir / INFO_NAME
        info = _read_json(info_path)
        if not info:
            continue

        normalized = _normalize_info(module_dir, info)
        if normalized["id"] != module_dir.name:
            errors.append({
                "module": module_dir.name,
                "error": f"info.json id must equal directory name: {normalized['id']}",
            })
            continue

        if not (module_dir / "index.html").exists():
            errors.append({"module": module_dir.name, "error": "Missing index.html"})
            continue

        if not normalized["use_when"]:
            errors.append({"module": module_dir.name, "error": "Missing use_when"})
            continue

        if not normalized["summary"]:
            errors.append({"module": module_dir.name, "error": "Missing summary"})
            continue

        modules.append(normalized)

    if errors:
        return {"ok": False, "errors": errors}

    index = {"modules": modules}

    if write:
        _write_json(INDEX_PATH, index)

    return {
        "ok": True,
        "index": str(INDEX_PATH),
        "moduleCount": len(modules),
        "written": write,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build index.json from module info.json files.")
    parser.add_argument("--init-missing", action="store_true", help="Create missing info.json files.")
    parser.add_argument("--check", action="store_true", help="Validate without writing index.json.")
    args = parser.parse_args()

    result = build_index(init_missing=args.init_missing, write=not args.check)
    if args.check and result.get("ok"):
        result = {**result, "checkOnly": True}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
