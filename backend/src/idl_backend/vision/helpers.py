"""vision / helpers."""
from __future__ import annotations
import numpy as np
from idl_backend.datasets.digits import (LFW_IMAGE_HEIGHT, LFW_IMAGE_WIDTH, rgb_to_luminance)


def to_small_matrix(values: np.ndarray, digits: int = 3) -> list[list[float]]:
    return np.round(values.astype(float), digits).tolist()


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
