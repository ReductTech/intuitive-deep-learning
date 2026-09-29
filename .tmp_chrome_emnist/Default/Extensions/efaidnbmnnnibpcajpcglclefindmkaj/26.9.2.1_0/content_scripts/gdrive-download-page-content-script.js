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
(()=>{let e={};const t=(t,n)=>{if(t){const o=e?.selectors,r=o&&o[n];for(let e=0;e<r?.length;e++){let n=t.querySelector(r[e]);if(n)return n}}return null},n=()=>{const n=new URLSearchParams(window.location.search);n?.has("acrobatPromotionSource")&&(n?.has("uuid")&&"https://accounts.google.com/"!==document.referrer||chrome.runtime.sendMessage({main_op:"gdrive-download-init"},async n=>{if(n?.acrobatTouchPointEnabled){e=n;const o=await(async()=>{const e=t(document,"confirmInput")?.value,n=t(document,"atInput")?.value,o=t(document,"uuidInput")?.value,r=t(document,"fileName");let a=new URL(window.location.href);const i=new URLSearchParams(a.hash.slice(1)),c=i.get("gdriveEmail");if(c&&(i.delete("gdriveEmail"),a.hash=i.toString()),!e&&!n&&!o)return`https://drive.google.com/file/d/${a.searchParams.get("id")}/view`;a.searchParams.set("uuid",o),a.searchParams.set("at",n),a.searchParams.set("confirm",e);let s=chrome.runtime.getURL("viewer.html")+"?pdfurl="+encodeURIComponent(a.toString());if(r?.textContent&&(s=s+"&pdffilename="+encodeURIComponent(r?.textContent)),c){const{buildGdriveAuthHash:e}=await import(chrome.runtime.getURL("content_scripts/utils/util.js"));s+=e(null,c)}return s})();(e=>{try{chrome.runtime.sendMessage({main_op:"analytics",analytics:e})}catch(e){}})([["DCBrowserExt:GdriveDPage:Redirect"]]),window.location.replace(o)}}))};(async()=>{"drive.usercontent.google.com"===window?.document?.location?.host&&window.top===window.self&&0===window?.document?.location?.ancestorOrigins.length&&n()})()})();