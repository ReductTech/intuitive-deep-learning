"""Fit JPG/PNG images inside 1600x900, then compress opaque PNGs to smaller JPGs.

Small images are never resized or re-encoded by the resize step. Transparent PNGs
keep their alpha channel and PNG format. Animated/high-bit-depth images are skipped.
Resized originals are backed up outside the asset directory; PNG-to-JPG conversion
retains its source and never overwrites an existing JPG. Reports include dimensions.
Requires Pillow. Example: python compress-images.py modules/Example/assets --report report.json
"""
import argparse
import json
from pathlib import Path
import tempfile
import shutil
import os


def fit_size(width, height, max_width=1600, max_height=900):
    """Fit within both bounds without cropping or enlarging either dimension."""
    scale = min(1.0, max_width / width, max_height / height)
    return max(1, round(width * scale)), max(1, round(height * scale))


def resize_image(path, backup, quality=92, dry_run=False, max_width=1600, max_height=900):
    from PIL import Image, ImageOps
    path, backup = Path(path), Path(backup)
    result = {'source': str(path), 'status': 'skipped'}
    if path.is_symlink() or path.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
        return {**result, 'reason': 'unsupported-format-or-link'}
    with Image.open(path) as original:
        if original.format not in {'PNG', 'JPEG'}:
            return {**result, 'reason': 'format-mismatch'}
        if getattr(original, 'n_frames', 1) != 1:
            return {**result, 'reason': 'animated'}
        if original.mode not in {'RGB', 'RGBA', 'L', 'LA', 'P', 'CMYK'}:
            return {**result, 'reason': 'unsupported-bit-depth-or-mode'}
        image = ImageOps.exif_transpose(original)
        before_size = image.size
        after_size = fit_size(*before_size, max_width, max_height)
        result.update(before_size=list(before_size), after_size=list(after_size),
                      before=path.stat().st_size)
        if after_size == before_size:
            return {**result, 'reason': 'within-bounds'}
        if dry_run:
            return {**result, 'status': 'eligible', 'reason': 'resize-required'}
        if backup.resolve() == path.resolve():
            raise ValueError('Backup must not overwrite source: ' + str(path))
        backup.parent.mkdir(parents=True, exist_ok=True)
        # Exclusive backup prevents a later run from replacing the true original.
        with path.open('rb') as source:
            try:
                with backup.open('xb') as output:
                    shutil.copyfileobj(source, output)
            except FileExistsError:
                pass
        if image.mode == 'P':
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        image = image.resize(after_size, Image.Resampling.LANCZOS)
        if original.format == 'JPEG':
            image = image.convert('RGB')
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=path.suffix, delete=False) as stream:
            temporary = Path(stream.name)
        try:
            options = {'optimize': True, 'icc_profile': original.info.get('icc_profile')}
            if original.format == 'JPEG':
                options.update(quality=quality, subsampling=0, progressive=True)
            exif = image.getexif()
            if exif:
                options['exif'] = exif.tobytes()
            image.save(temporary, format=original.format, **options)
            with Image.open(temporary) as check:
                check.load()
                if check.format != original.format or check.size != after_size:
                    raise ValueError('Resized image verification failed: ' + str(path))
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)
        return {**result, 'status': 'resized', 'after': path.stat().st_size,
                'backup': str(backup)}


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
    parser.add_argument('--max-width', type=int, default=1600)
    parser.add_argument('--max-height', type=int, default=900)
    parser.add_argument('--backup-dir', type=Path,
                        help='Defaults to a sibling <directory>-image-originals directory')
    parser.add_argument('--resize-only', action='store_true',
                        help='Keep formats and filenames; do not convert opaque PNGs to JPG')
    args = parser.parse_args()
    if not args.directory.is_dir() or not 1 <= args.quality <= 100 or min(args.max_width, args.max_height) < 1:
        parser.error('An existing directory and quality between 1 and 100 are required')
    directory = args.directory.resolve()
    backup = (args.backup_dir or directory.with_name(directory.name + '-image-originals')).resolve()
    if backup == directory or backup.is_relative_to(directory):
        parser.error('Backup directory must be outside the input directory')
    rows = []
    for p in sorted(directory.rglob('*')):
        if not p.is_file() or p.is_symlink() or p.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
            continue
        resized = resize_image(p, backup / p.relative_to(directory), args.quality,
                               args.dry_run, args.max_width, args.max_height)
        if args.resize_only:
            rows.append(resized)
        else:
            converted = convert(p, args.quality, args.dry_run)
            rows.append({**converted, 'resize': resized})
    # The shared URL helper consumes exact conversions, including dynamic filenames.
    # Transparent/unconverted PNGs are never added to this mapping.
    if not args.dry_run and any(row['status'] == 'converted' for row in rows):
        for root in [args.directory.resolve(), *args.directory.resolve().parents]:
            index = root / 'modules/shared/asset-index.json'
            if not index.is_file():
                continue
            document = json.loads(index.read_text(encoding='utf-8'))
            for outline in (root/'modules').glob('*/outlines.json'):
                identity=json.loads(outline.read_text(encoding='utf-8-sig')).get('moduleIdentity',{})
                if identity.get('id'):
                    document['roots'][identity['id']]=(outline.parent/'assets').relative_to(root).as_posix()
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
