"""Local training service for the CNN teaching modules.

Start:
    python3 .claude/skills/intuitive-deep-learning/scripts/lenet5_cnn_service.py

The first scene intentionally trains only a small classifier on top of a fixed
edge convolution kernel. It is the bridge between manual features and learnable CNNs:
the feature extractor is still hand-written, but it scans local structure.
"""

from __future__ import annotations

import json
import os
import struct
import threading
import time
import traceback
import uuid
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import numpy as np

import insightface_tool


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 59415
ROOT = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT / "dataset"
MNIST_DIR = DATASET_DIR / "mnist"
OLIVETTI_DIR = DATASET_DIR / "olivetti"
LFW_BALANCED_DIR = DATASET_DIR / "lfw-50-balanced"
IMAGE_PATH = DATASET_DIR / "t10k-images.idx3-ubyte"
LABEL_PATH = DATASET_DIR / "t10k-labels.idx1-ubyte"
OLIVETTI_FACE_PATH = OLIVETTI_DIR / "olivetti_faces.npy"
OLIVETTI_TARGET_PATH = OLIVETTI_DIR / "olivetti_faces_target.npy"
LFW_FACE_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_images.npy"
LFW_TARGET_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_target.npy"
LFW_TARGET_NAMES_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_target_names.npy"
LFW_TRAIN_INDEX_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_train_indices.npy"
LFW_VAL_INDEX_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_val_indices.npy"
LFW_MANIFEST_PATH = LFW_BALANCED_DIR / "lfw_50_balanced_manifest.json"
FACE_DEMO_IMAGE_PATH = DATASET_DIR / "face_demo.png"
FIXED_TRAIN_IMAGE_PATH = MNIST_DIR / "lenet-fixed11-train-images.idx3-ubyte"
FIXED_TRAIN_LABEL_PATH = MNIST_DIR / "lenet-fixed11-train-labels.idx1-ubyte"
FIXED_VAL_IMAGE_PATH = MNIST_DIR / "lenet-fixed11-val-images.idx3-ubyte"
FIXED_VAL_LABEL_PATH = MNIST_DIR / "lenet-fixed11-val-labels.idx1-ubyte"
FIXED_FEATURE_PATH = MNIST_DIR / "lenet-fixed11-grid8-features.npz"
FIXED_MANIFEST_PATH = MNIST_DIR / "lenet-fixed11-manifest.json"
MAX_BODY_BYTES = 4 * 1024 * 1024
IMAGE_SIZE = 28
FACE_IMAGE_SIZE = 64
LFW_IMAGE_HEIGHT = 62
LFW_IMAGE_WIDTH = 47
SEQUENCE_MARGIN = 8
DIGIT_CLASS_COUNT = 10
REJECT_LABEL = 10
CLASS_COUNT = 11
FACE_CLASS_COUNT = 40
LFW_FACE_CLASS_COUNT = 12
FEATURE_GRID_SIZE = 8
FACE_FEATURE_GRID_SIZE = 4
FEATURE_RESPONSE_SIZE = IMAGE_SIZE - 2
FACE_FEATURE_RESPONSE_SIZE = FACE_IMAGE_SIZE - 2
LFW_FEATURE_RESPONSE_HEIGHT = LFW_IMAGE_HEIGHT - 2
LFW_FEATURE_RESPONSE_WIDTH = LFW_IMAGE_WIDTH - 2
FEATURE_MAP_DESCRIPTION = f"{FEATURE_RESPONSE_SIZE}x{FEATURE_RESPONSE_SIZE} convolution responses pooled to {FEATURE_GRID_SIZE}x{FEATURE_GRID_SIZE}"
FACE_FEATURE_MAP_DESCRIPTION = f"{FACE_FEATURE_RESPONSE_SIZE}x{FACE_FEATURE_RESPONSE_SIZE} convolution responses pooled to {FACE_FEATURE_GRID_SIZE}x{FACE_FEATURE_GRID_SIZE}"
LFW_FEATURE_MAP_DESCRIPTION = f"{LFW_FEATURE_RESPONSE_HEIGHT}x{LFW_FEATURE_RESPONSE_WIDTH} convolution responses pooled to {FACE_FEATURE_GRID_SIZE}x{FACE_FEATURE_GRID_SIZE}"
FACE_LENET_DESCRIPTION = "Learnable compact CNN on original 62x47 RGB LFW faces"
DATA_CACHE: dict[str, Any] = {}
LENET_TRAIN_JOBS: dict[str, dict[str, Any]] = {}
LENET_TRAIN_JOBS_LOCK = threading.Lock()
FACE_LENET_EMBEDDING_CACHE: dict[str, Any] | None = None
FACE_LENET_EMBEDDING_CACHE_LOCK = threading.Lock()
INSIGHTFACE_APP: Any | None = None


def _json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def read_idx_images(path: Path) -> np.ndarray:
    with path.open("rb") as handle:
        magic, count, rows, cols = struct.unpack(">IIII", handle.read(16))
        if magic != 2051:
            raise ValueError(f"Invalid image idx magic: {magic}")
        raw = np.frombuffer(handle.read(), dtype=np.uint8)
    return raw.reshape(count, rows, cols).astype(np.float32) / 255.0


def read_idx_labels(path: Path) -> np.ndarray:
    with path.open("rb") as handle:
        magic, count = struct.unpack(">II", handle.read(8))
        if magic != 2049:
            raise ValueError(f"Invalid label idx magic: {magic}")
        raw = np.frombuffer(handle.read(), dtype=np.uint8)
    return raw.reshape(count).astype(np.int64)


def load_base_dataset() -> tuple[np.ndarray, np.ndarray]:
    cached = DATA_CACHE.get("base")
    if cached is not None:
        return cached
    images = read_idx_images(IMAGE_PATH)
    labels = read_idx_labels(LABEL_PATH)
    limit = min(images.shape[0], labels.shape[0], 10_000)
    images = (images[:limit] > 0).astype(np.float32)
    labels = labels[:limit]
    DATA_CACHE["base"] = (images, labels)
    return images, labels


def load_olivetti_dataset() -> tuple[np.ndarray, np.ndarray]:
    cached = DATA_CACHE.get("olivetti")
    if cached is not None:
        return cached
    if not OLIVETTI_FACE_PATH.exists() or not OLIVETTI_TARGET_PATH.exists():
        raise FileNotFoundError(
            "Olivetti dataset is missing: "
            + str(OLIVETTI_FACE_PATH.relative_to(ROOT))
            + ", "
            + str(OLIVETTI_TARGET_PATH.relative_to(ROOT))
        )
    faces = np.load(OLIVETTI_FACE_PATH, allow_pickle=False).astype(np.float32)
    labels = np.load(OLIVETTI_TARGET_PATH, allow_pickle=False).astype(np.int64)
    if faces.shape != (400, FACE_IMAGE_SIZE, FACE_IMAGE_SIZE):
        raise ValueError(f"Unexpected Olivetti face shape: {faces.shape}")
    if labels.shape != (400,):
        raise ValueError(f"Unexpected Olivetti target shape: {labels.shape}")
    faces = np.clip(faces, 0.0, 1.0)
    result = (faces, labels)
    DATA_CACHE["olivetti"] = result
    return result


