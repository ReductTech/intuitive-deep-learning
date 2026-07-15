from __future__ import annotations

import json
import time
import traceback
from http.server import BaseHTTPRequestHandler
from typing import Any

from llm_settings import get_llm_settings

from ..client import json_bytes
from ..errors import INTERNAL_ERROR, NOT_FOUND, user_facing_input_error, user_facing_service_reason
from .config import CONFIG, PROVIDER_NAME
from .upstream import UpstreamServiceError, request_completion, upstream_url


class LlmProxyHandler(BaseHTTPRequestHandler):
    timeout_seconds = CONFIG.timeout

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[llm-proxy] {self.address_string()} {format % args}", flush=True)

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", CONFIG.allow_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, Any]:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError:
            length = 0
        if length > CONFIG.max_body_bytes:
            raise ValueError(f"Request body too large. Limit is {CONFIG.max_body_bytes} bytes.")
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object.")
        return data

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_json(
                404,
                {
                    "ok": False,
                    "status": "not_found",
                    "errorCode": NOT_FOUND.code,
                    "error": NOT_FOUND.message,
                },
            )
            return
        try:
            settings = get_llm_settings()
            self.send_json(
                200,
                {
                    "ok": True,
                    "service": "llm-proxy",
                    "provider": PROVIDER_NAME,
                    "upstream": upstream_url(settings),
                    "defaultModel": settings.model,
                    "apiKeyConfigured": bool(settings.auth_token),
                    "settingsPath": str(settings.source_path),
                },
            )
        except ValueError as exc:
            print(f"[llm-proxy:configuration] {exc}", flush=True)
            friendly = user_facing_service_reason("configuration_error")
            self.send_json(
                503,
                {
                    "ok": False,
                    "service": "llm-proxy",
                    "status": "service_unavailable",
                    "reason": "configuration_error",
                    "errorCode": friendly.code,
                    "error": friendly.message,
                    "retryable": False,
                },
            )

    def do_POST(self) -> None:
        if self.path not in {"/chat", "/v1/chat"}:
            self.send_json(
                404,
                {
                    "ok": False,
                    "status": "not_found",
                    "errorCode": NOT_FOUND.code,
                    "error": NOT_FOUND.message,
                },
            )
            return

        started_at = time.time()
        try:
            payload = self.read_json()
            completion = request_completion(payload, self.timeout_seconds)
            self.send_json(
                200,
                {
                    "ok": True,
                    "provider": PROVIDER_NAME,
                    "model": completion.model,
                    "text": completion.text,
                    "raw": completion.raw if payload.get("includeRaw") is True else None,
                    "durationMs": int((time.time() - started_at) * 1000),
                },
            )
        except ValueError as exc:
            duration_ms = int((time.time() - started_at) * 1000)
            print(f"[llm-proxy:input] {exc}", flush=True)
            friendly = user_facing_input_error(exc)
            self.send_json(
                422,
                {
                    "ok": False,
                    "status": "invalid_request",
                    "errorCode": friendly.code,
                    "error": friendly.message,
                    "durationMs": duration_ms,
                },
            )
        except UpstreamServiceError as exc:
            duration_ms = int((time.time() - started_at) * 1000)
            print(f"[llm-proxy:upstream] {exc.reason}: {exc}; detail={exc.detail!r}", flush=True)
            friendly = user_facing_service_reason(exc.reason)
            self.send_json(
                503,
                {
                    "ok": False,
                    "status": "service_unavailable",
                    "reason": exc.reason,
                    "errorCode": friendly.code,
                    "error": friendly.message,
                    "retryable": exc.retryable,
                    "durationMs": duration_ms,
                },
            )
        except Exception as exc:
            duration_ms = int((time.time() - started_at) * 1000)
            print(f"[llm-proxy:error] {type(exc).__name__}: {exc}", flush=True)
            print(traceback.format_exc(), flush=True)
            self.send_json(
                500,
                {
                    "ok": False,
                    "status": "internal_error",
                    "errorCode": INTERNAL_ERROR.code,
                    "error": INTERNAL_ERROR.message,
                    "durationMs": duration_ms,
                },
            )
