"""Convert only static, fully opaque PNGs to smaller JPGs. Originals are retained.

Transparent PNG, APNG, GIF, SVG, WebP and every other format are untouched.
An existing JPG is never overwritten. A JSON report lists only successful conversions
so callers can update references without globally replacing filename extensions.
Requires Pillow. Example: python compress-images.py modules/Example/assets --report report.json
"""
import argparse
import json
from pathlib import Path
import tempfile


def convert(path, quality=92, dry_run=False):
    from PIL import Image, ImageOps
    path = Path(path)
    result = {'source': str(path), 'status': 'skipped'}
    if path.is_symlink() or path.suffix.lower() != '.png':
        return {**result, 'reason': 'unsupported-format-or-link'}
    target = path.with_suffix('.jpg')
    if target.exists():
        return {**result, 'reason': 'jpg-already-exists'}
    with Image.open(path) as image:
        if image.format != 'PNG':
            return {**result, 'reason': 'not-png'}
        if image.mode not in {'RGB', 'RGBA', 'L', 'LA', 'P'}:
            return {**result, 'reason': 'unsupported-bit-depth-or-mode'}
        if getattr(image, 'n_frames', 1) != 1 or getattr(image, 'is_animated', False):
            return {**result, 'reason': 'animated'}
        if image.convert('RGBA').getchannel('A').getextrema() != (255, 255):
            return {**result, 'reason': 'transparent'}
        if dry_run:
            return {**result, 'status': 'eligible', 'target': str(target)}
        rgb = ImageOps.exif_transpose(image).convert('RGB')
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix='.jpg', delete=False) as stream:
            temporary = Path(stream.name)
        try:
            rgb.save(temporary, format='JPEG', quality=quality, subsampling=0,
                     optimize=True, progressive=True, icc_profile=image.info.get('icc_profile'))
            with Image.open(temporary) as check:
                check.load()
                if check.format != 'JPEG' or check.size != rgb.size:
                    raise ValueError('JPEG verification failed: ' + str(path))
            if temporary.stat().st_size >= path.stat().st_size:
                return {**result, 'reason': 'jpg-not-smaller'}
            # Exclusive creation also protects against another author creating this filename.
            with target.open('xb') as output:
                output.write(temporary.read_bytes())
            return {**result, 'status': 'converted', 'target': str(target),
                    'before': path.stat().st_size, 'after': target.stat().st_size}
        finally:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--quality', type=int, default=92)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    if not args.directory.is_dir() or not 1 <= args.quality <= 100:
        parser.error('An existing directory and quality between 1 and 100 are required')
    rows = [convert(p, args.quality, args.dry_run) for p in sorted(args.directory.rglob('*'))
            if p.is_file() and not p.is_symlink()]
    # The shared URL helper consumes exact conversions, including dynamic filenames.
    # Transparent/unconverted PNGs are never added to this mapping.
    if not args.dry_run:
        for root in [args.directory.resolve(), *args.directory.resolve().parents]:
            index = root / 'modules/shared/asset-index.json'
            if not index.is_file():
                continue
            document = json.loads(index.read_text(encoding='utf-8'))
            for row in rows:
                if row['status'] != 'converted':
                    continue
                source, target = Path(row['source']).resolve(), Path(row['target']).resolve()
                for uid, relative in document['roots'].items():
                    base = (root / relative).resolve()
                    if source.is_relative_to(base):
                        document['formats'][uid+'/'+source.relative_to(base).as_posix()] = target.relative_to(base).as_posix()
            index.write_text(json.dumps(document, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
            (root/'modules/shared/react/asset-formats.json').write_text(
                json.dumps(document['formats'], ensure_ascii=False, separators=(',',':'))+'\n', encoding='utf-8')
            break
    text = json.dumps(rows, ensure_ascii=False, indent=2)
    if args.report:
        args.report.write_text(text + '\n', encoding='utf-8')
    counts = {}
    for row in rows:
        key = row.get('reason', row['status'])
        counts[key] = counts.get(key, 0) + 1
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == '__main__':
    main()
