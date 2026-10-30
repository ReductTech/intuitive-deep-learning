import json
from pathlib import Path
import subprocess
import sys
import uuid

import pytest

from module import init_module
from module.init_module import ensure_outline


def test_existing_outline_is_not_opened_or_changed(tmp_path, monkeypatch):
    folder = tmp_path / "modules/Example"
    folder.mkdir(parents=True)
    outline = folder / "outlines.json"
    original = b'\xef\xbb\xbf{\r\n "moduleIdentity": {"id":"keep-me", "signature":"keep-this-too"}, "custom":42\r\n}\r\n'
    outline.write_bytes(original)
    before = outline.stat()
    with monkeypatch.context() as patch:
        patch.setattr(Path, "open", lambda *a, **kw: pytest.fail("existing outline must not be opened"))
        patch.setattr(init_module, "new_identity", lambda *a: pytest.fail("must not generate a replacement identity"))
        result = ensure_outline(tmp_path, "Example", "A different title")
    assert result["status"] == "unchanged"
    assert outline.read_bytes() == original
    assert outline.stat().st_mtime_ns == before.st_mtime_ns
    assert {p.name for p in folder.iterdir()} == {"outlines.json"}


def test_missing_outline_is_created_once_in_existing_module(tmp_path):
    folder = tmp_path / "modules/Example"
    folder.mkdir(parents=True)
    source = folder / "Existing.tsx"
    source.write_text("existing page", encoding="utf-8")
    result = ensure_outline(tmp_path, "Example", "示例")
    outline = folder / "outlines.json"
    document = json.loads(outline.read_text(encoding="utf-8"))
    assert result["status"] == "created"
    assert document["title"] == "示例"
    assert document["id"] == "example"
    assert document["path"] == "/modules/example"
    assert document["pages"] == []
    assert uuid.UUID(document["moduleIdentity"]["id"]).version == 4
    original = outline.read_bytes()
    assert ensure_outline(tmp_path, "Example")["status"] == "unchanged"
    assert outline.read_bytes() == original
    assert source.read_text(encoding="utf-8") == "existing page"
    assert {p.name for p in folder.iterdir()} == {"outlines.json", "Existing.tsx"}
    assert not (tmp_path / "assets").exists()


def test_dry_run_does_not_create_module(tmp_path):
    assert ensure_outline(tmp_path, "Example", dry_run=True)["status"] == "would-create"
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize("directory", ["../Other", "a/b", "a\\b", "", ".."])
def test_invalid_directory_cannot_write_elsewhere(tmp_path, directory):
    with pytest.raises(ValueError):
        ensure_outline(tmp_path, directory)
    assert list(tmp_path.iterdir()) == []


def test_concurrent_creator_is_not_overwritten(tmp_path, monkeypatch):
    winner = b'{"moduleIdentity":{"id":"created-by-another-process"}}'
    def competing_link(source, destination):
        destination.write_bytes(winner)
        raise FileExistsError()
    monkeypatch.setattr(init_module.os, "link", competing_link)
    assert ensure_outline(tmp_path, "Example")["status"] == "unchanged"
    folder = tmp_path / "modules/Example"
    assert (folder / "outlines.json").read_bytes() == winner
    assert {p.name for p in folder.iterdir()} == {"outlines.json"}


def test_cli_needs_only_directory_and_preserves_existing_outline(tmp_path):
    command = [sys.executable, "-B", str(Path(init_module.__file__)),
               "--repository", str(tmp_path), "--directory", "Example"]
    created = subprocess.run(command, capture_output=True, text=True, check=True)
    assert json.loads(created.stdout)["status"] == "created"
    path = tmp_path / "modules/Example/outlines.json"
    original = path.read_bytes()
    unchanged = subprocess.run(command + ["--title", "Ignore this"], capture_output=True, text=True, check=True)
    assert json.loads(unchanged.stdout)["status"] == "unchanged"
    assert path.read_bytes() == original
