import * as esbuild from 'esbuild-wasm';
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url';
import reactRuntime from 'virtual:edit-deck-react-runtime';

let initialized: Promise<void> | undefined;
export async function compileSlide(source: string) {
  initialized ??= esbuild.initialize({ wasmURL: wasmUrl }).catch(error => { initialized = undefined; throw error; });
  await initialized;
  const result = await esbuild.transform(source, {
    loader: 'tsx', format: 'iife', globalName: 'EditDeckSlide', target: 'es2022', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
  });
  // Generated slides are single-file React components. No arbitrary npm or filesystem imports.
  if (/\brequire\s*\(/.test(result.code) || /\bimport\s*\(/.test(result.code)) throw new Error('课件不能导入外部依赖，请使用提供的 React 和浏览器 API');
  return result.code;
}
const script = (source: string) => source.replace(/<\/script/gi, '<\\/script');
export function previewDocument(code: string, channel: string, editing = false, image = '') {
  const bridge = `
  const channel=${JSON.stringify(channel)};
  const notify=(kind,value)=>parent.postMessage({channel,kind,value},'*');
  window.addEventListener('error',e=>notify('error',String(e.message).slice(0,1000)));
  window.addEventListener('unhandledrejection',e=>notify('error',String(e.reason).slice(0,1000)));
  const React=globalThis.DeckReact;
  const {useState,useEffect,useRef,useMemo,useCallback,useReducer,useLayoutEffect}=React;
  const draftImage=${JSON.stringify(image)};
  ${code}
  try{if(typeof EditDeckSlide.default!=='function')throw new Error('请导出默认 React 组件');
  DeckCreateRoot(document.getElementById('root')).render(React.createElement(EditDeckSlide.default));
  requestAnimationFrame(()=>requestAnimationFrame(()=>notify('ready',null)));
  }catch(e){notify('error',String(e.message));}
  ${editing ? `
  let previous;
  document.addEventListener('pointerover',e=>{
    if(previous)previous.style.outline=previous.dataset.edOutline||'';
    const el=e.target;
    if(!(el instanceof HTMLElement)||el===document.body||el.id==='root')return;
    previous=el;el.dataset.edOutline=el.style.outline;el.style.outline='2px solid #6554ec';
  });
  document.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const el=e.target;if(!(el instanceof Element))return;
    let current=el;const parts=[];
    while(current&&current.id!=='root'&&current!==document.body){
      const tag=current.tagName.toLowerCase();const siblings=current.parentElement?[...current.parentElement.children].filter(s=>s.tagName===current.tagName):[];
      parts.unshift(tag+':nth-of-type('+(siblings.indexOf(current)+1)+')');current=current.parentElement;
    }
    notify('select',{tag:el.tagName.toLowerCase(),text:(el.textContent||'').slice(0,600),html:el.outerHTML.slice(0,1800),selector:'#root > '+parts.join(' > ')});
  },true);` : ''}
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1600"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>*{box-sizing:border-box}html,body,#root{margin:0;width:1600px;height:900px;overflow:hidden}body{background:#fff;font-family:Arial,'Microsoft YaHei',sans-serif}button,input{font:inherit}img,svg,canvas{max-width:100%}</style></head><body><div id="root"></div><script>${script(reactRuntime)}</script><script>${script(bridge)}</script></body></html>`;
}
export function downloadFile(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
