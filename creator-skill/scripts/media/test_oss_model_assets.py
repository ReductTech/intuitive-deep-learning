"""Every file explicitly placed in public assets must be available on OSS."""
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('oss_model_assets',Path(__file__).with_name('upload-assets-oss.py'))
uploader=importlib.util.module_from_spec(spec)
spec.loader.exec_module(uploader)


def test_render_models_and_textures_are_not_mistaken_for_training_weights(tmp_path):
    directory=tmp_path/'uuid/scene/models';directory.mkdir(parents=True)
    for name in ['scene.gltf','scene.bin','bark.jpg','leaves.png','weights.pth','model.onnx']:
        (directory/name).write_bytes(b'resource')
    assert {p.name for p in uploader.visualization_files(tmp_path)}=={'scene.gltf','scene.bin','bark.jpg','leaves.png','weights.pth','model.onnx'}


def test_all_explicit_asset_files_are_included(tmp_path):
    for relative in ['models/weights.bin','datasets/train.jpg','digit-training/result.png','photo.jpg']:
        file=tmp_path/relative;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(b'resource')
    assert {p.relative_to(tmp_path).as_posix() for p in uploader.visualization_files(tmp_path)}=={'models/weights.bin','datasets/train.jpg','digit-training/result.png','photo.jpg'}
