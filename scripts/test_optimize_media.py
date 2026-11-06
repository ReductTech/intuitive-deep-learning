import importlib.util
import json
import struct
import pytest
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location('media', Path(__file__).with_name('optimize-media.py'))
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


def test_opaque_png_always_becomes_jpeg_even_when_jpeg_is_larger(tmp_path):
    source, target = tmp_path / 'tiny.png', tmp_path / 'tiny.jpg'
    Image.new('RGB', (16, 16), 'white').save(source)
    result = media.prepare_image(source, target)
    assert result['converted'] is True and target.stat().st_size > source.stat().st_size
    with Image.open(target) as image:
        assert image.format == 'JPEG'


def test_real_transparency_is_kept_and_small_images_are_untouched(tmp_path):
    source, target = tmp_path / 'transparent.png', tmp_path / 'out.png'
    Image.new('RGBA', (32, 32), (200, 30, 10, 128)).save(source)
    assert media.prepare_image(source, target) is None
    assert not target.exists()


def test_large_transparent_image_retains_alpha_without_cropping(tmp_path):
    source, target = tmp_path / 'large.png', tmp_path / 'out.png'
    Image.new('RGBA', (3200, 1800), (200, 30, 10, 128)).save(source)
    result = media.prepare_image(source, target)
    assert result['format'] == 'PNG' and result['size'] == [1600, 900]
    with Image.open(target) as image:
        assert image.getchannel('A').getextrema() == (128, 128)


def test_physical_imports_and_dynamic_uuid_aliases_are_updated(tmp_path):
    module = tmp_path / 'modules/Example'
    assets = module / 'assets'
    assets.mkdir(parents=True)
    (module / 'outlines.json').write_text(json.dumps({'moduleIdentity': {'id': 'uuid'}}))
    source, target = assets / 'picture.png', assets / 'picture.jpg'
    source.write_bytes(b'png'); target.write_bytes(b'jpg')
    page = module / 'Page.tsx'
    page.write_text("import picture from './assets/picture.png';")
    shared = tmp_path / 'modules/shared'
    (shared / 'react').mkdir(parents=True)
    (shared / 'asset-index.json').write_text(json.dumps({'roots': {}, 'formats': {'uuid/old.webp': 'picture.png'}}))
    (shared / 'react/asset-formats.json').write_text('{}')
    media.rewrite_references(tmp_path, {source: target}, lambda file: None)
    assert "'./assets/picture.jpg'" in page.read_text()
    formats = json.loads((shared / 'react/asset-formats.json').read_text())
    assert formats['uuid/picture.png'] == formats['uuid/old.webp'] == 'picture.jpg'


@pytest.mark.parametrize('use_alias', [False, True])
def test_glb_texture_uri_changes_without_altering_mesh_bytes(tmp_path, use_alias):
    folder = tmp_path / 'modules/Example/assets'
    folder.mkdir(parents=True)
    source, target = folder / 'texture.png', folder / 'texture.jpg'
    target.write_bytes(b'jpeg')
    document = json.dumps({'asset': {'version': '2.0'}, 'images': [{'uri': 'texture.png', 'mimeType': 'image/png'}]}).encode()
    document += b' ' * ((-len(document)) % 4)
    mesh = b'\x01\x02\x03\x04'
    chunks = struct.pack('<II', len(document), 0x4e4f534a) + document + struct.pack('<II', len(mesh), 0x004e4942) + mesh
    model = folder / 'model.glb'
    model.write_bytes(struct.pack('<III', 0x46546c67, 2, len(chunks)+12) + chunks)
    if use_alias:
        shared = tmp_path / 'modules/shared'
        shared.mkdir()
        (shared / 'asset-index.json').write_text(json.dumps({'roots': {'uuid': 'modules/Example/assets'}, 'formats': {'uuid/texture.png': 'texture.jpg'}}))
    assert media.rewrite_model_references(tmp_path, {} if use_alias else {source: target}, lambda file: None)
    output = model.read_bytes()
    size = struct.unpack_from('<I', output, 12)[0]
    image = json.loads(output[20:20+size])['images'][0]
    assert image == {'uri': 'texture.jpg', 'mimeType': 'image/jpeg'}
    assert output[-4:] == mesh
    assert struct.unpack_from('<I', output, 8)[0] == len(output)
