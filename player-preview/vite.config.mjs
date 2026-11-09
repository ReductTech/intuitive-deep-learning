import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv, normalizePath} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {readCourses, entryExport} from './scripts/courses.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const coursesRoot = path.resolve(root, '../modules');

export default defineConfig(({mode}) => {
  const env = {...loadEnv(mode, root, ''), ...process.env};
  const shukuRoot = path.resolve(root, env.SHUKU_ROOT || '../../Shuku');
  const runtime = path.join(shukuRoot, 'packages/course-runtime');
  const style = path.join(coursesRoot, 'shared');
  if (!fs.existsSync(path.join(runtime, 'react/index.ts')) || !fs.existsSync(path.join(style, 'react/presentation/SceneDeck.tsx'))) {
    throw Error(`未找到 Shuku 课程运行时：${runtime}。请在 .env.local 设置 SHUKU_ROOT。`);
  }
  const courses = readCourses(coursesRoot);
  const localPlayer = normalizePath(path.join(root, 'src/index.ts'));
  const runtimeReact = normalizePath(path.join(style, 'react'));
  const sharedRoot = normalizePath(path.join(coursesRoot, 'shared'));
  const plugin = {
    name: 'local-course-preview', enforce: 'pre',
    async resolveId(id, importer) {
      if (id.startsWith('virtual:preview-')) return '\0' + id;
      if (id === 'virtual:creator-skill-documents') return '\0preview-documents';
      if (id === '@preview/runtime') return path.join(style, 'react/presentation/index.ts');
      if (importer && (id.startsWith('.') || path.isAbsolute(id))) {
        const target = normalizePath(path.resolve(path.dirname(importer.split('?')[0]), id));
        // Reuse platform course components, but always use the player copied into this folder.
        if (target === normalizePath(path.join(shukuRoot, 'packages/player/src')) ||
            target === normalizePath(path.join(shukuRoot, 'packages/player/src/index.ts'))) return localPlayer;
        if (target === sharedRoot || target.startsWith(sharedRoot + '/')) {
          return this.resolve(target, importer, {skipSelf: true});
        }
      }
      // Courses and the external runtime must resolve packages from this project's node_modules.
      if (importer && !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0') &&
          !id.startsWith('virtual:') && !id.startsWith('node:') && !/^[A-Za-z]:/.test(id)) {
        return this.resolve(id, path.join(root, 'package.json'), {skipSelf: true});
      }
    },
    load(id) {
      if (id === '\0virtual:preview-catalog') return `export default ${JSON.stringify(courses.map(({directory, ...course}) => course))};`;
      if (id === '\0preview-documents') {
        const creator = courses.find(course => course.alias === 'creator-guide');
        const file = creator && path.join(creator.directory, 'assets/creator-skill-documents.json');
        return `export default ${file && fs.existsSync(file) ? JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8')).documents || []) : '[]'};`;
      }
      if (id.startsWith('\0virtual:preview-course:')) {
        const course = courses.find(course => course.id === id.slice('\0virtual:preview-course:'.length));
        if (!course) throw Error('未知课程');
        const imports = [];
        for (const [key, entry] of [['guide', course.entry], ['presentation', course.ppt?.entry]]) {
          imports.push(entry
            ? `import * as ${key} from ${JSON.stringify(normalizePath(path.join(course.directory, entry)))}; export {${key}};`
            : `export const ${key} = null;`);
        }
        imports.push(`export const guideExport = ${JSON.stringify(course.entry ? entryExport(course, course.entry) : '')};`);
        imports.push(`export const pptExport = ${JSON.stringify(course.ppt?.entry ? entryExport(course, course.ppt.entry) : '')};`);
        return imports.join('\n');
      }
    },
    configureServer(server) {
      server.watcher.add(courses.map(course => path.join(course.directory, 'outlines.json')));
      server.watcher.on('change', file => {
        if (file.endsWith('outlines.json')) void server.restart();
      });
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url || '/', 'http://localhost');
        // moduleAssetUrl(uuid, file) and assets inside standalone games stay local.
        let pathname;
        try { pathname = decodeURIComponent(url.pathname); } catch { return next(); }
        for (const course of courses) {
          const prefix = `/${course.assetId}/`;
          if (pathname.startsWith(prefix)) {
            const base = path.join(course.directory, 'assets');
            const file = path.resolve(base, pathname.slice(prefix.length));
            if (file.startsWith(base + path.sep)) request.url = '/@fs/' + normalizePath(file) + url.search;
            break;
          }
        }
        next();
      });
    },
    transform(code, id) {
      const file = normalizePath(id.split('?')[0]);
      // Match the platform's fixed 1600×900 slide layout rather than browser width.
      if (file.startsWith(normalizePath(coursesRoot) + '/') && /\/pages\/.*\.css$/.test(file)) {
        return {code: code.replace(/@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,
          (_, boundary, value) => `@container lesson-slide (${boundary}-width: ${value.trim()})`), map: null};
      }
    },
  };
  return {
    root, envDir: root, publicDir: false,
    cacheDir: path.join(root, 'node_modules/.vite'),
    plugins: [plugin, react(), tailwind()],
    resolve: {
      dedupe: ['react', 'react-dom', 'lucide-react'],
      alias: [
        {find: '@shuku/course-runtime', replacement: normalizePath(runtime)},
        {find: '@shuku/course-style', replacement: normalizePath(style)},
        {find: '@shuku/player', replacement: localPlayer},
        {find: '@preview/runtime', replacement: runtimeReact + '/presentation/index.ts'},
        {find: '@preview/runtime-styles', replacement: normalizePath(path.join(style, 'vendor/mathlive/mathlive-fonts.css'))},
      ],
    },
    define: {
      'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(''),
      'import.meta.env.VITE_LLM_SERVICE_URL': JSON.stringify('/api/ai'),
    },
    server: {
      host: '127.0.0.1', port: 5174, strictPort: true,
      fs: {strict: true, allow: [root, coursesRoot, runtime, path.join(shukuRoot, 'packages/player')]},
      proxy: env.SHUKU_API_URL ? {'/api': {target: env.SHUKU_API_URL, changeOrigin: true}} : undefined,
    },
  };
});
