"""Export Grad-CAM from complete, unmodified official pretrained networks.

Run with the vision environment plus torchvision, onnx, onnxruntime,
onnx2torch and OpenCV. No fitting or fine-tuning occurs in this exporter.
"""
import os
os.environ.setdefault('KMP_DUPLICATE_LIB_OK', 'TRUE')

import hashlib
import json
from pathlib import Path
from urllib.request import urlretrieve

import cv2
import numpy as np
import onnx
import onnxruntime as ort
import torch
from PIL import Image
from onnx2torch import convert
from torch.nn import functional as F
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

from idl_backend.config import repository_root, model_directory

ROOT = repository_root()
UUID = '80396753-7fc8-4f55-9188-bddbdb828169'
OUT = ROOT / 'assets' / UUID / 'gradcam'
MODELS = model_directory() / UUID / 'gradcam' / 'pretrained'
ZOO = 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/'
SFACE_URL = ZOO + 'face_recognition_sface/face_recognition_sface_2021dec.onnx'
YUNET_URL = ZOO + 'face_detection_yunet/face_detection_yunet_2023mar.onnx'


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def download(url, path):
    if not path.exists():
        print('Downloading', path.name, flush=True)
        urlretrieve(url, path)


def align(image, detector, recognizer):
    bgr = cv2.cvtColor(np.asarray(image.convert('RGB')), cv2.COLOR_RGB2BGR)
    detector.setInputSize((bgr.shape[1], bgr.shape[0]))
    _, faces = detector.detect(bgr)
    if faces is None:
        raise ValueError('No face detected: do not substitute an invented alignment.')
    face = max(faces, key=lambda row: row[2] * row[3])
    cropped = recognizer.alignCrop(bgr, face)
    # Reproduce OpenCV's five-landmark similarity transform at display resolution;
    # do not enlarge the recognition network's 112px input for the visible photo.
    src = face[4:14].reshape(5, 2).astype(np.float32)
    dst = np.array([[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]], dtype=np.float32)
    src_mean = src.mean(0)
    dst_mean = np.array([56.0262, 71.9008], dtype=np.float32)
    centered = src - src_mean
    covariance = (dst - dst_mean).astype(np.float64).T @ centered.astype(np.float64) / 5
    u, singular, vt = np.linalg.svd(covariance)
    signs = np.array([1., -1. if np.linalg.det(covariance) < 0 else 1.])
    rotation = u @ np.diag(signs) @ vt
    scale = (singular * signs).sum() / np.mean(np.sum(centered.astype(np.float64) ** 2, axis=1))
    matrix = np.column_stack([scale * rotation, dst_mean - scale * rotation @ src_mean])
    check = cv2.warpAffine(bgr, matrix, (112, 112), flags=cv2.INTER_LINEAR)
    if np.abs(check.astype(float) - cropped.astype(float)).mean() > .2:
        raise ValueError('Display alignment does not agree with official OpenCV alignment')
    display = cv2.warpAffine(bgr, matrix * (480 / 112), (480, 480), flags=cv2.INTER_LINEAR)
    return Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)), face.tolist(), Image.fromarray(cv2.cvtColor(display, cv2.COLOR_BGR2RGB))


def pixels(image, size):
    image = image.resize((size, size), Image.Resampling.BILINEAR)
    return torch.from_numpy(np.asarray(image).copy()).permute(2, 0, 1).float()[None]


def classification_input(image):
    x = pixels(image, 224) / 255
    return (x - torch.tensor([.485, .456, .406])[None, :, None, None]) / torch.tensor([.229, .224, .225])[None, :, None, None]


