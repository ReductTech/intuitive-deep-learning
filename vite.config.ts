import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [fixedLessonCanvas(), react()],
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        webPpt: 'web_ppt/index.html',
        webPptSlide: 'web_ppt/slide.html',
      },
    },
  },
  server: {
    // Windows 上 localhost 可能先解析到 ::1；单个双栈监听让 localhost 与 127.0.0.1 始终落到同一台开发服务器。
    host: '::',
    port: 5173,
    strictPort: true,
    proxy: {
      '/__telemetry': {
        target: 'http://127.0.0.1:59411',
        changeOrigin: true,
      },
    },
  },
});
