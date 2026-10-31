import {pythonRuntime} from './scripts/python-runtime-vite';
import {offlinePreview} from './scripts/offline-preview-vite';
import {browserOffline} from './scripts/browser-offline-vite';
import {localNarration} from './scripts/narration-vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { editDeckPlugin } from './deprecated/Edit-Deck/server';
import { creatorSkillDocuments } from './modules/Creator-Guide/skillDocumentsPlugin';
import {courseLibraryRoot,courseLibraryPlugin} from './scripts/course-library-vite';
import {localModuleAssets} from './scripts/module-assets.mjs';

function creatorCapture(root: string): Plugin {
  return {name:'creator-capture',apply:'serve',configureServer(server){
    server.middlewares.use('/__creator_capture__/info',(_req,res)=>{
      res.setHeader('Content-Type','application/json');
      res.setHeader('Cache-Control','no-store');
      res.end(JSON.stringify({kind:'creator-capture',root}));
    });
  }};
}

function cloudRuntime(root: string): Plugin {
  const candidates = process.env.IDL_CLOUD_REPOSITORY
    ? [process.env.IDL_CLOUD_REPOSITORY]
    : [path.resolve(root, '../cloud-intuitive-deep-learning'), path.resolve(root, '..')];
  const cloud = candidates.find(candidate => fs.existsSync(path.join(candidate, 'frontend/cloud-runtime.js')));
  if (!cloud) throw new Error('找不到 Cloud 仓库，请设置 IDL_CLOUD_REPOSITORY；本地开发使用同一套 Cloud API。');
  const runtime = path.join(cloud, 'frontend/cloud-runtime.js');
  return {
    name: 'shared-cloud-runtime',
    apply: 'serve',
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { src: '/__cloud-runtime.js' }, injectTo: 'head-prepend' }];
    },
    configureServer(server) {
      server.middlewares.use('/__cloud-runtime.js', (_request, response) => {
        response.setHeader('Content-Type', 'application/javascript');
        response.setHeader('Cache-Control', 'no-store');
        response.end(fs.readFileSync(runtime, 'utf8'));
      });
    },
  };
}

function fixedLessonCanvas(): Plugin {
  return {
    name: 'fixed-lesson-canvas',
    enforce: 'pre',
    transform(source, id) {
      const path = id.split('?')[0].replaceAll('\\', '/');
      if (!/\/modules\/(?!shared\/)[^/]+\/pages\/.*\.css$/.test(path)) return null;

      // 禁止修改缩放机制：模块页面只按 1600 × 900 画布排版，视口变化只缩放外层画布。
      const css = source.replace(
        /@media\s*\(\s*(max|min)-width\s*:\s*([^)]+)\)/g,
        (_, boundary: string, value: string) => `@container lesson-slide (${boundary}-width: ${value.trim()})`,
      );
      if (/@media[^{}]*\b(?:width|height|orientation|aspect-ratio)\b/.test(css)) {
        throw new Error(`课件页面不能使用视口断点：${path}。请使用固定画布容器规则。`);
      }
      return css === source ? null : { code: css, map: null };
    },
  };
}

/** Course images must stay on the configured asset host, not in the app bundle. */
function externalCourseImages(): Plugin {
  const image = /\.(?:png|jpe?g|webp|gif|svg|avif|bmp|ico)(?:\?|$)/i;
  return {
    name: 'external-course-images',
    apply: 'build',
    generateBundle(_options, bundle) {
      const imported = [...this.getModuleIds()].filter(id => {
        const normalized = id.replaceAll('\\', '/');
        return /\/(?:modules|src)\//.test(normalized) && !normalized.includes('/node_modules/') && image.test(normalized);
      });
      const emitted = Object.values(bundle).filter(item => item.type === 'asset' && image.test(item.fileName));
      if (imported.length || emitted.length) {
        this.error(`课程图片必须使用 moduleAssetUrl，禁止打包进前端：\n${[...imported, ...emitted.map(item => item.fileName)].join('\n')}`);
      }
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const localPreview = mode === 'public-preview' || (command === 'serve' && mode === 'preview');
  const captureOnly = process.env.IDL_CAPTURE_ONLY === '1';
  const assetBaseUrl = loadEnv(mode, '.', '').VITE_ASSET_BASE_URL?.trim();
  const library=courseLibraryRoot(__dirname,process.env.IDL_COURSE_LIBRARY_ROOT||loadEnv(mode,'.','').IDL_COURSE_LIBRARY_ROOT);
  return {
    ...(captureOnly ? {
      cacheDir: 'node_modules/.vite-capture',
      optimizeDeps: {
        entries: ['creator-skill/scripts/common/_capture_entry.html'],
        include: ['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','@icon-park/react','lucide-react','@codemirror/state','@codemirror/view','@codemirror/language','@codemirror/lang-python','@codemirror/lint','@codemirror/autocomplete','@lezer/highlight'],
        holdUntilCrawlEnd: false,
      },
    } : {}),
    plugins: [creatorCapture(__dirname),pythonRuntime(__dirname),localModuleAssets(library),courseLibraryPlugin(__dirname,library),...(captureOnly?[]:[browserOffline(__dirname,library),offlinePreview(__dirname,library)]),...(localPreview&&!captureOnly?[localNarration(__dirname)]:[]),...(localPreview ? [{
      name: 'local-course-preview',
      transformIndexHtml(html: string) {
        return html.replace('<script src="/modules/shared/telemetry.js"></script>', '');
      },
    }] : [editDeckPlugin()]), creatorSkillDocuments(), fixedLessonCanvas(), externalCourseImages(), react(), tailwindcss(), ...(command === 'serve'&&!captureOnly ? [cloudRuntime(__dirname)] : [])],
    publicDir: false,
    resolve: {dedupe:['react','react-dom','three','@icon-park/react']},
    build: {
      copyPublicDir: !assetBaseUrl,
      rollupOptions: {
        input: {
          app: 'index.html',
          visualFeatureGame: 'modules/Visual-Feature-Learning/game/index.html',
          visualFeatureGameEditor: 'modules/Visual-Feature-Learning/game/level-editor.html',
          visualFeatureGameDebug: 'modules/Visual-Feature-Learning/game/game-debug.html',
        },
      },
    },
    server: {
      // Windows 上 localhost 可能先解析到 ::1；单个双栈监听让 localhost 与 127.0.0.1 始终落到同一台开发服务器。
      host: '::',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/shuku': { target: process.env.SHUKU_API_URL || 'http://127.0.0.1:8010', changeOrigin: true },
        '/api': {
          target: process.env.IDL_LOCAL_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/__telemetry': {
          target: 'http://127.0.0.1:59411',
          changeOrigin: true,
        },
      },
    },
  };
});
