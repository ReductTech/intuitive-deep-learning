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
