"""Verify the standalone build serves every slide image and formula font locally."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

module = Path(__file__).resolve().parents[1]
root = module.parents[1]
outline = json.loads((module / 'outlines.json').read_text(encoding='utf-8'))
assert not (root / 'assets' / outline['moduleIdentity']['id']).exists()

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root / 'dist-visual-architecture')))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(reduced_motion='reduce')
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        for row in outline['pages']:
            page.goto(f'http://127.0.0.1:{server.server_port}/visual-architecture.html?scenedeckCapture=1&slide={row["id"]}')
            page.locator('.vgr-page').wait_for()
            page.wait_for_timeout(500)
            assert not page.locator('img').evaluate_all('els=>els.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)'), row['id']
            assert not page.locator('img').evaluate_all('els=>els.filter(i=>i.src.includes("0fd05cd8")).map(i=>i.src)')
            page.evaluate('document.fonts.ready')
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
print(json.dumps({'productionPages':len(outline['pages']), 'images':'PASS', 'formulaFonts':'PASS', 'browserErrors':errors}))