def olivetti_split_indices(train_per_class: int = 7) -> tuple[np.ndarray, np.ndarray]:
    cached = DATA_CACHE.get(f"olivetti-split-{train_per_class}")
    if cached is not None:
        return cached
    _, labels = load_olivetti_dataset()
    train: list[int] = []
    val: list[int] = []
    for identity in range(FACE_CLASS_COUNT):
        indices = np.flatnonzero(labels == identity)
        if len(indices) < train_per_class + 1:
            raise ValueError(f"Olivetti identity {identity} has too few samples.")
        train.extend(int(index) for index in indices[:train_per_class])
        val.extend(int(index) for index in indices[train_per_class:])
    result = (np.asarray(train, dtype=np.int64), np.asarray(val, dtype=np.int64))
    DATA_CACHE[f"olivetti-split-{train_per_class}"] = result
    return result


def rgb_to_luminance(images: np.ndarray) -> np.ndarray:
    if images.ndim == 3:
        return images.astype(np.float32)
    if images.ndim != 4 or images.shape[-1] != 3:
        raise ValueError(f"Expected RGB image batch, got {images.shape}.")
    rgb = images.astype(np.float32)
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def load_lfw_balanced_dataset() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, Any]]:
    cached = DATA_CACHE.get("lfw-balanced")
    if cached is not None:
        return cached
    required = [
        LFW_FACE_PATH,
        LFW_TARGET_PATH,
        LFW_TARGET_NAMES_PATH,
        LFW_TRAIN_INDEX_PATH,
        LFW_VAL_INDEX_PATH,
        LFW_MANIFEST_PATH,
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Packed LFW balanced dataset is missing: "
            + ", ".join(missing)
            + ". Run scripts/prepare_lfw_mini_dataset.py --pack-from dataset/lfw-mini --output-dir dataset/lfw-50-balanced --pack-min-faces 50 --samples-per-class 50 --train-per-class 40 first."
        )
    images = np.load(LFW_FACE_PATH, allow_pickle=False)
    labels = np.load(LFW_TARGET_PATH, allow_pickle=False).astype(np.int64)
    names = np.load(LFW_TARGET_NAMES_PATH, allow_pickle=False).astype(str)
    manifest = json.loads(LFW_MANIFEST_PATH.read_text(encoding="utf-8"))
    if images.ndim != 4 or images.shape[1:] != (LFW_IMAGE_HEIGHT, LFW_IMAGE_WIDTH, 3):
        raise ValueError(f"Unexpected LFW image shape: {images.shape}")
    if labels.shape != (images.shape[0],):
        raise ValueError("Packed LFW image and label counts do not match.")
    if len(names) != int(labels.max()) + 1:
        raise ValueError("Packed LFW target names do not match target labels.")
    if images.dtype == np.uint8:
        images = images.astype(np.float32) / 255.0
    else:
        images = np.clip(images.astype(np.float32), 0.0, 1.0)
    result = (images, labels, names, manifest)
    DATA_CACHE["lfw-balanced"] = result
    return result


def lfw_balanced_split_indices() -> tuple[np.ndarray, np.ndarray]:
    cached = DATA_CACHE.get("lfw-balanced-split")
    if cached is not None:
        return cached
    train_indices = np.load(LFW_TRAIN_INDEX_PATH, allow_pickle=False).astype(np.int64)
    val_indices = np.load(LFW_VAL_INDEX_PATH, allow_pickle=False).astype(np.int64)
    result = (train_indices, val_indices)
    DATA_CACHE["lfw-balanced-split"] = result
    return result


def load_fixed_kernel_training_assets() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, Any]]:
    cached = DATA_CACHE.get("fixed11-assets")
    if cached is not None:
        return cached
    required = [
        FIXED_TRAIN_LABEL_PATH,
        FIXED_VAL_IMAGE_PATH,
        FIXED_VAL_LABEL_PATH,
        FIXED_MANIFEST_PATH,
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Prepared fixed-kernel dataset is missing: "
            + ", ".join(missing)
            + ". Run scripts/prepare_lenet_fixed_kernel_dataset.py first."
        )
    train_labels = read_idx_labels(FIXED_TRAIN_LABEL_PATH)
    val_images = read_idx_images(FIXED_VAL_IMAGE_PATH).astype(np.float32)
    val_labels = read_idx_labels(FIXED_VAL_LABEL_PATH)
    manifest = json.loads(FIXED_MANIFEST_PATH.read_text(encoding="utf-8"))
    if len(val_images) != len(val_labels):
        raise ValueError("Prepared fixed-kernel dataset has mismatched image/label counts.")
    if int(manifest.get("feature_grid_size", FEATURE_GRID_SIZE)) != FEATURE_GRID_SIZE:
        raise ValueError("Prepared fixed-kernel feature grid size does not match the service.")
    result = (train_labels, val_images, val_labels, manifest)
    DATA_CACHE["fixed11-assets"] = result
    return result


def load_fixed_kernel_features() -> dict[str, Any]:
    cached = DATA_CACHE.get("fixed11-features")
    if cached is not None:
        return cached
    if not FIXED_FEATURE_PATH.exists():
        raise FileNotFoundError(
            "Prepared fixed-kernel feature file is missing: "
            + str(FIXED_FEATURE_PATH.relative_to(ROOT))
            + ". Run scripts/prepare_lenet_fixed_kernel_dataset.py first."
        )
    with np.load(FIXED_FEATURE_PATH, allow_pickle=False) as payload:
        kernel_ids = [str(item) for item in payload["kernel_ids"].tolist()]
        train_features = payload["train_features"].astype(np.float32)
        val_features = payload["val_features"].astype(np.float32)
        feature_grid_size = int(payload["feature_grid_size"])
        feature_kind = str(payload["feature_kind"]) if "feature_kind" in payload.files else ""
    if feature_grid_size != FEATURE_GRID_SIZE:
        raise ValueError("Prepared fixed-kernel feature file has an incompatible grid size.")
    if feature_kind and feature_kind != "pooled-convolution":
        raise ValueError("Prepared fixed-kernel feature file has an incompatible feature kind.")
    if train_features.ndim != 4 or val_features.ndim != 4:
        raise ValueError("Prepared fixed-kernel feature file has an invalid shape.")
    if train_features.shape[1:] != (len(kernel_ids), FEATURE_GRID_SIZE, FEATURE_GRID_SIZE):
        raise ValueError("Prepared train feature shape does not match kernel/grid metadata.")
    if val_features.shape[1:] != (len(kernel_ids), FEATURE_GRID_SIZE, FEATURE_GRID_SIZE):
        raise ValueError("Prepared val feature shape does not match kernel/grid metadata.")
    result = {
        "kernel_ids": kernel_ids,
        "kernel_index": {name: index for index, name in enumerate(kernel_ids)},
        "train": train_features,
        "val": val_features,
    }
    DATA_CACHE["fixed11-features"] = result
    return result


