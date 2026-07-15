from __future__ import annotations

"""Single Python CLI for starting, opening, inspecting, and stopping the lab."""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import service_runtime


SCRIPT_DIR = Path(__file__).resolve().parent
MODULES_DIR = SCRIPT_DIR.parent / "modules"

SERVICE_BIND_HOST = "0.0.0.0"


def _print_result(result: dict[str, Any]) -> int:
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 1


def _read_payload(args: argparse.Namespace) -> dict[str, Any]:
    raw = args.payload_json
    if raw is None and not sys.stdin.isatty():
        raw = sys.stdin.buffer.read().decode("utf-8").strip()
    if not raw:
        return {}
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("payload JSON must be an object")
    return payload


def _payload_string(payload: dict[str, Any], *names: str) -> str | None:
    for name in names:
        value = payload.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _module_exists(module_id: str) -> bool:
    candidate = (MODULES_DIR / module_id).resolve()
    return MODULES_DIR.resolve() in candidate.parents and (candidate / "index.html").is_file()


def _ensure_llm_services() -> dict[str, Any]:
    proxy = service_runtime.ensure_background_http_service(
        "llm-proxy",
        [sys.executable, str(SCRIPT_DIR / "llm_proxy_service.py"), "--host", SERVICE_BIND_HOST, "--port", str(service_runtime.LLM_PROXY_PORT)],
        port=service_runtime.LLM_PROXY_PORT,
        markers=service_runtime.LLM_PROXY_MARKERS,
        expected_service="llm-proxy",
    )
    if not proxy.get("ok"):
        return {"ok": False, "llmProxy": proxy}

    langchain = service_runtime.ensure_background_http_service(
        "langchain",
        [sys.executable, str(SCRIPT_DIR / "langchain_service.py"), "--host", SERVICE_BIND_HOST, "--port", str(service_runtime.LANGCHAIN_PORT)],
        port=service_runtime.LANGCHAIN_PORT,
        markers=service_runtime.LANGCHAIN_MARKERS,
        expected_service="langchain-service",
    )
    return {"ok": bool(langchain.get("ok")), "llmProxy": proxy, "langchain": langchain}


def _ensure_cnn_service() -> dict[str, Any]:
    return service_runtime.ensure_background_http_service(
        "cnn",
        [sys.executable, str(SCRIPT_DIR / "lenet5_cnn_service.py")],
        port=service_runtime.CNN_PORT,
        markers=service_runtime.CNN_MARKERS,
        expected_service="lenet5-cnn-service",
        startup_timeout_seconds=30.0,
    )


def _ensure_runtime_backends() -> dict[str, Any]:
    """Start the complete backend bundle before opening any static module.

    Module-to-module navigation happens entirely in the browser, so it cannot
    invoke this Python entrypoint again. Starting every backend at entry avoids
    a Face-Recog-Lab page that is reachable but has no LLM or CNN service.
    """
    services: dict[str, Any] = {}
    llm = _ensure_llm_services()
    services["llm"] = llm
    if not llm.get("ok"):
        return {"ok": False, "services": services}

    cnn = _ensure_cnn_service()
    services["cnn"] = cnn
    if not cnn.get("ok"):
        return {"ok": False, "services": services}
    return {"ok": True, "services": services}


def _start_services() -> dict[str, Any]:
    module_http = service_runtime.ensure_module_http_service()
    if not module_http.get("ok"):
        return {
            "ok": False,
            "stage": module_http.get("stage") or "module-http-service",
            "services": {"modules": module_http},
        }

    backends = _ensure_runtime_backends()
    backend_services = backends.get("services", {})
    llm_services = backend_services.get("llm", {})
    services = {
        "modules": module_http,
        "llmProxy": llm_services.get("llmProxy"),
        "langchain": llm_services.get("langchain"),
        "cnn": backend_services.get("cnn"),
    }
    if not backends.get("ok"):
        return {"ok": False, "stage": "backend-services", "services": services}

    return {
        "ok": True,
        "services": services,
        "urls": {
            "modules": service_runtime.MODULES_URL,
            "telemetry": service_runtime.MODULE_HTTP_HEALTH_URL,
            "llmProxy": f"http://127.0.0.1:{service_runtime.LLM_PROXY_PORT}/health",
            "langchain": f"http://127.0.0.1:{service_runtime.LANGCHAIN_PORT}/health",
            "cnn": f"http://127.0.0.1:{service_runtime.CNN_PORT}/health",
        },
    }


