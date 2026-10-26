import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {courseLibraryPlugin,courseLibraryRoot} from './course-library-vite';
const root=process.cwd(),library=courseLibraryRoot(root,process.env.IDL_COURSE_LIBRARY_ROOT||'locked');
export default defineConfig({plugins:[courseLibraryPlugin(root,library),react(),tailwindcss()],publicDir:false,server:{host:'127.0.0.1',port:5178,strictPort:true}});
