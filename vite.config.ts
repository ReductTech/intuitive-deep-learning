import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/__telemetry': {
        target: 'http://127.0.0.1:59411',
        changeOrigin: true,
      },
    },
  },
});
