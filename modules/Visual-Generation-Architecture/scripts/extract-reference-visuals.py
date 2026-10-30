"""Extract course illustrations from the supplied reference slides (no remote assets)."""
from pathlib import Path
from collections import deque
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
ASSETS = Path(__file__).resolve().parents[1] / 'assets'
DEST = ASSETS / 'visuals'
# Coordinates refer to the unmodified 1672 x 941 reference slides.
SPECS = {
    'arrow-blue': ('03', (257,307,338,347), True),
    'feature-fine': ('03', (343,197,531,414), True),
    'feature-coarse': ('03', (493,399,628,545), True),
    'feature-mid': ('03', (785,678,889,783), True),
    'feature-up-coarse': ('03', (1041,401,1174,543), True),
    'feature-up-fine': ('03', (1142,195,1333,415), True),
    'latent-encoded': ('13', (711,364,962,586), True),
    'latent-noisy': ('18', (37,494,247,692), True),
    'latent-denoised': ('18', (992,493,1182,691), True),
    'latent-color': ('12', (1115,310,1645,603), True),
    'latent-channel': ('12', (846,434,947,532), False),
    'cat': ('13', (60,324,363,609), False),
    'noise': ('01', (49,187,366,480), False),
    'noise-prediction': ('03', (1432,232,1636,435), False),
    'noisy-cat': ('03', (39,232,248,435), False),
    'unet-mini': ('18', (363,535,605,637), True),
    'network-neurons': ('02', (669,425,1008,568), False),
    'patch-channels': ('22', (425,482,584,623), True),
    'patch-flattened': ('22', (831,535,1108,572), True),
    'token-blue': ('24', (75,504,106,627), False),
    'token-modulated': ('24', (1442,507,1473,637), False),
    'transformer-block': ('24', (397,477,656,631), True),
    'attention-feature': ('08', (291,258,519,488), False),
    'attention-enhanced': ('08', (1353,263,1614,501), False),
}
POLYGONS = {
    'feature-fine': [(344,248),(529,197),(531,366),(344,414)],
    'feature-coarse': [(494,436),(626,400),(628,513),(494,546)],
    'feature-mid': [(786,705),(889,678),(889,756),(786,782)],
    'feature-up-coarse': [(1042,436),(1174,401),(1174,508),(1042,545)],
    'feature-up-fine': [(1144,246),(1332,197),(1333,367),(1144,404)],
    'latent-denoised': [(992,539),(1093,493),(1182,530),(1182,652),(1078,691),(992,654)],
    'patch-channels': [(425,482),(584,482),(584,602),(548,623),(425,623)],
}

def remove_exterior_white(im):
    """Only remove white connected to the boundary; keep white inside feature maps."""
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in (0,h-1)] + [(x,y) for y in range(h) for x in (0,w-1)])
    visited = set()
    while queue:
        x,y = queue.popleft()
        if (x,y) in visited or not (0 <= x < w and 0 <= y < h):
            continue
        visited.add((x,y))
        r,g,b,a = px[x,y]
        if min(r,g,b) < 235 or max(r,g,b)-min(r,g,b) > 20:
            continue
        px[x,y] = (r,g,b,0)
        queue.extend(((x-1,y),(x+1,y),(x,y-1),(x,y+1)))
    return im

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {}
    sheet = Image.new('RGB', (1000, ((len(SPECS)+3)//4)*200), '#edf3f8')
    draw = ImageDraw.Draw(sheet)
    for i,(name,(source,box,transparent)) in enumerate(SPECS.items()):
        im = Image.open(ASSETS / f'references/{source}.png').crop(box).convert('RGBA')
        if name in POLYGONS:
            mask = Image.new('L', im.size)
            ImageDraw.Draw(mask).polygon([(x-box[0],y-box[1]) for x,y in POLYGONS[name]], fill=255)
            im.putalpha(mask)
        if name == 'latent-color':
            mask = Image.new('L', im.size)
            for points in [
                [(1119,337),(1313,379),(1313,599),(1119,554)],
                [(1250,326),(1430,368),(1430,588),(1250,545)],
                [(1377,317),(1545,357),(1545,578),(1377,536)],
                [(1502,309),(1643,346),(1643,558),(1502,519)],
            ]:
                ImageDraw.Draw(mask).polygon([(x-box[0],y-box[1]) for x,y in points], fill=255)
            im.putalpha(mask)
        if transparent:
            im = remove_exterior_white(im)
        im.save(DEST / f'{name}.png')
        manifest[name] = {'source':f'references/{source}.png', 'crop':box, 'size':im.size, 'exteriorWhiteRemoved':transparent, 'outlineMask':POLYGONS.get(name, 'channel silhouettes' if name == 'latent-color' else None)}
        im.thumbnail((225,160))
        x,y = (i%4)*250, (i//4)*200
        sheet.paste(im, (x+(250-im.width)//2,y+20), im)
        draw.text((x+10,y+182), name, fill='#17345b')
    (DEST / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    sheet.save(DEST / 'contact-sheet.jpg')
    print(f'Extracted {len(SPECS)} local reference assets to {DEST}')

if __name__ == '__main__':
    main()
