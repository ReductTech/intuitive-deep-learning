from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import cv2
import insightface
import numpy as np

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

ROOT = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT / "dataset"
INSIGHTFACE_ROOT = DATASET_DIR / "insightface"
INSIGHTFACE_MODEL_NAME = "buffalo_sc"
INSIGHTFACE_DET_SIZE = (320, 320)
INSIGHTFACE_PROVIDERS = ["CPUExecutionProvider"]
_FACE_APP: Any | None = None


def model_root() -> Path:
    INSIGHTFACE_ROOT.mkdir(parents=True, exist_ok=True)
    return INSIGHTFACE_ROOT


def create_face_app() -> Any:
    app = insightface.app.FaceAnalysis(
        name=INSIGHTFACE_MODEL_NAME,
        root=str(model_root()),
        providers=INSIGHTFACE_PROVIDERS,
    )
    app.prepare(ctx_id=-1, det_size=INSIGHTFACE_DET_SIZE)
    return app


def get_face_app() -> Any:
    global _FACE_APP
    if _FACE_APP is None:
        _FACE_APP = create_face_app()
    return _FACE_APP


def l2_normalize(x: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(x))
    if norm <= 1e-8:
        return x.astype(np.float32)
    return (x / norm).astype(np.float32)


def get_face_embedding(app: Any, image_path: str | Path) -> np.ndarray:
    """
    Read an image, detect faces, and return the largest face's normalized embedding.
    Model weights are downloaded to and loaded from dataset/insightface.
    """
    image_path = Path(image_path)
    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(f"无法读取图片: {image_path}")

    faces = app.get(img)
    if len(faces) == 0:
        raise ValueError(f"图片中没有检测到人脸: {image_path}")

    face = max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
    )
    return l2_normalize(face.embedding.astype(np.float32))


def get_face_embedding_from_bgr(app: Any, image_bgr: np.ndarray, label: str = "image") -> np.ndarray:
    if image_bgr.ndim != 3 or image_bgr.shape[2] != 3:
        raise ValueError(f"{label} 必须是 BGR 彩色图。")
    height, width = image_bgr.shape[:2]
    min_size = min(height, width)
    if min_size < 256:
        scale = 256 / max(1, min_size)
        image_bgr = cv2.resize(
            image_bgr,
            (int(round(width * scale)), int(round(height * scale))),
            interpolation=cv2.INTER_CUBIC,
        )

    faces = app.get(image_bgr)
    if len(faces) == 0:
        raise ValueError(f"{label} 中没有检测到人脸。")

    face = max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
    )
    return l2_normalize(face.embedding.astype(np.float32))


def cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    return float(np.dot(l2_normalize(emb1), l2_normalize(emb2)))


def rgb_array_to_bgr(image: np.ndarray) -> np.ndarray:
    image = np.asarray(image, dtype=np.float32)
    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError(f"Expected RGB image array, got {image.shape}.")
    if image.max(initial=0.0) <= 1.5:
        image = image * 255.0
    image = np.clip(image, 0, 255).astype(np.uint8)
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


def compare_face_arrays(rgb_image_1: np.ndarray, rgb_image_2: np.ndarray, app: Any | None = None) -> float:
    if app is None:
        app = get_face_app()
    emb1 = get_face_embedding_from_bgr(app, rgb_array_to_bgr(rgb_image_1), "图片 1")
    emb2 = get_face_embedding_from_bgr(app, rgb_array_to_bgr(rgb_image_2), "图片 2")
    return cosine_similarity(emb1, emb2)


def compare_faces(image_path_1: str | Path, image_path_2: str | Path) -> float:
    app = get_face_app()
    emb1 = get_face_embedding(app, image_path_1)
    emb2 = get_face_embedding(app, image_path_2)
    sim = cosine_similarity(emb1, emb2)

    print(f"模型目录: {model_root()}")
    print(f"图片 1: {image_path_1}")
    print(f"图片 2: {image_path_2}")
    print(f"Cosine Similarity: {sim:.4f}")
    print("判断结果: 可能是同一个人" if sim >= 0.45 else "判断结果: 可能不是同一个人")
    return sim


if __name__ == "__main__":
    assets = ROOT / "modules" / "Face-Recog-Lab" / "game_assets"
    compare_faces(assets / "anchor_face.png", assets / "pos_face.png")
