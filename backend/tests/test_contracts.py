import json
from pathlib import Path
import shutil
import subprocess
import sys

import pytest
from idl_backend.config import artifact_directory, data_directory, model_directory, service_address, source_label
from idl_backend.contracts.courses import load_courses
from idl_backend.contracts.tasks import endpoints, execute_vision

ROOT = Path(__file__).resolve().parents[2]


def test_backend_data_uses_datasets_even_when_old_asset_directory_exists(tmp_path, monkeypatch):
    monkeypatch.setenv("IDL_REPOSITORY_ROOT", str(tmp_path))
    for name in ("IDL_DATA_DIR", "IDL_MODEL_DIR", "IDL_ARTIFACT_DIR"):
        monkeypatch.delenv(name, raising=False)
    (tmp_path / "assets/dataset").mkdir(parents=True)
    assert data_directory() == tmp_path / "datasets"
    assert model_directory() == tmp_path / "datasets/models"
    assert artifact_directory().is_relative_to(tmp_path / "datasets")
    mounted = tmp_path / "mounted-data"
    monkeypatch.setenv("IDL_DATA_DIR", str(mounted))
    assert data_directory() == mounted
    assert model_directory() == mounted / "models"
    monkeypatch.setenv("IDL_MODEL_DIR", str(tmp_path / "weight-volume"))
    monkeypatch.setenv("IDL_ARTIFACT_DIR", str(tmp_path / "training-volume"))
    assert model_directory() == tmp_path / "weight-volume"
    assert artifact_directory() == tmp_path / "training-volume"


def test_address_configuration_overrides_os_default(monkeypatch):
    monkeypatch.delenv("GPU_GATEWAY_BASE_URL", raising=False)
    assert service_address("vision", platform="win32") == "http://127.0.0.1:28431"
    assert service_address("vision", platform="linux") == ""
    monkeypatch.setenv("GPU_GATEWAY_BASE_URL", "http://mapped-host:28431/")
    assert service_address("vision", platform="win32") == "http://mapped-host:28431"


def test_registered_signed_uuid_and_legacy_cache_identity():
    course = load_courses()["80396753-7fc8-4f55-9188-bddbdb828169"]
    assert course.legacy_cache_scope == "official/visual-feature-learning"


def test_duplicate_signed_identity_is_rejected(tmp_path, monkeypatch):
    import base64
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    from idl_backend.contracts import courses
    key = Ed25519PrivateKey.generate()
    monkeypatch.setattr(courses, "PUBLIC_KEY", base64.b64encode(key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)).decode())
    for directory in ["CourseA", "CourseB"]:
        target = tmp_path / directory
        target.mkdir()
        identity = {"version": 1, "modulePath": "/modules/" + directory.lower(), "id": "80396753-7fc8-4f55-9188-bddbdb828169"}
        signature = key.sign(json.dumps(identity, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("ascii"))
        document = {"id": directory.lower(), "path": identity["modulePath"], "moduleIdentity": {"version": 1, "id": identity["id"], "signature": base64.b64encode(signature).decode()}}
        (target / "outlines.json").write_text(json.dumps(document), encoding="utf-8")
    with pytest.raises(ValueError, match="Duplicate"):
        load_courses(tmp_path)


def test_importing_http_contract_does_not_load_vision_or_llm():
    script = "import sys; sys.path.insert(0, 'backend/src'); import idl_backend.local.http; assert 'torch' not in sys.modules; assert 'insightface' not in sys.modules; assert 'idl_backend.assessment.config' not in sys.modules"
    subprocess.run([sys.executable, "-c", script], cwd=ROOT, check=True)


def test_fixed_features_execute_without_face_initialization():
    result = execute_vision("/lenet5/fixed-kernel-preview", {"image": [[0] * 28 for _ in range(28)]})
    assert result["dataset"]["images"] == "custom-canvas"
    assert result["dataset"]["count"] == 1


def test_external_dataset_paths_are_valid_metadata(tmp_path):
    assert source_label(tmp_path / "images.idx") == (tmp_path / "images.idx").as_posix()


def test_vision_catalog_includes_new_digit_tasks():
    assert "/emnist/predict-digits" in endpoints("vision")
    assert "/visual-feature-learning/digit-train" in endpoints("vision")
