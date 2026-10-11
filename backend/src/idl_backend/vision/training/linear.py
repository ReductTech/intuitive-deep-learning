"""vision / training / linear."""
from __future__ import annotations
from typing import Any
import numpy as np
from idl_backend.datasets.digits import (CLASS_COUNT)


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.maximum(exp.sum(axis=1, keepdims=True), 1e-8)


def train_classifier(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_val: np.ndarray,
    y_val: np.ndarray,
    class_count: int = CLASS_COUNT,
    seed: int = 20260705,
    epochs: int = 28,
    rate: float = 0.10,
    batch_size: int = 256,
    weight_scale: float = 0.035,
) -> dict[str, Any]:
    train_count = x_train.shape[0]
    mean = x_train.mean(axis=0, keepdims=True)
    std = x_train.std(axis=0, keepdims=True) + 1e-5
    x_train = (x_train - mean) / std
    x_val = (x_val - mean) / std

    rng = np.random.default_rng(seed)
    weights = rng.normal(0.0, weight_scale, size=(x_train.shape[1], class_count)).astype(np.float32)
    bias = np.zeros((1, class_count), dtype=np.float32)
    one_hot = np.eye(class_count, dtype=np.float32)[y_train]
    history: list[dict[str, float | int]] = []
    checkpoints = {
        0,
        max(0, epochs // 10 - 1),
        max(0, epochs // 5 - 1),
        max(0, epochs // 3 - 1),
        max(0, epochs // 2 - 1),
        max(0, (epochs * 3) // 4 - 1),
        max(0, epochs - 1),
    }

    for epoch in range(epochs):
        order = rng.permutation(train_count)
        total_loss = 0.0
        for start in range(0, train_count, batch_size):
            batch = order[start:start + batch_size]
            xb = x_train[batch]
            yb = one_hot[batch]
            probs = softmax(xb @ weights + bias)
            total_loss += float(-np.log(np.maximum(probs[yb.astype(bool)], 1e-8)).sum())
            grad = (probs - yb) / max(1, xb.shape[0])
            weights -= rate * (xb.T @ grad)
            bias -= rate * grad.sum(axis=0, keepdims=True)

        if epoch in checkpoints:
            train_probs = softmax(x_train @ weights + bias)
            val_probs = softmax(x_val @ weights + bias)
            history.append({
                "epoch": epoch + 1,
                "loss": total_loss / train_count,
                "train_accuracy": float((train_probs.argmax(axis=1) == y_train).mean()),
                "val_accuracy": float((val_probs.argmax(axis=1) == y_val).mean()),
            })

    return {
        "weights": weights,
        "bias": bias,
        "mean": mean,
        "std": std,
        "history": history,
        "epochs": int(epochs),
        "train_accuracy": history[-1]["train_accuracy"],
        "val_accuracy": history[-1]["val_accuracy"],
        "train_count": train_count,
        "val_count": int(x_val.shape[0]),
    }
