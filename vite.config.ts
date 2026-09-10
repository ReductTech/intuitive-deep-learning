import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
      },
    },
  },
  server: {
    proxy: {
      '/__telemetry': {
        target: 'http://127.0.0.1:59411',
        changeOrigin: true,
      },
    },
  },
});
