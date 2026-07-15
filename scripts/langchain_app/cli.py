from __future__ import annotations

import argparse
from http.server import ThreadingHTTPServer

from .client import DEFAULT_CLIENT
from .config import CONFIG, LLM_SETTINGS
from .dependencies import dependency_status
from .diagnostics import trace
from .http_server import LangChainServiceHandler
from .registry import ENDPOINTS


def main() -> int:
    parser = argparse.ArgumentParser(description="LangChain orchestration service for learning modules")
    parser.add_argument("--host", default=CONFIG.host)
    parser.add_argument("--port", type=int, default=CONFIG.port)
    parser.add_argument("--timeout", type=float, default=CONFIG.timeout)
    args = parser.parse_args()

    LangChainServiceHandler.timeout_seconds = args.timeout
    server = ThreadingHTTPServer((args.host, args.port), LangChainServiceHandler)
    print(f"[langchain-service] listening on http://{args.host}:{args.port}", flush=True)
    print(f"[langchain-service] proxy: {CONFIG.proxy_url}", flush=True)
    print(f"[langchain-service] settings: {LLM_SETTINGS.source_path}", flush=True)
    print(f"[langchain-service] upstream: {LLM_SETTINGS.base_url}", flush=True)
    print(f"[langchain-service] api key: {'configured' if LLM_SETTINGS.auth_token else 'missing'}", flush=True)
    print(f"[langchain-service] proxy health: {DEFAULT_CLIENT.health()}", flush=True)
    print(f"[langchain-service] dependencies: {dependency_status()}", flush=True)
    print(f"[langchain-service] default model: {CONFIG.model}", flush=True)
    for endpoint in ENDPOINTS:
        print(f"[langchain-service] POST {endpoint.path} with {endpoint.request_example}", flush=True)
    trace("service.started", host=args.host, port=args.port, timeoutSeconds=args.timeout)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        trace("service.shutdown_requested", signal="KeyboardInterrupt")
    finally:
        server.server_close()
        trace("service.stopped", host=args.host, port=args.port)
    return 0
