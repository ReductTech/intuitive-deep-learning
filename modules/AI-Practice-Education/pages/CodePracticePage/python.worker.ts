import prelude from './pythonPrelude.py?raw';
import metadata from 'pyodide/package.json';
import type { PyodideInterface } from 'pyodide';

const runtimeURL = new URL(`${import.meta.env.BASE_URL}python-runtime/${metadata.version}/`, self.location.origin).href;
let python: PyodideInterface;
const ready = (async () => {
  postMessage({ type: 'status', message: '正在加载 Python 运行时' });
  const { loadPyodide } = await import(/* @vite-ignore */ `${runtimeURL}pyodide.mjs`) as typeof import('pyodide');
  python = await loadPyodide({ indexURL: runtimeURL, stdin: () => null });
  postMessage({ type: 'status', message: '正在加载 NumPy' });
  await python.loadPackage('numpy');
  await python.runPythonAsync(prelude);
  postMessage({ type: 'ready' });
})().catch(error => postMessage({ type: 'init-error', error: String(error) }));

// Serialize execution; each program gets a fresh Python namespace.
let queue = ready;
self.onmessage = (event: MessageEvent<{ type: string; id: number; source: string }>) => {
  if (event.data.type !== 'run') return;
  const { id, source } = event.data;
  queue = queue.then(() => {
    const execute = python.globals.get('_run_student');
    try { postMessage({ type: 'result', id, execution: JSON.parse(execute(source)) }); }
    catch (error) { postMessage({ type: 'result', id, execution: { ok: false, graph: null, result: null, stdout: '', stderr: '', error: String(error) } }); }
    finally { execute.destroy(); }
  });
};
