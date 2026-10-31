"""Capture entry isolation, publish timing and official output boundaries."""
from contextlib import contextmanager
import io
import json

import pytest
from PIL import Image

from media import capture_slides as capture


def test_capture_mounts_current_module_without_app_router(tmp_path, monkeypatch):
    module = tmp_path / "modules/Example"
    module.mkdir(parents=True)
    (module / "ExamplePpt.tsx").write_text("export function ExamplePpt() {}")
    (module / "outlines.json").write_text(json.dumps({"ppt": {"entry": "ExamplePpt.tsx"}}))
    monkeypatch.setattr(capture, "ROOT", tmp_path)
    scripts = []
    routes = []

    class Context:
        def add_init_script(self, script):
            scripts.append(script)
        def route(self, pattern, handler):
            routes.append((pattern, handler))

    context = Context()
    capture.configure_module_capture(context, module, "http://localhost:5173")
    assert routes[0][0].fullmatch(capture.capture_url('http://localhost:5173', 'example', 'one'))
    assert '"entry": "/modules/Example/ExamplePpt.tsx"' in scripts[0]
    assert '"component": "ExamplePpt"' in scripts[0]
    assert "/src/main.tsx" not in scripts[0]
    (module / "outlines.json").write_text(json.dumps({"ppt": {"entry": "../../outside.tsx"}}))
    with pytest.raises(ValueError, match="inside"):
        capture.configure_module_capture(Context(), module, "http://localhost:5173")


def setup_capture(tmp_path, monkeypatch):
    monkeypatch.setattr(capture, "ROOT", tmp_path)
    monkeypatch.setattr(capture, "resolve_module", lambda _: (tmp_path, "fixture", "uuid"))
    monkeypatch.setattr(capture, "scene_ids", lambda *args: ["one", "two"])
    official = tmp_path / "assets/scenedeck-thumbnails"
    closed = False

    @contextmanager
    def session(*args, **kwargs):
        nonlocal closed
        yield object(), "http://localhost:5173"
        assert not official.exists(), "Publishing while Vite is watched can reload later captures"
        closed = True

    def take(*args):
        assert not closed
        assert not official.exists()
        args[6].update(status="passed", text={"status": "passed", "characters": 1})
        return Image.new("RGB", (1600, 900), "navy")

    monkeypatch.setattr(capture, "browser_session", session)
    monkeypatch.setattr(capture, "capture_slide", take)
    return official


def test_publish_after_close_respects_module_format_mapping(tmp_path, monkeypatch):
    official = setup_capture(tmp_path, monkeypatch)
    index = tmp_path / "modules/shared/asset-index.json"
    index.parent.mkdir(parents=True)
    index.write_text(json.dumps({"formats": {"uuid/scenedeck-thumbnails/one.png": "scenedeck-thumbnails/one.jpg"}}))
    args = capture.build_parser().parse_args(["--module", "fixture", "--format", "thumbnails"])
    result = capture.capture_module(args)
    assert result["errors"] == []
    assert set(p.name for p in official.iterdir()) == {"one.jpg", "two.jpg"}
    with Image.open(official / "one.jpg") as saved:
        assert saved.format == "JPEG" and saved.size == (320, 180)
        assert saved.info.get("progressive")
    with Image.open(official / "two.jpg") as saved:
        assert saved.format == "JPEG"
    with Image.open(tmp_path / 'assets/course-covers/one.jpg') as cover:
        assert cover.format == 'JPEG' and cover.size == (800, 450)
    assert not (tmp_path / 'assets/course-covers/two.jpg').exists()
    assert not (tmp_path / "_scratchpad/screenshots").exists()
    report = json.loads((tmp_path / '_scratchpad/thumbnails/report.json').read_text(encoding='utf-8'))
    assert report['generatedCount'] == report['requestedCount'] == 2
    assert report['generationStatus'] == 'ok' and report['checksStatus'] == 'passed'
    assert report['timing']['totalSeconds'] >= 0
    with Image.open(report['contactSheet']) as sheet:
        assert sheet.size == (1600, 252)


def test_thumbnail_mapping_cannot_write_outside_thumbnail_directory(tmp_path, monkeypatch):
    setup_capture(tmp_path, monkeypatch)
    index = tmp_path / "modules/shared/asset-index.json"
    index.parent.mkdir(parents=True)
    index.write_text(json.dumps({"formats": {"uuid/scenedeck-thumbnails/one.png": "../../escaped.jpg"}}))
    args = capture.build_parser().parse_args(["--module", "fixture", "--format", "thumbnails"])
    result = capture.capture_module(args)
    assert len(result["errors"]) == 1
    assert "escapes" in result["errors"][0]["error"]
    assert not (tmp_path / "escaped.jpg").exists()
    assert len(result["files"]) == 1


def test_single_nonfirst_page_does_not_replace_home_cover(tmp_path, monkeypatch):
    setup_capture(tmp_path, monkeypatch)
    args = capture.build_parser().parse_args(['--module', 'fixture', '--slide', 'two', '--format', 'thumbnails'])
    result = capture.capture_module(args)
    assert result['generatedCount'] == result['requestedCount'] == 1
    assert result['coverFiles'] == []
    assert not (tmp_path / 'assets/course-covers').exists()


def test_external_thumbnail_output_rejected_before_browser(tmp_path, monkeypatch):
    monkeypatch.setattr(capture, "resolve_module", lambda _: (tmp_path, "fixture", "uuid"))
    monkeypatch.setattr(capture, "browser_session", lambda *a, **k: pytest.fail("must not launch"))
    args = capture.build_parser().parse_args(["--module", "fixture", "--format", "thumbnails", "--output", str(tmp_path / "outside")])
    with pytest.raises(ValueError, match="inside"):
        capture.capture_module(args)


@pytest.mark.parametrize('kind,matching,expected', [('creator-capture', True, True), ('creator-capture', False, False), ('other-service', True, False)])
def test_server_reuse_requires_this_exact_checkout(tmp_path, monkeypatch, kind, matching, expected):
    monkeypatch.setattr(capture, 'ROOT', tmp_path)
    info = {'kind': kind, 'root': str(tmp_path if matching else tmp_path / 'other-checkout')}
    monkeypatch.setattr(capture, 'urlopen', lambda *args, **kwargs: io.BytesIO(json.dumps(info).encode()))
    assert (capture.running_vite() is not None) is expected


def test_cold_optimizer_retry_is_bounded_and_does_not_repeat_captured_slides(tmp_path, monkeypatch):
    setup_capture(tmp_path, monkeypatch)
    class InitialTimeout(Exception):
        pass
    monkeypatch.setattr(capture, 'PlaywrightError', InitialTimeout)
    attempts = []
    def ids(*args):
        attempts.append(1)
        if len(attempts) == 1:
            raise InitialTimeout('cold dependency optimizer')
        return ['one', 'two']
    monkeypatch.setattr(capture, 'scene_ids', ids)
    args = capture.build_parser().parse_args(['--module', 'fixture', '--format', 'thumbnails'])
    result = capture.capture_module(args)
    assert len(attempts) == 2
    assert result['generatedCount'] == result['requestedCount'] == 2
    assert not result['errors']
