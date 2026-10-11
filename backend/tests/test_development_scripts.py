"""Exercise the real Windows entrypoints without touching existing services."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys

import pytest


@pytest.mark.skipif(sys.platform != "win32", reason="Windows PowerShell entrypoints")
def test_start_is_idempotent_and_stop_only_removes_owned_service(tmp_path):
    pytest.importorskip("psutil")
    root = Path(__file__).resolve().parents[2]
    shell = shutil.which("powershell.exe")
    if not shell:
        pytest.skip("PowerShell not installed")
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    environment = {
        **os.environ,
        "PATH": str(Path(sys.executable).parent) + os.pathsep + os.environ["PATH"],
        "IDL_REPOSITORY_ROOT": str(tmp_path),
        "IDL_MODULES_DIR": str(root / "modules"),
        "IDL_MODEL_DIR": str(root / "datasets/models"),
    }

    def invoke(script, *arguments):
        result = subprocess.run([shell, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(root / "scripts" / script), "-Kind", "vision", *arguments], env=environment, capture_output=True, text=True, timeout=110)
        assert result.returncode == 0, result.stdout + result.stderr
        return result.stdout

    state = tmp_path / "runtime_logs/development.json"
    try:
        invoke("devstart.ps1", "-Port", str(port), "-Device", "cpu")
        initial = json.loads(state.read_text())["vision"]
        invoke("devstart.ps1", "-Port", str(port))
        assert json.loads(state.read_text())["vision"]["pid"] == initial["pid"]
        assert "ready" in invoke("devstart.ps1", "-Status")
    finally:
        invoke("devstop.ps1")
    assert "vision" not in json.loads(state.read_text())
    import psutil
    assert not psutil.pid_exists(initial["pid"])
    invoke("devstop.ps1")  # Repeating stop is safe.
