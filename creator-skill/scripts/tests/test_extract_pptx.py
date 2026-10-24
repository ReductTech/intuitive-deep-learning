"""PPTX ordering, notes filtering and output ownership regressions."""

import json
from pathlib import Path
from zipfile import ZipFile

import pytest

from media import extract_pptx as tool


@pytest.fixture
def module_dir(tmp_path, monkeypatch):
    directory = tmp_path / "modules/Demo"
    directory.mkdir(parents=True)
    monkeypatch.setattr(tool, "resolve_module", lambda _: (directory, {}))
    return directory


def make_pptx(path: Path) -> None:
    # Reverse the physical slide filenames to catch ZIP/filename-order mistakes.
    parts = {
        "ppt/presentation.xml": '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="256" r:id="r2"/><p:sldId id="257" r:id="r1"/></p:sldIdLst><p:sldSz cx="400" cy="300"/></p:presentation>',
        "ppt/_rels/presentation.xml.rels": '<Relationships><Relationship Id="r1" Type="x/slide" Target="slides/slide1.xml"/><Relationship Id="r2" Type="x/slide" Target="slides/slide2.xml"/></Relationships>',
        "ppt/slides/slide2.xml": '<p:sld xmlns:p="p" xmlns:a="a"><p:spTree><p:grpSp><p:sp><a:p><a:r><a:t>标题</a:t></a:r><a:r><a:t>文字</a:t></a:r><a:br/><a:r><a:t>第二行</a:t></a:r></a:p></p:sp></p:grpSp><a:tbl><a:tc><a:p><a:r><a:t>单元格</a:t></a:r></a:p></a:tc></a:tbl></p:spTree></p:sld>',
        "ppt/slides/slide1.xml": '<p:sld xmlns:p="p"/>',
        "ppt/slides/_rels/slide2.xml.rels": '<Relationships><Relationship Id="n" Type="x/notesSlide" Target="../notesSlides/notesSlide2.xml"/></Relationships>',
        "ppt/notesSlides/notesSlide2.xml": '<p:notes xmlns:p="p" xmlns:a="a"><p:sp><p:ph type="sldNum"/><a:p><a:r><a:t>99</a:t></a:r></a:p></p:sp><p:sp><p:ph type="body"/><a:p><a:r><a:t>演讲者备注</a:t></a:r></a:p></p:sp></p:notes>',
    }
    with ZipFile(path, "w") as archive:
        for name, content in parts.items():
            archive.writestr(name, content)


def test_order_group_table_and_notes(tmp_path):
    source = tmp_path / "中文 原稿.pptx"
    make_pptx(source)
    document = tool.read_pptx(source)
    assert document["pages"] == [
        {"page": 1, "text": "标题文字\n第二行\n单元格", "notes": "演讲者备注"},
        {"page": 2, "text": "", "notes": ""},
    ]


def test_publish_and_refuse_overwrite(tmp_path, monkeypatch, module_dir):
    source = tmp_path / "原稿.pptx"
    make_pptx(source)
    original = source.read_bytes()
    output = module_dir / "_scratchpad/原稿-extracted"

    def render(source, directory, width, height, count, timeout):
        assert (width, height, count) == (1600, 1200, 2)
        for page in range(1, count + 1):
            (directory / f"{page:04d}.png").write_bytes(b"fixture")

    monkeypatch.setattr(tool, "render_slides", render)
    args = tool.build_parser().parse_args([str(source), "--module", "Demo"])
    result = tool.run_task(args)
    manifest = json.loads(Path(result["manifest"]).read_text(encoding="utf-8"))
    assert manifest["pages"][0]["image"] == "0001.png"
    assert (output / "0001.notes.txt").read_text(encoding="utf-8") == "演讲者备注"
    assert (output / "0002.notes.txt").read_text() == ""
    assert source.read_bytes() == original
    before = {p.name: p.read_bytes() for p in output.iterdir()}
    with pytest.raises(ValueError, match="already exists"):
        tool.run_task(args)
    assert before == {p.name: p.read_bytes() for p in output.iterdir()}


def test_failure_does_not_publish_partial_output(
    tmp_path, monkeypatch, capsys, module_dir
):
    source = tmp_path / "source.pptx"
    make_pptx(source)
    output = module_dir / "_scratchpad/result"

    def fail(*args):
        (args[1] / "0001.png").write_bytes(b"partial")
        raise RuntimeError("render failed")

    monkeypatch.setattr(tool, "render_slides", fail)
    assert tool.main([str(source), "--module", "Demo", "--output", str(output)]) == 2
    assert json.loads(capsys.readouterr().out)["status"] == "error"
    assert not output.exists()
    assert list(output.parent.iterdir()) == []


def test_invalid_zip_reports_execution_error(tmp_path, capsys, module_dir):
    source = tmp_path / "bad.pptx"
    source.write_text("not a zip")
    assert tool.main([str(source), "--module", "Demo"]) == 2
    assert json.loads(capsys.readouterr().out)["status"] == "error"


def test_output_escape_rejected_before_rendering(
    tmp_path, monkeypatch, module_dir, capsys
):
    source = tmp_path / "source.pptx"
    make_pptx(source)
    monkeypatch.setattr(
        tool, "render_slides", lambda *a: pytest.fail("must reject before rendering")
    )
    outside = tmp_path / "elsewhere"
    assert tool.main([str(source), "--module", "Demo", "--output", str(outside)]) == 2
    assert "_scratchpad" in json.loads(capsys.readouterr().out)["error"]
    assert not outside.exists()
