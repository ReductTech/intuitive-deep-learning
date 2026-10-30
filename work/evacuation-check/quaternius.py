import requests,re,zipfile,io
from pathlib import Path
s=requests.Session()
base='https://quaternius.itch.io/stylized-nature-megakit'
h=s.get(base+'/purchase').text
token=re.search(r'name="csrf_token" value="([^"]+)',h)[1]
scripts=re.findall(r'<script[^>]+src="([^"]+)',h)
for u in scripts:
 if 'purchase' in u or 'game' in u:
  t=s.get('https:'+u if u.startswith('//') else u).text
  for m in re.finditer('direct_download|download_url',t): print(t[max(0,m.start()-200):m.start()+500])
print(h[-1800:])
r=s.post(base+'/download_url',data={'csrf_token':token});print('download_url',r.status_code,r.text[:1500])
if r.ok:
 url=r.json().get('url')
 if url:
  h=s.get(url).text;Path('work/evacuation-check/itch-download.html').write_text(h,encoding='utf8')
  token=re.search(r'name="csrf_token" value="([^"]+)',h)[1]
  upload=re.search(r'data-upload_id="(\d+)',h)[1]
  r=s.post(base+'/file/'+upload,data={'csrf_token':token});print(r.status_code,r.text[:1200])
  if r.ok and 'url' in r.json():
   f=s.get(r.json()['url'],timeout=120);f.raise_for_status()
   z=zipfile.ZipFile(io.BytesIO(f.content));z.extractall('work/evacuation-check/assets/quaternius');print('downloaded',len(f.content));print('\n'.join(z.namelist())[:6500])
