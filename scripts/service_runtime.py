from __future__ import annotations

"""Internal service runtime used by ``lab_launcher.py``.

The public course surface is the ``modules`` directory itself.  This file only
starts a local static HTTP server, starts module backends when requested by the
entrypoint, and returns module URLs for the caller to open with its browser
tool.  It intentionally contains no page shell, iframe composition, or browser
bridge code.
"""

import json
import os
import re
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
MODULES_DIR = SKILL_DIR / "modules"
DATASET_DIR = SKILL_DIR / "dataset"
RUNTIME_LOG_DIR = SKILL_DIR / "runtime_logs"
RUNTIME_STATE_PATH = RUNTIME_LOG_DIR / "runtime_state.json"

MODULES_PORT = 59411
MODULES_BIND_HOST = os.environ.get("DL_MODULES_HOST", "0.0.0.0")
LLM_PROXY_PORT = 59413
LANGCHAIN_PORT = 59414
CNN_PORT = 59415
MODULES_HEALTH_URL = f"http://127.0.0.1:{MODULES_PORT}/"
MODULES_URL = os.environ.get("DEEP_LEARNING_MODULES_PUBLIC_URL", MODULES_HEALTH_URL).rstrip("/") + "/"
MODULE_HTTP_HEALTH_URL = f"http://127.0.0.1:{MODULES_PORT}/__telemetry/health"
MODULE_HTTP_SERVICE_NAME = "deep-learning-module-server"
MODULE_HTTP_REQUIRED_CAPABILITY = "dataset-mount-v1"


MODULE_HTTP_MARKERS = [
    "intuitive-deep-learning/modules",
    "intuitive-deep-learning/scripts/module_http_service.py",
    "skill:intuitive-deep-learning:modules",
]
LLM_PROXY_MARKERS = [
    "intuitive-deep-learning/scripts/llm_proxy_service.py",
    "skill:intuitive-deep-learning:llm-proxy",
]
LANGCHAIN_MARKERS = [
    "intuitive-deep-learning/scripts/langchain_service.py",
    "skill:intuitive-deep-learning:langchain",
]
CNN_MARKERS = [
    "intuitive-deep-learning/scripts/lenet5_cnn_service.py",
    "skill:intuitive-deep-learning:cnn",
]


