"""Exercise warm navigation, state reset, readiness and early render failures."""
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
from media import capture_slides as capture

HTML = '''<!doctype html><style>html,body{margin:0}main{width:1600px;height:900px}</style>
<script>
window.__IDL_CAPTURE_NAVIGATE__ = id => {
  const color = id === 'two' ? 'green' : 'red';
  document.body.innerHTML = `<main class="ppt-slide-surface" data-scene-deck-capture
    data-deck-id="fixture" data-scene-id="${id || 'one'}" data-scene-ids='["one","two"]'
    style="background:${color}"><button onclick="this.parentNode.style.background='blue';this.textContent='changed'">default</button>
    <span data-capture-ready="false">Waiting for initial work</span></main>`;
  const ready = document.querySelector('[data-capture-ready]');
  setTimeout(() => ready.dataset.captureReady = 'true', 350);
};
addEventListener('DOMContentLoaded', () => window.__IDL_CAPTURE_NAVIGATE__(new URLSearchParams(location.search).get('slide')));
</script>'''


@pytest.fixture
def runtime():
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            content = HTML if '/error/' not in self.path else '<script>window.__IDL_CAPTURE_ERROR__="Intentional render failure"</script>'
            self.wfile.write(content.encode())

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with capture.browser_session(f'http://127.0.0.1:{server.server_port}') as (context, url):
            context._idl_reuse_capture = True
            yield context, url
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def test_one_loaded_document_resets_state_and_waits_until_ready(runtime):
    context, url = runtime
    assert capture.scene_ids(context, url, 'fixture') == ['one', 'two']
    warm_page = context._idl_capture_page
    first = capture.capture_slide(context, url, 'fixture', 'one', None)
    assert first.getpixel((1000, 500)) == (255, 0, 0)
    assert warm_page.locator('[data-capture-ready]').get_attribute('data-capture-ready') == 'true'
    changed = capture.capture_slide(context, url, 'fixture', 'one', None, [{'action': 'click', 'selector': 'button'}])
    assert changed.getpixel((1000, 500)) == (0, 0, 255)
    reset = capture.capture_slide(context, url, 'fixture', 'one', None)
    assert reset.getpixel((1000, 500)) == (255, 0, 0)
    assert warm_page.locator('button').inner_text() == 'default'
    second = capture.capture_slide(context, url, 'fixture', 'two', None)
    assert second.getpixel((1000, 500)) == (0, 128, 0)
    assert context._idl_capture_page is warm_page
    assert context.pages == [warm_page]


def test_render_error_is_reported_instead_of_waiting_for_missing_surface(runtime):
    context, url = runtime
    with pytest.raises(RuntimeError, match='Intentional render failure'):
        capture.open_capture(context, url + '/error/')
    assert context.pages == []
