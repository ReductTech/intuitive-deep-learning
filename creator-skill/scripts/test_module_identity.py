import json
import uuid

import pytest

import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location("authoring_identity", Path(__file__).resolve().parent / "module_identity.py")
identity = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(identity)
from idl_backend.contracts.courses import load_courses

MODULE_ID = "2e5c4732-a40a-4d20-b954-a61507aabc75"


@pytest.fixture
def modules(tmp_path, monkeypatch):
    root = tmp_path / "modules"
    root.mkdir()
    monkeypatch.setattr(identity, "ROOT", tmp_path)
    monkeypatch.setattr(identity, "MODULES_DIR", root)
    return root


def outline(modules, name="Example", module_identity=None, *, missing=False):
    path = modules / name / "outlines.json"
    path.parent.mkdir()
    document = {"path": "/modules/" + name.lower(), "title": "Example"}
    if not missing:
        document["moduleIdentity"] = module_identity
    path.write_text(json.dumps(document), encoding="utf-8")
    return path


def test_generate_missing_uuid_without_keys_and_preserve_on_rerun(modules):
    path = outline(modules, missing=True)
    assert identity.process_outlines() == 0
    document = json.loads(path.read_text())
    value = document["moduleIdentity"]
    assert set(value) == {"version", "id"}
    assert value["version"] == 1
    assert uuid.UUID(value["id"]).version == 4
    original = path.read_bytes()
    assert identity.process_outlines() == 0
    assert identity.process_outlines(check_only=True) == 0
    assert path.read_bytes() == original
    assert value["id"] in load_courses(modules)


def test_check_missing_is_read_only_and_loader_rejects_missing(modules):
    path = outline(modules, missing=True)
    original = path.read_bytes()
    assert identity.process_outlines(check_only=True) == 1
    assert path.read_bytes() == original
    with pytest.raises(identity.IdentityError, match="Missing"):
        load_courses(modules)


@pytest.mark.parametrize("value", [
    None, {}, {"id": MODULE_ID},
    {"version": True, "id": MODULE_ID}, {"version": 2, "id": MODULE_ID},
    {"version": 1, "id": None}, {"version": 1, "id": "invalid"},
    {"version": 1, "id": MODULE_ID.upper()},
    {"version": 1, "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"},
])
def test_invalid_identity_stops_before_generating_anything(modules, value):
    missing = outline(modules, "A", missing=True)
    invalid = outline(modules, "Z", value)
    originals = [p.read_bytes() for p in (missing, invalid)]
    for check_only in (False, True):
        with pytest.raises(identity.IdentityError, match="Invalid"):
            identity.process_outlines(check_only=check_only)
    with pytest.raises(identity.IdentityError):
        load_courses(modules)
    assert [p.read_bytes() for p in (missing, invalid)] == originals


def test_duplicate_uuid_stops_without_writes(modules):
    missing = outline(modules, "A", missing=True)
    for name in ("B", "C"):
        outline(modules, name, {"version": 1, "id": MODULE_ID})
    original = missing.read_bytes()
    for check_only in (False, True):
        with pytest.raises(identity.IdentityError, match="Duplicate"):
            identity.process_outlines(check_only=check_only)
    assert missing.read_bytes() == original


def test_legacy_signature_is_ignored_and_removed_without_changing_uuid(modules):
    path = outline(modules, module_identity={"version": 1, "id": MODULE_ID, "signature": "invalid-old-signature"})
    original = path.read_bytes()
    assert MODULE_ID in load_courses(modules)
    assert identity.process_outlines(check_only=True) == 0
    assert path.read_bytes() == original
    assert identity.process_outlines() == 0
    assert json.loads(path.read_text())["moduleIdentity"] == {"version": 1, "id": MODULE_ID}


def test_module_can_be_renamed_without_changing_uuid(modules):
    path = outline(modules, module_identity={"version": 1, "id": MODULE_ID})
    renamed = modules / "Renamed"
    path.parent.rename(renamed)
    path = renamed / "outlines.json"
    document = json.loads(path.read_text())
    document["path"] = "/modules/renamed"
    path.write_text(json.dumps(document))
    assert identity.process_outlines(check_only=True) == 0
    assert load_courses(modules)[MODULE_ID].module_path == "/modules/renamed"
