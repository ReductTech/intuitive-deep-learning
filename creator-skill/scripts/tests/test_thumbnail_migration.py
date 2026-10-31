import json
from PIL import Image
from media.migrate_thumbnail_jpg import migrate


def test_migration_preserves_new_capture_and_maps_legacy_paths(tmp_path):
    shared = tmp_path / 'modules/shared/react'
    shared.mkdir(parents=True)
    assets = tmp_path / 'modules/Example/assets'
    thumbs = assets / 'scenedeck-thumbnails'
    thumbs.mkdir(parents=True)
    Image.new('RGB', (8, 8), 'red').save(thumbs / 'one.png')
    Image.new('RGB', (320, 180), 'blue').save(thumbs / 'one.jpg')
    fresh = (thumbs / 'one.jpg').read_bytes()
    Image.new('RGBA', (8, 8), (0, 0, 0, 0)).save(thumbs / 'two.png')
    Image.new('RGB', (8, 8), 'green').save(assets / 'lesson.png')
    (assets.parent / 'outlines.json').write_text(json.dumps({'moduleIdentity': {'id': 'uuid'}}))
    (shared.parent / 'asset-index.json').write_text(json.dumps({
        'roots': {'legacy': 'modules/Example/assets'}, 'formats': {}}))
    (shared / 'asset-formats.json').write_text('{}')
    result = migrate(tmp_path)
    assert result == {'thumbnailCount': 2, 'converted': 1, 'removedOldFiles': 2}
    assert (thumbs / 'one.jpg').read_bytes() == fresh
    assert (assets / 'lesson.png').is_file()
    assert not list(thumbs.glob('*.png'))
    with Image.open(thumbs / 'two.jpg') as image:
        assert image.format == 'JPEG' and image.size == (320, 180) and image.getpixel((0, 0)) == (255, 255, 255)
    mapping = json.loads((shared / 'asset-formats.json').read_text())
    assert mapping['legacy/scenedeck-thumbnails/one.png'] == 'scenedeck-thumbnails/one.jpg'
    assert mapping['uuid/scenedeck-thumbnails/two.png'] == 'scenedeck-thumbnails/two.jpg'
    assert migrate(tmp_path)['converted'] == 0
