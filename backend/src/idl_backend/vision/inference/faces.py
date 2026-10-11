"""vision / inference / faces."""
from __future__ import annotations
from idl_backend.config import source_label
import time
from typing import Any
import numpy as np
from idl_backend.vision.inference import face_embeddings as insightface_tool


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

    face_app = insightface_tool.get_face_app()
    left = parse_face_image("left")
    right = parse_face_image("right")
    similarity = insightface_tool.compare_face_arrays(left, right, app=face_app)
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
        "model_root": source_label(insightface_tool.model_root()),
        "durationMs": int((time.time() - started) * 1000),
    }
