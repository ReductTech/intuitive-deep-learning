"""Inference for the EMNIST MobileNet V3 checkpoint used by the opening page."""

from __future__ import annotations

import base64
import binascii
from functools import lru_cache
from io import BytesIO
from typing import Any

from PIL import Image


from idl_backend.config import model_directory
CHECKPOINT_PATH = model_directory() / "emnist_mobilenet_v3_small_best.pt"
CANVAS_SIZE_LIMIT = 512
MAX_IMAGE_BYTES = 1024 * 1024
EMNIST_SIZE = 28
GLYPH_SIZE = 20
DIGIT_CLASSES = 10


def prepare_canvas_image(data_url: str) -> Image.Image:
    """Center the visible ink and match EMNIST's stored image orientation."""
    prefix = "data:image/png;base64,"
    if not isinstance(data_url, str) or not data_url.startswith(prefix):
        raise ValueError("Each image must be a PNG data URL.")
    try:
        raw = base64.b64decode(data_url[len(prefix):], validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Invalid PNG image data.") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("PNG image is too large.")

    try:
        with Image.open(BytesIO(raw)) as source:
            if source.format != "PNG" or max(source.size) > CANVAS_SIZE_LIMIT:
                raise ValueError("Unexpected canvas image format or size.")
            rgba = source.convert("RGBA")
    except (OSError, SyntaxError) as exc:
        raise ValueError("Invalid PNG image.") from exc

    # The browser canvas has a transparent background and opaque pen strokes.
    ink = rgba.getchannel("A")
    bbox = ink.point(lambda alpha: 255 if alpha >= 16 else 0).getbbox()
    if bbox is None:
        raise ValueError("The handwriting canvas is empty.")
    ink = ink.crop(bbox)
    scale = GLYPH_SIZE / max(ink.size)
    width = max(1, round(ink.width * scale))
    height = max(1, round(ink.height * scale))
    ink = ink.resize((width, height), Image.Resampling.LANCZOS)
    image = Image.new("L", (EMNIST_SIZE, EMNIST_SIZE), 0)
    image.paste(ink, ((EMNIST_SIZE - width) // 2, (EMNIST_SIZE - height) // 2))

    # torchvision's EMNIST IDX images were used as stored during training.
    # They appear transposed relative to upright handwriting.
    return image.transpose(Image.Transpose.TRANSPOSE)


@lru_cache(maxsize=1)
def _load_model():
    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"EMNIST checkpoint not found: {CHECKPOINT_PATH}")

    import torch
    from torchvision import transforms
    from torchvision.models import mobilenet_v3_small

    checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu", weights_only=True)
    if checkpoint.get("num_classes") != 62 or checkpoint.get("image_size") != 96 or checkpoint.get("split") != "byclass":
        raise ValueError("EMNIST checkpoint metadata does not match the training script.")
    from idl_backend.vision.device import select_device
    device = select_device(torch)
    model = mobilenet_v3_small(weights=None, num_classes=62)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device).eval()
    transform = transforms.Compose([
        transforms.Resize((96, 96)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
    ])
    return model, transform, device


def warmup_digits():
    model, _, device = _load_model()
    import torch
    with torch.inference_mode():
        model(torch.zeros(1, 3, 96, 96, device=device))
    if device.type == "cuda":
        torch.cuda.synchronize(device)
    return {"device": str(device), "modelLoads": _load_model.cache_info().misses}


def predict_digits(payload: dict[str, Any]) -> dict[str, Any]:
    images = payload.get("images")
    if not isinstance(images, list) or not 1 <= len(images) <= 4:
        raise ValueError("Provide between one and four canvas images.")
    prepared = [prepare_canvas_image(image) for image in images]
    model, transform, device = _load_model()

    import torch

    batch = torch.stack([transform(image) for image in prepared]).to(device)
    with torch.inference_mode():
        logits = model(batch)
        # This page explicitly asks for digits. EMNIST ByClass labels 0-9 are digits.
        digit_probabilities = logits[:, :DIGIT_CLASSES].softmax(dim=1)
        confidence, labels = digit_probabilities.max(dim=1)
    return {
        "predictions": [
            {"digit": str(int(label)), "confidence": float(score)}
            for label, score in zip(labels.tolist(), confidence.tolist())
        ]
    }
