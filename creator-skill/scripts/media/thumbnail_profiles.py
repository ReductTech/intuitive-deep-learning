"""Fixed publishing profiles: agents select a course/page, never pixel sizes."""
from PIL import Image, ImageOps

THUMBNAIL_SIZE = (320, 180)
COVER_SIZE = (800, 450)


def _save(image, target, size, quality):
    rgba = ImageOps.contain(image.convert('RGBA'), size, Image.Resampling.LANCZOS)
    background = Image.new('RGB', size, 'white')
    background.paste(rgba, ((size[0] - rgba.width) // 2, (size[1] - rgba.height) // 2), rgba)
    target.parent.mkdir(parents=True, exist_ok=True)
    background.save(target, format='JPEG', quality=quality, subsampling=0,
                    optimize=True, progressive=True)


def save_thumbnail(image, target):
    _save(image, target, THUMBNAIL_SIZE, 75)


def save_cover(image, target):
    _save(image, target, COVER_SIZE, 80)
