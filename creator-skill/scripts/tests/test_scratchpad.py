"""Intermediate outputs stay module-local; official resources remain separate."""

import json
from pathlib import Path

import pytest

from _common import scratchpad_path
from analysis import page_statistics as statistics
from checks import course_consistency as consistency
from checks.validate_module import validate_modules
from module.init_module import initialize
from media import capture_slides, remove_green_screen


def test_scratchpad_rejects_other_module_and_parent_escape(tmp_path):
    directory = tmp_path / "modules/Demo"
    assert (
        scratchpad_path(directory, default="reports/a.html")
        == directory / "_scratchpad/reports/a.html"
    )
    for output in (
        tmp_path / "work/a.html",
        directory / "_scratchpad/../a.html",
        tmp_path / "modules/Other/_scratchpad/a.html",
    ):
        with pytest.raises(ValueError, match="inside"):
            scratchpad_path(directory, output, default="unused")
    assert not directory.exists()


def test_scratchpad_rejects_symlink_escape(tmp_path):
    directory = tmp_path / "module"
    directory.mkdir()
    outside = tmp_path / "outside"
    outside.mkdir()
    link = directory / "_scratchpad"
    try:
        link.symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip("Creating symlinks is unavailable on this host")
    with pytest.raises(ValueError, match="inside"):
        scratchpad_path(directory, default="report.html")


def test_module_check_ignores_scratch_sources(tmp_path):
    initialize(
        tmp_path, "Demo", {"title": "Demo", "pages": [{"id": "one", "title": "One"}]}
    )
    scratch = tmp_path / "modules/Demo/_scratchpad"
    scratch.mkdir()
    (scratch / "experiment.tsx").write_text(
        "import old from 'modules-legacy'; const x = <Player assetId='wrong' />;",
        encoding="utf-8",
    )
    assert validate_modules(tmp_path) == []


@pytest.fixture
def report_data(tmp_path, monkeypatch):
    modules, pages = [], []
    for name in ("First", "Second"):
        directory = tmp_path / "modules" / name
        directory.mkdir(parents=True)
        (directory / "outlines.json").write_text(json.dumps({"id": name.lower()}))
        modules.append({"directory": name, "id": name.lower(), "title": name})
        pages.append(
            {
                "directory": name,
                "module": name.lower(),
                "assetId": name.lower(),
                "page": 1,
                "sceneId": "one",
                "title": "One",
                "words": 1,
            }
        )
    data = {
        "modules": modules,
        "pages": pages,
        "missingThumbnails": ["First/one", "Second/one"],
        "imageErrors": [],
        "unmatchedThumbnails": [],
    }

    def dataset(root, module, *args):
        if module:
            return {
                **data,
                "modules": [m for m in modules if m["directory"] == module],
                "pages": [p for p in pages if p["directory"] == module],
            }
        return data

    monkeypatch.setattr(statistics, "build_dataset", dataset)
    return data


def test_bulk_reports_are_saved_in_their_own_modules(tmp_path, report_data):
    args = statistics.build_parser().parse_args(["--root", str(tmp_path)])
    result = statistics.write_report(args)
    assert result["modules"] == 2
    for name, report in zip(("First", "Second"), result["reports"]):
        parent = tmp_path / "modules" / name / "_scratchpad/reports"
        assert Path(report["report"]) == parent / "page-statistics.html"
        document = json.loads(Path(report["json"]).read_text(encoding="utf-8"))
        assert [p["directory"] for p in document["pages"]] == [name]
        assert document["missingThumbnails"] == [name + "/one"]
        assert Path(report["csv"]).is_file()
    assert not (tmp_path / "creator-skill").exists()


def test_report_output_requires_matching_module(tmp_path, report_data):
    outside = tmp_path / "report.html"
    for extra in ([], ["--module", "First"]):
        args = statistics.build_parser().parse_args(
            ["--root", str(tmp_path), "--output", str(outside), *extra]
        )
        with pytest.raises(ValueError):
            statistics.write_report(args)
    assert not outside.exists()


def test_snapshot_writes_only_within_its_module(tmp_path, monkeypatch, capsys):
    directory = tmp_path / "module"
    snapshot = tmp_path / "input.json"
    snapshot.write_text(
        json.dumps({"scenes": [{"id": "one", "title": "One"}], "guideIds": ["one"]})
    )
    monkeypatch.setattr(
        consistency,
        "resolve_module",
        lambda _: (directory, {"pages": [{"id": "one", "title": "One"}]}),
    )
    base = ["--module", "Demo", "--snapshot", str(snapshot), "--save-snapshot"]
    assert consistency.main([*base, str(tmp_path / "escape.json")]) == 2
    assert json.loads(capsys.readouterr().out)["status"] == "error"
    assert not directory.exists()
    output = directory / "_scratchpad/snapshots/course.json"
    assert consistency.main([*base, str(output)]) == 0
    assert json.loads(capsys.readouterr().out)["snapshot"] == str(output)
    assert json.loads(output.read_text()) == json.loads(snapshot.read_text())


def test_capture_and_media_reject_escape_before_launch(tmp_path, monkeypatch):
    monkeypatch.setattr(
        capture_slides, "resolve_module", lambda _: (tmp_path, "demo", "uuid")
    )
    monkeypatch.setattr(
        capture_slides,
        "browser_session",
        lambda *a, **k: pytest.fail("must reject before browser launch"),
    )
    args = capture_slides.build_parser().parse_args(
        ["--module", "Demo", "--output", str(tmp_path / "bad")]
    )
    with pytest.raises(ValueError, match="inside"):
        capture_slides.capture_module(args)
    monkeypatch.setattr(remove_green_screen, "resolve_module", lambda _: (tmp_path, {}))
    monkeypatch.setattr(
        remove_green_screen,
        "remove_green_screen",
        lambda *a: pytest.fail("must reject before encoding"),
    )
    assert (
        remove_green_screen.main(
            ["source.mp4", "--module", "Demo", "--output", str(tmp_path / "bad")]
        )
        == 2
    )
    assert not (tmp_path / "bad").exists()