def _open_module(module_id: str) -> dict[str, Any]:
    if not _module_exists(module_id):
        return {"ok": False, "stage": "module-not-found", "error": f"Unknown module id: {module_id}"}
    backends = _ensure_runtime_backends()
    if not backends.get("ok"):
        return {"ok": False, "stage": "module-backend", "moduleId": module_id, "backends": backends}
    page = service_runtime.open_module(module_id)
    return {**page, "backends": backends}


def _init() -> dict[str, Any]:
    module_http = service_runtime.ensure_module_http_service()
    if not module_http.get("ok"):
        return {"ok": False, "stage": module_http.get("stage") or "module-http-service", "server": module_http}
    return _open_module("CourseMap")


def _status() -> dict[str, Any]:
    ready = {
        "modules": service_runtime._is_service_health_ready(
            service_runtime.MODULE_HTTP_HEALTH_URL,
            expected_service=service_runtime.MODULE_HTTP_SERVICE_NAME,
        ),
        "llmProxy": service_runtime._is_service_health_ready(
            f"http://127.0.0.1:{service_runtime.LLM_PROXY_PORT}/health",
            expected_service="llm-proxy",
        ),
        "langchain": service_runtime._is_service_health_ready(
            f"http://127.0.0.1:{service_runtime.LANGCHAIN_PORT}/health",
            expected_service="langchain-service",
        ),
        "cnn": service_runtime._is_service_health_ready(
            f"http://127.0.0.1:{service_runtime.CNN_PORT}/health",
            expected_service="lenet5-cnn-service",
        ),
    }
    return {
        "ok": all(ready.values()),
        "urls": {
            "modules": service_runtime.MODULES_URL,
            "llmProxy": f"http://127.0.0.1:{service_runtime.LLM_PROXY_PORT}/health",
            "langchain": f"http://127.0.0.1:{service_runtime.LANGCHAIN_PORT}/health",
            "cnn": f"http://127.0.0.1:{service_runtime.CNN_PORT}/health",
        },
        "ready": ready,
        "nextStep": "Run start-all-services.sh if any service is not ready.",
    }


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Start deep-learning modules and return page URLs.")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--start-services", action="store_true", help="Start every service without opening a browser page.")
    action.add_argument("--init", action="store_true", help="Start all runtime services and return the CourseMap URL.")
    action.add_argument("--open-module", action="store_true", help="Start all runtime services and return one module URL.")
    action.add_argument("--status", action="store_true", help="Report static module host and backend service health.")
    action.add_argument("--stop", action="store_true", help="Stop skill-owned static and backend services.")
    parser.add_argument("--module-id", dest="module_id", help="Directory id under modules/.")
    parser.add_argument("--payload-json", help="JSON payload for manifest/action callers.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        payload = _read_payload(args)
    except Exception as exc:
        return _print_result({"ok": False, "stage": "read-payload", "errorType": type(exc).__name__, "error": str(exc)})
    args.module_id = args.module_id or _payload_string(payload, "moduleId", "module_id")

    if args.start_services:
        return _print_result(_start_services())
    if args.init:
        return _print_result(_init())
    if args.status:
        return _print_result(_status())
    if args.stop:
        return _print_result({"ok": True, "stopped": service_runtime.cleanup_skill_runtime()})
    if args.open_module:
        if not args.module_id:
            parser.error("--open-module requires --module-id")
        return _print_result(_open_module(args.module_id))
    parser.error("No action selected.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
