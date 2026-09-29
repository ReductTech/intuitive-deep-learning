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
(()=>{const e=e=>(e||[]).map(e=>document.querySelector(e)?.value).find(e=>!!e)||null,n=n=>{const t=e(n.downloadUrlInput);return t&&((e,n)=>{try{return new URL(e).searchParams.has(n)}catch{return!1}})(t,n.tempAuthParam)?t:e(n.downloadUrlNoAuthInput)||t||(e=>{if(!(e?.hostSuffixes?.length&&e?.pathPrefixes?.length&&e?.sourcedocParam&&e?.docPages?.length&&e?.downloadPage&&e?.uniqueIdParam&&e?.extraQuery))return null;let n;try{n=new URL(window.location.href)}catch{return null}if(!e.hostSuffixes.some(e=>n.hostname.endsWith(e)))return null;const t=n.searchParams.get(e.sourcedocParam);if(!t)return null;const r=e.pathPrefixes.find(e=>n.pathname.includes(e));if(!r)return null;const o=n.pathname.slice(n.pathname.indexOf(r));if(!e.docPages.some(e=>o.toLowerCase().endsWith(`/${e.toLowerCase()}`)))return null;const s=o.slice(0,o.lastIndexOf("/")+1),a=t.replace(/[{}]/g,"").toLowerCase();return`${n.origin}${s}${e.downloadPage}?${e.uniqueIdParam}=${a}&${e.extraQuery}`})(n.pageUrlDownload)},t=t=>((e,n)=>{const{url:t,filename:r,fileExtension:o}=e||{},s=o?.toLowerCase()||null;return!!(t&&r&&s)&&!!n.supportedFileExtensions.includes(s)&&(chrome.runtime.sendMessage({main_op:"msoffice-set-file-details",url:t,filename:r,fileExtension:s}).catch(()=>{}),!0)})({url:n(t),filename:e(t.fileNameInput),fileExtension:e(t.fileExtensionInput)},t);chrome.runtime.sendMessage({main_op:"msoffice-get-filedetails-selectors"}).then(e=>{e&&(e=>{if(t(e))return;let n;const r=new MutationObserver(()=>{t(e)&&(clearTimeout(n),r.disconnect())});n=setTimeout(()=>r.disconnect(),12e4),r.observe(document.body,{childList:!0,subtree:!0})})(e)}).catch(()=>{})})();