from __future__ import annotations

from typing import Any


def require_text(payload: dict[str, Any], field: str, message: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(message)
    return value.strip()


def optional_text(payload: dict[str, Any], field: str, default: str = "") -> str:
    value = payload.get(field)
    return value.strip() if isinstance(value, str) and value.strip() else default

