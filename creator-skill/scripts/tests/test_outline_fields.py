import json
from checks.outline_fields import process


def write_module(root, pages, source=""):
    directory = root / "modules" / "Example"
    directory.mkdir(parents=True)
    target = directory / "outlines.json"
    target.write_text(json.dumps({"pages": pages}), encoding="utf-8")
    (directory / "Ppt.tsx").write_text(source, encoding="utf-8")
    return target


def test_fix_reuses_scene_ids_and_is_idempotent(tmp_path):
    file = write_module(tmp_path, [{"title": "标题", "snippet": "实际讲稿"}],
                        "const deck={scenes:[{id:'actual-scene',title:outline.pages[0].title}]};")
    result = process(tmp_path, fix=True)
    assert result["errors"] == []
    assert json.loads(file.read_text())["pages"][0]["id"] == "actual-scene"
    before = file.read_bytes()
    assert process(tmp_path, fix=True)["filledIds"] == 0
    assert file.read_bytes() == before


def test_component_mapping_and_existing_ids_are_preserved(tmp_path):
    file = write_module(tmp_path, [{"id": "kept", "title": "一", "snippet": "讲稿一"},
                                  {"title": "二", "snippet": "讲稿二"}],
                        "const pages=[{id:'source-one',Component:One},{id:'source-two',Component:Two}];const deck={scenes:pages.map(render)};")
    assert process(tmp_path, fix=True)["errors"] == []
    assert [p["id"] for p in json.loads(file.read_text())["pages"]] == ["kept", "source-two"]


def test_missing_prose_and_duplicates_fail_without_writing(tmp_path):
    file = write_module(tmp_path, [{"id": "one", "title": "标题", "snippet": ""},
                                  {"id": "one", "title": "", "snippet": "讲稿"}])
    before = file.read_bytes()
    errors = process(tmp_path)["errors"]
    assert any("snippet" in error for error in errors)
    assert any("title" in error for error in errors)
    assert any("duplicate" in error for error in errors)
    assert file.read_bytes() == before


def test_planned_page_gets_stable_non_numbered_id(tmp_path):
    file = write_module(tmp_path, [{"title": "尚未实现", "snippet": "讲稿"}])
    assert process(tmp_path, fix=True)["errors"] == []
    value = json.loads(file.read_text())["pages"][0]["id"]
    assert value.startswith("page-") and value != "page-1"
    assert process(tmp_path, fix=True)["filledIds"] == 0
