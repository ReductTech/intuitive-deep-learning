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
(()=>{let e;const t=(e,t)=>(e||[]).flatMap(e=>Array.from(t.querySelectorAll(e)));window.preExtractHook=async(n,o)=>{let r=null;try{r=await new Promise(e=>{chrome.runtime.sendMessage({main_op:"get-chatgpt-deep-research-html-to-pdf-config"},t=>e(t??null))})}catch(e){}const i=r?.selectors??{},a=r?.selectors?.heading??[],l=r?.layoutFixCSS;({getFirstElementBasedOnSelectors:e}=await import(chrome.runtime.getURL("content_scripts/utils/util.js"))),t(i.citationSup,o).forEach(t=>{const n=t.getAttribute("data-citation-index"),r=(i.citationBtn||[]).map(e=>`${e}[data-citation-index="${n}"]`),a=e(r,o),l=e(i.citationUrl,a?.nextElementSibling)?.href;if(l){const e=o.createElement("a");e.href=l,e.target="_blank",t.parentNode.insertBefore(e,t),e.appendChild(t)}}),t(i.citationsPanel,o).forEach(e=>e.remove());const c=e(a,o);if(c){let e=c;for(;e&&e!==o.body;){let t=e.previousElementSibling;for(;t;){const e=t;t=t.previousElementSibling,e.remove()}e=e.parentElement}}if(c&&o.body){const e=c.parentElement;e&&e.parentElement!==o.body&&(Array.from(o.body.children).forEach(e=>e.remove()),o.body.appendChild(e))}return{layoutFixCSS:l}},window.overrideHTMLForConvertHTMLToPDFOp=async(e,t)=>{const{layoutFixCSS:n}=t??{};if(n&&e.head){const t=e.createElement("style");t.textContent=n,e.head.appendChild(t)}}})();