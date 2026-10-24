"""Templates must remain usable after being copied into a tool category directory."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize(
    "template,helper,runtime",
    [
        ("python_tool.py", "_common.py", [sys.executable, "-S", "-B"]),
        ("node_tool.mjs", "_cli.mjs", ["node"]),
    ],
)
def test_copied_template_help_import_and_unimplemented_behavior(
    tmp_path, template, helper, runtime
):
    category = tmp_path / "scripts/checks"
    common = tmp_path / "scripts/common"
    category.mkdir(parents=True)
    common.mkdir()
    target = category / ("new_tool" + Path(template).suffix)
    shutil.copyfile(SCRIPTS / "templates" / template, target)
    shutil.copyfile(SCRIPTS / "common" / helper, common / helper)
    environment = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}

    def execute(*arguments):
        return subprocess.run(
            [*runtime, str(target), *arguments],
            capture_output=True,
            text=True,
            encoding="utf-8",
            env=environment,
            timeout=10,
        )

    help_result = execute("--help")
    assert help_result.returncode == 0, help_result.stderr
    assert "--help" in help_result.stdout
    failed = execute()
    assert failed.returncode == 2
    assert json.loads(failed.stdout)["status"] == "error"
    assert "Implement" in failed.stderr

    if target.suffix == ".py":
        code = "import importlib.util,sys; spec=importlib.util.spec_from_file_location('copied_tool',sys.argv[1]); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)"
        command = [*runtime, "-c", code, str(target)]
    else:
        code = "import {pathToFileURL} from 'node:url'; const file=process.argv[1]; process.argv=['node','import-only']; await import(pathToFileURL(file).href);"
        command = ["node", "--input-type=module", "-e", code, str(target)]
    imported = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=environment,
        timeout=10,
    )
    assert imported.returncode == 0, imported.stderr
    assert not imported.stdout and not imported.stderr
    assert {p.name for p in category.iterdir()} == {target.name}
    assert {p.name for p in common.iterdir()} == {helper}
