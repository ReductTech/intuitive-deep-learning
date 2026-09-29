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
!function(){const e=window.SummaryBarConfig.manager.fgFlag,t=window.SummaryBarConfig.manager.fgMetaStorageKey;let n=null,r=null;function o(e){return e?String(e).toLowerCase().replace(/^www\./,""):""}function c(e,t){const n=e?.siteInsertion;if(!n||"object"!=typeof n)return null;const r=o(t);if(!r)return null;const c=n[r];if(c?.selector)return c;const l=Object.keys(n).find(e=>{const t=n[e];return t?.selector&&function(e,t){return!(!e||!t)&&(e===t||e.endsWith(`.${t}`))}(r,o(e))});return l?n[l]:null}function l(e){const t=String(e||"").trim();if(!t)return null;const n=t.includes("::prepend")||t.includes("::before"),r=t.replace("::prepend","").replace("::before","").trim();return!r||/[<>'"]/u.test(r)?null:{query:r,insertBefore:n}}function i(e){let t;try{t=document.querySelector(e.query)}catch{return null}const n=t?.parentElement;return t&&n?{parent:n,before:e.insertBefore?t:t.nextElementSibling,preferArticleColumnWidth:!0}:null}function u(e,t=n??{}){const r=c(t,e);if(!r?.selector)return null;const o=l(r.selector);return o?i(o):null}window.SummaryBarInsertionMeta=Object.freeze({loadFgMeta:async function(){return n||(r||(r=(async()=>{let r=await chrome.runtime.sendMessage({main_op:"getFloodgateMeta",flag:e});if(!r&&"function"==typeof initDcLocalStorage)try{await initDcLocalStorage(),r=window.dcLocalStorage?.getItem?.(t)}catch{}return n=function(e){if(!e||"string"!=typeof e)return{};try{const t=JSON.parse(e);return"object"==typeof t&&null!==t?t:{}}catch{return{}}}(r),n})().catch(()=>(n={},n))),r)},resetFgMeta:function(){n=null,r=null},parseSelectorDirective:l,resolveSiteInsertionEntry:c,resolveInsertionFromDirective:i,resolveForHost:u,resolveForCurrentHost:function(){try{return u(window.location.hostname||"")}catch{return null}}})}();