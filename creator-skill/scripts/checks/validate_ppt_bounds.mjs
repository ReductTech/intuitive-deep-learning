/** Check rendered slide bounds through an existing Chromium debugging session.
 * Reads: requested live slides. Writes: none; owns and closes only its inspection tabs.
 */
import { emitResult, isMain, parseOptions, printHelp, reportError } from '../common/_cli.mjs';
export function buildParser() {
    return {
        help: { type: 'boolean', short: 'h', description: 'show help without contacting Chromium' },
        url: { type: 'string', description: 'lesson URL; falls back to PPT_LESSON_URL' },
        slides: { type: 'string', description: 'comma-separated scene IDs; default currently selected slide' },
        surface: { type: 'string', default: '.ppt-slide-surface', description: 'actual slide container CSS selector' },
        port: { type: 'string', description: 'existing Chromium debugging port; default PPT_DEBUG_PORT or 9223' },
    };
}
async function createTab(url, debugPort) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT', signal: AbortSignal.timeout(10000) });
    if (!response.ok)
        throw new Error(`Cannot create browser tab: ${response.status}`);
    return response.json();
}
export async function auditSlide(id, { lessonUrl, debugPort, surfaceSelector }) {
    const url = new URL(lessonUrl);
    if (id !== null)
        url.searchParams.set('slide', id);
    const tab = await createTab(url.toString(), debugPort);
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
            if (!resolve)
                return;
            pending.delete(message.id);
            clearTimeout(resolve.timer);
            if (message.error)
                resolve.reject(new Error(message.error.message || JSON.stringify(message.error)));
            else
                resolve(message);
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
        await send('Runtime.evaluate', { expression: "document.fonts.ready", awaitPromise: true });
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
    }
    finally {
        socket?.close();
        await fetch(`http://127.0.0.1:${debugPort}/json/close/${tab.id}`, { signal: AbortSignal.timeout(5000) }).catch(() => { });
    }
}
export async function main(argv = process.argv.slice(2)) {
    try {
        const options = buildParser();
        const args = parseOptions(argv, options);
        if (args.help) {
            printHelp('Requires an existing Chromium debugging session and running course server; starts neither.', options);
            return 0;
        }
        const settings = {
            lessonUrl: args.url || process.env.PPT_LESSON_URL,
            debugPort: args.port || process.env.PPT_DEBUG_PORT || '9223',
            surfaceSelector: args.surface,
        };
        if (!settings.lessonUrl)
            throw new Error('Provide --url or PPT_LESSON_URL; no course URL is assumed.');
        new URL(settings.lessonUrl);
        if (!/^\d+$/.test(settings.debugPort) || Number(settings.debugPort) < 1 || Number(settings.debugPort) > 65535) {
            throw new Error('--port must be an integer from 1 to 65535.');
        }
        const ids = args.slides ? args.slides.split(',').filter(Boolean) : [null];
        if (!ids.length)
            throw new Error('--slides must contain at least one scene ID.');
        const slides = [];
        for (const id of ids)
            slides.push({ id, ...await auditSlide(id, settings) });
        const failed = slides.some(slide => slide.error || slide.overflowCount > 0);
        emitResult({ slides }, failed ? 'failed' : 'passed');
        return failed ? 1 : 0;
    }
    catch (error) {
        return reportError(error);
    }
}
if (isMain(import.meta.url))
    process.exitCode = await main();
