/** Check rendered slide bounds through an existing Chromium debugging session.
 * Reads: requested live slides. Writes: none; owns and closes only its inspection tabs.
 */
import { emitResult, isMain, parseOptions, printHelp, reportError } from '../common/_cli.mjs';
import {readFile} from 'node:fs/promises';
export function buildParser() {
    return {
        help: { type: 'boolean', short: 'h', description: 'show help without contacting Chromium' },
        url: { type: 'string', description: 'lesson URL; falls back to PPT_LESSON_URL' },
        slides: { type: 'string', description: 'comma-separated scene IDs; default currently selected slide' },
        surface: { type: 'string', default: '.ppt-slide-surface', description: 'actual slide container CSS selector' },
        port: { type: 'string', description: 'existing Chromium debugging port; default PPT_DEBUG_PORT or 9223' },
        'max-chars': {type: 'string', description: 'explicit per-state character limit; omitted means count without a limit'},
        timeout: {type: 'string', default: '15000', description: 'maximum readiness wait in milliseconds, 1..60000'},
    };
}
async function createTab(url, debugPort) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT', signal: AbortSignal.timeout(10000) });
    if (!response.ok)
        throw new Error(`Cannot create browser tab: ${response.status}`);
    return response.json();
}
export async function auditSlide(id, { lessonUrl, debugPort, surfaceSelector, maxChars = null, timeout = 15000 }) {
    const url = new URL(lessonUrl);
    if (id !== null)
        url.searchParams.set('slide', id);
    if (/\/scenedeck\/?$/.test(url.pathname)) url.searchParams.set('scenedeckCapture', '1');
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
        const checker = await readFile(new URL('../common/_page_checks.js', import.meta.url), 'utf8');
        const expression = `(${checker})(${JSON.stringify({surfaceSelector, expectedId: id ?? url.searchParams.get('slide'), maxChars})})`;
        const deadline = Date.now() + timeout;
        let result;
        do {
            const response = await send('Runtime.evaluate', {expression, returnByValue: true});
            if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text || 'Page inspection failed');
            result = response.result.result.value;
            if (!result || typeof result.ready !== 'boolean') throw new Error('Page inspection returned no valid result');
            if (result.ready || result.status === 'failed') return result;
            if (Date.now() >= deadline) break;
            await new Promise(resolve => setTimeout(resolve, 100));
        } while (true);
        return {...result, readinessTimedOut: true};
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
            maxChars: args['max-chars'] === undefined ? null : Number(args['max-chars']),
            timeout: Number(args.timeout),
        };
        if (!settings.lessonUrl)
            throw new Error('Provide --url or PPT_LESSON_URL; no course URL is assumed.');
        new URL(settings.lessonUrl);
        if (!/^\d+$/.test(settings.debugPort) || Number(settings.debugPort) < 1 || Number(settings.debugPort) > 65535) {
            throw new Error('--port must be an integer from 1 to 65535.');
        }
        if ((settings.maxChars !== null && (!/^\d+$/.test(args['max-chars']) || !Number.isSafeInteger(settings.maxChars))) ||
            !/^\d+$/.test(args.timeout) || settings.timeout < 1 || settings.timeout > 60000) {
            throw new Error('--max-chars must be a non-negative integer; --timeout must be 1..60000.');
        }
        const ids = args.slides ? args.slides.split(',').filter(Boolean) : [null];
        if (!ids.length)
            throw new Error('--slides must contain at least one scene ID.');
        const slides = [];
        for (const id of ids)
            slides.push({ id, ...await auditSlide(id, settings) });
        const failed = slides.some(slide => slide.status === 'failed');
        const unverified = slides.some(slide => slide.status === 'unverified' || slide.text?.status === 'unverified');
        emitResult({slides}, unverified ? 'unverified' : failed ? 'failed' : 'passed');
        return unverified ? 2 : failed ? 1 : 0;
    }
    catch (error) {
        return reportError(error);
    }
}
if (isMain(import.meta.url))
    process.exitCode = await main();
