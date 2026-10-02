"""Native developer services; tracks and stops only processes started here."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

import psutil
from idl_backend.config import repository_root

SERVICES = {
    "records": (59411, "deep-learning-module-server", "/__telemetry/health", ["-m", "idl_backend.local.content_http", "--host", "127.0.0.1", "--port", "59411"]),
    "proxy": (59413, "llm-proxy", "/health", ["-m", "idl_backend.assessment.proxy.cli", "--host", "127.0.0.1", "--port", "59413"]),
    "assessment": (28432, "assessment-service", "/healthz", ["-m", "idl_backend", "serve", "--kind", "assessment", "--dev"]),
    "vision": (28431, "vision-service", "/healthz", ["-m", "idl_backend", "serve", "--kind", "vision", "--dev"]),
}


def healthy(name, port=None):
    service_port, identity, path, _ = SERVICES[name]
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port or service_port}{path}", timeout=1) as response:
            return json.loads(response.read()).get("service") == identity
    except (OSError, ValueError):
        return False


def owned_process(record, root):
    try:
        process = psutil.Process(record["pid"])
        if abs(process.create_time() - record["created"]) > 0.01:
            return None
        if Path(process.cwd()).resolve() != root.resolve() or process.cmdline() != record["command"]:
            return None
        return process
    except (psutil.NoSuchProcess, psutil.AccessDenied, KeyError):
        return None


def stop_owned(record, root):
    process = owned_process(record, root)
    if process is None:
        return
    children = process.children(recursive=True)
    for child in children:
        try:
            child.terminate()
        except psutil.NoSuchProcess:
            pass
    process.terminate()
    _, remaining = psutil.wait_procs(children + [process], timeout=5)
    for child in remaining:
        child.kill()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--action", choices=["start", "status", "stop"], default="start")
    parser.add_argument("--kind", choices=["all", *SERVICES], default="all")
    parser.add_argument("--device", choices=["auto", "cpu", "cuda", "mps"], default="auto")
    parser.add_argument("--port", type=int)
    parser.add_argument("--course")
    args = parser.parse_args()
    if args.port and args.kind == "all":
        parser.error("--port requires a single --kind")
    root = repository_root()
    logs = root / "runtime_logs"
    logs.mkdir(exist_ok=True)
    state_file = logs / "development.json"
    state = json.loads(state_file.read_text()) if state_file.exists() else {}
    selected = list(SERVICES) if args.kind == "all" else [args.kind]
    started = []
    try:
        for name in selected:
            record = state.get(name, {})
            port = args.port or record.get("port") or SERVICES[name][0]
            if args.action == "stop":
                stop_owned(record, root)
                state.pop(name, None)
                print(f"{name}: stopped owned process", flush=True)
                continue
            if args.action == "status":
                print(f"{name}: {'ready' if healthy(name, port) else 'not running'} ({port})", flush=True)
                continue
            if healthy(name, port):
                print(f"{name}: already ready ({port})", flush=True)
                continue
            if any(row.status == psutil.CONN_LISTEN and row.laddr.port == port for row in psutil.net_connections(kind="inet")):
                raise RuntimeError(f"Port {port} is occupied by another service; it will not be stopped.")
            arguments = list(SERVICES[name][3])
            if args.port:
                if "--port" in arguments:
                    arguments[arguments.index("--port") + 1] = str(port)
                else:
                    arguments += ["--port", str(port)]
            if name == "vision":
                arguments += ["--device", args.device]
            if args.course and name in {"vision", "assessment"}:
                arguments += ["--course", args.course]
            command = [sys.executable, *arguments]
            environment = {**os.environ, "IDL_REPOSITORY_ROOT": str(root), "PYTHONUTF8": "1"}
            environment["PYTHONPATH"] = str(root / "backend/src") + os.pathsep + environment.get("PYTHONPATH", "")
            with (logs / (name + ".log")).open("w", encoding="utf-8") as output:
                options = {"creationflags": subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" else {"start_new_session": True}
                process = subprocess.Popen(command, cwd=root, env=environment, stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT, **options)
            state[name] = {"pid": process.pid, "created": psutil.Process(process.pid).create_time(), "command": command, "port": port}
            started.append(name)
            deadline = time.monotonic() + (90 if name == "vision" else 30)
            while time.monotonic() < deadline and process.poll() is None and not healthy(name, port):
                time.sleep(0.2)
            if not healthy(name, port):
                raise RuntimeError(f"{name} failed to start. See {logs / (name + '.log')}")
            print(f"{name}: ready at http://127.0.0.1:{port}", flush=True)
    except Exception:
        for name in started:
            stop_owned(state.pop(name), root)
        raise
    finally:
        temporary = state_file.with_suffix(".tmp")
        temporary.write_text(json.dumps(state, indent=2), encoding="utf-8")
        temporary.replace(state_file)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
