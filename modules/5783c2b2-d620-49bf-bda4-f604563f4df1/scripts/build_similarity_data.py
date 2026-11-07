"""Reproduce page 9 retrieval descriptors; no labels or map coordinates are inputs."""
import argparse
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image
import torch
import torchvision
from torchvision.models import ResNet18_Weights, resnet18

parser = argparse.ArgumentParser()
parser.add_argument('--checkpoint', type=Path, required=True)
args = parser.parse_args()
module = Path(__file__).resolve().parents[1]
samples = {
    'bottle-front': 'recycling/camera-views/bottle-front.png',
    'bottle-angle': 'recycling/camera-views/bottle-angle-45.png',
    'bottle-side': 'recycling/camera-views/bottle-side-90.png',
    'bottle-crushed': 'recycling/bottle-crushed-severe.png',
    'can-upright': 'recycling/can-upright.png',
    'can-crushed': 'recycling/can-crushed.png',
    'carton': 'recycling/carton-upright.png',
    'carton-drink': 'recycling/embedding/carton-drink.png',
    'carton-crushed': 'recycling/embedding/carton-crushed.png',
}
torch.set_num_threads(2)
weights = ResNet18_Weights.IMAGENET1K_V1
args.checkpoint.parent.mkdir(parents=True, exist_ok=True)
if not args.checkpoint.exists():
    torch.hub.download_url_to_file(weights.url, str(args.checkpoint), hash_prefix='f37072fd', progress=False)
checkpoint_hash = hashlib.sha256(args.checkpoint.read_bytes()).hexdigest()
assert checkpoint_hash.startswith('f37072fd'), 'Unexpected checkpoint hash'
model = resnet18(weights=None)
model.load_state_dict(torch.load(args.checkpoint, map_location='cpu', weights_only=True))
model.fc = torch.nn.Identity()
model.eval()
transform = weights.transforms()
batch = []
hashes = {}
for sample_id, relative in samples.items():
    path = module / 'assets' / relative
    hashes[sample_id] = hashlib.sha256(path.read_bytes()).hexdigest()
    with Image.open(path) as source:
        rgba = source.convert('RGBA')
        background = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
        background.alpha_composite(rgba)
        batch.append(transform(background.convert('RGB')))
with torch.inference_mode():
    raw = model(torch.stack(batch))
    vectors = torch.nn.functional.normalize(raw, dim=1)
assert vectors.shape == (9, 512)
assert torch.isfinite(vectors).all()
payload = {
    'model': 'torchvision ResNet-18', 'weights': 'IMAGENET1K_V1',
    'checkpointUrl': weights.url, 'checkpointSha256': checkpoint_hash,
    'featureNode': 'global average pooling + flatten; fc replaced by Identity',
    'dimensions': 512, 'metric': 'cosine similarity of L2-normalized features',
    'preprocessing': 'RGBA composited on white, RGB; resize shortest edge 256 bilinear; center crop 224; ImageNet normalization',
    'torch': torch.__version__, 'torchvision': torchvision.__version__, 'pillow': PIL.__version__,
    'imagesSha256': hashes,
    'vectors': {sample_id: [round(float(value), 8) for value in vector] for sample_id, vector in zip(samples, vectors)},
}
destination = module / 'pages' / 'EmbeddingOutputPage' / 'similarityData.json'
destination.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
similarity = vectors @ vectors.T
for index, sample_id in enumerate(samples):
    ranking = [(other, round(float(similarity[index, j]), 4)) for j, other in enumerate(samples) if j != index]
    print(sample_id, sorted(ranking, key=lambda item: -item[1])[:3])
print('Saved', destination, 'checkpoint SHA256', checkpoint_hash)
