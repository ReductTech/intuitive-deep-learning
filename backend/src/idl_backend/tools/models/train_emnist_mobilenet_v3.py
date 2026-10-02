"""Train MobileNet V3 Small on EMNIST ByClass.

Example:
    python -m idl_backend.tools.models.train_emnist_mobilenet_v3 --epochs 10 --batch-size 128

Dataset and checkpoint paths are configurable through CLI arguments.
"""

import argparse
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms
from torchvision.datasets import EMNIST
from torchvision.models import mobilenet_v3_small
from tqdm.auto import tqdm


from idl_backend.config import data_directory, model_directory
DATA_ROOT = data_directory() / "emnist"
CHECKPOINT_PATH = model_directory() / "emnist_mobilenet_v3_small_best.pt"


class TransformedSubset(Dataset):
    """Apply a transform after splitting, so validation stays deterministic."""

    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform

    def __len__(self):
        return len(self.subset)

    def __getitem__(self, index):
        image, label = self.subset[index]
        return self.transform(image), label


def make_dataloaders(batch_size: int, num_workers: int):
    # MobileNet V3 expects three channels; EMNIST contains 28 x 28 grayscale images.
    common_transform = [
        transforms.Resize((96, 96)),
        transforms.Grayscale(num_output_channels=3),
    ]
    train_transform = transforms.Compose(
        [
            *common_transform,
            # Keep changes modest: large rotations or flips can change a character's label.
            transforms.RandomAffine(
                degrees=12,
                translate=(0.10, 0.10),
                scale=(0.90, 1.10),
                shear=6,
                fill=0,
            ),
            transforms.RandomPerspective(distortion_scale=0.12, p=0.15, fill=0),
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
            transforms.RandomErasing(
                p=0.15, scale=(0.005, 0.02), ratio=(0.3, 3.0), value=-1.0
            ),
        ]
    )
    eval_transform = transforms.Compose(
        [
            *common_transform,
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
        ]
    )

    train_set = EMNIST(
        root=str(DATA_ROOT),
        split="byclass",
        train=True,
        download=True,
    )

    test_set = EMNIST(
        root=str(DATA_ROOT),
        split="byclass",
        train=False,
        download=True,
        transform=eval_transform,
    )

    val_size = max(1, len(train_set) // 20)
    train_subset, val_subset = random_split(
        train_set,
        [len(train_set) - val_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )
    train_subset = TransformedSubset(train_subset, train_transform)
    val_subset = TransformedSubset(val_subset, eval_transform)
    loader_options = {
        "batch_size": batch_size,
        "num_workers": num_workers,
        "pin_memory": torch.cuda.is_available(),
    }
    train_loader = DataLoader(train_subset, shuffle=True, **loader_options)
    val_loader = DataLoader(val_subset, shuffle=False, **loader_options)
    test_loader = DataLoader(test_set, shuffle=False, **loader_options)
    return train_loader, val_loader, test_loader, len(train_set.classes)


def evaluate(model, loader, criterion, device, description):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    with torch.inference_mode():
        with tqdm(loader, desc=description, unit="batch", dynamic_ncols=True) as progress:
            for images, labels in progress:
                images = images.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
                logits = model(images)
                total_loss += criterion(logits, labels).item() * labels.size(0)
                correct += (logits.argmax(dim=1) == labels).sum().item()
                total += labels.size(0)
                progress.set_postfix(loss=f"{total_loss / total:.4f}", acc=f"{correct / total:.2%}")
    return total_loss / total, correct / total


def main():
    global DATA_ROOT, CHECKPOINT_PATH
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--checkpoint", type=Path, default=model_directory() / "emnist_mobilenet_v3_small_best.pt")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--num-workers", type=int, default=0)
    args = parser.parse_args()
    DATA_ROOT, CHECKPOINT_PATH = args.data_root.resolve(), args.checkpoint.resolve()
    CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
    if args.epochs < 1 or args.batch_size < 1 or args.num_workers < 0 or args.learning_rate <= 0:
        parser.error("epochs, batch-size, and learning-rate must be positive; num-workers must be nonnegative")

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Dataset: {DATA_ROOT} | Device: {device}", flush=True)
    print("Loading EMNIST (first run may download it)...", flush=True)
    train_loader, val_loader, test_loader, num_classes = make_dataloaders(
        args.batch_size, args.num_workers
    )
    print(
        f"Samples: train={len(train_loader.dataset)}, val={len(val_loader.dataset)}, "
        f"test={len(test_loader.dataset)} | classes={num_classes}",
        flush=True,
    )

    model = mobilenet_v3_small(weights=None, num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs, eta_min=args.learning_rate * 0.05
    )
    best_val_accuracy = -1.0

    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        with tqdm(
            train_loader, desc=f"Epoch {epoch}/{args.epochs} train", unit="batch", dynamic_ncols=True
        ) as progress:
            for images, labels in progress:
                images = images.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
                optimizer.zero_grad(set_to_none=True)
                logits = model(images)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * labels.size(0)
                correct += (logits.argmax(dim=1) == labels).sum().item()
                total += labels.size(0)
                progress.set_postfix(loss=f"{total_loss / total:.4f}", acc=f"{correct / total:.2%}")

        val_loss, val_accuracy = evaluate(
            model, val_loader, criterion, device, f"Epoch {epoch}/{args.epochs} val"
        )
        print(
            f"Epoch {epoch}/{args.epochs} | train loss {total_loss / total:.4f} "
            f"| train accuracy {correct / total:.2%} | val loss {val_loss:.4f} "
            f"| val accuracy {val_accuracy:.2%}",
            flush=True,
        )
        if val_accuracy > best_val_accuracy:
            best_val_accuracy = val_accuracy
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "num_classes": num_classes,
                    "image_size": 96,
                    "split": "byclass",
                    "epoch": epoch,
                    "val_accuracy": val_accuracy,
                },
                CHECKPOINT_PATH,
            )
            print(f"Saved best checkpoint: {CHECKPOINT_PATH}", flush=True)
        scheduler.step()

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    test_loss, test_accuracy = evaluate(model, test_loader, criterion, device, "Final test")
    print(
        f"Best epoch {checkpoint['epoch']} | test loss {test_loss:.4f} "
        f"| test accuracy {test_accuracy:.2%} | saved: {CHECKPOINT_PATH}",
        flush=True,
    )


if __name__ == "__main__":
    main()
