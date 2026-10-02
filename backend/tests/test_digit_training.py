"""Small real CPU training validates the moved implementation and artifacts."""
import numpy as np
import pytest


def test_digit_training_keeps_metrics_progress_and_artifacts(tmp_path, monkeypatch):
    torch = pytest.importorskip("torch")
    torch.set_num_threads(1)
    from idl_backend.vision.training import digits
    monkeypatch.setenv("IDL_DEVICE", "cpu")
    monkeypatch.setenv("IDL_ARTIFACT_DIR", str(tmp_path))
    rng = np.random.default_rng(7)
    training = (rng.random((32, 1, 28, 28), dtype=np.float32), np.arange(32, dtype=np.int64) % 10)
    validation = (rng.random((20, 1, 28, 28), dtype=np.float32), np.arange(20, dtype=np.int64) % 10)
    monkeypatch.setattr(digits, "load_digit_training_subset", lambda: (training, validation))
    progress = []
    result = digits.train_digit_network({"epochs": 1, "architecture": [{"kind": "conv", "out_channels": 8}]}, lambda *args, **kwargs: progress.append((args, kwargs)), artifact_id="stable-job")
    assert result["session_id"] == "stable-job"
    assert result["train_count"] == 32 and result["val_count"] == 20
    assert len(result["history"]) == 1
    assert 0 <= result["val_accuracy"] <= 1
    assert progress[-1][1]["history"] == result["history"]
    for filename in ("model.pt", "features.npz", "result.json"):
        assert (tmp_path / "stable-job" / filename).is_file()
