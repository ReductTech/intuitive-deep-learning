"""Measured t-SNE frames of the same held-out digit samples at CNN checkpoints.

Labels are display metadata only: they never enter the t-SNE fit or alignment.
"""
import base64
import io
import numpy as np


def digit_projection_samples(images, labels):
    from PIL import Image
    samples = []
    for index, (image, label) in enumerate(zip(images, labels)):
        buffer = io.BytesIO()
        pixels = np.clip(image[0] * 255, 0, 255).astype(np.uint8)
        Image.fromarray(pixels).save(buffer, format="PNG")
        samples.append({"id": index, "label": int(label), "image": "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")})
    return samples


def project_digit_features(features, previous=None):
    from sklearn.manifold import TSNE
    from threadpoolctl import threadpool_limits
    features = np.asarray(features, dtype=np.float32)
    if features.ndim != 2 or not np.isfinite(features).all() or len(features) < 31:
        raise ValueError("t-SNE 需要至少 31 个有效特征向量。")
    # Warm start preserves sample identity between fits; it does not prescribe clusters.
    init = "pca" if previous is None else np.asarray(previous, dtype=np.float32) * 1e-4 / max(np.std(previous), 1e-8)
    with threadpool_limits(limits=2):
        coordinates = TSNE(n_components=2, perplexity=30, init=init,
                           learning_rate="auto", random_state=20261001,
                           max_iter=650, n_jobs=2).fit_transform(features).astype(np.float64)
    coordinates -= coordinates.mean(axis=0)
    # Remove arbitrary plot rotation/reflection and scale. No class information is used.
    coordinates *= 18 / max(np.sqrt(np.mean(coordinates ** 2)), 1e-8)
    if previous is not None:
        target = np.asarray(previous) - np.mean(previous, axis=0)
        u, _, vt = np.linalg.svd(coordinates.T @ target)
        coordinates = coordinates @ (u @ vt)
    return np.round(coordinates, 4).tolist()


def projection_metadata():
    return {"method": "t-SNE", "perplexity": 30, "random_state": 20261001,
            "max_iter": 650, "metric": "euclidean", "learning_rate": "auto",
            "alignment": "center, common RMS scale, orthogonal alignment to previous frame",
            "initialization": "PCA for epoch 0; previous coordinates for later epochs",
            "labels_used_in_projection": False, "sample_source": "held-out validation subset"}
