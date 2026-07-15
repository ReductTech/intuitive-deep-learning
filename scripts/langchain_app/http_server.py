from __future__ import annotations

import time
import traceback
import uuid
from http.server import BaseHTTPRequestHandler
from typing import Any

from .client import DEFAULT_CLIENT, LLMServiceUnavailable, json_bytes, json_loads
from .config import CONFIG, LLM_SETTINGS
from .diagnostics import bind_request_id, reset_request_id, trace
from .dependencies import dependency_status
from .errors import INTERNAL_ERROR, NOT_FOUND, user_facing_input_error, user_facing_service_error
from .registry import ENDPOINTS, ROUTES
from .structured import TaskResult


class LangChainServiceHandler(BaseHTTPRequestHandler):
    timeout_seconds = CONFIG.timeout
    active_request_id = "-"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[langchain-service] {self.address_string()} {format % args}", flush=True)

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", CONFIG.allow_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Expose-Headers", "X-Request-ID")

    def send_json(self, status: int, payload: dict[str, Any]) -> bool:
        write_started = time.perf_counter()
        body = json_bytes(payload)
        trace(
            "response.write.start",
            path=self.path,
            status=status,
            bodyBytes=len(body),
            responseStatus=payload.get("status"),
            structured=payload.get("structured"),
        )
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Request-ID", self.active_request_id)
        self._send_cors_headers()
        self.end_headers()
        try:
            self.wfile.write(body)
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError) as exc:
            trace(
                "response.client_disconnected",
                path=self.path,
                status=status,
                errorType=type(exc).__name__,
                durationMs=int((time.perf_counter() - write_started) * 1000),
            )
            return False
        trace(
            "response.write.complete",
            path=self.path,
            status=status,
            bodyBytes=len(body),
            durationMs=int((time.perf_counter() - write_started) * 1000),
        )
        return True

    def read_json(self) -> dict[str, Any]:
        read_started = time.perf_counter()
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError:
            length = 0
        if length > CONFIG.max_body_bytes:
            raise ValueError(f"Request body too large. Limit is {CONFIG.max_body_bytes} bytes.")
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        payload = json_loads(raw)
        answer = payload.get("answer")
        trace(
            "request.body.parsed",
            path=self.path,
            contentLength=length,
            keys=sorted(payload.keys()),
            taskId=payload.get("task_id"),
            answerChars=len(answer) if isinstance(answer, str) else None,
            durationMs=int((time.perf_counter() - read_started) * 1000),
        )
        return payload

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        self.active_request_id = uuid.uuid4().hex[:12]
        token = bind_request_id(self.active_request_id)
        trace("request.received", method="GET", path=self.path, client=self.client_address[0])
        try:
            self._do_GET()
        finally:
            reset_request_id(token)

    def _do_GET(self) -> None:
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
        self.send_json(
            200,
            {
                "ok": True,
                "service": "langchain-service",
                "proxyUrl": CONFIG.proxy_url,
                "proxyHealth": DEFAULT_CLIENT.health(),
                "defaultModel": CONFIG.model,
                "upstreamBaseUrl": LLM_SETTINGS.base_url,
                "apiKeyConfigured": bool(LLM_SETTINGS.auth_token),
                "settingsPath": str(LLM_SETTINGS.source_path),
                "dependencies": dependency_status(),
                "endpoints": [endpoint.path for endpoint in ENDPOINTS],
            },
        )

    def do_POST(self) -> None:
        self.active_request_id = uuid.uuid4().hex[:12]
        token = bind_request_id(self.active_request_id)
        request_started = time.perf_counter()
        trace(
            "request.received",
            method="POST",
            path=self.path,
            client=self.client_address[0],
            contentLength=self.headers.get("Content-Length"),
            userAgent=self.headers.get("User-Agent", "")[:120],
        )
        try:
            self._do_POST(request_started)
        finally:
            trace(
                "request.finished",
                method="POST",
                path=self.path,
                durationMs=int((time.perf_counter() - request_started) * 1000),
            )
            reset_request_id(token)

    def _do_POST(self, request_started: float) -> None:
        handler = ROUTES.get(self.path)
        if handler is None:
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
            payload = self.read_json()
            handler_started = time.perf_counter()
            trace(
                "handler.start",
                path=self.path,
                handler=getattr(handler, "__name__", type(handler).__name__),
                timeoutSeconds=self.timeout_seconds,
            )
            result = handler(payload, self.timeout_seconds)
            trace(
                "handler.complete",
                path=self.path,
                handler=getattr(handler, "__name__", type(handler).__name__),
                resultType=type(result).__name__,
                structured=result.structured if isinstance(result, TaskResult) else True,
                repaired=result.repaired if isinstance(result, TaskResult) else False,
                resultKeys=sorted(result.keys()) if isinstance(result, dict) else None,
                durationMs=int((time.perf_counter() - handler_started) * 1000),
            )
            result_fields = result.http_fields() if isinstance(result, TaskResult) else {
                "structured": True,
                "result": result,
            }
            self.send_json(
                200,
                {
                    "ok": True,
                    "status": "success",
                    **result_fields,
                    "durationMs": int((time.perf_counter() - request_started) * 1000),
                },
            )
        except ValueError as exc:
            duration_ms = int((time.perf_counter() - request_started) * 1000)
            trace("request.invalid", path=self.path, errorType=type(exc).__name__, error=str(exc), durationMs=duration_ms)
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
        except LLMServiceUnavailable as exc:
            duration_ms = int((time.perf_counter() - request_started) * 1000)
            trace(
                "request.service_unavailable",
                path=self.path,
                reason=exc.reason,
                retryable=exc.retryable,
                errorType=type(exc).__name__,
                durationMs=duration_ms,
            )
            friendly = user_facing_service_error(exc)
            self.send_json(
                503,
                {
                    "ok": False,
                    "status": "service_unavailable",
                    "errorCode": friendly.code,
                    "error": friendly.message,
                    "retryable": exc.retryable,
                    "durationMs": duration_ms,
                },
            )
        except Exception as exc:
            duration_ms = int((time.perf_counter() - request_started) * 1000)
            trace(
                "request.internal_error",
                path=self.path,
                errorType=type(exc).__name__,
                error=str(exc),
                durationMs=duration_ms,
            )
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
