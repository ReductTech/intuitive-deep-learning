"""vision / features / faces."""
from __future__ import annotations
from idl_backend.config import source_label
import time
from typing import Any
import numpy as np
from idl_backend.datasets.digits import DATA_CACHE, FACE_FEATURE_GRID_SIZE, KERNEL_NAMES, LFW_FACE_PATH, LFW_FEATURE_MAP_DESCRIPTION, LFW_MANIFEST_PATH, LFW_TARGET_NAMES_PATH, LFW_TARGET_PATH, fixed_kernel, lfw_balanced_split_indices, load_lfw_balanced_dataset, parse_kernel_names, rgb_to_luminance, sample_feature_maps
from idl_backend.vision.training.linear import softmax
from idl_backend.vision.helpers import to_small_matrix
from idl_backend.vision.training.linear import train_classifier


def load_face_fixed_kernel_features() -> dict[str, Any]:
    cache_key = f"lfw-balanced-fixed-features-grid{FACE_FEATURE_GRID_SIZE}"
    cached = DATA_CACHE.get(cache_key)
    if cached is not None:
        return cached
    faces, _, _, _ = load_lfw_balanced_dataset()
    gray_faces = rgb_to_luminance(faces)
    kernel_ids = list(KERNEL_NAMES.keys())
    feature_maps = np.zeros(
        (gray_faces.shape[0], len(kernel_ids), FACE_FEATURE_GRID_SIZE, FACE_FEATURE_GRID_SIZE),
        dtype=np.float32,
    )
    for index, name in enumerate(kernel_ids):
        feature_maps[:, index] = sample_feature_maps(gray_faces, fixed_kernel(name), FACE_FEATURE_GRID_SIZE)
    result = {
        "kernel_ids": kernel_ids,
        "kernel_index": {name: index for index, name in enumerate(kernel_ids)},
        "features": feature_maps,
    }
    DATA_CACHE[cache_key] = result
    return result


def face_sample_from_maps(
    faces: np.ndarray,
    labels: np.ndarray,
    target_names: np.ndarray,
    pooled_map_by_kernel: dict[str, np.ndarray],
    kernel_names: list[str],
    absolute_index: int,
    probs: np.ndarray | None = None,
    feature_index: int | None = None,
) -> dict[str, Any]:
    map_index = absolute_index if feature_index is None else feature_index
    feature_maps = {}
    for name in kernel_names:
        fmap = pooled_map_by_kernel[name][map_index]
        feature_maps[name] = to_small_matrix(fmap / max(float(fmap.max()), 1e-6), 3)
    top = []
    if probs is not None:
        order = np.argsort(-probs)[:8]
        top = [
            {
                "label": int(identity),
                "name": str(target_names[int(identity)]),
                "probability": float(np.round(probs[int(identity)], 4)),
            }
            for identity in order
        ]
    label = int(labels[absolute_index])
    return {
        "index": int(absolute_index),
        "label": label,
        "name": str(target_names[label]),
        "prediction": int(probs.argmax()) if probs is not None else -1,
        "prediction_name": str(target_names[int(probs.argmax())]) if probs is not None else "",
        "probs": np.round(probs, 4).tolist() if probs is not None else None,
        "top": top,
        "image": np.round(faces[absolute_index], 3).tolist(),
        "feature_maps": feature_maps,
        "feature_map": feature_maps[kernel_names[0]],
        "feature_max": 1.0,
    }


def face_feature_parts(
    all_feature_maps: np.ndarray,
    kernel_index: dict[str, int],
    kernel_names: list[str],
    indices: np.ndarray,
) -> tuple[np.ndarray, dict[str, np.ndarray]]:
    pooled_by_kernel = {
        name: all_feature_maps[indices, kernel_index[name]]
        for name in kernel_names
    }
    parts = [
        pooled_by_kernel[name].reshape(len(indices), -1)
        for name in kernel_names
    ]
    return np.concatenate(parts, axis=1), pooled_by_kernel


