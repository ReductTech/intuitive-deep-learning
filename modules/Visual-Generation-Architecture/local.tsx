import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitectureGuide } from './ArchitectureGuide';

if (location.pathname.endsWith('/visual-architecture.html')) {
  createRoot(document.getElementById('root')!).render(<StrictMode><ArchitectureGuide /></StrictMode>);
}
