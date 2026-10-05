"""Pack generated teaching images losslessly; retain original logical paths in the index."""
from pathlib import Path
from PIL import Image
import json, math, argparse
ROOT = Path(__file__).resolve().parents[3] / 'assets/80396753-7fc8-4f55-9188-bddbdb828169'
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--remove-originals',action='store_true');args=parser.parse_args()
    out=ROOT/'image-atlases';out.mkdir(exist_ok=True)
    index_path=out/'index.json'
    entries=json.loads(index_path.read_text()) if index_path.exists() else {}
    groups={}
    for area in ['feature-hierarchy','flatten-interface','gradcam']:
        for path in sorted((ROOT/area).rglob('*.png')):
            with Image.open(path) as im:
                if max(im.size)>256:continue
            parts=path.relative_to(ROOT).parts
            group='-'.join(parts[:4] if area=='feature-hierarchy' else parts[:2] if area=='gradcam' else parts[:1])
            groups.setdefault(group,[]).append(path)
    for group,paths in groups.items():
        images=[Image.open(path).convert('RGBA') for path in paths]
        positions=[];width=max(max(im.width for im in images)+2,math.ceil(math.sqrt(sum((im.width+2)*(im.height+2) for im in images))))
        x=y=row_height=0
        for i in sorted(range(len(images)),key=lambda i:-images[i].height):
            im=images[i]
            if x+im.width+2>width:x=0;y+=row_height;row_height=0
            positions.append((i,x+1,y+1));x+=im.width+2;row_height=max(row_height,im.height+2)
        sheet=Image.new('RGBA',(width,y+row_height))
        filename=f'{group}.webp'
        for i,x,y in positions:
            path=paths[i];im=images[i];sheet.paste(im,(x,y))
            entries[path.relative_to(ROOT).as_posix()]={'sheet':f'image-atlases/{filename}','x':x,'y':y,'width':im.width,'height':im.height,'sheetWidth':sheet.width,'sheetHeight':sheet.height}
        if sheet.getextrema()[3]==(255,255):sheet=sheet.convert('RGB')
        sheet.save(out/filename,lossless=True,exact=True,method=6)
        # Check every pixel before removing a source file.
        with Image.open(out/filename) as packed:
            for path,im in zip(paths,images):
                e=entries[path.relative_to(ROOT).as_posix()]
                assert packed.crop((e['x'],e['y'],e['x']+im.width,e['y']+im.height)).convert('RGBA').tobytes()==im.tobytes(),path
        print(group,len(paths),sum(p.stat().st_size for p in paths),(out/filename).stat().st_size)
        if args.remove_originals:
            for path in paths:path.unlink()
    index_path.write_text(json.dumps(entries,separators=(',',':'))+'\n',encoding='utf-8')
if __name__=='__main__':main()
