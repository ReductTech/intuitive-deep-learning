"""Export genuine score gradients for a small, explicitly limited celebrity demo.

Four attributed photographs, deterministic augmentation, ten epochs per objective.
This is an asset-generation job, not a face-verification benchmark.
"""
import copy
import json
from pathlib import Path

from .export_face_gradcam_lesson import FaceCNN, ROOT, OUT, MODELS, SEED
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from PIL import Image, ImageEnhance

SOURCES = OUT / 'celebrity-sources'
PEOPLE = [
    ('jackie', '成龙', [(75, 200, 675, 800), (255, 335, 1080, 1160)]),
    ('avril', '艾薇儿', [(115, 95, 470, 450), (200, 175, 705, 680)]),
]
ATTRIBUTIONS = [
    {'file': 'jackie-1.jpg', 'author': 'Toms Norde / State Chancellery of Latvia', 'license': 'CC BY-SA 2.0', 'url': 'https://commons.wikimedia.org/wiki/File:Jackie_Chan_in_2012.jpg'},
    {'file': 'jackie-2.jpg', 'author': 'Firdaus Latif', 'license': 'CC BY-SA 2.0', 'url': 'https://commons.wikimedia.org/wiki/File:Jackie_Chan_in_Kuala_Lumpur_2012.jpg'},
    {'file': 'avril-1.jpg', 'author': 'Glenn Francis / Pacific Pro Digital', 'license': 'CC BY-SA 4.0', 'url': 'https://commons.wikimedia.org/wiki/File:Avril_Lavigne_2013_(cropped).jpg'},
    {'file': 'avril-2.jpg', 'author': 'Freaktheclown; derivative Keraunoscopia', 'license': 'CC BY-SA 3.0', 'url': 'https://commons.wikimedia.org/wiki/File:Avril_Lavigne,_Today_Show,_2013.jpg'},
]


def tensor(image):
    return torch.from_numpy(np.asarray(image.resize((64, 64), Image.Resampling.LANCZOS)).copy()).permute(2, 0, 1).float() / 255


def export_cam(model, image, reference, identity, folder, mode):
    model.eval()
    logits, embedding, activation = model(image)
    if mode == 'classification':
        score = logits[0, identity]
    else:
        with torch.no_grad():
            reference_embedding = model(reference)[1]
        score = (embedding * reference_embedding).sum()
    gradient = torch.autograd.grad(score, activation)[0]
    alpha = gradient[0].mean((1, 2))
    raw = F.relu((alpha[:, None, None] * activation[0]).sum(0))
    peak = float(raw.detach().max())
    normalized = raw.detach() / max(peak, 1e-12)
    cam = F.interpolate(normalized[None, None], (480, 480), mode='bilinear', align_corners=False)[0, 0].numpy()
    # Transparent cold areas leave the actual photograph legible. The opacity
    # follows the normalized Grad-CAM value; no hand-painted regions are used.
    colors = np.stack([np.ones_like(cam), np.clip(1.8 - 1.8 * cam, 0, 1), np.zeros_like(cam), cam * .85], axis=-1)
    Image.fromarray(np.uint8(colors * 255), 'RGBA').save(folder / f'{mode}-heat.png')
    np.savez_compressed(folder / f'{mode}-raw.npz', activations=activation[0].detach().numpy(), gradients=gradient[0].detach().numpy(), alpha=alpha.detach().numpy(), cam=normalized.numpy())
    channels = []
    for k in torch.topk(alpha.abs(), 3).indices.tolist():
        response = activation[0, k].detach().numpy()
        v = response / (response.max() + 1e-12)
        rgb = np.stack([v*.2, v*.65, v], -1)
        filename = f'{mode}-channel-{k}.png'
        Image.fromarray(np.uint8(rgb*255)).resize((128, 128), Image.Resampling.NEAREST).save(folder/filename)
        channels.append({'index': k+1, 'alpha': float(alpha[k].detach()), 'image': filename})
    return {'score': float(score.detach()), 'heat': f'{mode}-heat.png', 'hasPositiveSupport': peak > 1e-10, 'channels': channels}


