"""Offline full-MNIST training. Browser playback never starts this computation."""
import hashlib
import json
from pathlib import Path
import struct
import time

import numpy as np

from idl_backend.contracts.digit_tsne import EPOCHS, SEED, VERSION


def read_mnist(root):
    root = Path(root)
    hashes = {}
    arrays = []
    for prefix, count in (("train", 60000), ("t10k", 10000)):
        image_path, label_path = root / f"{prefix}-images-idx3-ubyte", root / f"{prefix}-labels-idx1-ubyte"
        image_bytes, label_bytes = image_path.read_bytes(), label_path.read_bytes()
        if struct.unpack(">IIII", image_bytes[:16]) != (2051, count, 28, 28) or struct.unpack(">II", label_bytes[:8]) != (2049, count):
            raise ValueError("Expected the original complete 10-class MNIST IDX files.")
        if len(image_bytes) != 16 + count * 784 or len(label_bytes) != 8 + count:
            raise ValueError("MNIST file length does not match its header.")
        images = np.frombuffer(image_bytes, dtype=np.uint8, offset=16).reshape(count, 1, 28, 28).astype(np.float32) / 255
        labels = np.frombuffer(label_bytes, dtype=np.uint8, offset=8).astype(np.int64)
        if set(np.unique(labels)) != set(range(10)):
            raise ValueError("This lesson must use exactly the ten digit classes.")
        arrays.append((images, labels))
        hashes[image_path.name] = hashlib.sha256(image_bytes).hexdigest()
        hashes[label_path.name] = hashlib.sha256(label_bytes).hexdigest()
    return arrays[0], arrays[1], hashes


def make_model(torch):
    nn = torch.nn
    class DigitNetwork(nn.Module):
        def __init__(self):
            super().__init__()
            self.backbone = nn.Sequential(nn.Conv2d(1, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                                          nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                                          nn.Conv2d(32, 64, 3, padding=1), nn.ReLU())
            self.gap = nn.AdaptiveAvgPool2d(1)
            self.classifier = nn.Linear(64, 10)
        def features(self, x):
            return self.gap(self.backbone(x)).flatten(1)
        def forward(self, x):
            return self.classifier(self.features(x))
    return DigitNetwork()


def train_record(training, validation, hashes, learning_rate, batch_size, output, *, epochs=EPOCHS, device="cuda", progress=print):
    import torch
    from idl_backend.vision.features.projection import digit_projection_samples, project_digit_features, projection_metadata
    torch.manual_seed(SEED)
    if device == "cuda":
        torch.cuda.manual_seed_all(SEED)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
    torch.set_num_threads(4)
    model = make_model(torch).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    # Keep this small dataset on the GPU to avoid per-batch transfer overhead.
    tx, ty = (torch.from_numpy(value).to(device) for value in training)
    vx, vy = (torch.from_numpy(value).to(device) for value in validation)
    indices = np.concatenate([np.flatnonzero(validation[1] == digit)[:30] for digit in range(10)])
    fx = vx[torch.from_numpy(indices).to(device)]
    samples = digit_projection_samples(validation[0][indices], validation[1][indices])
    frames, features = [], []
    started = time.monotonic()
    def evaluate(x, y):
        loss_sum = torch.zeros((), device=device)
        correct = torch.zeros((), dtype=torch.int64, device=device)
        for offset in range(0, len(y), 512):
            target = y[offset:offset+512]
            logits = model(x[offset:offset+512])
            loss_sum += torch.nn.functional.cross_entropy(logits, target, reduction="sum")
            correct += (logits.argmax(1) == target).sum()
        return float(loss_sum.item()) / len(y), int(correct.item()) / len(y)
    for epoch in range(epochs+1):
        if epoch:
            model.train()
            permutation = torch.randperm(len(ty), device=device)
            for offset in range(0, len(ty), batch_size):
                selection = permutation[offset:offset+batch_size]
                optimizer.zero_grad(set_to_none=True)
                loss = torch.nn.functional.cross_entropy(model(tx[selection]), ty[selection])
                if not torch.isfinite(loss):
                    raise ValueError("Non-finite training loss; record will not be published.")
                loss.backward()
                optimizer.step()
        model.eval()
        with torch.inference_mode():
            train_loss, train_accuracy = evaluate(tx, ty)
            val_loss, val_accuracy = evaluate(vx, vy)
            vectors = model.features(fx).cpu().numpy()
        points = project_digit_features(vectors, frames[-1]["points"] if frames else None)
        features.append(vectors.copy())
        frame = {"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss, "train_accuracy": train_accuracy, "val_accuracy": val_accuracy, "points": points}
        frames.append(frame)
        progress(f"lr={learning_rate:g} batch={batch_size} epoch={epoch}/{epochs} loss={train_loss:.4f}/{val_loss:.4f} accuracy={train_accuracy:.4f}/{val_accuracy:.4f} elapsed={time.monotonic()-started:.1f}s", flush=True)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    record = {"schema_version": 1, "samples": samples, "frames": frames, "metadata": projection_metadata(),
              "recording": {"version": VERSION, "epochs": epochs, "learning_rate": learning_rate, "batch_size": batch_size, "seed": SEED,
                            "optimizer": "Adam", "architecture": "Conv16-ReLU-Pool-Conv32-ReLU-Pool-Conv64-ReLU-GAP-Linear10",
                            "train_count": len(ty), "val_count": len(vy), "dataset": "original MNIST, 10 classes", "dataset_sha256": hashes,
                            "validation_source": "official 10000-image test split; used as lesson validation, not an additional independent test",
                            "metrics": "full-split evaluation at the same epoch checkpoint in eval mode", "feature_layer": "64-dimensional GAP output"}}
    torch.save({"state_dict": model.cpu().state_dict(), "recording": record["recording"]}, output / "model.pt")
    np.savez_compressed(output / "features.npz", checkpoints=np.stack(features), labels=validation[1][indices], indices=indices)
    serialized = json.dumps(record, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
    temporary = output / "record.json.tmp"
    temporary.write_bytes(serialized)
    temporary.replace(output / "record.json")
    return record
