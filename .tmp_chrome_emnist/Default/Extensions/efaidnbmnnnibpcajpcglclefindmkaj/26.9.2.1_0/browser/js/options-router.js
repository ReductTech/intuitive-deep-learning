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
function e(e,t="body"){return new Promise((o,r)=>{const n=document.createElement("script"),c="head"===t?document.head:document.body;if(Array.from(e.attributes).forEach(e=>{n.setAttribute(e.name,e.value)}),!e.src&&e.textContent)return n.textContent=e.textContent,c.appendChild(n),void o();e.src?(n.onload=o,n.onerror=()=>r(new Error(`Failed to load script: ${e.src}`)),c.appendChild(n)):o()})}async function t(t){try{const o=await fetch(t);if(!o.ok)throw new Error(`Failed to load ${t}`);const r=await o.text(),n=(new DOMParser).parseFromString(r,"text/html"),c=n.head.querySelectorAll("link, style");for(const e of c)document.head.appendChild(e.cloneNode(!0));const s=n.querySelector("title");if(s){const e=s.id;document.title=e&&chrome.i18n.getMessage(e)||s.textContent}const a=n.head.querySelectorAll('script:not([type="module"])');for(const t of a)await e(t,"head");const l=n.head.querySelectorAll('script[type="module"]');for(const t of l)await e(t,"head");n.body.className&&(document.body.className=n.body.className),n.body.style.cssText&&(document.body.style.cssText=n.body.style.cssText);const d=document.getElementById("options-app-container");if(!d)throw new Error("Container element not found");const i=n.body.cloneNode(!0);i.querySelectorAll("script").forEach(e=>e.remove()),d.innerHTML=i.innerHTML;const m=n.body.querySelectorAll('script:not([type="module"])');for(const t of m)await e(t,"body");const y=n.body.querySelectorAll('script[type="module"]');for(const t of y)await e(t,"body")}catch(e){throw console.error(`Error loading HTML from ${t}:`,e),e}}!async function(){try{await t(chrome.runtime.getURL("browser/js/preference-page.html"))}catch(e){console.error("Error in options router:",e),chrome.runtime.sendMessage({main_op:"log-error",log:{message:"Options router failed to load preferences page",error:e?.message||e?.toString(),errorStack:e?.stack}}),t(chrome.runtime.getURL("browser/js/legacy-options.html"))}}();