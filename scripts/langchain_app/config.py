from __future__ import annotations

import os
from dataclasses import dataclass

from llm_settings import get_llm_settings


@dataclass(frozen=True)
class ServiceConfig:
    host: str
    port: int
    proxy_url: str
    model: str
    timeout: float
    max_body_bytes: int
    allow_origin: str


LLM_SETTINGS = get_llm_settings()


def load_config() -> ServiceConfig:
    return ServiceConfig(
        host=os.environ.get("LANGCHAIN_SERVICE_HOST", "0.0.0.0"),
        port=int(os.environ.get("LANGCHAIN_SERVICE_PORT", "59414")),
        proxy_url=os.environ.get("LANGCHAIN_SERVICE_PROXY_URL", "http://127.0.0.1:59413/chat"),
        model=LLM_SETTINGS.model,
        timeout=float(os.environ.get("LANGCHAIN_SERVICE_TIMEOUT", "120")),
        max_body_bytes=int(os.environ.get("LANGCHAIN_SERVICE_MAX_BODY_BYTES", str(256 * 1024))),
        allow_origin=os.environ.get("LANGCHAIN_SERVICE_ALLOW_ORIGIN", "*"),
    )


CONFIG = load_config()
