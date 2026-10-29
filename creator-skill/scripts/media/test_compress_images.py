import importlib.util
from pathlib import Path
from PIL import Image
import pytest

spec = importlib.util.spec_from_file_location('compress_images', Path(__file__).with_name('compress-images.py'))
compress = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compress)


@pytest.mark.parametrize('mode,color', [('RGBA', (255, 0, 0, 0)), ('RGBA', (255, 0, 0, 128))])
def test_transparent_png_is_untouched(tmp_path, mode, color):
    p = tmp_path / 'image.png'
    Image.new(mode, (32, 32), color).save(p)
    before = p.read_bytes()
    assert compress.convert(p)['reason'] == 'transparent'
    assert p.read_bytes() == before and not p.with_suffix('.jpg').exists()


def test_palette_transparency_and_animation_are_untouched(tmp_path):
    p = tmp_path / 'palette.png'
    Image.new('P', (32, 32)).save(p, transparency=0)
    assert compress.convert(p)['reason'] == 'transparent'
    a = tmp_path / 'animation.png'
    Image.new('RGB', (32, 32), 'red').save(a, save_all=True,
        append_images=[Image.new('RGB', (32, 32), 'blue')], duration=100, loop=0)
    assert compress.convert(a)['reason'] == 'animated'


def test_gif_and_other_formats_are_untouched(tmp_path):
    for suffix in ['gif', 'webp', 'jpg']:
        p = tmp_path / ('image.' + suffix)
        Image.new('RGB', (32, 32)).save(p)
        assert compress.convert(p)['reason'] == 'unsupported-format-or-link'


def test_opaque_png_conversion_keeps_original_and_dimensions(tmp_path):
    p = tmp_path / 'photo.png'
    # Photographic/noisy source ensures PNG is larger than JPEG.
    Image.effect_noise((512, 512), 64).convert('RGB').save(p)
    before = p.read_bytes()
    assert compress.convert(p)['status'] == 'converted'
    with Image.open(p.with_suffix('.jpg')) as jpg:
        assert jpg.format == 'JPEG' and jpg.size == (512, 512)
    assert p.read_bytes() == before
    assert compress.convert(p)['reason'] == 'jpg-already-exists'


def test_dry_run_and_larger_jpg_do_not_write(tmp_path):
    p = tmp_path / 'small.png'
    Image.new('RGB', (16, 16), 'white').save(p)
    assert compress.convert(p, dry_run=True)['status'] == 'eligible'
    assert compress.convert(p)['reason'] == 'jpg-not-smaller'
    assert not p.with_suffix('.jpg').exists()


def test_high_bit_depth_png_is_untouched(tmp_path):
    p = tmp_path / 'scientific.png'
    Image.new('I;16', (16, 16), 30000).save(p)
    before = p.read_bytes()
    assert compress.convert(p)['reason'] == 'unsupported-bit-depth-or-mode'
    assert p.read_bytes() == before and not p.with_suffix('.jpg').exists()


@pytest.mark.parametrize('size,expected', [
    ((2500, 1000), (1600, 640)), ((2500, 1800), (1250, 900)),
    ((900, 1800), (450, 900)), ((1600, 900), (1600, 900)),
    ((640, 480), (640, 480)), ((2000, 1), (1600, 1)),
])
def test_fit_both_bounds_without_cropping_or_enlargement(size, expected):
    assert compress.fit_size(*size) == expected


def test_large_transparent_png_keeps_alpha_and_original_backup(tmp_path):
    p, backup = tmp_path/'large.png', tmp_path/'backup/large.png'
    Image.new('RGBA', (2500, 1000), (255, 0, 0, 128)).save(p)
    original = p.read_bytes()
    result = compress.resize_image(p, backup)
    assert result['status'] == 'resized' and backup.read_bytes() == original
    with Image.open(p) as image:
        assert image.size == (1600, 640) and image.mode == 'RGBA'
        assert image.getchannel('A').getextrema() == (128, 128)
    once = p.read_bytes()
    assert compress.resize_image(p, backup)['reason'] == 'within-bounds'
    assert p.read_bytes() == once and backup.read_bytes() == original


def test_small_image_is_byte_identical_and_dry_run_writes_nothing(tmp_path):
    p, backup = tmp_path/'small.jpg', tmp_path/'backup/small.jpg'
    Image.new('RGB', (800, 600), 'white').save(p)
    original = p.read_bytes()
    assert compress.resize_image(p, backup)['reason'] == 'within-bounds'
    assert p.read_bytes() == original and not backup.exists()
    Image.new('RGB', (2500, 1800), 'red').save(p)
    original = p.read_bytes()
    assert compress.resize_image(p, backup, dry_run=True)['after_size'] == [1250, 900]
    assert p.read_bytes() == original and not backup.exists()


def test_jpeg_exif_orientation_is_applied_before_fitting(tmp_path):
    p = tmp_path/'rotated.jpg'
    exif = Image.Exif(); exif[274] = 6
    Image.new('RGB', (2500, 1000), 'red').save(p, exif=exif)
    result = compress.resize_image(p, tmp_path/'backup.jpg')
    assert result['before_size'] == [1000, 2500]
    with Image.open(p) as image:
        assert image.size == (360, 900)
        assert image.getexif().get(274, 1) == 1