def _read_runtime_state() -> dict[str, Any]:
    try:
        value = json.loads(RUNTIME_STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return value if isinstance(value, dict) else {}


def _write_runtime_state(state: dict[str, Any]) -> None:
    RUNTIME_LOG_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _remember_service_process(label: str, process_info: dict[str, Any]) -> None:
    state = _read_runtime_state()
    services = state.get("services") if isinstance(state.get("services"), dict) else {}
    services[label] = {
        "pid": process_info.get("pid"),
        "command": process_info.get("command"),
        "log": process_info.get("log"),
        "startedAt": time.time(),
    }
    state["services"] = services
    state["ports"] = {
        "modules": MODULES_PORT,
        "llmProxy": LLM_PROXY_PORT,
        "langchain": LANGCHAIN_PORT,
        "cnn": CNN_PORT,
    }
    _write_runtime_state(state)


def _remove_remembered_service(label: str) -> None:
    state = _read_runtime_state()
    services = state.get("services") if isinstance(state.get("services"), dict) else {}
    services.pop(label, None)
    state["services"] = services
    _write_runtime_state(state)


def _is_http_ready(url: str, timeout: float = 1.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return 200 <= response.status < 400
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return False


def _is_service_health_ready(
    url: str,
    *,
    expected_service: str | None = None,
    expected_capability: str | None = None,
    timeout: float = 1.0,
) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            if not 200 <= response.status < 400:
                return False
            payload = json.loads(response.read().decode("utf-8") or "{}")
    except (urllib.error.URLError, TimeoutError, ValueError, OSError, json.JSONDecodeError):
        return False
    if not isinstance(payload, dict) or payload.get("ok") is False:
        return False
    if expected_service and payload.get("service") != expected_service:
        return False
    capabilities = payload.get("capabilities")
    if expected_capability and (not isinstance(capabilities, list) or expected_capability not in capabilities):
        return False
    return True


def _wait_until(predicate: Any, *, timeout_seconds: float, interval_seconds: float = 0.35) -> bool:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(interval_seconds)
    return bool(predicate())


def _find_listening_pids(port: int) -> list[int]:
    socket_inodes: set[str] = set()
    for table_name in ("tcp", "tcp6"):
        try:
            lines = (Path("/proc/net") / table_name).read_text(encoding="utf-8", errors="ignore").splitlines()[1:]
        except OSError:
            continue
        for line in lines:
            fields = line.split()
            if len(fields) < 10 or fields[3] != "0A":
                continue
            try:
                local_port = int(fields[1].rsplit(":", 1)[1], 16)
            except (IndexError, ValueError):
                continue
            if local_port == port and fields[9] != "0":
                socket_inodes.add(fields[9])

    if not socket_inodes:
        return []
    pids: set[int] = set()
    for process_dir in Path("/proc").iterdir():
        if not process_dir.name.isdigit():
            continue
        try:
            for descriptor in (process_dir / "fd").iterdir():
                target = os.readlink(descriptor)
                match = re.fullmatch(r"socket:\[(\d+)\]", target)
                if match and match.group(1) in socket_inodes:
                    pids.add(int(process_dir.name))
                    break
        except OSError:
            continue
    return sorted(pids)


def _get_process_commandline(pid: int) -> str:
    try:
        return (Path("/proc") / str(pid) / "cmdline").read_text(encoding="utf-8", errors="ignore").replace("\x00", " ").strip()
    except OSError:
        return ""


def _matches_skill_process(commandline: str, markers: list[str]) -> bool:
    return any(marker.lower() in commandline.lower() for marker in markers)


def _pid_exists(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _terminate_pid(pid: int) -> None:
    if not _pid_exists(pid):
        return
    try:
        os.killpg(os.getpgid(pid), signal.SIGTERM)
    except (ProcessLookupError, PermissionError):
        return
    deadline = time.monotonic() + 2.0
    while _pid_exists(pid) and time.monotonic() < deadline:
        time.sleep(0.05)
    if not _pid_exists(pid):
        return
    try:
        os.killpg(os.getpgid(pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        return


def _classify_port_processes(port: int, *, markers: list[str], label: str) -> dict[str, Any]:
    result: dict[str, Any] = {"label": label, "port": port, "skill": [], "foreign": []}
    for pid in _find_listening_pids(port):
        commandline = _get_process_commandline(pid)
        process = {"pid": pid, "commandline": commandline}
        if commandline and _matches_skill_process(commandline, markers):
            result["skill"].append(process)
        else:
            if not commandline:
                process["reason"] = "could not read command line"
            result["foreign"].append(process)
    return result


def _spawn_background(command: list[str], *, log_name: str, label: str, env: dict[str, str] | None = None) -> dict[str, Any]:
    RUNTIME_LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = RUNTIME_LOG_DIR / log_name
    process_env = {
        **os.environ,
        "PYTHONUTF8": "1",
        "PYTHONIOENCODING": "utf-8",
        **(env or {}),
    }
    # Each process start gets a fresh, BOM-marked UTF-8 log. This prevents
    # unbounded accumulation and lets Windows editors detect Chinese text.
    log_handle = open(log_path, "w", encoding="utf-8-sig")
    kwargs: dict[str, Any] = {
        "cwd": str(SKILL_DIR),
        "stdout": log_handle,
        "stderr": subprocess.STDOUT,
        "stdin": subprocess.DEVNULL,
        "close_fds": True,
        "env": process_env,
    }
    process = subprocess.Popen(command, start_new_session=True, **kwargs)
    log_handle.close()
    return {"pid": process.pid, "command": command, "log": str(log_path), "label": label}


def ensure_background_http_service(
    label: str,
    command: list[str],
    *,
    port: int,
    health_path: str = "/health",
    log_name: str | None = None,
    markers: list[str],
    expected_service: str | None = None,
    startup_timeout_seconds: float = 20.0,
) -> dict[str, Any]:
    health_url = f"http://127.0.0.1:{port}{health_path}"
    if _is_service_health_ready(health_url, expected_service=expected_service):
        return {"ok": True, "label": label, "started": False, "alreadyRunning": True, "url": health_url}

    classification = _classify_port_processes(port, markers=markers, label=label)
    if classification["foreign"]:
        return {
            "ok": False,
            "stage": "port-check",
            "label": label,
            "url": health_url,
            "error": f"Port {port} is occupied by a non-skill process.",
            "port": classification,
        }
    for process in classification["skill"]:
        _terminate_pid(process["pid"])

    process_info = _spawn_background(command, log_name=log_name or f"{label}.log", label=label)
    _remember_service_process(label, process_info)
    ready = _wait_until(
        lambda: _is_service_health_ready(health_url, expected_service=expected_service),
        timeout_seconds=startup_timeout_seconds,
    )
    return {"ok": ready, "label": label, "started": True, "alreadyRunning": False, "url": health_url, **process_info}


def ensure_module_http_service() -> dict[str, Any]:
    if not MODULES_DIR.is_dir():
        return {"ok": False, "stage": "modules-directory", "error": f"Modules directory is missing: {MODULES_DIR}"}
    if not DATASET_DIR.is_dir():
        return {"ok": False, "stage": "dataset-directory", "error": f"Dataset directory is missing: {DATASET_DIR}"}
    index_url = urllib.parse.urljoin(MODULES_HEALTH_URL, "index.json")
    if _is_http_ready(index_url) and _is_service_health_ready(
        MODULE_HTTP_HEALTH_URL,
        expected_service=MODULE_HTTP_SERVICE_NAME,
        expected_capability=MODULE_HTTP_REQUIRED_CAPABILITY,
    ):
        return {"ok": True, "started": False, "alreadyRunning": True, "url": MODULES_URL, "indexUrl": index_url}

    classification = _classify_port_processes(MODULES_PORT, markers=MODULE_HTTP_MARKERS, label="modules")
    if classification["foreign"]:
        return {
            "ok": False,
            "stage": "port-check",
            "error": f"Port {MODULES_PORT} is occupied by a non-skill process.",
            "port": classification,
        }
    for process in classification["skill"]:
        _terminate_pid(process["pid"])

    command = [
        sys.executable,
        str(SCRIPT_DIR / "module_http_service.py"),
        "--port",
        str(MODULES_PORT),
        "--host",
        MODULES_BIND_HOST,
        "--directory",
        str(MODULES_DIR),
        "--history-dir",
        str(SKILL_DIR / "history"),
    ]
    process_info = _spawn_background(command, log_name="modules-http.log", label="modules")
    _remember_service_process("modules", process_info)
    ready = _wait_until(
        lambda: _is_http_ready(index_url)
        and _is_service_health_ready(
            MODULE_HTTP_HEALTH_URL,
            expected_service=MODULE_HTTP_SERVICE_NAME,
            expected_capability=MODULE_HTTP_REQUIRED_CAPABILITY,
        ),
        timeout_seconds=10.0,
    )
    return {"ok": ready, "stage": None if ready else "module-http-service-not-ready", "started": True, "alreadyRunning": False, "url": MODULES_URL, "indexUrl": index_url, **process_info}


def get_module_url(module_id: str) -> str:
    normalized = str(module_id or "").strip()
    candidate = (MODULES_DIR / normalized).resolve()
    modules_root = MODULES_DIR.resolve()
    if not normalized or modules_root not in candidate.parents or not (candidate / "index.html").is_file():
        raise ValueError(f"Unknown module id: {module_id}")
    return urllib.parse.urljoin(MODULES_URL, f"{urllib.parse.quote(normalized)}/")


def open_module(module_id: str) -> dict[str, Any]:
    server = ensure_module_http_service()
    if not server.get("ok"):
        return {"ok": False, "stage": server.get("stage") or "module-http-service", "server": server}
    try:
        url = get_module_url(module_id)
    except ValueError as exc:
        return {"ok": False, "stage": "module-not-found", "errorType": type(exc).__name__, "error": str(exc), "server": server}
    return {"ok": True, "moduleId": module_id, "pageUrl": url, "moduleUrl": url, "server": server}


def cleanup_skill_runtime(*, force_unknown_port_pids: bool = False) -> dict[str, Any]:
    targets = [
        ("modules", "modules", MODULES_PORT, MODULE_HTTP_MARKERS),
        ("llmProxy", "llm-proxy", LLM_PROXY_PORT, LLM_PROXY_MARKERS),
        ("langchain", "langchain", LANGCHAIN_PORT, LANGCHAIN_MARKERS),
        ("cnn", "cnn", CNN_PORT, CNN_MARKERS),
    ]
    state = _read_runtime_state()
    recorded_services = state.get("services") if isinstance(state.get("services"), dict) else {}
    result: dict[str, Any] = {}
    for label, state_label, port, markers in targets:
        stopped: list[dict[str, Any]] = []
        foreign: list[dict[str, Any]] = []
        listening_pids = _find_listening_pids(port)
        recorded = recorded_services.get(state_label) if state_label else None
        recorded_pid = recorded.get("pid") if isinstance(recorded, dict) else None
        if isinstance(recorded_pid, int) and recorded_pid in listening_pids:
            _terminate_pid(recorded_pid)
            stopped.append({"pid": recorded_pid, "reason": "matched runtime state"})
            listening_pids.remove(recorded_pid)
        for process in listening_pids:
            commandline = _get_process_commandline(process)
            entry = {"pid": process, "commandline": commandline}
            if commandline and _matches_skill_process(commandline, markers):
                _terminate_pid(process)
                stopped.append(entry)
            elif force_unknown_port_pids and not commandline:
                _terminate_pid(process)
                stopped.append({**entry, "reason": "forced cleanup with unavailable command line"})
            else:
                foreign.append(entry)
        if state_label:
            _remove_remembered_service(state_label)
        result[label] = {"port": port, "stopped": stopped, "foreign": foreign}
    return result
