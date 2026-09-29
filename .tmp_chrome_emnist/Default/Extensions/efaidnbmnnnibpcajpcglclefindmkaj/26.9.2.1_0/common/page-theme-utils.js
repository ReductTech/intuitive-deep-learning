/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property laws,
* including trade secret and or copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
function e(e,t){if(!t?.getComputedStyle)return null;const n=t.getComputedStyle(e).backgroundColor;if(!n)return null;const r=n.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);if(!r)return null;if((void 0!==r[4]?parseFloat(r[4]):1)<.1)return null;return(299*parseInt(r[1],10)+587*parseInt(r[2],10)+114*parseInt(r[3],10))/255e3}export function detectPageTheme({contextEl:t=null,doc:n=document}={}){const r=n.defaultView;try{if(t){let l=t.parentElement||t;for(;l&&l!==n.documentElement;){const t=e(l,r);if(null!==t)return t<.5?"dark":"light";l=l.parentElement}}const l=function(e,...t){return e?.getComputedStyle&&t.map(t=>{if(!t)return null;const n=(e.getComputedStyle(t).colorScheme||"").toLowerCase().trim();if(!n||"normal"===n)return null;const r=/\bdark\b/.test(n),l=/\blight\b/.test(n);return r&&!l?"dark":l&&!r?"light":null}).find(Boolean)||null}(r,n.documentElement,n.body);if(l)return l;const o=[n.body,n.documentElement].find(t=>t&&null!==e(t,r));if(o){return e(o,r)<.5?"dark":"light"}}catch{}return r?.matchMedia?.("(prefers-color-scheme: dark)")?.matches?"dark":"light"}export function createPageThemeWatcher({contextEl:e=null,onChange:t,doc:n=document,debounceMs:r=75}){const l=n.defaultView;let o=null,u=null,c=null,d=null;const a=()=>{const r=detectPageTheme({contextEl:e,doc:n});return r===o||(o=r,t(r)),r},s=()=>{clearTimeout(u),u=setTimeout(a,r)};return{start:()=>c?o??detectPageTheme({contextEl:e,doc:n}):(o=detectPageTheme({contextEl:e,doc:n}),d=l?.matchMedia?.("(prefers-color-scheme: dark)"),d?.addEventListener("change",s),c=new MutationObserver(s),n.documentElement&&c.observe(n.documentElement,{attributes:!0}),n.body&&c.observe(n.body,{attributes:!0}),o),stop:()=>{clearTimeout(u),u=null,d?.removeEventListener("change",s),c?.disconnect(),c=null,d=null}}}