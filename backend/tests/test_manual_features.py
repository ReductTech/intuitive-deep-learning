import numpy as np
import pytest

from idl_backend.vision.training import manual_features as manual


def test_nine_grid_threshold_and_region_edges():
    image = np.zeros((1, 28, 28), np.float32)
    image[0, 8, 8] = 128 / 255
    image[0, 9, 9] = 1
    image[0, 18, 18] = 1
    image[0, 0, 9] = 127 / 255
    assert manual.nine_grid_features(image).tolist() == [[1, 0, 0, 0, 1, 0, 0, 0, 1]]
    assert manual.nine_grid_features(np.ones_like(image)).tolist() == [manual.AREAS.tolist()]


@pytest.mark.parametrize("payload", [{}, {"seed": -1}, {"seed": 10}, {"seed": True}, {"seed": 1.5}, {"seed": 2, "epochs": 20}])
def test_seed_contract(payload):
    with pytest.raises(ValueError):
        manual.validate_seed(payload)


def test_training_is_reproducible_and_returns_inference_weights(monkeypatch):
    rng = np.random.default_rng(43)
    images = rng.random((100, 28, 28), dtype=np.float32)
    labels = np.repeat(np.arange(10), 10)
    monkeypatch.setattr(manual, "read_idx_images", lambda path: images)
    monkeypatch.setattr(manual, "read_idx_labels", lambda path: labels)
    observed = []
    first = manual.train_manual_features({"seed": 3}, lambda *args, **kwargs: observed.append(kwargs["history"][-1]["epoch"]))
    second = manual.train_manual_features({"seed": 3})
    assert first == second
    assert observed == list(range(1, 11))
    assert first["epochs"] == 10
    assert first["train_count"] == 90 and first["val_count"] == 10
    assert set(first["dataset"]["train_indices"]).isdisjoint(first["dataset"]["val_indices"])
    model = first["classifier"]
    parameters = [np.asarray(model[key]) for key in ("hidden_weights", "hidden_bias", "output_weights", "output_bias")]
    assert sum(p.size for p in parameters) == 650
    _, probabilities = manual.forward(manual.nine_grid_features(images) / np.asarray(model["areas"]), parameters)
    assert np.isfinite(probabilities).all()
    np.testing.assert_allclose(probabilities.sum(axis=1), 1)
    other = manual.train_manual_features({"seed": 4})
    assert first["classifier"] != other["classifier"]
