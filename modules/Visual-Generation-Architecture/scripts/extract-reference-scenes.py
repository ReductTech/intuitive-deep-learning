"""Reproduce added crops without altering any supplied reference page."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[3]
assets = Path(__file__).resolve().parents[1] / 'assets'
manifest = assets / 'visuals/reference-scenes.json'
specs = json.loads(manifest.read_text(encoding='utf-8'))
for name, (source, rect) in specs.items():
    Image.open(assets / f'references/{source}.png').crop(tuple(rect)).save(assets / f'visuals/{name}.png')
print(f'Extracted {len(specs)} reference crops.')

# Only illustration bodies are used in standard modules; Shared renders the header.
body_tops = json.loads((assets / 'visuals/reference-body-manifest.json').read_text(encoding='utf-8'))
for source, top in body_tops.items():
    image = Image.open(assets / f'references/{source}.png').convert('RGB')
    if source == '24':
        ImageDraw.Draw(image).rectangle((1280, top, 1630, 301), fill='white')
    image.crop((0, top, 1672, 941)).save(assets / f'visuals/reference-body-{source}.png')
print(f'Extracted {len(body_tops)} content-only plates for Shared ContentBlock.')
