"""Rebuild the recorded, measured default-network trajectory without an HTTP server.

Run in the existing teaching-service Python environment. This executes ten bounded
training epochs and saves the same projection contract used by live training.
"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root / 'scripts'))
from gpu_service import train_digit_network

architecture = []
for i, channels in enumerate([8, 16, 32, 64]):
    architecture.append({'kind': 'conv', 'out_channels': channels})
    if i < 3:
        architecture.append({'kind': 'pool', 'pool_type': 'max'})

if __name__ == '__main__':
    import torch
    torch.set_num_threads(4)
    result = train_digit_network({'epochs': 10, 'architecture': architecture, 'feature_projection': True},
                                progress_callback=lambda percent, phase, message: print(percent, phase, message, flush=True))
    projection = result['projection']
    projection['recording'] = {key: result[key] for key in ['epochs', 'architecture', 'train_count', 'val_count', 'session_id']}
    projection['recording']['seed'] = 20261001
    out = root / 'assets' / '80396753-7fc8-4f55-9188-bddbdb828169' / 'digit-tsne'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'training-record.json').write_text(json.dumps(projection, separators=(',', ':')), encoding='utf-8')
    print('Saved measured training record:', result['session_id'])
