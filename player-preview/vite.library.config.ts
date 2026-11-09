import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
 build:{emptyOutDir:false,lib:{entry:fileURLToPath(new URL('./src/index.ts',import.meta.url)),formats:['es'],fileName:()=> 'index.js',cssFileName:'style'},
  rollupOptions:{external:id=>id==='react'||id.startsWith('react/')||id==='react-dom'||id.startsWith('react-dom/')}}
});