def main():
    torch.manual_seed(SEED)
    rng = np.random.default_rng(SEED)
    crops, labels = [], []
    for identity, (person, _, boxes) in enumerate(PEOPLE):
        for index, box in enumerate(boxes, 1):
            crops.append(Image.open(SOURCES / f'{person}-{index}.jpg').convert('RGB').crop(box).resize((480, 480), Image.Resampling.LANCZOS))
            labels.append(identity)
    (SOURCES / 'sources.json').write_text(json.dumps(ATTRIBUTIONS, ensure_ascii=False, indent=2), encoding='utf-8')
    augmented, targets = [], []
    for image, label in zip(crops, labels):
        for _ in range(64):
            margin = int(rng.integers(0, 22))
            variant = image.crop((margin, margin, 480-margin, 480-margin)).rotate(float(rng.uniform(-5, 5)), resample=Image.Resampling.BILINEAR)
            variant = ImageEnhance.Brightness(variant).enhance(float(rng.uniform(.85, 1.15)))
            augmented.append(tensor(variant)); targets.append(label)
    batch = torch.stack(augmented)
    targets = torch.tensor(targets)
    mean = batch.mean((0, 2, 3), keepdim=True)
    std = batch.std((0, 2, 3), keepdim=True).clamp_min(1e-5)
    batch = (batch-mean)/std
    classification = FaceCNN()
    checkpoint = torch.load(MODELS / 'classification.pt', map_location='cpu', weights_only=False)
    classification.load_state_dict(checkpoint['state_dict'])
    classification.classifier = nn.Linear(32, 2)
    optimizer = torch.optim.Adam(classification.parameters(), lr=.0005)
    for epoch in range(10):
        for indices in torch.randperm(len(batch)).split(32):
            optimizer.zero_grad()
            loss = F.cross_entropy(classification(batch[indices])[0], targets[indices])
            loss.backward(); optimizer.step()
        print('classification epoch', epoch+1, flush=True)
    triplet = copy.deepcopy(classification)
    optimizer = torch.optim.Adam(triplet.parameters(), lr=.00015)
    for epoch in range(10):
        for indices in torch.randperm(len(batch)).split(32):
            optimizer.zero_grad()
            z = triplet(batch[indices])[1]
            distance = torch.cdist(z, z)
            same = targets[indices, None] == targets[indices][None, :]
            positive_mask = same.clone(); positive_mask.fill_diagonal_(False)
            positives = distance.masked_fill(~positive_mask, -1).max(1).values
            negatives = distance.masked_fill(same, 10).min(1).values
            loss = F.relu(positives-negatives+.3).mean()
            loss.backward(); optimizer.step()
        print('triplet epoch', epoch+1, flush=True)
    samples = []
    for identity, (person, name, _) in enumerate(PEOPLE):
        folder = OUT / f'celebrity-{person}'; folder.mkdir(exist_ok=True)
        photo, reference = crops[identity*2:identity*2+2]
        photo.save(folder/'input.png'); reference.save(folder/'reference.png')
        x = (tensor(photo)[None]-mean)/std
        r = (tensor(reference)[None]-mean)/std
        samples.append({'id': folder.name, 'name': name, 'input': 'input.png', 'reference': 'reference.png', 'classification': export_cam(classification, x, r, identity, folder, 'classification'), 'triplet': export_cam(triplet, x, r, identity, folder, 'triplet')})
    for mode, model in [('classification', classification), ('triplet', triplet)]:
        torch.save({'state_dict': model.state_dict(), 'mean': mean, 'std': std, 'seed': SEED}, MODELS/f'celebrity-{mode}.pt')
    record = {'samples': samples, 'sources': ATTRIBUTIONS, 'seed': SEED, 'classificationEpochs': 10, 'tripletEpochs': 10, 'originalPhotographs': 4, 'augmentedTrainingImages': len(batch), 'initialization': 'LFW teaching classifier backbone; new two-identity classification head; then triplet-only fine-tuning', 'targetLayer': 'last convolution; 48 channels; 16 x 16', 'classificationTarget': 'specified identity pre-softmax logit', 'tripletTarget': 'cosine similarity to the other photograph of the same identity; reference branch detached', 'limitations': 'Both displayed photographs participate in this four-photo teaching fit. No held-out validation or generalization claim. Maps independently normalized. The original LFW heatmaps are not reused.', 'references': ['https://arxiv.org/abs/1610.02391']}
    (OUT/'celebrity-record.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print('celebrity assets exported', flush=True)


if __name__ == '__main__':
    main()
