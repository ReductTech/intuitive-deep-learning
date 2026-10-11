"""Run the same Cloud API locally; never copy its cache or routing implementation."""
import os
from pathlib import Path

from idl_backend.config import repository_root


def cloud_repository(root=None):
    root = (root or repository_root()).resolve()
    configured = os.environ.get("IDL_CLOUD_REPOSITORY")
    candidates = [Path(configured)] if configured else [root.parent / "cloud-intuitive-deep-learning", root.parent]
    for candidate in candidates:
        if (candidate / "backend/cloud_api/app.py").is_file():
            return candidate.resolve()
    raise RuntimeError("Cloud checkout not found. Set IDL_CLOUD_REPOSITORY to cloud-intuitive-deep-learning.")


def cloud_environment(root=None):
    from dotenv import dotenv_values
    root = (root or repository_root()).resolve()
    cloud = cloud_repository(root)
    environment = dict(os.environ)
    # Read credentials server-side only; never import production network topology.
    production = dotenv_values(cloud / "infra/.env.cloud.production")
    local = dotenv_values(cloud / ".env.local")
    records = dotenv_values(cloud / "infra/.env.cloud")
    allowed = ("MYSQL_URL_REMOTE", "GPU_GATEWAY_API_TOKEN", "LLM_GATEWAY_API_TOKEN",
               "IDL_DATA_REVISION", "IDL_MODEL_REVISION", "IDL_VISION_CACHE_VERSION")
    for name in allowed:
        if not environment.get(name):
            value = local.get(name) or production.get(name)
            if value:
                environment[name] = value
    # The private-record publisher writes its server credentials to this ignored
    # runtime file. Read only OSS settings, never its production gateway topology.
    for name in ("OSS_ACCESS_KEY_ID", "OSS_ACCESS_KEY_SECRET", "IDL_RECORDS_OSS_BUCKET",
                 "IDL_RECORDS_OSS_REGION", "IDL_RECORDS_OSS_ENDPOINT"):
        if not environment.get(name):
            value = local.get(name) or records.get(name) or production.get(name)
            if value:
                environment[name] = value
    if not environment.get("MYSQL_URL_REMOTE"):
        raise RuntimeError("Set MYSQL_URL_REMOTE in the environment or Cloud .env.local; local requests require the shared cloud cache.")
    environment.setdefault("GPU_GATEWAY_BASE_URL", "http://127.0.0.1:28431")
    environment.setdefault("LLM_GATEWAY_BASE_URL", "http://127.0.0.1:28432")
    environment.setdefault("IDL_TELEMETRY_ENABLED", "false")
    environment.update(IDL_REPOSITORY_ROOT=str(root), IDL_MODULES_DIR=str(root / "modules"),
                       IDL_BACKEND_SOURCE=str(root / "backend/src"), IDL_CLOUD_REPOSITORY=str(cloud))
    environment["PYTHONPATH"] = os.pathsep.join([str(root / "backend/src"), str(cloud / "backend"), environment.get("PYTHONPATH", "")])
    return environment
