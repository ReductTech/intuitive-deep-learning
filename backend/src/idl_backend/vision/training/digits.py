"""vision / training / digits."""
from __future__ import annotations
import json
import threading
import uuid
from typing import Any
import numpy as np
from idl_backend.datasets.digits import load_digit_training_subset

DIGIT_TRAIN_LOCK = threading.Lock()

def train_digit_network(payload: dict[str, Any], progress_callback=None, artifact_id: str | None = None) -> dict[str, Any]:
    """Editable CNN → GAP → ten-class head; all reported values are measured."""
    import torch
    from torch import nn
    from torch.utils.data import DataLoader, TensorDataset
    if not DIGIT_TRAIN_LOCK.acquire(blocking=False):
        raise ValueError("另一个数字网络正在训练，请稍后重试。")
    try:
        epochs = max(1, min(15, int(payload.get("epochs", 10))))
        raw = payload.get("architecture")
        if not isinstance(raw, list) or not 1 <= len(raw) <= 8:
            raise ValueError("网络需包含 1–8 个模块。")
        torch.manual_seed(20261001)
        architecture, blocks, channels, side = [], [], 1, 28
        for layer in raw:
            if not isinstance(layer, dict):
                raise ValueError("网络模块格式不正确。")
            if layer.get("kind") == "conv":
                out = int(layer.get("out_channels", 16))
                if out not in [8, 12, 16, 24, 32, 48, 64]:
                    raise ValueError("卷积通道数超出课程范围。")
                architecture.append({"kind": "conv", "out_channels": out})
                blocks.extend([nn.Conv2d(channels, out, 3, padding=1), nn.ReLU()])
                channels = out
            elif layer.get("kind") == "pool":
                side //= 2
                if side < 1:
                    raise ValueError("池化后的空间尺寸小于 1。")
                mode = "avg" if layer.get("pool_type") == "avg" else "max"
                architecture.append({"kind": "pool", "pool_type": mode})
                blocks.append(nn.AvgPool2d(2) if mode == "avg" else nn.MaxPool2d(2))
            else:
                raise ValueError("未知网络模块。")
        if not any(x["kind"] == "conv" for x in architecture):
            raise ValueError("请至少添加一个卷积层。")
        class DigitNetwork(nn.Module):
            def __init__(self):
                super().__init__()
                self.backbone = nn.Sequential(*blocks)
                self.gap = nn.AdaptiveAvgPool2d(1)
                self.classifier = nn.Linear(channels, 10)
            def features(self, x):
                return self.gap(self.backbone(x)).flatten(1)
            def forward(self, x):
                return self.classifier(self.features(x))
        torch.manual_seed(20261001)
        from idl_backend.vision.device import select_device
        device = select_device(torch)
        (tx, ty), (vx, vy) = load_digit_training_subset()
        train = DataLoader(TensorDataset(torch.from_numpy(tx), torch.from_numpy(ty)), batch_size=64, shuffle=True, generator=torch.Generator().manual_seed(20261001))
        validation = DataLoader(TensorDataset(torch.from_numpy(vx), torch.from_numpy(vy)), batch_size=128)
        model = DigitNetwork().to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=.002)
        criterion = nn.CrossEntropyLoss()
        feature_indices = np.concatenate([np.flatnonzero(vy == c)[:30] for c in range(10)])
        feature_input = torch.from_numpy(vx[feature_indices]).to(device)
        with torch.inference_mode():
            before = model.features(feature_input).cpu().numpy()
        projection = None
        feature_history = [before.copy()]
        if payload.get("feature_projection"):
            from idl_backend.vision.features.projection import digit_projection_samples, project_digit_features, projection_metadata
            projection = {"samples": digit_projection_samples(vx[feature_indices], vy[feature_indices]),
                          "frames": [{"epoch": 0, "points": project_digit_features(before)}],
                          "metadata": projection_metadata()}
        history = []
        for epoch in range(1, epochs + 1):
            model.train()
            total_loss, correct, count = 0., 0, 0
            for x, y in train:
                x, y = x.to(device), y.to(device)
                optimizer.zero_grad(); logits = model(x); loss = criterion(logits, y)
                loss.backward(); optimizer.step()
                total_loss += float(loss.detach()) * len(y)
                correct += int((logits.argmax(1) == y).sum()); count += len(y)
            model.eval()
            with torch.inference_mode():
                val_correct = sum(int((model(x.to(device)).argmax(1) == y.to(device)).sum()) for x, y in validation)
            history.append({"epoch": epoch, "loss": total_loss / count, "train_accuracy": correct / count, "val_accuracy": val_correct / len(vy)})
            with torch.inference_mode():
                epoch_features = model.features(feature_input).cpu().numpy()
            feature_history.append(epoch_features.copy())
            if projection is not None:
                if progress_callback:
                    progress_callback(round((epoch - .3) / epochs * 100), "特征投影中", f"第 {epoch} 轮已训练，正在计算 t-SNE。")
                frame = {**history[-1], "points": project_digit_features(epoch_features, projection["frames"][-1]["points"])}
                projection = {**projection, "frames": [*projection["frames"], frame]}
            if progress_callback:
                progress_callback(round(epoch / epochs * 100), "训练中", f"第 {epoch} / {epochs} 轮：损失 {history[-1]['loss']:.3f}", history=list(history), projection=projection)
        with torch.inference_mode():
            after = model.features(feature_input).cpu().numpy()
        stats = [layer.weight.detach().cpu().numpy().reshape(layer.out_channels, -1).mean(1).tolist() for layer in model.backbone if isinstance(layer, nn.Conv2d)]
        session_id = artifact_id or uuid.uuid4().hex
        from idl_backend.config import artifact_directory
        out = artifact_directory() / session_id
        out.mkdir(parents=True, exist_ok=True)
        torch.save({"state_dict": model.cpu().state_dict(), "architecture": architecture}, out / "model.pt")
        np.savez_compressed(out / "features.npz", before=before, after=after, checkpoints=np.stack(feature_history), labels=vy[feature_indices], images=vx[feature_indices])
        result = {"session_id": session_id, "epochs": epochs, "train_count": len(ty), "val_count": len(vy), "history": history, "train_accuracy": history[-1]["train_accuracy"], "val_accuracy": history[-1]["val_accuracy"], "conv_stats": stats, "architecture": architecture}
        if projection is not None:
            result["projection"] = projection
            (out / "projection.json").write_text(json.dumps(projection, ensure_ascii=False), encoding="utf-8")
        (out / "result.json").write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
        return result
    finally:
        DIGIT_TRAIN_LOCK.release()
