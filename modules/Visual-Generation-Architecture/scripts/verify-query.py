"""Real pointer/keyboard regression for slide 4, including scaled SceneDeck."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect

module = Path(__file__).resolve().parents[1]
root = module.parents[1]
out = module / 'assets/scenedeck-thumbnails/text-cross-attention'
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width':1600, 'height':900}, reduced_motion='reduce')
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:5180/visual-architecture.html?scenedeckCapture=1&slide=text-cross-attention')
    surface = page.get_by_test_id('query-surface')
    surface.wait_for()

    def cell(col, row):
        b = surface.bounding_box()
        return b['x'] + (col+.5)*b['width']/16, b['y'] + (row+.5)*b['height']/16

    def position(col, row):
        expect(surface).to_have_attribute('data-query-col', str(col))
        expect(surface).to_have_attribute('data-query-row', str(row))
        weights = [int(page.get_by_test_id(f'query-weight-{i}').inner_text().strip('%')) for i in range(3)]
        assert sum(weights) == 100
        return weights

    assert position(5,5) == [78,12,10]
    # Click a non-preset location: the cursor moves and weights interpolate.
    page.mouse.click(*cell(7,6))
    interpolated = position(7,6)
    assert interpolated not in ([78,12,10],[8,30,62],[20,55,25])
    page.mouse.click(*cell(11,12))
    assert position(11,12) == [8,30,62]
    page.screenshot(path=str(out/'query-click-book.png'))

    # Capture the pointer and drag from the book to the background.
    page.mouse.move(*cell(11,12))
    page.mouse.down()
    page.mouse.move(*cell(1,1), steps=12)
    page.mouse.up()
    assert position(1,1) == [20,55,25]
    assert 'is-dragging' not in surface.get_attribute('class')
    page.screenshot(path=str(out/'query-drag-background.png'))

    # Drag past the image; the query stays at the nearest legal cell.
    page.mouse.move(*cell(1,1)); page.mouse.down()
    b = surface.bounding_box()
    page.mouse.move(b['x']+b['width']+100, b['y']-100, steps=8)
    page.mouse.up()
    position(15,0)
    surface.press('ArrowLeft'); surface.press('ArrowDown')
    position(14,1)
    surface.press('Home'); position(0,0)
    surface.press('End'); position(15,15)
    page.get_by_test_id('region-face').click(); position(5,5)
    page.get_by_test_id('region-book').click(); position(11,12)

    # Inspect actual interactive overlays, including the source-aligned Query surface.
    overflow = page.evaluate('''() => [...document.querySelectorAll('.vgr-query-surface,.vgr-query-weights,.vgr-controls')].flatMap(p => {
      const b=p.getBoundingClientRect();
      return [...p.querySelectorAll('*')].filter(e => {
        if (!(e instanceof HTMLElement)) return false;
        const r=e.getBoundingClientRect(),s=getComputedStyle(e);
        return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0 &&
          (r.left<b.left-1 || r.right>b.right+1 || r.top<b.top-1 || r.bottom>b.bottom+1);
      }).map(e => e.className);
    })''')
    assert not overflow, overflow

    # The real player scales the 1600x900 canvas; coordinates must still work.
    page.set_viewport_size({'width':1280,'height':800})
    page.goto('http://127.0.0.1:5180/visual-architecture.html?slide=text-cross-attention')
    surface.wait_for()
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(800)
    page.mouse.click(*cell(8,7)); position(8,7)
    page.mouse.move(*cell(8,7)); page.mouse.down()
    page.mouse.move(*cell(11,12), steps=10); page.mouse.up()
    assert position(11,12) == [8,30,62]
    surface.press('ArrowLeft'); position(10,12)
    assert 'text-cross-attention' in page.url, 'Arrow keys moved the deck instead of the query'
    page.screenshot(path=str(out/'query-scaled-player.png'))
    assert not errors, errors
    print(json.dumps({'click':True, 'drag':True, 'interpolation':interpolated, 'clampedDrag':True, 'keyboard':True, 'scaledPlayer':True, 'overlayOverflow':overflow, 'pageErrors':errors}))
    browser.close()
