"""3D lesson models are public media; training weights remain excluded."""
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('oss_model_assets',Path(__file__).with_name('upload-assets-oss.py'))
uploader=importlib.util.module_from_spec(spec)
spec.loader.exec_module(uploader)


def test_render_models_and_textures_are_not_mistaken_for_training_weights(tmp_path):
    directory=tmp_path/'uuid/scene/models';directory.mkdir(parents=True)
    for name in ['scene.gltf','scene.bin','bark.jpg','leaves.png','weights.pth','model.onnx']:
        (directory/name).write_bytes(b'resource')
    assert {p.name for p in uploader.visualization_files(tmp_path)}=={'scene.gltf','scene.bin','bark.jpg','leaves.png'}


def test_unidentified_binary_weights_and_datasets_remain_excluded(tmp_path):
    for relative in ['models/weights.bin','datasets/train.jpg','digit-training/result.png','photo.jpg']:
        file=tmp_path/relative;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(b'resource')
    assert [p.name for p in uploader.visualization_files(tmp_path)]==['photo.jpg']
