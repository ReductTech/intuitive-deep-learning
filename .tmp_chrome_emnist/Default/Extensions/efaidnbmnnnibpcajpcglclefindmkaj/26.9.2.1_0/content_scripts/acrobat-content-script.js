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
(()=>{const t={gsuiteintegration:"DCBrowserExt:AcrobatSurface:GsuiteIntegration:Opened",spodintegration:"DCBrowserExt:AcrobatSurface:SpodIntegration:Opened",boxintegration:"DCBrowserExt:AcrobatSurface:BoxIntegration:Opened",acrobatWeb:"DCBrowserExt:AcrobatSurface:AcrobatWeb:Opened"},e="https://acrobat.adobe.com",n=()=>{const n=(()=>{const n=window?.document?.location?.pathname,r=window?.document?.location?.origin;let o=n.split("/").filter(t=>t);return o=o.length>0?o[0]:null,r===e&&null==t[o]?"acrobatWeb":o})();r().then(t=>{o(t,n)&&(a(n),i(t,n),c(t),s())}).catch(()=>{})},r=()=>new Promise((t,e)=>{chrome.storage.local.get("acrobatSurfaceEvents",n=>{if(chrome.runtime.lastError)return void e(chrome.runtime.lastError);const r=n.acrobatSurfaceEvents;if(void 0===r)t({integrations:[]});else{const e=JSON.parse(r);t(e)}})}),o=(t,e)=>{const n=new Date,r=n.getMonth(),o=n.getFullYear(),a=t.integrations.findIndex(t=>t.integrationName===e);if(-1!==a){const e=new Date(t.integrations[a].dateSent),n=e.getMonth();if(o===e.getFullYear()&&r===n)return!1}return!0},a=e=>{(t=>{try{chrome.runtime.sendMessage({main_op:"analytics",analytics:t})}catch(t){}})([[t[e]]])},i=(t,e)=>{const n=new Date,r=t.integrations.findIndex(t=>t.integrationName===e);-1!==r?t.integrations[r].dateSent=n.toISOString():t.integrations.push({integrationName:e,dateSent:n.toISOString()})},c=t=>{chrome.storage.local.set({acrobatSurfaceEvents:JSON.stringify(t)})},s=()=>{window.removeEventListener("load",n)};window.addEventListener("load",n)})();