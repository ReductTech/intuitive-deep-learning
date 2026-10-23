import { parseArgs } from 'node:util';

const {values} = parseArgs({options: {
  help: {type: 'boolean'}, url: {type: 'string'}, slides: {type: 'string'},
  surface: {type: 'string'}, port: {type: 'string'},
}});
if (values.help) {
  console.log('Usage: node creator-skill/scripts/validate_ppt_bounds.mjs --url <lesson-url> [--slides id1,id2] [--surface .selector] [--port 9223]');
  console.log('Requires an existing Chromium remote-debugging session and a running course server. Does not start either.');
  process.exit(0);
}
const debugPort = values.port || process.env.PPT_DEBUG_PORT || '9223';
const lessonUrl = values.url || process.env.PPT_LESSON_URL;
const surfaceSelector = values.surface || '.ppt-slide-surface';
const slideIds = values.slides ? values.slides.split(',').filter(Boolean) : [null];
if (!lessonUrl) throw new Error('Provide --url or PPT_LESSON_URL; no course URL is assumed.');
new URL(lessonUrl);

async function createTab(url) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Cannot create browser tab: ${response.status}`);
  return response.json();
}

async function auditSlide(id) {
  const url = new URL(lessonUrl);
  if (id !== null) url.searchParams.set('slide', id);
  const tab = await createTab(url.toString());
  let socket;
  try {
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP connection timed out')), 10000);
    socket.onopen = () => { clearTimeout(timer); resolve(); };
    socket.onerror = event => { clearTimeout(timer); reject(event); };
  });

  let sequence = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (!resolve) return;
    pending.delete(message.id);
    clearTimeout(resolve.timer);
    if (message.error) resolve.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else resolve(message);
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++sequence;
    resolve.reject = reject;
    resolve.timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timed out: ${method}`)); }, 10000);
    pending.set(requestId, resolve);
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });

  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
  await send('Runtime.evaluate', {expression: "document.fonts.ready", awaitPromise: true});
  const expression = `(() => {
    const surface = document.querySelector(${JSON.stringify(surfaceSelector)});
    if (!surface) return { error: 'missing slide surface' };
    const surfaceRect = surface.getBoundingClientRect();
    const overflow = [];
    for (const element of surface.querySelectorAll('*')) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (
        rect.left < surfaceRect.left - 0.5 ||
        rect.top < surfaceRect.top - 0.5 ||
        rect.right > surfaceRect.right + 0.5 ||
        rect.bottom > surfaceRect.bottom + 0.5
      ) {
        overflow.push({
          tag: element.tagName,
          className: String(element.className?.baseVal ?? element.className).slice(0, 80),
          left: +(rect.left - surfaceRect.left).toFixed(1),
          top: +(rect.top - surfaceRect.top).toFixed(1),
          right: +(rect.right - surfaceRect.right).toFixed(1),
          bottom: +(rect.bottom - surfaceRect.bottom).toFixed(1),
        });
      }
    }
    return {
      viewport: { width: innerWidth, height: innerHeight },
      surface: { width: surfaceRect.width, height: surfaceRect.height },
      scroll: { width: surface.scrollWidth, height: surface.scrollHeight },
      descendants: surface.querySelectorAll('*').length,
      overflowCount: overflow.length,
      overflow: overflow.slice(0, 12),
    };
  })()`;
  const response = await send('Runtime.evaluate', { expression, returnByValue: true });
  return response.result.result.value ?? {
    error: response.result.exceptionDetails?.text ?? response.result.result.description ?? 'Evaluation failed',
  };
  } finally {
    socket?.close();
    await fetch(`http://127.0.0.1:${debugPort}/json/close/${tab.id}`, {signal: AbortSignal.timeout(5000)}).catch(() => {});
  }
}

let failed = false;
for (const id of slideIds) {
  const result = await auditSlide(id);
  console.log(JSON.stringify({ id, ...result }));
  if (result.error || result.overflowCount > 0) failed = true;
}

if (failed) process.exitCode = 1;
