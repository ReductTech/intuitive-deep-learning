"""Export real MobileNetV3 responses for the feature hierarchy lesson.

Run with Python + torch, torchvision, numpy, Pillow. No training or HTTP service.
The cache directory holds downloaded source data; only derived lesson assets
are written to the repository assets directory.
"""
import argparse
import hashlib
import json
import pickle
import tarfile
import urllib.request
from pathlib import Path

import numpy as np
import torch
import torchvision
from PIL import Image, ImageDraw
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

UUID = "80396753-7fc8-4f55-9188-bddbdb828169"
CIFAR_URL = "https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz"
CIFAR_MD5 = "c58f30108f718f92721af3b95e74349a"
CLASSES = ["airplane", "automobile", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"]
STAGES = {"shallow": 0, "middle": 3, "deep": 9}


def digest(path, algorithm="sha256"):
    h = hashlib.new(algorithm)
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[3]
    root = repo / "assets" / UUID
    output = root / "feature-hierarchy" / "mobilenet-v3-small"
    output.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(4)
    torch.manual_seed(0)
    weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
    model = mobilenet_v3_small(weights=weights).eval()
    preprocess = weights.transforms()
    checkpoint = Path(torch.hub.get_dir()) / "checkpoints" / Path(weights.url).name
    expected_hash_prefix = checkpoint.stem.rsplit("-", 1)[-1]
    if not digest(checkpoint).startswith(expected_hash_prefix):
        raise RuntimeError("MobileNetV3 checkpoint checksum mismatch")
    print("Loaded pretrained MobileNetV3 Small", flush=True)

    samples = []
    for digit in range(10):
        paths = sorted((root / "mnist" / str(digit)).glob("*.png"))[:1]
        if len(paths) != 1:
            raise RuntimeError(f"Missing MNIST samples for {digit}")
        for ordinal, path in enumerate(paths):
            samples.append((f"mnist-{digit}-{ordinal}", "mnist", str(digit),
                            {"asset": path.relative_to(root).as_posix(), "sha256": digest(path)},
                            Image.open(path).convert("RGB")))

    archive = args.cache / "cifar-10-python.tar.gz"
    if not archive.exists():
        print("Downloading official CIFAR-10 archive", flush=True)
        urllib.request.urlretrieve(CIFAR_URL, archive)
    if digest(archive, "md5") != CIFAR_MD5:
        raise RuntimeError("CIFAR-10 checksum mismatch")
    with tarfile.open(archive, "r:gz") as tar:
        stream = tar.extractfile("cifar-10-batches-py/test_batch")
        # Official archive is verified above; no filesystem extraction.
        batch = pickle.load(stream, encoding="bytes")
    images = batch[b"data"].reshape(-1, 3, 32, 32).transpose(0, 2, 3, 1)
    labels = np.asarray(batch[b"labels"])
    for label, name in enumerate(CLASSES):
        for ordinal, index in enumerate(np.flatnonzero(labels == label)[:1]):
            samples.append((f"cifar10-{name}-{ordinal}", "cifar10", name,
                            {"url": CIFAR_URL, "archiveMd5": CIFAR_MD5,
                             "split": "test", "index": int(index)}, Image.fromarray(images[index])))

    tensors = {stage: [] for stage in STAGES}
    records = []
    with torch.inference_mode():
        for sample_id, dataset, label, source, image in samples:
            folder = output / "samples" / sample_id
            folder.mkdir(parents=True, exist_ok=True)
            image.save(folder / "input.png")
            x = preprocess(image)
            # Save exact RGB crop before channel normalization for alignment.
            mean = torch.tensor([0.485, 0.456, 0.406])[:, None, None]
            std = torch.tensor([0.229, 0.224, 0.225])[:, None, None]
            rgb = ((x * std + mean).clamp(0, 1) * 255).round().byte()
            Image.fromarray(rgb.permute(1, 2, 0).numpy()).save(folder / "model-input.png")
            values = {}
            h = x.unsqueeze(0)
            for index, layer in enumerate(model.features):
                h = layer(h)
                for stage, target in STAGES.items():
                    if index == target:
                        values[stage] = h[0].cpu().numpy().copy()
                        tensors[stage].append(values[stage])
            np.savez_compressed(folder / "activations.npz", **values)
            prefix = folder.relative_to(output).as_posix()
            records.append({"id": sample_id, "dataset": dataset, "label": label,
                            "source": source, "input": f"{prefix}/input.png",
                            "modelInput": f"{prefix}/model-input.png",
                            "rawActivations": f"{prefix}/activations.npz", "features": {}})
    stage_info = {}
    for stage, all_values in tensors.items():
        arrays = np.stack(all_values)
        # Select ONCE across the whole collection, never independently per input.
        variance = arrays.var(axis=(2, 3)).mean(axis=0)
        channels = np.argsort(-variance, kind="stable")[:2].tolist()
        ranges = {}
        for channel in channels:
            low, high = np.percentile(arrays[:, channel], [1, 99])
            ranges[str(channel)] = [float(low), float(high)]
        stage_info[stage] = {"layer": f"features.{STAGES[stage]}",
                             "shapeCHW": list(arrays.shape[1:]), "channels": channels,
                             "displayRanges": ranges}
        for record, values in zip(records, arrays):
            folder = output / "samples" / record["id"] / stage
            folder.mkdir(exist_ok=True)
            maps = []
            for channel in channels:
                low, high = ranges[str(channel)]
                scaled = np.clip((values[channel] - low) / max(high - low, 1e-12), 0, 1)
                path = folder / f"channel-{channel:03d}.png"
                Image.fromarray(np.round(scaled * 255).astype(np.uint8)).save(path)
                maps.append({"channel": channel, "image": path.relative_to(output).as_posix()})
            record["features"][stage] = maps
    manifest = {
        "schemaVersion": 1, "model": "mobilenet_v3_small",
        "weights": "IMAGENET1K_V1", "weightsUrl": weights.url,
        "weightsSha256": digest(checkpoint),
        "versions": {"torch": torch.__version__, "torchvision": torchvision.__version__},
        "preprocessing": {"resizeShortEdge": 256, "centerCrop": [224, 224],
                          "interpolation": "bilinear", "antialias": True,
                          "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "channelSelection": "Top 2 by mean spatial variance over all 20 inputs; fixed across inputs",
        "visualization": "Grayscale with fixed per-stage/per-channel 1st/99th percentile range across all inputs; clipped only for PNG display; NPZ preserves all float32 channels",
        "interpretation": "ImageNet-pretrained responses, not a trained MNIST/CIFAR-10 classifier. Single channels are not guaranteed semantic detectors. Pyramid widths do not encode channel counts.",
        "stages": stage_info, "samples": records,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "README.md").write_text(
        "# Real feature hierarchy assets\n\n"
        "20 inputs: MNIST digits 0–9 and CIFAR-10 classes, one example per class.\n"
        "MobileNetV3 Small, torchvision ImageNet IMAGENET1K_V1 pretrained weights, eval mode, no training.\n\n"
        "`manifest.json` associates original input, exact preprocessed RGB crop, raw float32 activations and two display channels at each stage. Paths are relative to this directory. Use moduleAssetUrl with the module UUID.\n\n"
        "Shallow/middle/deep are features.0/features.3/features.9, not three consecutive single convolution layers. Each transition composes all intervening operations. Channels are selected once by average spatial variance across the full collection and remain fixed for every input. PNG normalization uses a fixed range per stage/channel, with percentile clipping; raw NPZ values are unchanged. Black denotes the low end of that range, not necessarily zero. Resize feature-map previews with nearest-neighbor interpolation.\n\n"
        "ImageNet pretraining does not imply digit recognition; do not assign invented edge/part/class labels to particular channels. These are feature responses, not CAM.\n\n"
        "Sources: https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.mobilenet_v3_small.html ; https://www.cs.toronto.edu/~kriz/cifar.html ; MNIST inputs reused from this module.\n\n"
        "Reproduce with services/prepare_hierarchy_assets.py --cache <download-cache>. Package versions and checkpoint SHA256 are in the manifest.\n", encoding="utf-8")
    if args.preview:
        chosen = [records[0], records[5], records[10], records[13]]
        canvas = Image.new("RGB", (1500, 850), "white")
        draw = ImageDraw.Draw(canvas)
        draw.text((24, 12), "REAL MobileNetV3 Small / fixed channels across inputs / ImageNet pretrained", fill="black")
        for row, record in enumerate(chosen):
            y = 50 + row * 195
            draw.text((24, y), record["id"], fill="black")
            canvas.paste(Image.open(output / record["modelInput"]).resize((140, 140)), (24, y + 25))
            for column, stage in enumerate(STAGES):
                x = 200 + column * 425
                draw.text((x, y), f"{stage}: {stage_info[stage]['layer']} {stage_info[stage]['shapeCHW']}", fill="black")
                for i, item in enumerate(record["features"][stage]):
                    image = Image.open(output / item["image"]).convert("RGB").resize((96, 96), Image.Resampling.NEAREST)
                    canvas.paste(image, (x + i * 102, y + 30))
                    draw.text((x + i * 102, y + 132), f"channel {item['channel']}", fill="black")
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(args.preview)
    print(f"Exported {len(records)} inputs, {len(records) * 6} feature PNGs to {output}", flush=True)


if __name__ == "__main__":
    main()