def preview_face_fixed_kernel(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    faces, labels, target_names, manifest = load_lfw_balanced_dataset()
    kernel_names = parse_kernel_names(payload)
    train_indices, val_indices = lfw_balanced_split_indices()
    sample_index = int(payload.get("sample_index") or int(val_indices[0]))
    sample_index = min(len(faces) - 1, max(0, sample_index))
    feature_bundle = load_face_fixed_kernel_features()
    all_feature_maps = feature_bundle["features"]
    kernel_index = feature_bundle["kernel_index"]
    pooled_map_by_kernel = {
        name: all_feature_maps[:, kernel_index[name]]
        for name in kernel_names
    }
    return {
        "dataset": {
            "images": source_label(LFW_FACE_PATH),
            "labels": source_label(LFW_TARGET_PATH),
            "target_names": source_label(LFW_TARGET_NAMES_PATH),
            "count": int(len(faces)),
            "class_count": int(len(target_names)),
            "split": f"{manifest.get('train_per_class', 40)} train + {manifest.get('val_per_class', 10)} validation images per identity",
            "train_count": int(len(train_indices)),
            "val_count": int(len(val_indices)),
            "feature_map": LFW_FEATURE_MAP_DESCRIPTION,
            "image_shape": [int(x) for x in faces.shape[1:]],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": source_label(LFW_MANIFEST_PATH),
        },
        "kernels": [
            {
                "id": name,
                "name": KERNEL_NAMES[name],
                "values": fixed_kernel(name).tolist(),
            }
            for name in kernel_names
        ],
        "samples": [face_sample_from_maps(faces, labels, target_names, pooled_map_by_kernel, kernel_names, sample_index)],
        "durationMs": int((time.time() - started) * 1000),
    }


def train_face_fixed_kernel(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    faces, labels, target_names, manifest = load_lfw_balanced_dataset()
    kernel_names = parse_kernel_names(payload)
    feature_bundle = load_face_fixed_kernel_features()
    all_feature_maps = feature_bundle["features"]
    kernel_index = feature_bundle["kernel_index"]
    missing_kernels = [name for name in kernel_names if name not in kernel_index]
    if missing_kernels:
        raise ValueError("Prepared Olivetti features are missing kernels: " + ", ".join(missing_kernels))

    train_indices, val_indices = lfw_balanced_split_indices()
    train_features, train_pooled_by_kernel = face_feature_parts(
        all_feature_maps,
        kernel_index,
        kernel_names,
        train_indices,
    )
    val_features, val_pooled_by_kernel = face_feature_parts(
        all_feature_maps,
        kernel_index,
        kernel_names,
        val_indices,
    )
    model = train_classifier(
        train_features,
        labels[train_indices],
        val_features,
        labels[val_indices],
        class_count=int(len(target_names)),
        seed=20260707,
        epochs=40,
        rate=0.10,
        batch_size=128,
        weight_scale=0.025,
    )

    val_x = (val_features - model["mean"]) / model["std"]
    val_probs = softmax(val_x @ model["weights"] + model["bias"])
    sample_relative_indices = np.linspace(0, max(0, len(val_indices) - 1), num=min(16, len(val_indices)), dtype=int)
    samples = []
    for relative_index in sample_relative_indices:
        relative_index = int(relative_index)
        absolute_index = int(val_indices[relative_index])
        samples.append(
            face_sample_from_maps(
                faces,
                labels,
                target_names,
                val_pooled_by_kernel,
                kernel_names,
                absolute_index,
                val_probs[relative_index],
                feature_index=relative_index,
            )
        )

    return {
        "dataset": {
            "images": source_label(LFW_FACE_PATH),
            "labels": source_label(LFW_TARGET_PATH),
            "target_names": source_label(LFW_TARGET_NAMES_PATH),
            "count": int(len(faces)),
            "class_count": int(len(target_names)),
            "split": f"{manifest.get('train_per_class', 40)} train + {manifest.get('val_per_class', 10)} validation images per identity",
            "train_count": int(len(train_indices)),
            "val_count": int(len(val_indices)),
            "feature_map": LFW_FEATURE_MAP_DESCRIPTION,
            "image_shape": [int(x) for x in faces.shape[1:]],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": source_label(LFW_MANIFEST_PATH),
        },
        "kernels": [
            {
                "id": name,
                "name": KERNEL_NAMES[name],
                "values": fixed_kernel(name).tolist(),
            }
            for name in kernel_names
        ],
        "train_count": int(model["train_count"]),
        "val_count": int(model["val_count"]),
        "train_accuracy": float(model["train_accuracy"]),
        "val_accuracy": float(model["val_accuracy"]),
        "history": model["history"],
        "network": {
            "kind": "fixed-kernel-mlp",
            "epochs": int(model["epochs"]),
        },
        "classifier": {
            "weights": np.round(model["weights"], 6).tolist(),
            "bias": np.round(model["bias"][0], 6).tolist(),
            "mean": np.round(model["mean"][0], 6).tolist(),
            "std": np.round(model["std"][0], 6).tolist(),
            "kernels": kernel_names,
            "class_count": int(len(target_names)),
            "target_names": target_names.astype(str).tolist(),
        },
        "samples": samples,
        "durationMs": int((time.time() - started) * 1000),
    }
