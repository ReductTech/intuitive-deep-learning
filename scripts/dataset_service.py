"""Dataset loading and fixed feature preparation for the local CNN service."""

from __future__ import annotations

import json
import struct
import zlib
from pathlib import Path
from typing import Any

import numpy as np

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
