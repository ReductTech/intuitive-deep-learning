from pathlib import Path
from PIL import Image
import json, statistics, hashlib
root=Path(__file__).resolve().parents[4]
asset=root/'assets/80396753-7fc8-4f55-9188-bddbdb828169/mnist'
rows=[]
for digit in range(10):
    samples=[]
    for path in sorted((asset/str(digit)).glob('*.png')):
        im=Image.open(path).convert('RGB')
        if im.size != (28,28): raise ValueError(str(path))
        pixels=[(x,y) for y in range(28) for x in range(28) if sum(im.getpixel((x,y)))/3>=128]
        if not pixels: raise ValueError('Empty ink: '+str(path))
        xs,ys=zip(*pixels)
        samples.append({'file':'mnist/'+str(digit)+'/'+path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'width':max(xs)-min(xs)+1,'height':max(ys)-min(ys)+1,'ink':len(pixels),'centerX':sum(xs)/len(xs),'centerY':sum(ys)/len(ys)})
    features={key:{'min':min(s[key] for s in samples),'median':statistics.median(s[key] for s in samples),'max':max(s[key] for s in samples)} for key in ['width','height','ink','centerX','centerY']}
    rows.append({'digit':digit,'count':len(samples),'features':features,'samples':samples})
data={'threshold':128,'size':28,'total':sum(r['count'] for r in rows),'description':'All PNG files in module mnist/0–9; zero-based original image coordinates; inclusive ink bounding box.','classes':rows}
p=root/'modules/Visual-Feature-Learning/pages/FeatureStatisticsPage/statistics.json'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Total',data['total'])
for key in ['width','height','ink','centerX','centerY']:
 print(key,round(min(r['features'][key]['min'] for r in rows),2),round(max(r['features'][key]['max'] for r in rows),2))