def read_png_matrix(path: Path) -> np.ndarray:
    raw = path.read_bytes()
    if not raw.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Not a PNG file: {path.name}")
    pos = 8
    width = height = color_type = bit_depth = None
    compressed = bytearray()
    while pos + 8 <= len(raw):
        length = struct.unpack(">I", raw[pos:pos + 4])[0]
        chunk_type = raw[pos + 4:pos + 8]
        chunk = raw[pos + 8:pos + 8 + length]
        pos += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
        elif chunk_type == b"IDAT":
            compressed.extend(chunk)
        elif chunk_type == b"IEND":
            break
    if width is None or height is None or bit_depth != 8 or color_type not in {0, 2, 6}:
        raise ValueError(f"Unsupported PNG format: {path.name}")
    channels = {0: 1, 2: 3, 6: 4}[int(color_type)]
    scanline = int(width) * channels
    inflated = zlib.decompress(bytes(compressed))
    rows: list[bytes] = []
    prev = [0] * scanline
    offset = 0
    for _ in range(int(height)):
        filter_type = inflated[offset]
        offset += 1
        src = list(inflated[offset:offset + scanline])
        offset += scanline
        recon = [0] * scanline
        for i, value in enumerate(src):
            left = recon[i - channels] if i >= channels else 0
            up = prev[i]
            up_left = prev[i - channels] if i >= channels else 0
            if filter_type == 0:
                out = value
            elif filter_type == 1:
                out = value + left
            elif filter_type == 2:
                out = value + up
            elif filter_type == 3:
                out = value + ((left + up) // 2)
            elif filter_type == 4:
                p = left + up - up_left
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - up_left)
                out = value + (left if pa <= pb and pa <= pc else (up if pb <= pc else up_left))
            else:
                raise ValueError(f"Unsupported PNG filter: {filter_type}")
            recon[i] = out & 0xFF
        rows.append(bytes(recon))
        prev = recon
    matrix = np.zeros((int(height), int(width)), dtype=np.float32)
    for row_index, row in enumerate(rows):
        if channels == 1:
            values = np.frombuffer(row, dtype=np.uint8).astype(np.float32)
        else:
            pixels = np.frombuffer(row, dtype=np.uint8).reshape(int(width), channels)
            values = (pixels[:, 0] * 0.299 + pixels[:, 1] * 0.587 + pixels[:, 2] * 0.114).astype(np.float32)
        matrix[row_index] = values / 255.0
    return np.clip(matrix, 0.0, 1.0)


def sample_mnist_digit(digit: str, salt: int) -> np.ndarray:
    folder = MNIST_DIR / digit
    files = sorted(folder.glob("*.png"))
    if not files:
        raise ValueError(f"MNIST digit folder is empty: {digit}")
    return read_png_matrix(files[salt % len(files)])


def parse_digit_sequence(payload: dict[str, Any]) -> str:
    digits = "".join(ch for ch in str(payload.get("digits") or "10086") if ch.isdigit())
    if not 2 <= len(digits) <= 12:
        raise ValueError("请输入 2 到 12 位数字。")
    return digits


KERNEL_NAMES = {
    "edge": "边缘",
    "vertical": "竖边",
    "horizontal": "横边",
    "diag_down": "斜边 /",
    "diag_up": "斜边 \\",
    "center": "中心墨迹",
}


def fixed_kernel(name: str) -> np.ndarray:
    if name == "vertical":
        return np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    if name == "horizontal":
        return np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
    if name == "diag_down":
        return np.array([[0, 1, 2], [-1, 0, 1], [-2, -1, 0]], dtype=np.float32)
    if name == "diag_up":
        return np.array([[2, 1, 0], [1, 0, -1], [0, -1, -2]], dtype=np.float32)
    if name == "center":
        return np.array([[0, 1, 0], [1, 4, 1], [0, 1, 0]], dtype=np.float32) / 8.0
    return np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], dtype=np.float32)


def parse_kernel_names(payload: dict[str, Any]) -> list[str]:
    raw = payload.get("kernels")
    if isinstance(raw, list):
        names = [str(item) for item in raw if str(item) in KERNEL_NAMES]
    else:
        single = str(payload.get("kernel") or "edge")
        names = [single] if single in KERNEL_NAMES else ["edge"]
    if not names:
        names = ["edge"]
    result: list[str] = []
    for name in names:
        if name not in result:
            result.append(name)
    return result[:6]


def parse_custom_image(payload: dict[str, Any]) -> np.ndarray | None:
    raw = payload.get("image")
    if raw is None:
        return None
    image = np.asarray(raw, dtype=np.float32)
    if image.shape != (28, 28):
        raise ValueError("Custom image must be a 28x28 array.")
    return np.clip(image, 0.0, 1.0)


