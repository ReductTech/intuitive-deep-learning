"""HTTP-only client, shared by Windows and cloud; never controls containers."""
from __future__ import annotations

import json
import urllib.error
import urllib.request


class ServiceError(RuntimeError):
    def __init__(self, message: str, status: int = 503, details=None):
        super().__init__(message)
        self.status = status
        self.details = details


def request_json(base_url: str, token: str, method: str, path: str, payload=None, *, timeout: float = 15):
    if not base_url:
        raise ServiceError("Service address is not configured.")
    if not path.startswith("/") or path.startswith("//"):
        raise ValueError("Service path must be an absolute local path.")
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-API-Key"] = token
    request = urllib.request.Request(base_url.rstrip("/") + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            error_body = json.loads(exc.read().decode("utf-8"))
            details = error_body.get("detail", error_body) if isinstance(error_body, dict) else None
        except (ValueError, OSError):
            details = None
        raise ServiceError(f"Service returned HTTP {exc.code}.", exc.code, details) from exc
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        raise ServiceError("Service is unavailable or returned invalid JSON.") from exc
    if not isinstance(result, dict):
        raise ServiceError("Invalid service result.", 502)
    return result
