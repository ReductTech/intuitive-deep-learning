import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from checks.validate_module import validate_modules
from checks.validate_skill import validate_skill

TOOLS = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("oss_uploader", TOOLS / "media/upload-assets-oss.py")
uploader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(uploader)
UUID = "2e5c4732-a40a-4d20-b954-a61507aabc75"


def course(root, name="Example", module_id=UUID):
    directory = root / "modules" / name
    directory.mkdir(parents=True)
    (directory / "Guide.tsx").write_text("export function Guide() { return null; }")
    outline = {"id": name.lower(), "title": "Example", "path": "/modules/" + name.lower(),
               "entry": "Guide.tsx", "moduleIdentity": {"version": 1, "id": module_id},
               "pages": [{"id": "01", "title": "Question"}]}
    (directory / "outlines.json").write_text(json.dumps(outline))
    return directory


def test_valid_course_and_literal_asset_are_accepted(tmp_path):
    directory = course(tmp_path)
    assets = tmp_path / "assets" / UUID
    assets.mkdir(parents=True)
    (assets / "image.png").write_bytes(b"image")
    (directory / "asset.ts").write_text(f"moduleAssetUrl('{UUID}', 'image.png')")
    assert validate_modules(tmp_path) == []


def test_missing_and_escaping_assets_are_rejected(tmp_path):
    directory = course(tmp_path)
    (directory / "asset.ts").write_text(f"moduleAssetUrl('{UUID}', '../../outside.png')")
    (tmp_path / "outside.png").write_bytes(b"must not be accepted")
    assert any("escaping asset" in error for error in validate_modules(tmp_path))


def test_uuid_duplicates_detected_even_when_selecting_one_module(tmp_path):
    course(tmp_path, "A")
    course(tmp_path, "B")
    assert any("Duplicate course UUID" in error for error in validate_modules(tmp_path, "A"))


def test_unknown_module_reports_failure(tmp_path):
    course(tmp_path)
    assert any("Unknown module" in error for error in validate_modules(tmp_path, "typo"))


def test_missing_entry_and_duplicate_pages_are_rejected(tmp_path):
    directory = course(tmp_path)
    (directory / "Guide.tsx").unlink()
    path = directory / "outlines.json"
    doc = json.loads(path.read_text())
    doc["pages"] *= 2
    path.write_text(json.dumps(doc))
    errors = validate_modules(tmp_path)
    assert any("existing root TSX" in error for error in errors)
    assert any("duplicate page" in error for error in errors)


def test_module_local_assets_and_wrong_asset_id_are_rejected(tmp_path):
    directory = course(tmp_path)
    (directory / "assets").mkdir()
    (directory / "assets/picture.png").write_bytes(b"image")
    (directory / "Deck.tsx").write_text('const element = <SceneDeck assetId="example" />')
    errors = validate_modules(tmp_path)
    assert any("module-local" in error for error in errors)
    assert any("assetId must" in error for error in errors)


def test_skill_rejects_empty_description_and_broken_reference(tmp_path):
    path = tmp_path / "SKILL.md"
    path.write_text('---\nname: example\ndescription: ""\n---\n')
    assert not validate_skill(tmp_path)[0]
    path.write_text('---\nname: example\ndescription: Does something\n---\n[missing](missing.md)\n')
    assert not validate_skill(tmp_path)[0]


def test_upload_skips_existing_and_forbids_unintended_overwrite(tmp_path):
    path = tmp_path / "course/picture.png"
    path.parent.mkdir()
    path.write_bytes(b"image")
    calls = []
    bucket = SimpleNamespace(object_exists=lambda key: True, put_object_from_file=lambda *a, **kw: calls.append((a, kw)))
    assert uploader.upload_one(bucket, tmp_path, path, False)[0] == "skipped"
    assert calls == []
    assert uploader.upload_one(bucket, tmp_path, path, True)[0] == "uploaded"
    bucket.object_exists = lambda key: False
    uploader.upload_one(bucket, tmp_path, path, False)
    assert calls[-1][1]["headers"]["x-oss-forbid-overwrite"] == "true"


def test_upload_private_records_remain_private(tmp_path):
    path = tmp_path / "record.json"
    path.write_text("{}")
    calls = []
    bucket = SimpleNamespace(object_exists=lambda key: False, put_object_from_file=lambda *a, **kw: calls.append((a, kw)))
    uploader.upload_one(bucket, tmp_path, path, False, True)
    assert calls[0][0][0] == "cloud-IDL/records/record.json"
    assert calls[0][1]["headers"]["x-oss-object-acl"] == "private"
    assert calls[0][1]["headers"]["Cache-Control"] == "private, no-store"


def test_dry_run_preserves_uuid_prefix_without_oss_or_credentials(tmp_path, monkeypatch, capsys):
    import sys
    (tmp_path / UUID).mkdir()
    (tmp_path / UUID / "picture.png").write_bytes(b"image")
    monkeypatch.setattr(uploader, "OSS_KEY_ID", "")
    monkeypatch.setattr(uploader, "OSS_KEY_SECRET", "")
    monkeypatch.setitem(sys.modules, "oss2", None)
    monkeypatch.setattr(sys, "argv", ["uploader", "--assets-dir", str(tmp_path), "--module", UUID, "--dry-run"])
    assert uploader.main() == 0
    assert f"cloud-IDL/assets/{UUID}/picture.png" in capsys.readouterr().out


def test_full_datasets_and_model_weights_are_not_uploaded(tmp_path):
    for name in ["course/view.npz", "datasets/full.npy", "course/models/model.pt", "course/digit-training/job/result.npz"]:
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"data")
    assert [path.relative_to(tmp_path).as_posix() for path in uploader.visualization_files(tmp_path)] == ["course/view.npz"]


def test_optional_module_slug_uses_existing_router_fallback(tmp_path):
    directory = course(tmp_path)
    path = directory / "outlines.json"
    doc = json.loads(path.read_text())
    del doc["id"]
    path.write_text(json.dumps(doc))
    assert validate_modules(tmp_path) == []


def test_atlas_virtual_image_requires_a_real_mapped_sheet(tmp_path):
    directory = course(tmp_path)
    assets = tmp_path / "assets" / UUID
    (assets / "image-atlases").mkdir(parents=True)
    (assets / "image-atlases/index.json").write_text(json.dumps({"virtual.png": {"sheet": "image-atlases/sheet.png"}}))
    (directory / "asset.ts").write_text(f"atlasCropUrl(moduleAssetUrl('{UUID}', 'virtual.png'))")
    assert any("missing" in error for error in validate_modules(tmp_path))
    (assets / "image-atlases/sheet.png").write_bytes(b"sheet")
    assert validate_modules(tmp_path) == []
    (directory / "asset.ts").write_text(f"moduleAssetUrl('{UUID}', 'virtual.png')")
    assert any("missing" in error for error in validate_modules(tmp_path))
