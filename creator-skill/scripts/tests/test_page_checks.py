"""Run the shared bounds/text probe in Chromium, not a mocked DOM."""

from pathlib import Path

import pytest

from media import capture_slides

CHECKER = (Path(__file__).resolve().parents[1] / "common/_page_checks.js").read_text(
    encoding="utf-8"
)


@pytest.fixture(scope="module")
def context():
    with capture_slides.browser_session("http://127.0.0.1") as (context, _):
        yield context


@pytest.fixture
def page(context):
    page = context.new_page()
    yield page
    page.close()


def inspect(page, content="<p>正常页面</p>", style="", maximum=None, extra=""):
    page.set_content(
        f"""<style>html,body{{margin:0}} .ppt-slide-surface{{width:1600px;height:900px;position:relative;overflow:hidden;{style}}}</style>
        <main class="ppt-slide-surface" data-scene-id="one">{content}</main>{extra}"""
    )
    return page.evaluate(CHECKER, {"expectedId": "one", "maxChars": maximum})


def test_normal_page_and_uniform_scale(page):
    for style in ("", "transform:scale(.5);transform-origin:top left"):
        result = inspect(page, style=style)
        assert result["status"] == "passed", result
        assert result["surface"]["width"] == 1600
        assert result["text"]["characters"] == 4


def test_outside_canvas_and_internal_overflow_are_distinct(page):
    result = inspect(
        page,
        '<p>页面</p><div id="outside" style="position:absolute;left:1590px;width:100px;height:20px">超出</div>',
    )
    assert result["status"] == "failed"
    assert any(
        e["kind"] == "outside-canvas" and e["id"] == "outside" for e in result["errors"]
    )
    result = inspect(
        page,
        '<div id="clipped" style="width:45px;height:20px;overflow:hidden;white-space:nowrap">这是不应该裁掉的长文字</div>',
    )
    assert result["status"] == "failed"
    assert any(
        e["kind"] == "internal-overflow" and e["id"] == "clipped"
        for e in result["errors"]
    )


def test_hidden_elements_and_explicit_viewport(page):
    result = inspect(
        page,
        """<p>页面</p><div style="display:none;position:absolute;left:2000px">隐藏</div>
        <div id="viewport" data-ppt-viewport="Scrollable code listing" style="width:200px;height:80px;overflow:auto">
          <div style="width:2000px;height:600px">内容</div></div>""",
    )
    assert result["status"] == "passed", result
    assert result["exceptions"][0]["reason"] == "Scrollable code listing"
    assert not any(e.get("kind") == "outside-canvas" for e in result["errors"])


def test_viewport_marker_requires_reason_and_cannot_exempt_surface(page):
    result = inspect(
        page, '<p>页面</p><div data-ppt-viewport="" style="overflow:hidden">内容</div>'
    )
    assert any(e["kind"] == "invalid-viewport-exception" for e in result["errors"])
    inspect(page)
    page.locator("main").evaluate(
        "e => e.setAttribute('data-ppt-viewport', 'skip everything')"
    )
    assert any(
        e["kind"] == "invalid-viewport-exception"
        for e in page.evaluate(CHECKER, {})["errors"]
    )


def test_viewport_does_not_exempt_its_child_text_overflow(page):
    result = inspect(
        page,
        """<div data-ppt-viewport="Scrollable list" style="width:300px;height:200px;overflow:auto">
        <p id="broken-label" style="width:20px;height:20px;white-space:nowrap;overflow:hidden">这个标签不该被截断</p></div>""",
    )
    assert any(
        e["kind"] == "internal-overflow" and e["id"] == "broken-label"
        for e in result["errors"]
    )


@pytest.mark.parametrize("style", ["display:none", "width:0", "height:0", "opacity:0"])
def test_hidden_or_zero_canvas_never_passes(page, style):
    result = inspect(page, style=style)
    assert result["status"] == "failed"
    assert result["text"]["characters"] is None


def test_missing_empty_and_mismatched_page_are_unverified(page):
    for html in (
        "",
        '<div class="ppt-slide-surface" style="width:1600px;height:900px" data-scene-id="one"></div>',
        '<div class="ppt-slide-surface" style="width:1600px;height:900px" data-scene-id="wrong">文字</div>',
    ):
        page.set_content(html)
        result = page.evaluate(CHECKER, {"expectedId": "one"})
        assert result["status"] == "unverified", result
        assert result["text"]["characters"] is None


def test_character_count_no_duplicates_hidden_notes_or_player_text(page):
    result = inspect(
        page,
        """<div><span>你好 AB12!</span></div><input value="CD">
        <span style="display:none">不统计</span><span style="visibility:hidden">不统计</span>""",
        extra="<aside>播放器和讲稿不统计</aside>",
    )
    assert result["text"]["textCharacters"] == 7
    assert result["text"]["inputCharacters"] == 2
    assert result["text"]["characters"] == 9
    assert result["text"]["maximum"] is None
    assert result["text"]["exceeded"] is None


def test_page_id_cannot_be_borrowed_from_an_unrelated_element(page):
    inspect(page, extra='<aside data-scene-id="one">Other state</aside>')
    page.locator("main").evaluate("e => e.removeAttribute('data-scene-id')")
    result = page.evaluate(CHECKER, {"expectedId": "one"})
    assert result["status"] == "unverified"
    assert result["text"]["characters"] is None


def test_display_contents_text_is_counted_once(page):
    result = inspect(page, '<div style="display:contents">直接文字<span>嵌套</span></div>')
    assert result["text"]["characters"] == 6


def test_explicit_limit_and_separate_interaction_states(page):
    result = inspect(
        page, "<button onclick=\"this.textContent='更多文字'\">短</button>", maximum=2
    )
    assert result["text"]["characters"] == 1
    assert result["status"] == "passed"
    page.locator("button").click()
    changed = page.evaluate(CHECKER, {"expectedId": "one", "maxChars": 2})
    assert changed["text"]["characters"] == 4
    assert changed["text"]["exceeded"] is True
    assert changed["status"] == "failed"


def test_canvas_only_text_is_unverified_not_zero(page):
    result = inspect(page, '<canvas width="300" height="150"></canvas>')
    assert result["status"] == "unverified"
    assert result["text"]["characters"] is None
    assert result["warnings"]


def test_ellipsis_is_risk_not_deterministic_error(page):
    result = inspect(page, '<p style="text-overflow:ellipsis">短文</p>')
    assert result["status"] == "passed"
    assert any(w["kind"] == "possible-truncation" for w in result["warnings"])


def test_visible_overflow_is_a_warning_not_a_deterministic_error(page):
    result = inspect(
        page,
        '<p style="width:30px;white-space:nowrap;overflow:visible">可见文字超出容器但未越出画布</p>',
    )
    assert result["status"] == "passed"
    assert any(w["kind"] == "internal-overflow-risk" for w in result["warnings"])


def test_browser_failure_is_an_execution_error_not_success(
    tmp_path, monkeypatch, capsys
):
    monkeypatch.setattr(
        capture_slides, "resolve_module", lambda _: (tmp_path, "demo", "uuid")
    )

    def blocked(*args, **kwargs):
        raise RuntimeError("Chromium unavailable")

    monkeypatch.setattr(capture_slides, "browser_session", blocked)
    assert capture_slides.main(["--module", "demo", "--slide", "one"]) == 2
    import json

    result = json.loads(capsys.readouterr().out)
    assert result["status"] == "error"
    assert "Chromium unavailable" in result["error"]
    assert not list(tmp_path.iterdir())
