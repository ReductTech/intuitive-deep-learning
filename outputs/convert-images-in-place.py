"""Explicitly requested source maintenance: no staging directories or disk backups.

Encode and validate in memory, then write beside the original image. Keep the
source until the reference migration and checks approve removing it.
"""
from concurrent.futures import ThreadPoolExecutor, Future, as_completed
from pathlib import Path
from io import BytesIO
from hashlib import sha256
from threading import Lock
import json
import sys

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT.parent / 'creator-skill'
sys.path.insert(0, str(SKILL / 'scripts'))
from common.image_policy import inspect_image
from media.thumbnail_profiles import thumbnail_image

REPORT = ROOT / 'outputs' / 'images-in-place.json'
EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.avif'}
THUMBNAILS = {'shuku-thumbnails', 'scenedeck-thumbnails', 'course-thumbnails', 'course-covers'}
cache, lock = {}, Lock()


def encode(raw, atlas, thumbnail):
    with Image.open(BytesIO(raw)) as image:
        width, height = ImageOps.exif_transpose(image).size
        count = getattr(image, 'n_frames', 1)
        if width * height > 40_000_000 or count > 1000:
            raise ValueError('Image exceeds supported pixel/frame limits')
        factor = 1 if atlas else min(1, 1600 / width, 900 / height)
        size = (max(1, round(width * factor)), max(1, round(height * factor)))
        if image.format == 'WEBP' and factor == 1 and (not thumbnail or (width, height) == (1600, 900)):
            return None
        if image.mode not in {'RGB', 'RGBA', 'P', 'L', 'LA', 'CMYK'}:
            raise ValueError('Unsupported bit depth or colour mode')
        frames, durations = [], []
        for index in range(count):
            image.seek(index)
            frame = ImageOps.exif_transpose(image).convert('RGBA')
            frame = thumbnail_image(frame) if thumbnail else frame.resize(size, Image.Resampling.LANCZOS)
            if (index + 1) * frame.width * frame.height > 80_000_000:
                raise ValueError('Animation exceeds decoded pixel limit')
            frames.append(frame)
            durations.append(image.info.get('duration', 100))
        options = {'quality': 20 if thumbnail else 80, 'method': 6}
        if count > 1:
            options.update(save_all=True, append_images=frames[1:], duration=durations, loop=image.info.get('loop', 0))
        result = BytesIO()
        frames[0].save(result, format='WEBP', **options)
        data = result.getvalue()
        inspect_image('assets/image.webp', data)
        with Image.open(BytesIO(data)) as checked:
            if checked.size != frames[0].size or checked.n_frames != count:
                raise ValueError('Converted image dimensions or frame count differ')
            if count > 1:
                actual_durations = []
                for index in range(count):
                    checked.seek(index)
                    checked.load()
                    actual_durations.append(checked.info.get('duration', 100))
                if actual_durations != durations or checked.info.get('loop', 0) != image.info.get('loop', 0):
                    raise ValueError('Converted animation timing differs')
        return data


def convert(path):
    raw = path.read_bytes()
    atlas = 'image-atlases' in path.parts
    thumbnail = bool(THUMBNAILS.intersection(path.parts))
    key = (sha256(raw).hexdigest(), atlas, thumbnail)
    with lock:
        future = cache.get(key)
        owner = future is None
        if owner:
            future = cache[key] = Future()
    if owner:
        try:
            future.set_result(encode(raw, atlas, thumbnail))
        except Exception as error:
            future.set_exception(error)
    data = future.result()
    rel = path.relative_to(ROOT).as_posix()
    if data is None:
        return {'source': rel, 'status': 'preserved'}
    target = path.with_suffix('.webp')
    if target != path and target.exists() and target.read_bytes() != data:
        target = path.with_name(path.name + '.webp')
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Existing WebP has different content: ' + str(target))
    if path.read_bytes() != raw:
        raise ValueError('Source changed while encoding: ' + str(path))
    # The conversion is fully validated before touching either original path.
    if target == path:
        target.write_bytes(data)
    elif not target.exists():
        with target.open('xb') as output:
            output.write(data)
    return {'source': rel, 'target': target.relative_to(ROOT).as_posix(), 'status': 'converted',
            'beforeBytes': len(raw), 'afterBytes': len(data), 'sourceSha256': key[0],
            'targetSha256': sha256(data).hexdigest()}


def main():
    modules = [p for p in (ROOT / 'modules').iterdir() if (p / 'outlines.json').is_file()]
    files = sorted(p for module in modules if (module / 'assets').is_dir()
                   for p in (module / 'assets').rglob('*')
                   if p.is_file() and not p.is_symlink() and p.suffix.lower() in EXTENSIONS)
    rows, errors = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {pool.submit(convert, path): path for path in files}
        for index, job in enumerate(as_completed(jobs), 1):
            path = jobs[job]
            try:
                rows.append(job.result())
            except Exception as error:
                errors.append({'source': path.relative_to(ROOT).as_posix(), 'error': str(error)})
                print(json.dumps(errors[-1], ensure_ascii=False), flush=True)
            if index % 100 == 0:
                REPORT.write_text(json.dumps({'complete': False, 'images': rows, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
                print(f'Images processed in original modules: {index}/{len(files)}', flush=True)
    result = {'complete': True, 'images': sorted(rows, key=lambda row: row['source']), 'errors': errors}
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'processed': len(rows), 'errors': len(errors), 'report': str(REPORT)}, ensure_ascii=False), flush=True)
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(main())
