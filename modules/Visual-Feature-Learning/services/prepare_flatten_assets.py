"""Native-size MNIST responses of the first two pretrained MobileNetV3 blocks."""
import hashlib
import json
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

repo = Path(__file__).resolve().parents[3]
root = repo / 'assets' / '80396753-7fc8-4f55-9188-bddbdb828169'
out = root / 'flatten-interface'
out.mkdir(exist_ok=True)
torch.set_num_threads(4)
weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
model = mobilenet_v3_small(weights=weights).eval()
source = root / 'mnist/7/60000.png'
if not source.exists():
    source = sorted((root / 'mnist/7').glob('*.png'))[0]
image = Image.open(source).convert('RGB')
records = []
with torch.inference_mode():
    for size in [20, 24, 28, 32, 36, 40]:
        resized = image.resize((size, size), Image.Resampling.BILINEAR)
        resized.save(out / f'input-{size}.png')
        x = torch.from_numpy(np.array(resized).transpose(2,0,1).copy()).float()/255
        x = (x-torch.tensor([.485,.456,.406])[:,None,None])/torch.tensor([.229,.224,.225])[:,None,None]
        h = model.features[1](model.features[0](x.unsqueeze(0)))[0].numpy()
        records.append({'inputSize':size, 'mapSize':int(h.shape[1]), 'input':f'input-{size}.png', 'values':h.reshape(16,-1).tolist()})
all_values = np.concatenate([np.array(r['values']).reshape(-1) for r in records])
data = {'model':'mobilenet_v3_small', 'weights':'IMAGENET1K_V1', 'weightsUrl':weights.url,
        'source':source.relative_to(root).as_posix(), 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'layers':['features.0','features.1'], 'channels':16, 'displayChannels':[0,1],
        'preprocessing':{'resize':'bilinear to selected native size; no center crop', 'mean':[.485,.456,.406], 'std':[.229,.224,.225]},
        'displayRange':[float(all_values.min()),float(all_values.max())], 'samples':records}
(out/'responses.json').write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')
print('Exported native-size real 16-channel responses:',[(r['inputSize'],r['mapSize']) for r in records])
