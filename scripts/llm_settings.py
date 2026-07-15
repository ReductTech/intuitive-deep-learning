from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


LINUX_SETTINGS_PATH = Path("/opt/reduct/workspace/.claude/settings.json")
LOCAL_SETTINGS_PATH = Path(__file__).resolve().parent.parent / "settings.json"

MODEL_KEYS = (
    "ANTHROPIC_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
)

# Anthropic-compatible Messages APIs require max_tokens. Use one generous
# service-wide budget instead of imposing smaller limits per exercise.
LLM_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "32768"))


@dataclass(frozen=True)
class LlmSettings:
    source_path: Path
    base_url: str
    auth_token: str
    model: str

    def __repr__(self) -> str:
        return (
            f"LlmSettings(source_path={self.source_path!r}, "
            f"base_url={self.base_url!r}, auth_token='<redacted>', model={self.model!r})"
        )


def default_settings_path(*, platform: str | None = None) -> Path:
    current_platform = platform or sys.platform
    return LINUX_SETTINGS_PATH if current_platform.startswith("linux") else LOCAL_SETTINGS_PATH


DEFAULT_SETTINGS_PATH = default_settings_path()


def settings_path() -> Path:
    configured = os.environ.get("CLAUDE_SETTINGS_PATH", "").strip()
    return Path(configured).expanduser() if configured else default_settings_path()


def _required_text(env: dict[str, Any], key: str, source: Path) -> str:
    value = env.get(key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    raise ValueError(f"Missing {key} in {source} env object.")


def load_llm_settings(path: Path | None = None) -> LlmSettings:
    source = (path or settings_path()).resolve()
    try:
        document = json.loads(source.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"Claude settings file does not exist: {source}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude settings file is not valid JSON: {source}") from exc

    env = document.get("env") if isinstance(document, dict) else None
    if not isinstance(env, dict):
        raise ValueError(f"Claude settings file must contain an env object: {source}")

    model = next(
        (str(env[key]).strip() for key in MODEL_KEYS if isinstance(env.get(key), str) and str(env[key]).strip()),
        "",
    )
    if not model:
        raise ValueError(f"Missing model configuration ({', '.join(MODEL_KEYS)}) in {source}.")

    return LlmSettings(
        source_path=source,
        base_url=_required_text(env, "ANTHROPIC_BASE_URL", source).rstrip("/"),
        auth_token=_required_text(env, "ANTHROPIC_AUTH_TOKEN", source),
        model=model,
    )


@lru_cache(maxsize=1)
def get_llm_settings() -> LlmSettings:
    return load_llm_settings()
