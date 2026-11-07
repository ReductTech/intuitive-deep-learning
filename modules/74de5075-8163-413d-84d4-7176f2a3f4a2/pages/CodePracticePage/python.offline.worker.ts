import prelude from './pythonPrelude.py?raw';
import type { PyodideInterface } from 'pyodide';

// Exported into the ZIP separately; the online Worker never imports this file.
let python: PyodideInterface;
let ready: Promise<void> | undefined;
const base = 'https://offline.invalid/python/';

async function initialize(assets: Record<string, string>) {
  postMessage({ type: 'status', message: '正在加载离线 Python 运行时' });
  const nativeFetch = self.fetch.bind(self);
  const read = (name: string) => {
    if (!assets[name]) throw new Error(`离线 Python 资源缺失：${name}，请重新下载课件。`);
    return nativeFetch(assets[name]);
  };
  const moduleUrl = async (name: string) => URL.createObjectURL(new Blob([await (await read(name)).text()], { type: 'text/javascript' }));
  const loaderUrl = await moduleUrl('pyodide.mjs');
  const wasmScriptUrl = await moduleUrl('pyodide.asm.mjs');
  const wasm = await (await read('pyodide.asm.wasm')).arrayBuffer();
  const lock = await (await read('pyodide-lock.json')).json();
  // Package URLs keep their original wheel filenames; only their transport changes.
  self.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(base)) return read(url.slice(base.length));
    if (url.startsWith('blob:') || url.startsWith('data:')) return nativeFetch(input, init);
    return Promise.reject(new Error(`离线运行禁止访问网络：${url}`));
  };
  try {
    const { loadPyodide } = await import(/* @vite-ignore */ loaderUrl);
    const { default: createModule } = await import(/* @vite-ignore */ wasmScriptUrl);
    python = await loadPyodide({
      indexURL: base, packageBaseUrl: base, cdnUrl: base,
      lockFileContents: lock, stdLibURL: assets['python_stdlib.zip'], stdin: () => null,
      createPyodideModule: (settings: Record<string, unknown>) => createModule({ ...settings, wasmBinary: new Uint8Array(wasm) }),
    });
    postMessage({ type: 'status', message: '正在加载离线 NumPy' });
    await python.loadPackage('numpy');
    await python.runPythonAsync(prelude);
    postMessage({ type: 'ready' });
  } finally {
    URL.revokeObjectURL(loaderUrl); URL.revokeObjectURL(wasmScriptUrl);
  }
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (data.type === 'init' && !ready) {
    ready = initialize(data.assets);
    ready.catch(error => postMessage({ type: 'init-error', error: String(error) }));
  }
  if (data.type === 'run' && ready) {
    ready.then(() => {
      const execute = python.globals.get('_run_student');
      try { postMessage({ type: 'result', id: data.id, execution: JSON.parse(execute(data.source)) }); }
      catch (error) { postMessage({ type: 'result', id: data.id, execution: { ok: false, graph: null, result: null, stdout: '', stderr: '', error: String(error) } }); }
      finally { execute.destroy(); }
    }).catch(() => { /* Initialization reports its own error. */ });
  }
};