def convolve_valid(images: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    windows = np.lib.stride_tricks.sliding_window_view(images, (3, 3), axis=(1, 2))
    response = np.tensordot(windows, kernel, axes=((3, 4), (0, 1)))
    return np.maximum(response, 0.0)


def pool_feature_maps(feature_maps: np.ndarray, grid_size: int = FEATURE_GRID_SIZE) -> np.ndarray:
    row_edges = np.linspace(0, feature_maps.shape[1], grid_size + 1).astype(np.int64)
    col_edges = np.linspace(0, feature_maps.shape[2], grid_size + 1).astype(np.int64)
    pooled = np.zeros((feature_maps.shape[0], grid_size, grid_size), dtype=np.float32)
    for row in range(grid_size):
        row_start, row_end = int(row_edges[row]), int(row_edges[row + 1])
        for col in range(grid_size):
            col_start, col_end = int(col_edges[col]), int(col_edges[col + 1])
            pooled[:, row, col] = feature_maps[:, row_start:row_end, col_start:col_end].mean(axis=(1, 2))
    return pooled


def sample_feature_maps(images: np.ndarray, kernel: np.ndarray, grid_size: int = FEATURE_GRID_SIZE) -> np.ndarray:
    return pool_feature_maps(convolve_valid(images, kernel), grid_size)


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


def to_small_matrix(values: np.ndarray, digits: int = 3) -> list[list[float]]:
    return np.round(values.astype(float), digits).tolist()


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
        source = str(IMAGE_PATH.relative_to(ROOT))
        label_source = str(LABEL_PATH.relative_to(ROOT))
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
            "images": str(FIXED_TRAIN_IMAGE_PATH.relative_to(ROOT)),
            "labels": str(FIXED_TRAIN_LABEL_PATH.relative_to(ROOT)),
            "val_images": str(FIXED_VAL_IMAGE_PATH.relative_to(ROOT)),
            "val_labels": str(FIXED_VAL_LABEL_PATH.relative_to(ROOT)),
            "features": str(FIXED_FEATURE_PATH.relative_to(ROOT)),
            "count": int(len(train_labels) + len(val_images)),
            "source_count": source_count,
            "reject_label": REJECT_LABEL,
            "class_count": CLASS_COUNT,
            "split": "prepared fixed11 train, unaugmented validation",
            "manifest": str(FIXED_MANIFEST_PATH.relative_to(ROOT)),
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
            "images": str(LFW_FACE_PATH.relative_to(ROOT)),
            "labels": str(LFW_TARGET_PATH.relative_to(ROOT)),
            "target_names": str(LFW_TARGET_NAMES_PATH.relative_to(ROOT)),
            "count": int(len(faces)),
            "class_count": int(len(target_names)),
            "split": f"{manifest.get('train_per_class', 40)} train + {manifest.get('val_per_class', 10)} validation images per identity",
            "train_count": int(len(train_indices)),
            "val_count": int(len(val_indices)),
            "feature_map": LFW_FEATURE_MAP_DESCRIPTION,
            "image_shape": [int(x) for x in faces.shape[1:]],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": str(LFW_MANIFEST_PATH.relative_to(ROOT)),
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
            "images": str(LFW_FACE_PATH.relative_to(ROOT)),
            "labels": str(LFW_TARGET_PATH.relative_to(ROOT)),
            "target_names": str(LFW_TARGET_NAMES_PATH.relative_to(ROOT)),
            "count": int(len(faces)),
            "class_count": int(len(target_names)),
            "split": f"{manifest.get('train_per_class', 40)} train + {manifest.get('val_per_class', 10)} validation images per identity",
            "train_count": int(len(train_indices)),
            "val_count": int(len(val_indices)),
            "feature_map": LFW_FEATURE_MAP_DESCRIPTION,
            "image_shape": [int(x) for x in faces.shape[1:]],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": str(LFW_MANIFEST_PATH.relative_to(ROOT)),
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


def resize_gray_batch(images: np.ndarray, out_h: int = LFW_IMAGE_HEIGHT, out_w: int = LFW_IMAGE_WIDTH) -> np.ndarray:
    gray = rgb_to_luminance(images).astype(np.float32)
    row_pos = np.linspace(0, gray.shape[1] - 1, out_h)
    col_pos = np.linspace(0, gray.shape[2] - 1, out_w)
    row0 = np.floor(row_pos).astype(np.int64)
    col0 = np.floor(col_pos).astype(np.int64)
    row1 = np.minimum(row0 + 1, gray.shape[1] - 1)
    col1 = np.minimum(col0 + 1, gray.shape[2] - 1)
    row_lerp = (row_pos - row0).astype(np.float32)
    col_lerp = (col_pos - col0).astype(np.float32)
    top = gray[:, row0][:, :, col0] * (1.0 - col_lerp)[None, None, :] + gray[:, row0][:, :, col1] * col_lerp[None, None, :]
    bottom = gray[:, row1][:, :, col0] * (1.0 - col_lerp)[None, None, :] + gray[:, row1][:, :, col1] * col_lerp[None, None, :]
    resized = top * (1.0 - row_lerp)[None, :, None] + bottom * row_lerp[None, :, None]
    return resized.astype(np.float32)


def resize_rgb_batch(images: np.ndarray, out_h: int = LFW_IMAGE_HEIGHT, out_w: int = LFW_IMAGE_WIDTH) -> np.ndarray:
    if images.ndim != 4 or images.shape[-1] != 3:
        raise ValueError(f"Expected RGB image batch, got {images.shape}.")
    rgb = np.clip(images.astype(np.float32), 0.0, 1.0)
    row_pos = np.linspace(0, rgb.shape[1] - 1, out_h)
    col_pos = np.linspace(0, rgb.shape[2] - 1, out_w)
    row0 = np.floor(row_pos).astype(np.int64)
    col0 = np.floor(col_pos).astype(np.int64)
    row1 = np.minimum(row0 + 1, rgb.shape[1] - 1)
    col1 = np.minimum(col0 + 1, rgb.shape[2] - 1)
    row_lerp = (row_pos - row0).astype(np.float32)
    col_lerp = (col_pos - col0).astype(np.float32)
    top = (
        rgb[:, row0][:, :, col0, :] * (1.0 - col_lerp)[None, None, :, None]
        + rgb[:, row0][:, :, col1, :] * col_lerp[None, None, :, None]
    )
    bottom = (
        rgb[:, row1][:, :, col0, :] * (1.0 - col_lerp)[None, None, :, None]
        + rgb[:, row1][:, :, col1, :] * col_lerp[None, None, :, None]
    )
    resized = top * (1.0 - row_lerp)[None, :, None, None] + bottom * row_lerp[None, :, None, None]
    return resized.astype(np.float32)


def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0.0)


def conv2d_nchw(x: np.ndarray, weights: np.ndarray, bias: np.ndarray) -> np.ndarray:
    batch, channels, height, width = x.shape
    out_channels, weight_channels, kernel_h, kernel_w = weights.shape
    if channels != weight_channels:
        raise ValueError("Convolution input channel count does not match weights.")
    out_h = height - kernel_h + 1
    out_w = width - kernel_w + 1
    windows = np.lib.stride_tricks.sliding_window_view(x, (kernel_h, kernel_w), axis=(2, 3))
    out = np.tensordot(windows, weights, axes=((1, 4, 5), (1, 2, 3)))
    out = np.moveaxis(out, -1, 1)
    out += bias.reshape(1, out_channels, 1, 1)
    return out.astype(np.float32)


