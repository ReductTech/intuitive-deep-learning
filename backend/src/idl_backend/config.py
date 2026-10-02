"""Environment-neutral paths and HTTP addresses; no Docker knowledge."""
from __future__ import annotations

import os
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
