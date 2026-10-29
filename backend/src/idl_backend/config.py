"""Environment-neutral paths and HTTP addresses; no Docker knowledge."""
from __future__ import annotations

import os
import json
import sys
from pathlib import Path


def repository_root() -> Path:
    configured = os.environ.get("IDL_REPOSITORY_ROOT")
    if configured:
        return Path(configured).expanduser().resolve()
    for parent in Path(__file__).resolve().parents:
        if (parent / "modules").is_dir() and (parent / "scripts").is_dir():
            return parent
    return Path.cwd().resolve()


def data_directory() -> Path:
    configured = os.environ.get("IDL_DATA_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    root = repository_root()
    return root / "datasets"


def asset_directory(module_id: str, root: Path | None = None) -> Path:
    root = Path(root or repository_root()).resolve()
    index = root / 'modules/shared/asset-index.json'
    paths = json.loads(index.read_text(encoding='utf-8'))['roots'] if index.is_file() else {}
    for outline in (root / 'modules').glob('*/outlines.json'):
        identity = json.loads(outline.read_text(encoding='utf-8-sig')).get('moduleIdentity', {})
        if identity.get('id') == module_id:
            candidate = outline.parent / 'assets'
            legacy = root / 'assets' / module_id
            return legacy if not candidate.exists() and legacy.is_dir() else candidate
    candidate = (root / paths[module_id]).resolve() if module_id in paths else root / 'assets' / module_id
    if not candidate.is_relative_to(root):
        raise ValueError('Asset directory leaves repository')
    return candidate


def asset_relative(module_id: str, name: str, root: Path | None = None) -> str:
    index = Path(root or repository_root()) / 'modules/shared/asset-index.json'
    formats = json.loads(index.read_text(encoding='utf-8'))['formats'] if index.is_file() else {}
    return formats.get(module_id+'/'+name, name)


def model_directory() -> Path:
    default = data_directory() / "models"
    return Path(os.environ.get("IDL_MODEL_DIR", str(default))).expanduser().resolve()


def artifact_directory() -> Path:
    default = data_directory() / "artifacts/80396753-7fc8-4f55-9188-bddbdb828169/digit-training"
    return Path(os.environ.get("IDL_ARTIFACT_DIR", str(default))).expanduser().resolve()


def service_address(kind: str, *, platform: str | None = None) -> str:
    variable, port = {
        "vision": ("GPU_GATEWAY_BASE_URL", 28431),
        "assessment": ("LLM_GATEWAY_BASE_URL", 28432),
    }[kind]
    configured = os.environ.get(variable, "").strip().rstrip("/")
    if configured:
        return configured
    if (platform or sys.platform) == "win32":
        return f"http://127.0.0.1:{port}"
    return ""


def source_label(path: Path) -> str:
    """Metadata stays valid when cloud datasets are mounted outside the repo."""
    try:
        return path.relative_to(repository_root()).as_posix()
    except ValueError:
        return path.as_posix()