def conv2d_backward(
    x: np.ndarray,
    weights: np.ndarray,
    grad_out: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    batch, channels, height, width = x.shape
    out_channels, _, kernel_h, kernel_w = weights.shape
    grad_x = np.zeros_like(x, dtype=np.float32)
    grad_w = np.zeros_like(weights, dtype=np.float32)
    grad_b = grad_out.sum(axis=(0, 2, 3)).astype(np.float32)
    for kr in range(kernel_h):
        for kc in range(kernel_w):
            x_slice = x[:, :, kr:kr + grad_out.shape[2], kc:kc + grad_out.shape[3]]
            grad_w[:, :, kr, kc] = np.tensordot(grad_out, x_slice, axes=((0, 2, 3), (0, 2, 3)))
            grad_x[:, :, kr:kr + grad_out.shape[2], kc:kc + grad_out.shape[3]] += np.tensordot(
                grad_out,
                weights[:, :, kr, kc],
                axes=(1, 0),
            ).transpose(0, 3, 1, 2)
    return grad_x, grad_w, grad_b


def avg_pool2x2(x: np.ndarray) -> np.ndarray:
    batch, channels, height, width = x.shape
    trimmed = x[:, :, :height - height % 2, :width - width % 2]
    return trimmed.reshape(batch, channels, trimmed.shape[2] // 2, 2, trimmed.shape[3] // 2, 2).mean(axis=(3, 5))


def avg_pool2x2_backward(grad: np.ndarray, input_shape: tuple[int, ...]) -> np.ndarray:
    out = np.zeros(input_shape, dtype=np.float32)
    expanded = np.repeat(np.repeat(grad / 4.0, 2, axis=2), 2, axis=3)
    out[:, :, :expanded.shape[2], :expanded.shape[3]] = expanded
    return out


def lenet_forward(params: dict[str, np.ndarray], x: np.ndarray) -> dict[str, np.ndarray]:
    c1 = conv2d_nchw(x, params["w1"], params["b1"])
    a1 = relu(c1)
    p1 = avg_pool2x2(a1)
    c2 = conv2d_nchw(p1, params["w2"], params["b2"])
    a2 = relu(c2)
    p2 = avg_pool2x2(a2)
    flat = p2.reshape(x.shape[0], -1)
    h1_pre = flat @ params["w3"] + params["b3"]
    h1 = relu(h1_pre)
    logits = h1 @ params["w4"] + params["b4"]
    return {
        "x": x,
        "c1": c1,
        "a1": a1,
        "p1": p1,
        "c2": c2,
        "a2": a2,
        "p2": p2,
        "flat": flat,
        "h1_pre": h1_pre,
        "h1": h1,
        "logits": logits,
    }


def train_lenet_classifier(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_val: np.ndarray,
    y_val: np.ndarray,
    class_count: int,
    epochs: int = 80,
    architecture: list[dict[str, Any]] | None = None,
    progress_callback: Any | None = None,
) -> dict[str, Any]:
    if progress_callback is not None:
        progress_callback(0, "训练准备中", "正在初始化 Torch 与训练设备。")
    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        from torch.utils.data import DataLoader, TensorDataset
    except ImportError as exc:
        raise RuntimeError(
            "Torch is required for the learnable CNN scene. Install torch in the Python environment that runs lenet5_cnn_service.py."
        ) from exc

    torch.manual_seed(20260707)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(20260707)
        device = torch.device("cuda")
    elif getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    device = torch.device("cpu")
    epochs = int(max(4, min(240, epochs)))
    if progress_callback is not None:
        progress_callback(0, "训练准备中", f"已选择训练设备：{device}。")

    def arch_int(spec: dict[str, Any], key: str, default: int, minimum: int, maximum: int) -> int:
        try:
            value = int(spec.get(key, default))
        except (TypeError, ValueError):
            value = default
        return int(max(minimum, min(maximum, value)))

    def normalized_architecture(raw: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
        if raw is None:
            raw = [
                {"kind": "conv", "name": "Conv 1", "out_channels": 8, "kernel_size": 3, "stride": 1, "padding": 1},
                {"kind": "pool", "name": "Pool 1", "kernel_size": 2, "stride": 2},
                {"kind": "conv", "name": "Conv 2", "out_channels": 16, "kernel_size": 3, "stride": 1, "padding": 1},
                {"kind": "pool", "name": "Pool 2", "kernel_size": 2, "stride": 2},
                {"kind": "conv", "name": "Conv 3", "out_channels": 32, "kernel_size": 3, "stride": 1, "padding": 1},
                {"kind": "pool", "name": "Pool 3", "kernel_size": 2, "stride": 2},
                {"kind": "conv", "name": "Conv 4", "out_channels": 64, "kernel_size": 3, "stride": 1, "padding": 1},
            ]
        result: list[dict[str, Any]] = []
        conv_count = 0
        pool_count = 0
        for item in raw[:10]:
            if not isinstance(item, dict):
                continue
            kind = str(item.get("kind") or "conv")
            if kind == "pool":
                pool_count += 1
                pool_type = str(item.get("pool_type") or "max").strip().lower()
                if pool_type not in {"max", "avg"}:
                    pool_type = "max"
                result.append({
                    "kind": "pool",
                    "name": str(item.get("name") or f"Pool {pool_count}")[:32],
                    "kernel_size": arch_int(item, "kernel_size", 2, 1, 4),
                    "stride": arch_int(item, "stride", 2, 1, 4),
                    "pool_type": pool_type,
                })
            elif kind == "conv":
                conv_count += 1
                result.append({
                    "kind": "conv",
                    "name": str(item.get("name") or f"Conv {conv_count}")[:32],
                    "out_channels": arch_int(item, "out_channels", 16, 1, 64),
                    "kernel_size": arch_int(item, "kernel_size", 3, 1, 7),
                    "stride": arch_int(item, "stride", 1, 1, 3),
                    "padding": arch_int(item, "padding", 1, 0, 4),
                })
        return result

    architecture = normalized_architecture(architecture)

    class FaceEmbeddingCNN(nn.Module):
        def __init__(self, output_count: int, layers: list[dict[str, Any]], embedding_dim: int = 64):
            super().__init__()
            modules = []
            summaries = ["Input 3x62x47"]
            channels = 3
            height = LFW_IMAGE_HEIGHT
            width = LFW_IMAGE_WIDTH
            for layer in layers:
                if layer["kind"] == "pool":
                    kernel = int(layer["kernel_size"])
                    stride = int(layer["stride"])
                    pool_type = str(layer.get("pool_type") or "max")
                    next_height = (height - kernel) // stride + 1
                    next_width = (width - kernel) // stride + 1
                    if next_height <= 0 or next_width <= 0:
                        raise ValueError(layer["name"] + ": pooling makes the feature map too small.")
                    pool_cls = nn.AvgPool2d if pool_type == "avg" else nn.MaxPool2d
                    modules.append(pool_cls(kernel_size=kernel, stride=stride))
                    height = next_height
                    width = next_width
                    pool_label = "AvgPool" if pool_type == "avg" else "MaxPool"
                    summaries.append(f"{layer['name']} {pool_label} {kernel}x{kernel}/s{stride} -> {channels}x{height}x{width}")
                else:
                    out_channels = int(layer["out_channels"])
                    kernel = int(layer["kernel_size"])
                    stride = int(layer["stride"])
                    padding = int(layer["padding"])
                    next_height = (height + 2 * padding - kernel) // stride + 1
                    next_width = (width + 2 * padding - kernel) // stride + 1
                    if next_height <= 0 or next_width <= 0:
                        raise ValueError(layer["name"] + ": convolution makes the feature map too small.")
                    modules.extend([
                        nn.Conv2d(channels, out_channels, kernel_size=kernel, stride=stride, padding=padding, bias=False),
                        nn.BatchNorm2d(out_channels),
                        nn.ReLU(inplace=True),
                    ])
                    summaries.append(
                        f"{layer['name']} Conv {channels}->{out_channels} {kernel}x{kernel}/s{stride}/p{padding} + BN + ReLU -> {out_channels}x{next_height}x{next_width}"
                    )
                    channels = out_channels
                    height = next_height
                    width = next_width
            modules.append(nn.AdaptiveAvgPool2d((1, 1)))
            summaries.extend([
                f"AdaptiveAvgPool -> {channels}x1x1",
                f"FC 1: Flatten + Linear {channels}->{embedding_dim} + ReLU",
                f"FC 2: Linear {embedding_dim}->{embedding_dim} + L2 normalize",
                f"FC 3: Linear {embedding_dim}->{output_count}",
            ])
            self.features = nn.Sequential(*modules)
            self.layers = summaries
            self.mlp_layers = [
                {"name": "FC 1", "input": int(channels), "output": int(embedding_dim)},
                {"name": "FC 2", "input": int(embedding_dim), "output": int(embedding_dim)},
                {"name": "FC 3", "input": int(embedding_dim), "output": int(output_count)},
            ]
            self.embedding = nn.Sequential(
                nn.Linear(channels, embedding_dim),
                nn.ReLU(inplace=True),
                nn.Linear(embedding_dim, embedding_dim),
            )
            self.classifier = nn.Linear(embedding_dim, output_count)

            self._reset_parameters()

        def _reset_parameters(self):
            for m in self.modules():
                if isinstance(m, (nn.Conv2d, nn.Linear)):
                    nn.init.kaiming_normal_(m.weight, nonlinearity="relu")
                    if getattr(m, "bias", None) is not None:
                        nn.init.zeros_(m.bias)
                elif isinstance(m, (nn.BatchNorm1d, nn.BatchNorm2d)):
                    nn.init.ones_(m.weight)
                    nn.init.zeros_(m.bias)

        def forward(self, x, return_embedding=False):
            x = self.features(x)
            x = torch.flatten(x, 1)

            emb = self.embedding(x)
            emb = F.normalize(emb, p=2, dim=1)

            if return_embedding:
                return emb

            return self.classifier(emb)

    def learned_first_conv_filters(model: Any) -> np.ndarray:
        for layer in model.modules():
            if isinstance(layer, nn.Conv2d):
                weights = layer.weight.detach().cpu().numpy()
                return weights.mean(axis=1).astype(np.float32)
        return np.zeros((0, 3, 3), dtype=np.float32)

    def conv_kernel_stats(model: Any) -> list[dict[str, Any]]:
        conv_layers = [layer for layer in model.features if isinstance(layer, nn.Conv2d)]
        stats: list[dict[str, Any]] = []
        conv_cursor = 0
        for layer_index, spec in enumerate(architecture):
            if spec["kind"] != "conv":
                continue
            if conv_cursor >= len(conv_layers):
                break
            conv = conv_layers[conv_cursor]
            conv_cursor += 1
            weights = conv.weight.detach().cpu().numpy().astype(np.float32)
            per_kernel = weights.reshape(weights.shape[0], -1)
            kernel_mean = per_kernel.mean(axis=1)
            kernel_abs_mean = np.abs(per_kernel).mean(axis=1)
            kernel_std = per_kernel.std(axis=1)
            stats.append({
                "layer_index": int(layer_index),
                "name": str(spec.get("name") or f"Conv {conv_cursor}"),
                "out_channels": int(weights.shape[0]),
                "in_channels": int(weights.shape[1]),
                "kernel_size": [int(weights.shape[2]), int(weights.shape[3])],
                "kernel_mean": np.round(kernel_mean, 6).astype(float).tolist(),
                "kernel_abs_mean": np.round(kernel_abs_mean, 6).astype(float).tolist(),
                "kernel_std": np.round(kernel_std, 6).astype(float).tolist(),
                "mean": float(np.round(kernel_mean.mean(), 6)),
                "abs_mean": float(np.round(kernel_abs_mean.mean(), 6)),
                "std": float(np.round(kernel_std.mean(), 6)),
            })
        return stats

    train_tensor = torch.from_numpy(x_train.astype(np.float32))
    val_tensor = torch.from_numpy(x_val.astype(np.float32))
    input_mean = train_tensor.mean(dim=(0, 2, 3), keepdim=True)
    input_std = train_tensor.std(dim=(0, 2, 3), keepdim=True).clamp_min(1e-5)
    train_tensor = (train_tensor - input_mean) / input_std
    val_tensor = (val_tensor - input_mean) / input_std
    train_labels = torch.from_numpy(y_train.astype(np.int64))
    val_labels = torch.from_numpy(y_val.astype(np.int64))
    train_loader = DataLoader(
        TensorDataset(train_tensor, train_labels),
        batch_size=64,
        shuffle=True,
        generator=torch.Generator().manual_seed(20260707),
    )
    val_loader = DataLoader(TensorDataset(val_tensor, val_labels), batch_size=128, shuffle=False)
    model = FaceEmbeddingCNN(class_count, architecture).to(device)
    learning_rate = 0.002
    weight_decay = 5e-5
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(1, epochs), eta_min=learning_rate * 0.08)
    label_smoothing = 0.04
    criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)
    checkpoints = set((np.linspace(1, epochs, num=min(14, epochs), dtype=int) - 1).tolist())
    checkpoints.update({0, epochs - 1})
    history: list[dict[str, float | int]] = []
    best_val_accuracy = -1.0
    best_epoch = 0
    best_state: dict[str, Any] = {}
    if progress_callback is not None:
        progress_callback(0, "训练准备中", f"网络和数据加载完成，准备训练 {epochs} 轮。")

    def augment_batch(xb: Any) -> Any:
        if xb.shape[0] == 0:
            return xb
        if torch.rand((), device=xb.device) < 0.5:
            mask = torch.rand((xb.shape[0], 1, 1, 1), device=xb.device) < 0.5
            xb = torch.where(mask, torch.flip(xb, dims=(3,)), xb)
        if torch.rand((), device=xb.device) < 0.8:
            shifts = torch.randint(-2, 3, (2,), device=xb.device)
            xb = torch.roll(xb, shifts=(int(shifts[0].item()), int(shifts[1].item())), dims=(2, 3))
        if torch.rand((), device=xb.device) < 0.8:
            brightness = torch.empty((xb.shape[0], 1, 1, 1), device=xb.device).uniform_(-0.10, 0.10)
            contrast = torch.empty((xb.shape[0], 1, 1, 1), device=xb.device).uniform_(0.88, 1.12)
            channel = torch.empty((xb.shape[0], xb.shape[1], 1, 1), device=xb.device).uniform_(0.94, 1.06)
            xb = xb * contrast * channel + brightness
        if torch.rand((), device=xb.device) < 0.35:
            xb = xb + torch.randn_like(xb) * 0.025
        return xb.clamp(-3.0, 3.0)

    def evaluate(loader: Any) -> tuple[float, np.ndarray]:
        model.eval()
        correct = 0
        total = 0
        probs_parts = []
        with torch.no_grad():
            for xb, yb in loader:
                xb = xb.to(device)
                yb = yb.to(device)
                logits = model(xb)
                probs = torch.softmax(logits, dim=1)
                correct += int((probs.argmax(dim=1) == yb).sum().item())
                total += int(yb.numel())
                probs_parts.append(probs.detach().cpu().numpy())
        return correct / max(1, total), np.concatenate(probs_parts, axis=0)

    if progress_callback is not None:
        progress_callback(0, "训练中", f"开始训练，共 {epochs} 轮。")

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for xb, yb in train_loader:
            xb = xb.to(device)
            yb = yb.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(augment_batch(xb))
            loss = criterion(logits, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=4.0)
            optimizer.step()
            total_loss += float(loss.item()) * int(yb.numel())
        scheduler.step()

        val_accuracy_for_best, _ = evaluate(val_loader)
        if val_accuracy_for_best > best_val_accuracy:
            best_val_accuracy = float(val_accuracy_for_best)
            best_epoch = epoch + 1
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

        if epoch in checkpoints:
            train_accuracy, _ = evaluate(train_loader)
            history.append({
                "epoch": epoch + 1,
                "loss": total_loss / len(x_train),
                "train_accuracy": train_accuracy,
                "val_accuracy": val_accuracy_for_best,
            })
        if progress_callback is not None:
            progress = int(round((epoch + 1) / max(1, epochs) * 94))
            progress_callback(
                min(94, progress),
                "训练中",
                f"训练中：第 {epoch + 1}/{epochs} 轮，验证集准确率 {val_accuracy_for_best * 100:.1f}%。"
            )

    if best_state:
        model.load_state_dict(best_state)
    if progress_callback is not None:
        progress_callback(96, "收尾评估", "正在加载最佳权重并计算最终指标。")
    train_accuracy, _ = evaluate(train_loader)
    val_accuracy, val_probs = evaluate(val_loader)
    first_filters = learned_first_conv_filters(model)
    kernel_stats = conv_kernel_stats(model)
    return {
        "first_filters": first_filters,
        "conv_kernel_stats": kernel_stats,
        "embedding_model": model,
        "layers": model.layers,
        "mlp_layers": model.mlp_layers,
        "architecture": architecture,
        "device": str(device),
        "torch_version": str(torch.__version__),
        "history": history,
        "train_accuracy": train_accuracy,
        "val_accuracy": val_accuracy,
        "val_probs": val_probs,
        "train_count": int(len(x_train)),
        "val_count": int(len(x_val)),
        "epochs": int(epochs),
        "best_epoch": int(best_epoch),
        "best_val_accuracy": float(best_val_accuracy),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "label_smoothing": float(label_smoothing),
        "augmentation": "flip, translate, color jitter, gaussian noise",
        "input_mean": float(input_mean.mean().item()),
        "input_std": float(input_std.mean().item()),
        "input_mean_tensor": input_mean.detach().cpu(),
        "input_std_tensor": input_std.detach().cpu(),
    }


def lenet_sample(
    faces: np.ndarray,
    labels: np.ndarray,
    target_names: np.ndarray,
    absolute_index: int,
    probs: np.ndarray | None,
) -> dict[str, Any]:
    label = int(labels[absolute_index])
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
    return {
        "index": int(absolute_index),
        "label": label,
        "name": str(target_names[label]),
        "prediction": int(probs.argmax()) if probs is not None else -1,
        "prediction_name": str(target_names[int(probs.argmax())]) if probs is not None else "",
        "probs": np.round(probs, 4).tolist() if probs is not None else None,
        "top": top,
        "image": np.round(faces[absolute_index], 3).tolist(),
    }


def train_face_lenet(payload: dict[str, Any], progress_callback: Any | None = None) -> dict[str, Any]:
    global FACE_LENET_EMBEDDING_CACHE
    started = time.time()
    if progress_callback is not None:
        progress_callback(0, "训练准备中", "正在读取 LFW 人脸数据和当前网络结构。")
    faces, labels, target_names, manifest = load_lfw_balanced_dataset()
    train_indices, val_indices = lfw_balanced_split_indices()
    requested_epochs = int(payload.get("epochs", 80)) if isinstance(payload, dict) else 80
    requested_architecture = payload.get("architecture") if isinstance(payload, dict) else None
    if progress_callback is not None:
        progress_callback(0, "训练准备中", "正在整理训练集、验证集和 RGB 输入张量。")
    rgb_faces = np.clip(faces.astype(np.float32), 0.0, 1.0)
    train_images = np.moveaxis(rgb_faces[train_indices], -1, 1)
    val_images = np.moveaxis(rgb_faces[val_indices], -1, 1)
    model = train_lenet_classifier(
        train_images,
        labels[train_indices],
        val_images,
        labels[val_indices],
        class_count=int(len(target_names)),
        epochs=requested_epochs,
        architecture=requested_architecture if isinstance(requested_architecture, list) else None,
        progress_callback=progress_callback,
    )
    with FACE_LENET_EMBEDDING_CACHE_LOCK:
        FACE_LENET_EMBEDDING_CACHE = {
            "model": model["embedding_model"],
            "class_count": int(len(target_names)),
            "target_names": target_names.astype(str).tolist(),
            "input_mean": model["input_mean_tensor"],
            "input_std": model["input_std_tensor"],
            "trainedAt": time.time(),
            "best_epoch": int(model["best_epoch"]),
            "val_accuracy": float(model["val_accuracy"]),
        }
    if progress_callback is not None:
        progress_callback(98, "生成结果", "正在生成样本预测、卷积核统计和训练曲线。")
    sample_relative_indices = np.linspace(0, max(0, len(val_indices) - 1), num=min(16, len(val_indices)), dtype=int)
    samples = []
    for relative_index in sample_relative_indices:
        relative_index = int(relative_index)
        absolute_index = int(val_indices[relative_index])
        samples.append(lenet_sample(faces, labels, target_names, absolute_index, model["val_probs"][relative_index]))
    first_filters = model["first_filters"]
    filter_maps = [
        to_small_matrix((kernel - kernel.min()) / max(float(kernel.max() - kernel.min()), 1e-6), 3)
        for kernel in first_filters
    ]
    return {
        "dataset": {
            "images": str(LFW_FACE_PATH.relative_to(ROOT)),
            "labels": str(LFW_TARGET_PATH.relative_to(ROOT)),
            "target_names": str(LFW_TARGET_NAMES_PATH.relative_to(ROOT)),
            "count": int(len(faces)),
            "class_count": int(len(target_names)),
            "split": f"{manifest.get('train_per_class', 40)} train + {manifest.get('val_per_class', 10)} validation images per identity",
            "train_count": int(len(train_indices)),
            "val_count": int(len(val_indices)),
            "image_shape": [int(x) for x in faces.shape[1:]],
            "network_input_shape": [LFW_IMAGE_HEIGHT, LFW_IMAGE_WIDTH, 3],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": str(LFW_MANIFEST_PATH.relative_to(ROOT)),
        },
        "network": {
            "name": "Compact learnable CNN",
            "description": FACE_LENET_DESCRIPTION,
            "device": model["device"],
            "torch_version": model["torch_version"],
            "layers": model["layers"],
            "mlp_layers": model["mlp_layers"],
            "architecture": model["architecture"],
            "learnable_filter_maps": filter_maps,
            "conv_kernel_stats": model["conv_kernel_stats"],
            "epochs": int(model["epochs"]),
            "best_epoch": int(model["best_epoch"]),
            "learning_rate": float(model["learning_rate"]),
            "weight_decay": float(model["weight_decay"]),
            "label_smoothing": float(model["label_smoothing"]),
            "augmentation": model["augmentation"],
        },
        "train_count": int(model["train_count"]),
        "val_count": int(model["val_count"]),
        "train_accuracy": float(model["train_accuracy"]),
        "val_accuracy": float(model["val_accuracy"]),
        "history": model["history"],
        "classifier": {
            "class_count": int(len(target_names)),
            "target_names": target_names.astype(str).tolist(),
        },
        "samples": samples,
        "durationMs": int((time.time() - started) * 1000),
    }


def face_embedding_similarity(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.time()

    def parse_face_image(key: str) -> np.ndarray:
        raw = payload.get(key)
        if raw is None:
            raise ValueError(f"Missing image: {key}")
        image = np.asarray(raw, dtype=np.float32)
        if image.ndim != 3 or image.shape[2] != 3:
            raise ValueError(f"{key} must be an RGB array, got {image.shape}.")
        if image.max(initial=0.0) > 1.5:
            image = image / 255.0
        return np.clip(image, 0.0, 1.0)

    if INSIGHTFACE_APP is None:
        raise RuntimeError("InsightFace app is not initialized. Start lenet5_cnn_service.py before requesting similarity.")
    left = parse_face_image("left")
    right = parse_face_image("right")
    similarity = insightface_tool.compare_face_arrays(left, right, app=INSIGHTFACE_APP)
    similarity = float(max(-1.0, min(1.0, similarity)))
    correlation = float(max(0.0, min(1.0, similarity)))
    print(
        f"[face-recog] correlation={correlation:.4f} "
        f"cosine_similarity={similarity:.4f}",
        flush=True,
    )
    return {
        "model": insightface_tool.INSIGHTFACE_MODEL_NAME,
        "backend": "insightface",
        "similarity": correlation,
        "correlation": correlation,
        "cosineSimilarity": similarity,
        "similarityPercent": float(round(correlation * 100.0, 2)),
        "input_shape": [int(left.shape[0]), int(left.shape[1]), 3],
        "model_root": str(insightface_tool.model_root().relative_to(ROOT)),
        "durationMs": int((time.time() - started) * 1000),
    }


def lenet_job_public(job: dict[str, Any]) -> dict[str, Any]:
    public = {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress": int(job.get("progress", 0)),
        "phase": str(job.get("phase", "")),
        "message": str(job.get("message", "")),
        "startedAt": float(job.get("startedAt", 0)),
        "updatedAt": float(job.get("updatedAt", 0)),
    }
    if job.get("status") == "complete":
        public["result"] = job.get("result")
    if job.get("status") == "error":
        public["error"] = str(job.get("error") or "Training failed.")
    return public


def update_lenet_job(job_id: str, *, status: str | None = None, progress: int | None = None, phase: str | None = None, message: str | None = None, result: dict[str, Any] | None = None, error: str | None = None) -> None:
    with LENET_TRAIN_JOBS_LOCK:
        job = LENET_TRAIN_JOBS.get(job_id)
        if not job:
            return
        if status is not None:
            job["status"] = status
        if progress is not None:
            job["progress"] = int(max(0, min(100, progress)))
        if phase is not None:
            job["phase"] = phase
        if message is not None:
            job["message"] = message
        if result is not None:
            job["result"] = result
        if error is not None:
            job["error"] = error
        job["updatedAt"] = time.time()


def run_lenet_job(job_id: str, payload: dict[str, Any]) -> None:
    def progress_callback(progress: int, phase: str, message: str) -> None:
        update_lenet_job(job_id, status="running", progress=progress, phase=phase, message=message)

    try:
        progress_callback(0, "训练准备中", "训练任务已创建，正在排队启动。")
        result = train_face_lenet(payload, progress_callback=progress_callback)
        update_lenet_job(
            job_id,
            status="complete",
            progress=100,
            phase="训练完成",
            message="训练完成，已生成指标和可视化结果。",
            result=result,
        )
    except Exception as exc:
        print(f"[lenet5-cnn-service:job-error] {type(exc).__name__}: {exc}", flush=True)
        print(traceback.format_exc(), flush=True)
        update_lenet_job(
            job_id,
            status="error",
            progress=100,
            phase="训练失败",
            message=str(exc),
            error=str(exc),
        )


def start_lenet_job(payload: dict[str, Any]) -> dict[str, Any]:
    job_id = uuid.uuid4().hex
    now = time.time()
    with LENET_TRAIN_JOBS_LOCK:
        complete_jobs = [
            item_id for item_id, item in LENET_TRAIN_JOBS.items()
            if item.get("status") in {"complete", "error"} and now - float(item.get("updatedAt", now)) > 900
        ]
        for item_id in complete_jobs:
            LENET_TRAIN_JOBS.pop(item_id, None)
        LENET_TRAIN_JOBS[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "phase": "训练准备中",
            "message": "训练任务已创建，正在准备数据。",
            "startedAt": now,
            "updatedAt": now,
        }
    thread = threading.Thread(target=run_lenet_job, args=(job_id, payload), daemon=True)
    thread.start()
    with LENET_TRAIN_JOBS_LOCK:
        return lenet_job_public(LENET_TRAIN_JOBS[job_id])


def get_lenet_job(job_id: str) -> dict[str, Any] | None:
    with LENET_TRAIN_JOBS_LOCK:
        job = LENET_TRAIN_JOBS.get(job_id)
        return lenet_job_public(job) if job else None


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


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        print(f"[lenet5-cnn-service] {self.address_string()} {format % args}", flush=True)

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = _json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def send_binary(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/health":
            self.send_json(200, {
                "ok": True,
                "service": "lenet5-cnn-service",
                "dataset": {
                    "images": IMAGE_PATH.exists(),
                    "labels": LABEL_PATH.exists(),
                    "olivetti_faces": OLIVETTI_FACE_PATH.exists(),
                    "olivetti_targets": OLIVETTI_TARGET_PATH.exists(),
                    "lfw_balanced_faces": LFW_FACE_PATH.exists(),
                    "lfw_balanced_targets": LFW_TARGET_PATH.exists(),
                    "face_demo": FACE_DEMO_IMAGE_PATH.exists(),
                },
            })
            return
        if path == "/face-recog/lenet-train-status":
            query = parse_qs(parsed.query)
            job_id = str((query.get("job_id") or query.get("id") or [""])[0])
            job = get_lenet_job(job_id)
            if not job:
                self.send_json(404, {"ok": False, "error": "Training job not found."})
                return
            self.send_json(200, {"ok": True, "result": job})
            return
        if path == "/face-recog/demo-image":
            if not FACE_DEMO_IMAGE_PATH.exists():
                self.send_json(404, {"ok": False, "error": "dataset/face_demo.png not found"})
                return
            self.send_binary(200, FACE_DEMO_IMAGE_PATH.read_bytes(), "image/png")
            return
        self.send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path not in {
            "/lenet5/fixed-kernel-preview",
            "/lenet5/fixed-kernel-train",
            "/lenet5/sequence-sample",
            "/face-recog/fixed-kernel-preview",
            "/face-recog/fixed-kernel-train",
            "/face-recog/lenet-train",
            "/face-recog/embedding-similarity",
        }:
            self.send_json(404, {"ok": False, "error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > MAX_BODY_BYTES:
                raise ValueError("Request body too large.")
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            payload = json.loads(raw or "{}")
            body = payload if isinstance(payload, dict) else {}
            if path == "/lenet5/fixed-kernel-preview":
                result = preview_fixed_kernel(body)
            elif path == "/lenet5/fixed-kernel-train":
                result = train_fixed_kernel(body)
            elif path == "/lenet5/sequence-sample":
                result = build_sequence_sample(body)
            elif path == "/face-recog/fixed-kernel-preview":
                result = preview_face_fixed_kernel(body)
            elif path == "/face-recog/fixed-kernel-train":
                result = train_face_fixed_kernel(body)
            elif path == "/face-recog/embedding-similarity":
                result = face_embedding_similarity(body)
            elif path == "/face-recog/lenet-train" and body.get("async") is True:
                result = start_lenet_job(body)
            else:
                result = train_face_lenet(body)
            self.send_json(200, {"ok": True, "result": result})
        except Exception as exc:
            print(f"[lenet5-cnn-service:error] {type(exc).__name__}: {exc}", flush=True)
            print(traceback.format_exc(), flush=True)
            self.send_json(500, {"ok": False, "error": str(exc)})


def main() -> int:
    global INSIGHTFACE_APP
    print(f"[lenet5-cnn-service] initializing InsightFace model root: {insightface_tool.model_root()}", flush=True)
    INSIGHTFACE_APP = insightface_tool.get_face_app()
    server = ThreadingHTTPServer((DEFAULT_HOST, DEFAULT_PORT), Handler)
    print(f"[lenet5-cnn-service] listening on http://{DEFAULT_HOST}:{DEFAULT_PORT}", flush=True)
    print(f"[lenet5-cnn-service] dataset root: {DATASET_DIR}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