def occlusion_audit(model, x, reference_embedding):
    """Independent perturbation check; not used to edit or mask the heatmap."""
    regions = {'forehead': (32, 10, 80, 40), 'eyes': (24, 40, 90, 62),
               'nose_cheeks': (24, 62, 90, 85), 'mouth': (30, 85, 85, 106),
               'left_hair': (0, 10, 22, 100), 'right_hair': (90, 10, 112, 100)}
    with torch.no_grad():
        baseline = float((F.normalize(model(x), dim=1) * reference_embedding).sum())
        drops = {}
        for name, (x0, y0, x1, y1) in regions.items():
            occluded = x.detach().clone()
            occluded[:, :, y0:y1, x0:x1] = x[:, :, y0:y1, x0:x1].mean((2, 3), keepdim=True)
            score = float((F.normalize(model(occluded), dim=1) * reference_embedding).sum())
            drops[name] = baseline - score
    return {'baseline': baseline, 'scoreDrops': drops,
            'method': 'Replace each fixed aligned-image region by its mean RGB; separate diagnostic only; no changes to CAM pixels'}


def export_cam(model, layer, x, target, folder, mode):
    captured = []
    handle = layer.register_forward_hook(lambda _module, _args, output: captured.append(output))
    try:
        output = model(x.requires_grad_(True))
    finally:
        handle.remove()
    activation = captured[0]
    score = target(output)
    gradient = torch.autograd.grad(score, activation)[0]
    alpha = gradient[0].mean((1, 2))
    raw = F.relu((alpha[:, None, None] * activation[0]).sum(0)).detach()
    if not torch.isfinite(raw).all() or raw.max() <= 1e-10:
        raise ValueError(f'{mode}: no finite positive Grad-CAM; do not fabricate a heatmap')
    normalized = raw / raw.max()
    cam = F.interpolate(normalized[None, None], (480, 480), mode='bilinear', align_corners=False)[0, 0].numpy()
    colors = np.stack([np.ones_like(cam), np.clip(1.8 - 1.8 * cam, 0, 1), np.zeros_like(cam), cam * .85], -1)
    Image.fromarray(np.uint8(colors * 255)).save(folder / f'{mode}-heat.png')
    np.savez_compressed(folder / f'{mode}-raw.npz', activations=activation[0].detach().numpy(), gradients=gradient[0].detach().numpy(), alpha=alpha.detach().numpy(), cam=normalized.numpy(), score=float(score.detach()))
    # Show the strongest supporting channels, matching the positive Grad-CAM.
    indices = torch.topk(alpha.clamp_min(0), 3).indices.tolist()
    if sum(float(alpha[k]) > 0 for k in indices) != 3:
        raise ValueError(f'{mode}: fewer than three supporting channels')
    channels = []
    for k in indices:
        response = activation[0, k].detach().clamp_min(0).numpy()
        response = response / max(float(response.max()), 1e-12)
        rgb = np.stack([response * .2, response * .65, response], -1)
        filename = f'{mode}-channel-{k}.png'
        Image.fromarray(np.uint8(rgb * 255)).resize((128, 128), Image.Resampling.NEAREST).save(folder / filename)
        channels.append({'index': k + 1, 'alpha': float(alpha[k].detach()), 'image': filename})
    return {'score': float(score.detach()), 'heat': f'{mode}-heat.png', 'hasPositiveSupport': True, 'channels': channels, 'activationShape': list(activation.shape), 'targetLayer': mode == 'classification' and 'features.12' or 'conv_13_relu'}


