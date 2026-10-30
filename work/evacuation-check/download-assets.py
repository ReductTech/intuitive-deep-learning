import requests,re,zipfile,io
from pathlib import Path
base=Path('work/evacuation-check/assets');base.mkdir(parents=True,exist_ok=True)
for name,url in [('industrial','https://kenney.nl/media/pages/assets/city-kit-industrial/0ec35b139d-1788171848/kenney_city-kit-industrial_2.0.zip'),('nature','https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip')]:
 r=requests.get(url,timeout=90);r.raise_for_status();z=zipfile.ZipFile(io.BytesIO(r.content));z.extractall(base/name);print(name,len(r.content),len(z.namelist()));print('\n'.join(n for n in z.namelist() if n.endswith('.glb'))[:2500])
s=requests.get('https://quaternius.com/packs/stylizednaturemegakit.html',timeout=30).text
for m in re.finditer(r'(drive.google|itch.io|https:[^\s]+\.zip|download|Download)',s):
 print(s[max(0,m.start()-90):m.start()+230])
