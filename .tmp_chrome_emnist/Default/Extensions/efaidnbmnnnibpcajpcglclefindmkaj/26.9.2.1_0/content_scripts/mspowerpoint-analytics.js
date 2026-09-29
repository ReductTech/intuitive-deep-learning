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
(async()=>{let t;try{const e="dc-cv-mspowerpoint-opportunity-size";if(!await chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:e}))return;const n=await chrome.runtime.sendMessage({main_op:"getFloodgateMeta",flag:e}),o=JSON.parse(n||"{}"),r=()=>{const t=window.location.ancestorOrigins;if(!t||0===t.length)return!1;const e=t[t.length-1];let n;try{const t=new URL(e);if("https:"!==t.protocol)return!1;n=t.hostname.toLowerCase()}catch{return!1}return/^[a-z0-9-]+\.sharepoint\.com$/.test(n)||o.hostnames?.some(t=>t===n)};t=await import(chrome.runtime.getURL("content_scripts/utils/util.js")),r()&&t?.sendAnalytics([["DCBrowserExt:MSPowerPoint:Opened",{},{frequency:"monthly"}]])}catch(t){}})();