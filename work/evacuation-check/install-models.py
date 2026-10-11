from pathlib import Path
import json,shutil,struct
dst=Path('assets/56a1d5b2-a439-4ee3-8f63-fd63ac09c741/evacuation/models');dst.mkdir(parents=True,exist_ok=True)
q=Path('work/evacuation-check/assets/quaternius/glTF')
names=['Pine_1','Pine_2','Pine_3','CommonTree_1','CommonTree_3','DeadTree_1','DeadTree_3','Rock_Medium_1','Rock_Medium_2','Rock_Medium_3','Bush_Common','Fern_1','Grass_Common_Short','Flower_3_Group']
for n in names:
 g=json.loads((q/(n+'.gltf')).read_text());shutil.copy2(q/(n+'.gltf'),dst)
 for a in g.get('buffers',[])+g.get('images',[]):
  if 'uri' in a: shutil.copy2(q/a['uri'],dst/a['uri'])
k=Path('work/evacuation-check/assets/industrial/Models/GLB format')
for n in ['building-a','building-c','building-f','building-g','building-j','building-m','building-n','building-p','building-t','chimney-large','chimney-medium','detail-tank-large','shipping-container-a','shipping-container-b','water-tower']:
 f=k/(n+'.glb');shutil.copy2(f,dst)
 b=f.read_bytes();count=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+count])
 for a in g.get('images',[]):
  if 'uri' in a:
   out=dst/a['uri'];out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(k/a['uri'],out)
shutil.copy2('work/evacuation-check/assets/quaternius/License_Standard.txt',dst/'Quaternius-LICENSE.txt')
shutil.copy2('work/evacuation-check/assets/industrial/License.txt',dst/'Kenney-LICENSE.txt')
(dst/'sources.json').write_text(json.dumps({'nature':{'author':'Quaternius','source':'https://quaternius.com/packs/stylizednaturemegakit.html','license':'CC0 1.0','files':names},'industrial':{'author':'Kenney','source':'https://kenney.nl/assets/city-kit-industrial','license':'CC0 1.0'},'terrain':'Procedural 3D mesh. No map image.'},indent=2))
print('installed',len(list(dst.rglob('*'))),'files',sum(p.stat().st_size for p in dst.rglob('*') if p.is_file())//1024,'KiB')
