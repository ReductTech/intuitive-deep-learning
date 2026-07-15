from __future__ import annotations

import argparse
from http.server import ThreadingHTTPServer

from llm_settings import get_llm_settings

from .config import CONFIG
from .http_server import LlmProxyHandler
from .upstream import upstream_url


def main() -> int:
    parser = argparse.ArgumentParser(description="Local Anthropic-compatible LLM proxy service for browser modules")
    parser.add_argument("--host", default=CONFIG.host)
    parser.add_argument("--port", type=int, default=CONFIG.port)
    parser.add_argument("--timeout", type=float, default=CONFIG.timeout)
    args = parser.parse_args()

    settings = get_llm_settings()
    LlmProxyHandler.timeout_seconds = args.timeout
    server = ThreadingHTTPServer((args.host, args.port), LlmProxyHandler)
    print(f"[llm-proxy] listening on http://{args.host}:{args.port}", flush=True)
    print(f"[llm-proxy] settings: {settings.source_path}", flush=True)
    print(f"[llm-proxy] upstream: {upstream_url(settings)}", flush=True)
    print(f"[llm-proxy] api key: {'configured' if settings.auth_token else 'missing'}", flush=True)
    print(f"[llm-proxy] model: {settings.model}", flush=True)
    print("[llm-proxy] POST /chat with {messages[] | prompt}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[llm-proxy] shutdown requested", flush=True)
    finally:
        server.server_close()
        print("[llm-proxy] stopped", flush=True)
    return 0
