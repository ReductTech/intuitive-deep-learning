"""Nine-grid MNIST classifier; results are persisted by Cloud CacheDao only."""
from __future__ import annotations

import numpy as np

from idl_backend.datasets.digits import IMAGE_PATH, LABEL_PATH, read_idx_images, read_idx_labels
from idl_backend.config import source_label

EPOCHS = 10
EDGES = (0, 9, 18, 28)
AREAS = np.asarray([81, 81, 90, 81, 81, 90, 90, 90, 100], dtype=np.float32)


def validate_seed(payload):
    if set(payload) != {"seed"} or type(payload.get("seed")) is not int or not 0 <= payload["seed"] <= 9:
        raise ValueError("Request must contain only an integer seed from 0 to 9.")
    return payload["seed"]


def nine_grid_features(images):
    if images.ndim != 3 or images.shape[1:] != (28, 28):
        raise ValueError("Nine-grid inputs must be 28x28 images.")
    ink = images >= (128 / 255)
    return np.stack([
        ink[:, EDGES[row]:EDGES[row + 1], EDGES[col]:EDGES[col + 1]].sum(axis=(1, 2))
        for row in range(3) for col in range(3)
    ], axis=1).astype(np.float32)


def forward(x, parameters):
    w1, b1, w2, b2 = parameters
    hidden = np.maximum(x @ w1.T + b1, 0)
    logits = hidden @ w2.T + b2
    logits -= logits.max(axis=1, keepdims=True)
    probability = np.exp(logits)
    probability /= probability.sum(axis=1, keepdims=True)
    return hidden, probability


def train_manual_features(payload, progress_callback=None):
    seed = validate_seed(payload)
    rng = np.random.default_rng(seed)
    # Do not use load_base_dataset: its >0 binarization differs from page 7.
    images, labels = read_idx_images(IMAGE_PATH), read_idx_labels(LABEL_PATH)
    if len(images) != len(labels) or np.any((labels < 0) | (labels > 9)):
        raise ValueError("MNIST images and digit labels must match.")
    features = nine_grid_features(images) / AREAS
    train_indices, val_indices = [], []
    for digit in range(10):
        indices = rng.permutation(np.flatnonzero(labels == digit))
        if len(indices) < 2:
            raise ValueError("Each MNIST digit needs training and validation samples.")
        cut = min(len(indices) - 1, max(1, int(len(indices) * .9)))
        train_indices.extend(indices[:cut].tolist())
        val_indices.extend(indices[cut:].tolist())
    train_indices, val_indices = np.asarray(train_indices), np.asarray(val_indices)
    x, y = features[train_indices], labels[train_indices]
    vx, vy = features[val_indices], labels[val_indices]
    parameters = [
        rng.normal(0, np.sqrt(2 / 9), (32, 9)).astype(np.float32), np.zeros(32, np.float32),
        rng.normal(0, np.sqrt(2 / 32), (10, 32)).astype(np.float32), np.zeros(10, np.float32),
    ]
    moments = [np.zeros_like(p) for p in parameters]
    variances = [np.zeros_like(p) for p in parameters]
    history, step = [], 0
    for epoch in range(1, EPOCHS + 1):
        order = rng.permutation(len(x))
        for start in range(0, len(x), 128):
            batch = order[start:start + 128]
            bx, by = x[batch], y[batch]
            hidden, probability = forward(bx, parameters)
            gradient = probability.copy()
            gradient[np.arange(len(batch)), by] -= 1
            gradient /= len(batch)
            hidden_gradient = (gradient @ parameters[2]) * (hidden > 0)
            gradients = [hidden_gradient.T @ bx, hidden_gradient.sum(axis=0), gradient.T @ hidden, gradient.sum(axis=0)]
            step += 1
            for i, derivative in enumerate(gradients):
                moments[i] = .9 * moments[i] + .1 * derivative
                variances[i] = .999 * variances[i] + .001 * derivative ** 2
                parameters[i] -= .01 * (moments[i] / (1 - .9 ** step)) / (np.sqrt(variances[i] / (1 - .999 ** step)) + 1e-8)
        _, tp = forward(x, parameters)
        _, vp = forward(vx, parameters)
        record = {"epoch": epoch, "loss": float(-np.log(np.maximum(tp[np.arange(len(y)), y], 1e-8)).mean()),
                  "train_accuracy": float((tp.argmax(axis=1) == y).mean()), "val_accuracy": float((vp.argmax(axis=1) == vy).mean())}
        history.append(record)
        if progress_callback:
            progress_callback(epoch * 10, "training", f"Epoch {epoch} / {EPOCHS}", history=list(history))
    w1, b1, w2, b2 = parameters
    return {"seed": seed, "epochs": EPOCHS, "history": history,
            "train_accuracy": history[-1]["train_accuracy"], "val_accuracy": history[-1]["val_accuracy"],
            "train_count": len(x), "val_count": len(vx),
            "classifier": {"hidden_weights": w1.tolist(), "hidden_bias": b1.tolist(),
                           "output_weights": w2.tolist(), "output_bias": b2.tolist(), "areas": AREAS.tolist()},
            "dataset": {"images": source_label(IMAGE_PATH), "labels": source_label(LABEL_PATH),
                        "split": "local stratified 90/10 split of MNIST t10k", "threshold": 128,
                        "edges": list(EDGES), "train_indices": train_indices.tolist(), "val_indices": val_indices.tolist()}}
