"""vision / features / digits."""
from __future__ import annotations
from idl_backend.config import source_label
import time
from typing import Any
import numpy as np
from idl_backend.datasets.digits import CLASS_COUNT, FEATURE_MAP_DESCRIPTION, FIXED_FEATURE_PATH, FIXED_MANIFEST_PATH, FIXED_TRAIN_IMAGE_PATH, FIXED_TRAIN_LABEL_PATH, FIXED_VAL_IMAGE_PATH, FIXED_VAL_LABEL_PATH, IMAGE_PATH, KERNEL_NAMES, LABEL_PATH, REJECT_LABEL, SEQUENCE_MARGIN, fixed_kernel, load_base_dataset, load_fixed_kernel_features, load_fixed_kernel_training_assets, parse_custom_image, parse_digit_sequence, parse_kernel_names, sample_feature_maps, sample_mnist_digit
from idl_backend.vision.training.linear import softmax
from idl_backend.vision.helpers import to_small_matrix
from idl_backend.vision.training.linear import train_classifier


def sample_from_maps(
    images: np.ndarray,
    labels: np.ndarray,
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
    sample = {
        "index": int(absolute_index),
        "label": int(labels[absolute_index]),
        "prediction": int(probs.argmax()) if probs is not None else -1,
        "probs": np.round(probs, 4).tolist() if probs is not None else None,
        "image": images[absolute_index].astype(int).tolist(),
        "feature_maps": feature_maps,
        "feature_map": feature_maps[kernel_names[0]],
        "feature_max": 1.0,
    }
    return sample


def preview_fixed_kernel(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    kernel_names = parse_kernel_names(payload)
    custom_image = parse_custom_image(payload)
    if custom_image is None:
        images, labels = load_base_dataset()
        limit = images.shape[0]
        sample_index = int(payload.get("sample_index") or int(limit * 0.9))
        sample_index = min(limit - 1, max(0, sample_index))
        source = source_label(IMAGE_PATH)
        label_source = source_label(LABEL_PATH)
        count = int(limit)
    else:
        images = custom_image.reshape(1, 28, 28).astype(np.float32)
        labels = np.array([-1], dtype=np.int64)
        sample_index = 0
        source = "custom-canvas"
        label_source = "none"
        count = 1

    kernels = {name: fixed_kernel(name) for name in kernel_names}
    pooled_map_by_kernel = {
        name: sample_feature_maps(images[sample_index:sample_index + 1], kernel)
        for name, kernel in kernels.items()
    }
    return {
        "dataset": {
            "images": source,
            "labels": label_source,
            "count": count,
            "class_count": CLASS_COUNT,
            "reject_label": REJECT_LABEL,
            "feature_map": FEATURE_MAP_DESCRIPTION,
        },
        "kernels": [
            {
                "id": name,
                "name": KERNEL_NAMES[name],
                "values": kernels[name].tolist(),
            }
            for name in kernel_names
        ],
        "samples": [sample_from_maps(images, labels, pooled_map_by_kernel, kernel_names, sample_index, feature_index=0)],
        "durationMs": int((time.time() - started) * 1000),
    }


def train_fixed_kernel(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    kernel_names = parse_kernel_names(payload)
    custom_image = parse_custom_image(payload)

    train_labels, val_images, val_labels, manifest = load_fixed_kernel_training_assets()
    feature_bundle = load_fixed_kernel_features()
    train_feature_maps = feature_bundle["train"]
    val_feature_maps = feature_bundle["val"]
    kernel_index = feature_bundle["kernel_index"]
    missing_kernels = [name for name in kernel_names if name not in kernel_index]
    if missing_kernels:
        raise ValueError("Prepared feature file is missing kernels: " + ", ".join(missing_kernels))
    if train_feature_maps.shape[0] != len(train_labels) or val_feature_maps.shape[0] != len(val_labels):
        raise ValueError("Prepared fixed-kernel feature counts do not match labels.")
    source_count = int(manifest.get("digit_train_source_count", 0)) + int(manifest.get("digit_val_source_count", 0))

    kernels = {name: fixed_kernel(name) for name in kernel_names}
    train_pooled_by_kernel = {
        name: train_feature_maps[:, kernel_index[name]]
        for name in kernel_names
    }
    val_pooled_by_kernel = {
        name: val_feature_maps[:, kernel_index[name]]
        for name in kernel_names
    }
    train_feature_parts = []
    val_feature_parts = []
    for name in kernel_names:
        train_feature_parts.append(train_pooled_by_kernel[name].reshape(len(train_labels), -1))
        val_feature_parts.append(val_pooled_by_kernel[name].reshape(len(val_images), -1))
    train_features = np.concatenate(train_feature_parts, axis=1)
    val_features = np.concatenate(val_feature_parts, axis=1)
    model = train_classifier(train_features, train_labels, val_features, val_labels)

    val_feature_parts_for_samples = [
        val_pooled_by_kernel[name].reshape(len(val_images), -1)
        for name in kernel_names
    ]
    val_features_for_samples = np.concatenate(val_feature_parts_for_samples, axis=1)
    val_x_for_samples = (val_features_for_samples - model["mean"]) / model["std"]
    val_probs_for_samples = softmax(val_x_for_samples @ model["weights"] + model["bias"])
    sample_indices = np.linspace(0, max(0, len(val_images) - 1), num=min(12, len(val_images)), dtype=int)
    samples = []
    for relative_index in sample_indices:
        relative_index = int(relative_index)
        probs = val_probs_for_samples[relative_index]
        samples.append(
            sample_from_maps(
                val_images,
                val_labels,
                val_pooled_by_kernel,
                kernel_names,
                relative_index,
                probs,
                feature_index=relative_index,
            )
        )

    if custom_image is not None:
        custom_images = custom_image.reshape(1, 28, 28).astype(np.float32)
        custom_labels = np.array([-1], dtype=np.int64)
        custom_pooled_map_by_kernel = {
            name: sample_feature_maps(custom_images, kernels[name])
            for name in kernel_names
        }
        custom_features = np.concatenate(
            [custom_pooled_map_by_kernel[name].reshape(1, -1) for name in kernel_names],
            axis=1,
        )
        custom_x = (custom_features - model["mean"]) / model["std"]
        custom_probs = softmax(custom_x @ model["weights"] + model["bias"])[0]
        samples.insert(
            0,
            sample_from_maps(custom_images, custom_labels, custom_pooled_map_by_kernel, kernel_names, 0, custom_probs),
        )

    return {
        "dataset": {
            "images": source_label(FIXED_TRAIN_IMAGE_PATH),
            "labels": source_label(FIXED_TRAIN_LABEL_PATH),
            "val_images": source_label(FIXED_VAL_IMAGE_PATH),
            "val_labels": source_label(FIXED_VAL_LABEL_PATH),
            "features": source_label(FIXED_FEATURE_PATH),
            "count": int(len(train_labels) + len(val_images)),
            "source_count": source_count,
            "reject_label": REJECT_LABEL,
            "class_count": CLASS_COUNT,
            "split": "prepared fixed11 train, unaugmented validation",
            "manifest": source_label(FIXED_MANIFEST_PATH),
            "manifest_version": manifest.get("version"),
            "val_augmented": bool(manifest.get("val_augmented")),
            "feature_map": FEATURE_MAP_DESCRIPTION,
            "feature_dtype": manifest.get("feature_dtype"),
            "feature_compressed": bool(manifest.get("feature_compressed")),
        },
        "kernels": [
            {
                "id": name,
                "name": KERNEL_NAMES[name],
                "values": kernels[name].tolist(),
            }
            for name in kernel_names
        ],
        "train_count": int(model["train_count"]),
        "val_count": int(model["val_count"]),
        "train_accuracy": float(model["train_accuracy"]),
        "val_accuracy": float(model["val_accuracy"]),
        "history": model["history"],
        "classifier": {
            "weights": np.round(model["weights"], 6).tolist(),
            "bias": np.round(model["bias"][0], 6).tolist(),
            "mean": np.round(model["mean"][0], 6).tolist(),
            "std": np.round(model["std"][0], 6).tolist(),
            "kernels": kernel_names,
            "class_count": CLASS_COUNT,
            "reject_label": REJECT_LABEL,
        },
        "samples": samples,
        "durationMs": int((time.time() - started) * 1000),
    }


def build_sequence_sample(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    digits = parse_digit_sequence(payload)
    spacing = 0
    margin = SEQUENCE_MARGIN
    seed = payload.get("seed")
    rng = np.random.default_rng(int(seed)) if seed is not None else np.random.default_rng()
    sample_salts = [int(rng.integers(0, 2**31 - 1)) for _ in digits]
    samples = [sample_mnist_digit(digit, salt) for digit, salt in zip(digits, sample_salts)]
    height = 28
    width = len(samples) * 28 + margin * 2
    image = np.zeros((height, width), dtype=np.float32)
    boxes = []
    x = margin
    for digit, sample in zip(digits, samples):
        y = 0
        image[y:y + 28, x:x + 28] = np.maximum(image[y:y + 28, x:x + 28], sample)
        boxes.append({"digit": digit, "x": int(x), "y": int(y), "width": 28, "height": 28})
        x += 28
    return {
        "digits": digits,
        "image": np.round(image, 3).tolist(),
        "width": int(width),
        "height": int(height),
        "boxes": boxes,
        "spacing": int(spacing),
        "margin": int(margin),
        "seed": int(seed) if seed is not None else None,
        "sampleSalts": sample_salts,
        "durationMs": int((time.time() - started) * 1000),
    }
