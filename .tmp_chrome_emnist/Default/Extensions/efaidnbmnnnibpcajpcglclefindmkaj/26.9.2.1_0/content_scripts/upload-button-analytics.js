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
(async()=>{const e="dc-cv-upload-button-analytics",t="dc-upload-btn-detected-domains",o='input[type="file"]',n=[".pdf",".jpg",".jpeg",".png",".heic",".heif",".webp","application/pdf","image/"];try{if(window.top!==window.self)return;const r=window.location.hostname;if(!r)return;if(!await chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:e,cachePurge:"NO_CALL"}))return;const a=chrome.runtime.getURL("./common/local-storage.js"),{dcLocalStorage:i}=await import(a);await i.init();const c=i.getItem(t)||{};if(c&&"object"==typeof c&&r in c)return;let s=n;try{const t=await chrome.runtime.sendMessage({main_op:"getFloodgateMeta",flag:e});if(t){const e=JSON.parse(t);Array.isArray(e?.tokens)&&e.tokens.length>0&&(s=e.tokens.map(e=>String(e).toLowerCase()))}}catch(e){}const l=e=>{const t=(e.getAttribute("accept")||"").trim().toLowerCase();if(!t)return!0;const o=t.split(/[,\s]+/).filter(Boolean);return 0===o.length||(!!o.includes("*/*")||o.some(e=>s.some(t=>e.includes(t))))},d=()=>{const e=chrome.i18n&&chrome.i18n.getUILanguage&&chrome.i18n.getUILanguage()||navigator.language||"unknown";try{chrome.runtime.sendMessage({main_op:"analytics",analytics:[["DCBrowserExt:Website:UploadButton:Detected",{domain:r,eventContext:e}]]}),i.setItem(t,{...c,[r]:!0})}catch(e){}};if(Array.from(document.querySelectorAll(o)).some(l))return void d();const m=document.body||document.documentElement;if(!m)return;let u,g,p,h=!1;const f=[],y=()=>{if(!h){h=!0;try{u?.disconnect()}catch(e){}g&&clearTimeout(g),p&&clearTimeout(p),f.length=0}},w=e=>!(!e||e.nodeType!==Node.ELEMENT_NODE)&&(!(!e.matches?.(o)||!l(e))||!!e.querySelectorAll&&Array.from(e.querySelectorAll(o)).some(l)),E=()=>{if(p=null,h)return;if(!chrome?.runtime?.id)return void y();f.splice(0).some(w)&&(y(),d())};u=new MutationObserver(e=>{h||(e.forEach(e=>{"childList"===e.type&&e.addedNodes&&e.addedNodes.forEach(e=>{e&&e.nodeType===Node.ELEMENT_NODE&&f.push(e)})}),0!==f.length&&(p||(p=setTimeout(E,300))))}),u.observe(m,{childList:!0,subtree:!0}),g=setTimeout(y,3e4)}catch(e){}})();