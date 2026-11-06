"""Optimize course media. Geometry/JPEG policy follows Creator Skill compress-images.py.

Opaque PNGs always become JPEG (even tiny JPEGs that are larger); real alpha stays PNG.
Requires Pillow; --videos also requires ffmpeg or imageio-ffmpeg. Default is audit only.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import struct
import tempfile
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
TEXT = {'.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '.html', '.json', '.gltf'}


def opaque(image):
    return image.convert('RGBA').getchannel('A').getextrema() == (255, 255)


def fit_size(width, height, max_width=1600, max_height=900):
    scale = min(1.0, max_width / width, max_height / height)
    return max(1, round(width * scale)), max(1, round(height * scale))


def atomic(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as stream:
        temp = Path(stream.name)
        stream.write(data)
    try:
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def prepare_image(source, target, quality=92):
    with Image.open(source) as original:
        if getattr(original, 'n_frames', 1) > 1:
            return None
        image = ImageOps.exif_transpose(original)
        to_jpeg = original.format == 'PNG' and opaque(image)
        size = fit_size(*image.size)
        if not to_jpeg and size == image.size:
            return None
        if to_jpeg or original.format == 'JPEG':
            image = image.convert('RGB')
        elif image.mode == 'P':
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        if image.size != size:
            image = image.resize(size, Image.Resampling.LANCZOS)
        options = {'optimize': True, 'icc_profile': original.info.get('icc_profile')}
        output_format = 'JPEG' if to_jpeg else original.format
        if output_format == 'JPEG':
            options.update(quality=quality, subsampling=0, progressive=True)
        image.save(target, format=output_format, **options)
        with Image.open(target) as check:
            check.load()
            if check.size != size or check.format != output_format:
                raise ValueError('Image verification failed')
        return {'format': output_format, 'size': list(size), 'converted': to_jpeg}


def rewrite_model_references(root, conversions, preserve):
    by_path = {str(source.resolve()): target for source, target in conversions.items()}
    # Older optimization passes may already have removed PNGs while leaving model URIs unchanged.
    index = root / 'modules/shared/asset-index.json'
    if index.is_file():
        document = json.loads(index.read_text(encoding='utf-8'))
        for key, value in document['formats'].items():
            uid, relative = key.split('/', 1)
            if uid not in document['roots'] or not relative.lower().endswith('.png'):
                continue
            base = root / document['roots'][uid]
            source, target = (base / relative).resolve(), (base / value).resolve()
            if not source.exists() and target.is_file() and target.suffix.lower() in {'.jpg', '.jpeg'}:
                by_path[str(source)] = target
    changed = []
    for file in (root / 'modules').rglob('*.glb'):
        data = file.read_bytes()
        magic, version, length = struct.unpack_from('<III', data)
        if magic != 0x46546c67 or version != 2 or length != len(data):
            raise ValueError('Invalid GLB container: ' + str(file))
        chunks, cursor, modified = [], 12, False
        while cursor < len(data):
            size, kind = struct.unpack_from('<II', data, cursor)
            payload = data[cursor + 8:cursor + 8 + size]
            cursor += size + 8
            if kind == 0x4e4f534a:
                document = json.loads(payload.rstrip(b' \x00'))
                for image in document.get('images', []):
                    uri = image.get('uri', '')
                    if not uri or uri.startswith(('data:', 'http:', 'https:')):
                        continue
                    target = by_path.get(str((file.parent / uri).resolve()))
                    if target:
                        image['uri'] = uri[:uri.rfind('/')+1] + target.name
                        if 'mimeType' in image:
                            image['mimeType'] = 'image/jpeg'
                        modified = True
                if modified:
                    payload = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
                    payload += b' ' * ((-len(payload)) % 4)
            chunks.append(struct.pack('<II', len(payload), kind) + payload)
        if modified:
            output = b''.join(chunks)
            preserve(file)
            atomic(file, struct.pack('<III', magic, version, 12+len(output)) + output)
            changed.append(file.relative_to(root).as_posix())
    return changed


def rewrite_references(root, conversions, preserve):
    # Physical relative imports/URLs get a new filename. Logical UUID URLs use the exact map.
    by_path = {str(source.resolve()): target for source, target in conversions.items()}
    changed = []
    quoted = re.compile(r"(['\"`])([^'\"`\r\n]*\.png(?:[?#][^'\"`\r\n]*)?)\1", re.I)
    css_url = re.compile(r'url\(([^\s\'"()]+\.png)\)', re.I)
    for file in (root / 'modules').rglob('*'):
        if not file.is_file() or file.suffix.lower() not in TEXT or file.name.endswith('.min.js'):
            continue
        text = file.read_text(encoding='utf-8-sig')
        def replacement(value):
            raw = re.split(r'[?#]', value, maxsplit=1)[0]
            if '${' in raw or raw.startswith(('http:', 'https:', 'data:')):
                return value
            candidate = (root / raw.lstrip('/')) if raw.startswith('/') else file.parent / raw
            target = by_path.get(str(candidate.resolve()))
            if target is None:
                return value
            return raw[:raw.rfind('/')+1] + target.name + value[len(raw):]
        updated = quoted.sub(lambda m: m[1] + replacement(m[2]) + m[1], text)
        updated = css_url.sub(lambda m: 'url(' + replacement(m[1]) + ')', updated)
        if updated != text:
            preserve(file)
            atomic(file, updated.encode('utf-8'))
            changed.append(file.relative_to(root).as_posix())
    index = root / 'modules/shared/asset-index.json'
    document = json.loads(index.read_text(encoding='utf-8'))
    for outline in (root / 'modules').glob('*/outlines.json'):
        uid = json.loads(outline.read_text(encoding='utf-8-sig')).get('moduleIdentity', {}).get('id')
        if uid:
            document['roots'][uid] = (outline.parent / 'assets').relative_to(root).as_posix()
    for uid, relative in document['roots'].items():
        base = (root / relative).resolve()
        for source, target in conversions.items():
            if not source.resolve().is_relative_to(base):
                continue
            old = source.resolve().relative_to(base).as_posix()
            new = target.resolve().relative_to(base).as_posix()
            for key, value in list(document['formats'].items()):
                if key.startswith(uid + '/') and value == old:
                    document['formats'][key] = new
            document['formats'][uid + '/' + old] = new
    formats = root / 'modules/shared/react/asset-formats.json'
    for file, content in [(index, json.dumps(document, ensure_ascii=False, indent=2)),
                          (formats, json.dumps(document['formats'], ensure_ascii=False, separators=(',', ':')))]:
        preserve(file)
        atomic(file, (content + '\n').encode('utf-8'))
    return changed + rewrite_model_references(root, conversions, preserve)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--originals-root', type=Path, help='Existing unchanged archive; verified before modifying each file')
    parser.add_argument('--backup-dir', type=Path, help='Backup directory outside this repository')
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--videos', action='store_true')
    args = parser.parse_args()
    if args.apply and args.report.exists():
        parser.error('This report already exists. Use audit mode, or a new report path for an intentional new optimization pass.')
    if args.apply and not (args.originals_root or args.backup_dir):
        parser.error('Apply requires an archive or an external backup directory')
    if args.backup_dir and args.backup_dir.resolve().is_relative_to(ROOT):
        parser.error('Keep backups outside this repository')
    rows, conversions = [], {}
    def preserve(file):
        relative = file.relative_to(ROOT)
        if args.originals_root:
            original = args.originals_root.resolve() / relative
            if not original.is_file() or hashlib.sha256(original.read_bytes()).digest() != hashlib.sha256(file.read_bytes()).digest():
                raise ValueError('Archive does not match current original: ' + str(relative))
        else:
            dest = args.backup_dir.resolve() / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                shutil.copy2(file, dest)
    images = [p for p in (ROOT / 'modules').rglob('*') if p.is_file() and not p.is_symlink() and p.suffix.lower() in {'.png', '.jpg', '.jpeg'}]
    with tempfile.TemporaryDirectory(prefix='idl-media-') as folder:
        cache = Path(folder)
        # Cache identical media, common in courses that reuse another lesson's materials.
        groups = {}
        for file in images:
            groups.setdefault((hashlib.sha256(file.read_bytes()).hexdigest(), file.suffix.lower()), []).append(file)
        def process(item):
            (digest, suffix), files = item
            temp = cache / (digest + suffix + '.image')
            info = prepare_image(files[0], temp)
            return files, temp, info
        for files, temp, info in ThreadPoolExecutor(max_workers=4).map(process, groups.items()):
            if not info:
                continue
            for source in files:
                target = source.with_suffix('.jpg') if info['converted'] else source
                if target != source and target.exists():
                    raise ValueError('Refuse overwriting existing JPEG: ' + str(target))
                row = {'source': source.relative_to(ROOT).as_posix(), 'target': target.relative_to(ROOT).as_posix(),
                       'before': source.stat().st_size, 'after': temp.stat().st_size, **info}
                if args.apply:
                    preserve(source)
                    atomic(target, temp.read_bytes())
                    if info['converted']:
                        conversions[source] = target
                rows.append(row)
        if args.videos:
            binary = shutil.which('ffmpeg')
            if not binary:
                import imageio_ffmpeg
                binary = imageio_ffmpeg.get_ffmpeg_exe()
            videos = {}
            for file in (ROOT / 'modules').rglob('*.mp4'):
                videos.setdefault(hashlib.sha256(file.read_bytes()).hexdigest(), []).append(file)
            for digest, files in videos.items():
                if files[0].stat().st_size < 512 * 1024:
                    continue
                temp = cache / (digest + '.mp4')
                command = [binary, '-v', 'error', '-nostdin', '-y', '-i', str(files[0]), '-map', '0:v:0', '-map', '0:a?',
                    '-vf', "scale=w='min(1600,iw)':h='min(900,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
                    '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(temp)]
                subprocess.run(command, check=True, capture_output=True, timeout=300)
                if temp.stat().st_size >= files[0].stat().st_size:
                    continue
                subprocess.run([binary, '-v', 'error', '-i', str(temp), '-f', 'null', '-'], check=True, capture_output=True, timeout=300)
                for file in files:
                    rows.append({'source': file.relative_to(ROOT).as_posix(), 'target': file.relative_to(ROOT).as_posix(),
                                 'before': file.stat().st_size, 'after': temp.stat().st_size, 'format': 'MP4'})
                    if args.apply:
                        preserve(file)
                        atomic(file, temp.read_bytes())
        changed = rewrite_references(ROOT, conversions, preserve) if args.apply and conversions else []
        # Delete originals only after every conversion and reference update succeeds.
        if args.apply:
            for source in conversions:
                source.unlink()
    report = {'applied': args.apply, 'rows': rows, 'rewritten_source_files': changed,
              'before': sum(row['before'] for row in rows), 'after': sum(row['after'] for row in rows)}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'changed': len(rows), 'png_to_jpeg': len(conversions), 'rewritten_files': len(changed),
                      'saved_MB': round((report['before'] - report['after']) / 1048576, 1)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
