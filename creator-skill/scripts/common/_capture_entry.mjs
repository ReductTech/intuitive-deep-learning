/** Internal browser bootstrap for capture_slides.py, transformed by Vite. */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import RefreshRuntime from '/@react-refresh';
import '/modules/shared/react/styles.css';
import '/modules/shared/react/ui-kit.css';
import '/modules/shared/react/presentation.css';

if (!window.__vite_plugin_react_preamble_installed__) {
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => type => type;
  window.__vite_plugin_react_preamble_installed__ = true;
}
const { entry, component } = window.__IDL_CAPTURE_ENTRY__;
const fail = error => { window.__IDL_CAPTURE_ERROR__ = error.stack || String(error); throw error; };
const lesson = await import(/* @vite-ignore */ entry).catch(fail);
const exportName = Object.keys(lesson).find(name => name.toLowerCase() === component.toLowerCase());
const Component = lesson[exportName] || lesson.default;
if (typeof Component !== 'function') fail(Error(`PPT entry has no component export: ${component}`));
const root = createRoot(document.getElementById('root'), {
  onUncaughtError(error) { window.__IDL_CAPTURE_ERROR__ = error.stack || String(error); },
});
let generation = 0;
// Keep Vite's module graph and decoded assets warm, but remount the real page so
// local React state, effects and timers reset exactly as on a fresh navigation.
window.__IDL_CAPTURE_NAVIGATE__ = slide => {
  const url = new URL(location.href);
  if (slide) url.searchParams.set('slide', slide);
  else url.searchParams.delete('slide');
  history.replaceState(null, '', url);
  window.__IDL_CAPTURE_ERROR__ = null;
  flushSync(() => root.render(createElement(Component, { key: ++generation })));
};
window.__IDL_CAPTURE_NAVIGATE__(new URLSearchParams(location.search).get('slide'));
