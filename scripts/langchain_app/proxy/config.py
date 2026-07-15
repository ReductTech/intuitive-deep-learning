from __future__ import annotations

import os
from dataclasses import dataclass


PROVIDER_NAME = "anthropic-compatible"


@dataclass(frozen=True)
class ProxyConfig:
    host: str
    port: int
    timeout: float
    max_body_bytes: int
    allow_origin: str


def load_proxy_config() -> ProxyConfig:
    return ProxyConfig(
        host=os.environ.get("LLM_PROXY_HOST", "0.0.0.0"),
        port=int(os.environ.get("LLM_PROXY_PORT", "59413")),
        timeout=float(os.environ.get("LLM_PROXY_TIMEOUT", "120")),
        max_body_bytes=int(os.environ.get("LLM_PROXY_MAX_BODY_BYTES", str(256 * 1024))),
        allow_origin=os.environ.get("LLM_PROXY_ALLOW_ORIGIN", "*"),
    )


CONFIG = load_proxy_config()
