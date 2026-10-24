"""Behavioral checks for CLI imports, optional dependencies and result boundaries."""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import pytest

from tools import catalog

SCRIPTS = Path(__file__).resolve().parents[1]
ROOT = SCRIPTS.parent.parent
PYTHON_TOOLS = sorted(
    {
        Path(tool["path"]).relative_to("scripts").as_posix()
        for tool in catalog()
        if tool["runtime"] == "python"
    }
)
NODE_TOOLS = sorted(
    {
        Path(tool["path"]).relative_to("scripts").as_posix()
        for tool in catalog()
        if tool["runtime"] == "node"
    }
    | {"analysis/collect_page_metrics.cjs"}
)


def tool_path(name):
    """Resolve test shorthand through the same catalog as the public entry point."""
    if "/" in name:
        return SCRIPTS / name
    return next(
        SCRIPTS.parent / tool["path"]
        for tool in catalog()
        if Path(tool["path"]).name == name
    )


def execute(name, *arguments):
    return subprocess.run(
        [sys.executable, "-B", str(tool_path(name)), *map(str, arguments)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
        timeout=20,
    )


@pytest.mark.parametrize("name", PYTHON_TOOLS)
def test_python_help_works_without_site_packages(name):
    result = subprocess.run(
        [sys.executable, "-S", "-B", str(tool_path(name)), "--help"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
        timeout=15,
    )
    assert result.returncode == 0, result.stderr
    assert "usage:" in result.stdout


@pytest.mark.parametrize("name", PYTHON_TOOLS)
def test_python_import_does_not_parse_arguments_or_launch_processes(name):
    code = """
import importlib.util, pathlib, subprocess, sys
sys.path.insert(0, sys.argv[1])
file = pathlib.Path(sys.argv[1]) / sys.argv[2]
sys.argv = ["import-only", "--invalid-argument"]
def forbidden(*args, **kwargs):
    raise AssertionError("Import must not launch a subprocess")
subprocess.run = subprocess.Popen = forbidden
spec = importlib.util.spec_from_file_location("import_probe", file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
print("imported")
"""
    result = subprocess.run(
        [sys.executable, "-S", "-B", "-c", code, str(SCRIPTS), name],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=ROOT,
        timeout=15,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "imported"


@pytest.mark.parametrize("name", NODE_TOOLS)
def test_node_import_does_not_parse_arguments_scan_files_or_contact_browser(name):
    code = """
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const file = process.argv[1];
process.argv = ['node', 'import-only', '--invalid-argument'];
fs.readdirSync = () => {throw Error('Import must not scan module files');};
globalThis.fetch = () => {throw Error('Import must not contact a browser');};
await import(pathToFileURL(file).href);
console.log('imported');
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", code, str(SCRIPTS / name)],
        capture_output=True,
        text=True,
        cwd=ROOT,
        timeout=15,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "imported"


def test_validation_results_distinguish_failed_check_from_execution_error(tmp_path):
    skill = tmp_path / "SKILL.md"
    skill.write_text(
        "---\nname: sample\ndescription: A sample skill\n---\n", encoding="utf-8"
    )
    passed = execute("validate_skill.py", tmp_path)
    assert passed.returncode == 0
    assert json.loads(passed.stdout)["status"] == "passed"
    skill.write_text("invalid frontmatter", encoding="utf-8")
    failed = execute("validate_skill.py", tmp_path)
    assert failed.returncode == 1
    assert json.loads(failed.stdout)["status"] == "failed"
    error = execute(
        "init_module.py", "--repository", tmp_path, "--directory", "../escape"
    )
    assert error.returncode == 2
    assert json.loads(error.stdout)["status"] == "error"
    assert error.stderr.strip()
    assert not (tmp_path / "modules").exists()


def test_media_execution_preserves_encoding_options_and_reports_files(
    tmp_path, monkeypatch, capsys
):
    from media import remove_green_screen as media

    source = tmp_path / "input.mp4"
    source.write_bytes(b"fixture")
    calls = []
    monkeypatch.setattr(media.shutil, "which", lambda _: "ffmpeg")
    monkeypatch.setattr(
        media.subprocess,
        "run",
        lambda command, **kwargs: calls.append((command, kwargs)),
    )
    assert media.main([str(source)]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["status"] == "ok"
    assert result["files"] == [
        str(source.with_name("input_alpha.webm")),
        str(source.with_name("input_alpha.mov")),
    ]
    assert len(calls) == 2
    assert "libvpx-vp9" in calls[0][0] and "prores_ks" in calls[1][0]
    assert all(kwargs["stdout"] is sys.stderr for _, kwargs in calls)


def test_upload_dry_run_returns_json_without_importing_oss(
    tmp_path, monkeypatch, capsys
):
    spec = importlib.util.spec_from_file_location(
        "upload_cli", SCRIPTS / "media/upload-assets-oss.py"
    )
    uploader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uploader)
    (tmp_path / "image.png").write_bytes(b"fixture")
    monkeypatch.setitem(sys.modules, "oss2", None)
    assert uploader.main(["--assets-dir", str(tmp_path), "--dry-run"]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["status"] == "dry-run"
    assert result["objects"] == ["cloud-IDL/assets/image.png"]


def test_doctor_checks_node_as_an_executable(monkeypatch):
    from checks import doctor

    monkeypatch.setattr(
        doctor.shutil, "which", lambda name: "node.exe" if name == "node" else None
    )
    checks = doctor.diagnose("core", "analyze.pages")
    assert next(item for item in checks if item["name"] == "Node")["available"]
    assert not any(item["name"] == "node" for item in checks)
