import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/** Serve the Python runtime as static assets in dev and in the production build. */
export function pythonRuntime(root: string): Plugin {
  const runtime = path.join(root, 'node_modules/pyodide');
  const version = JSON.parse(readFileSync(path.join(runtime, 'package.json'), 'utf8')).version;
  const lock = JSON.parse(readFileSync(path.join(runtime, 'pyodide-lock.json'), 'utf8'));
  const wheel = lock.packages.numpy.file_name;
  const files = new Map([
    ...['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'].map(name => [name, path.join(runtime, name)] as const),
    [wheel, path.join(root, 'modules/AI-Practice-Education/runtime/pyodide', wheel)],
  ]);
  const prefix = `/python-runtime/${version}/`;
  return {
    name: 'static-python-runtime',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(prefix)) return next();
        const filename = pathname.slice(prefix.length), file = files.get(filename);
        if (!file) { response.statusCode = 404; response.end(); return; }
        response.setHeader('Content-Type', filename.endsWith('.mjs') ? 'application/javascript' : filename.endsWith('.wasm') ? 'application/wasm' : filename.endsWith('.json') ? 'application/json' : 'application/octet-stream');
        response.setHeader('Cache-Control', 'public, max-age=3600');
        response.end(readFileSync(file));
      });
    },
    generateBundle() {
      for (const [name, file] of files) this.emitFile({ type: 'asset', fileName: `python-runtime/${version}/${name}`, source: readFileSync(file) });
    },
  };
}
