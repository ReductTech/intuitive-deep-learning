import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import outline from '../outlines.json';

const root = fileURLToPath(new URL('../assets/', import.meta.url));

const assetId = outline.moduleIdentity.id;

// Include this course's resources in its standalone review build.
export default defineConfig({
  plugins: [react(), {
    name: 'data-annotation-course-assets',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const prefix = `/${assetId}/`;
        if (request.url?.startsWith(prefix)) {
          const file = resolve(root, decodeURIComponent(request.url.slice(prefix.length).split('?')[0]));
          if (file.startsWith(root)) request.url = '/@fs/' + file;
        }
        next();
      });
    },
    async generateBundle() {
      const emitDirectory = async (directory: string): Promise<void> => {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const path = resolve(directory, entry.name);
          if (entry.isDirectory()) await emitDirectory(path);
          else this.emitFile({ type: 'asset', fileName: `${assetId}/${relative(root, path)}`, source: await readFile(path) });
        }
      };
      await emitDirectory(root);
    },
  }],
  publicDir: false,
  define: { 'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify('/') },
  server: { host: '127.0.0.1', port: 5184, strictPort: true },
  build: {
    copyPublicDir: false,
    rollupOptions: { input: 'modules/Data-Annotation-Augmentation/preview.html' },
  },
});
