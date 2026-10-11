"""vision / training / faces."""
from __future__ import annotations
from idl_backend.config import source_label
import threading
import time
from typing import Any
import numpy as np
from idl_backend.datasets.digits import FACE_LENET_DESCRIPTION, LFW_FACE_PATH, LFW_IMAGE_HEIGHT, LFW_IMAGE_WIDTH, LFW_MANIFEST_PATH, LFW_TARGET_NAMES_PATH, LFW_TARGET_PATH, lfw_balanced_split_indices, load_lfw_balanced_dataset
from idl_backend.vision.helpers import to_small_matrix

FACE_CLASSIFIER_EMBEDDING_CACHE = None
FACE_CLASSIFIER_EMBEDDING_CACHE_LOCK = threading.Lock()

def train_face_classifier_model(
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
            "Torch is required for the learnable CNN scene. Install torch in the Python environment that runs http_service.py."
        ) from exc

    torch.manual_seed(20260707)
    from idl_backend.vision.device import select_device
    device = select_device(torch)
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


def face_classifier_sample(
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


def train_face_classifier(payload: dict[str, Any], progress_callback: Any | None = None) -> dict[str, Any]:
    global FACE_CLASSIFIER_EMBEDDING_CACHE
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
    model = train_face_classifier_model(
        train_images,
        labels[train_indices],
        val_images,
        labels[val_indices],
        class_count=int(len(target_names)),
        epochs=requested_epochs,
        architecture=requested_architecture if isinstance(requested_architecture, list) else None,
        progress_callback=progress_callback,
    )
    with FACE_CLASSIFIER_EMBEDDING_CACHE_LOCK:
        FACE_CLASSIFIER_EMBEDDING_CACHE = {
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
        samples.append(face_classifier_sample(faces, labels, target_names, absolute_index, model["val_probs"][relative_index]))
    first_filters = model["first_filters"]
    filter_maps = [
        to_small_matrix((kernel - kernel.min()) / max(float(kernel.max() - kernel.min()), 1e-6), 3)
        for kernel in first_filters
    ]
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
            "image_shape": [int(x) for x in faces.shape[1:]],
            "network_input_shape": [LFW_IMAGE_HEIGHT, LFW_IMAGE_WIDTH, 3],
            "target_names_list": target_names.astype(str).tolist(),
            "manifest": source_label(LFW_MANIFEST_PATH),
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