def main():
    torch.set_num_threads(2)
    MODELS.mkdir(parents=True, exist_ok=True)
    download(SFACE_URL, MODELS / 'sface.onnx')
    download(YUNET_URL, MODELS / 'yunet.onnx')
    weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
    classification_file = MODELS / Path(weights.url).name
    download(weights.url, classification_file)
    classification = mobilenet_v3_small(weights=None).eval()
    classification.load_state_dict(torch.load(classification_file, map_location='cpu', weights_only=True))
    # Keep every ONNX node and pretrained parameter. Autograd needs a Torch
    # representation; verify that its output agrees with official ONNX inference.
    face = convert(onnx.load(MODELS / 'sface.onnx')).eval()
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.log_severity_level = 3
    session = ort.InferenceSession(str(MODELS / 'sface.onnx'), options, providers=['CPUExecutionProvider'])
    detector = cv2.FaceDetectorYN.create(str(MODELS / 'yunet.onnx'), '', (480, 480), .8)
    recognizer = cv2.FaceRecognizerSF.create(str(MODELS / 'sface.onnx'), '')
    old_record = json.loads((OUT / 'celebrity-record.json').read_text(encoding='utf-8'))
    samples = []
    for old in old_record['samples']:
        person = old['id'].split('-')[-1]
        folder = OUT / f'pretrained-{person}'
        folder.mkdir(exist_ok=True)
        source_folder = OUT / old['id']
        image, landmarks, display = align(Image.open(source_folder / 'input.png'), detector, recognizer)
        reference, _, _ = align(Image.open(source_folder / 'reference.png'), detector, recognizer)
        display.save(folder / 'input.png')
        image.save(folder / 'recognition-input.png')
        reference.save(folder / 'reference.png')
        x = pixels(image, 112)
        with torch.no_grad():
            embedding = face(x)
            reference_embedding = F.normalize(face(pixels(reference, 112)), dim=1)
            logits = classification(classification_input(display))
        expected = session.run(None, {session.get_inputs()[0].name: x.numpy()})[0]
        np.testing.assert_allclose(embedding.numpy(), expected, rtol=2e-4, atol=2e-4)
        cv_embedding = recognizer.feature(cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR))
        np.testing.assert_allclose(embedding.numpy(), cv_embedding, rtol=3e-4, atol=3e-4)
        class_index = int(logits.argmax(1))
        cls = export_cam(classification, classification.features[-1], classification_input(display), lambda value: value[0, class_index], folder, 'classification')
        cls.update({'classIndex': class_index, 'className': weights.meta['categories'][class_index], 'classProbability': float(logits.softmax(1)[0, class_index])})
        # Use the preceding spatial feature layer consistently for both people.
        # The final 1024-channel expansion produced poorly localized maps:
        # eye occlusion lowered matching scores most, but was barely highlighted.
        recognition = export_cam(face, face.get_submodule('conv_13_relu'), x, lambda value: (F.normalize(value, dim=1) * reference_embedding).sum(), folder, 'recognition')
        recognition['occlusionAudit'] = occlusion_audit(face, x, reference_embedding)
        samples.append({'id': folder.name, 'name': old['name'], 'input': 'input.png', 'reference': 'reference.png', 'landmarks': landmarks, 'classification': cls, 'recognition': recognition, 'onnxMaxAbsoluteError': float(np.abs(embedding.numpy() - expected).max()), 'opencvMaxAbsoluteError': float(np.abs(embedding.numpy() - cv_embedding).max())})
        print(old['name'], cls['className'], 'face score', recognition['score'], flush=True)
    record = {
        'samples': samples, 'sources': old_record['sources'], 'method': 'Grad-CAM for both complete frozen pretrained networks; no training or fine-tuning',
        'models': {
            'classification': {'name': 'MobileNetV3-Small', 'weights': 'IMAGENET1K_V1', 'source': weights.url, 'sha256': checksum(classification_file), 'task': 'ImageNet-1K image classification', 'target': 'top predicted class pre-softmax logit', 'preprocessing': 'same aligned RGB face resized to 224; official ImageNet normalization; no additional center crop'},
            'recognition': {'name': 'MobileFaceNet / SFace', 'source': SFACE_URL, 'sha256': checksum(MODELS / 'sface.onnx'), 'task': 'face recognition with SFace pretrained weights', 'target': 'cosine similarity with a detached embedding of the other real photo of this identity', 'camLayer': 'conv_13_relu, preceding the final 1024-channel expansion; same layer for both samples', 'preprocessing': 'YuNet five-landmark alignment; RGB 112x112 pixels; normalization is inside the official ONNX graph'},
        },
        'networkModules': {'classification': str(classification), 'recognition': str(face)},
        'limitations': 'Different pretrained architectures, training data and target scores: illustrates different task evidence, not a controlled comparison of training losses. No claim that ImageNet recognizes celebrity identity. Maps independently normalized.',
        'references': ['https://arxiv.org/abs/1610.02391', 'https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.mobilenet_v3_small.html', 'https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface'],
    }
    (OUT / 'pretrained-record.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Verified pretrained Grad-CAM export complete', flush=True)


if __name__ == '__main__':
    main()
