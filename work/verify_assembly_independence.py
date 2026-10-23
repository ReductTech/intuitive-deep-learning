from pathlib import Path
import hashlib,json,re
root=Path('.')
p=root/'modules/Creator-Guide/CreatorPpt.tsx';s=p.read_text(encoding='utf-8');s=s.replace("sceneId === 'ui-kit' ? '.cg-kit-page'", "sceneId === 'ui-kit' ? '.cg-kit-assembly-page'");p.write_text(s,encoding='utf-8')
folder=root/'modules/Creator-Guide/components/assembly'
for p in folder.iterdir():
 if p.suffix in ('.tsx','.ts','.css'):
  s=p.read_text(encoding='utf-8-sig');assert '38cd1c79-d8b7-462a-b208-a567c5cd89c4' not in s
  assert not re.search(r'from\s+[\'\"][^\'\"]*Convolution-Kernel-Intro',s)
  p.write_text(s.rstrip()+'\n',encoding='utf-8')
source=root/'assets/38cd1c79-d8b7-462a-b208-a567c5cd89c4/bg_video.mp4'
copy=root/'assets/444f8951-dd2e-42dc-94e5-c5a878618631/assembly/gomoku-bg.mp4'
assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(copy.read_bytes()).digest()
o=json.loads((root/'modules/Creator-Guide/outlines.json').read_text(encoding='utf-8'));print(json.dumps({'pages':len(o['pages']),'ui-kit-scenes':sum(p['id']=='ui-kit' for p in o['pages']),'independent-assets':'verified'},ensure_ascii=False))
