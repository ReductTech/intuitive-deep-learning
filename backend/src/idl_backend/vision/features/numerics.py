"""vision / features / numerics."""
from __future__ import annotations
import numpy as np


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
