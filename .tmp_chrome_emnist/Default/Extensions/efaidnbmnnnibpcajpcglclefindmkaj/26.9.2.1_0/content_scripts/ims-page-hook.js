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
!function(){const t=["/ims/validate_token/","/ims/check/v6"];function n(n){try{const e=new URL("string"==typeof n?n:String(n));if("https:"!==e.protocol)return!1;const o=e.hostname;return!!("adobelogin.com"===o||o.endsWith(".adobelogin.com"))&&t.some(t=>e.pathname.startsWith(t))}catch{return!1}}function e(t,n){try{const e=function(t,n){if(!t||"object"!=typeof t)return null;const e=n||"";if(e.includes("/ims/validate_token/")){const n=t.token,e=n&&"object"==typeof n?n.user_id||n.userId:null;return e?String(e):null}if(e.includes("/ims/check/v6")){const n=t.userId||t.authId||t.user_id;return n?String(n):null}return null}(JSON.parse(t),n);if(!e||"anon"===e)return;const o=function(){const t=window.location.origin;return"string"==typeof t&&t.length>0?t:null}();if(!o)return;window.postMessage({dcImsBridgeV1:{userId:e,url:String(n).slice(0,512)}},o)}catch{}}if("function"==typeof window.fetch){const t=window.fetch;window.fetch=function(...o){const s=o[0],i="string"==typeof s?s:s?.url,r=t.apply(this,o);return i&&n(i)?r.then(t=>(t?.ok&&t.clone().text().then(t=>e(t,i)).catch(()=>{}),t)):r}}if("function"==typeof window.XMLHttpRequest){const t=XMLHttpRequest.prototype.open,o=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(...n){return this.dcAcrobatExtImsXhrUrl=n[1],t.apply(this,n)},XMLHttpRequest.prototype.send=function(...t){const s=this.dcAcrobatExtImsXhrUrl;return n(s)&&this.addEventListener("load",function(){try{this.status>=200&&this.status<300&&this.responseText&&e(this.responseText,s)}catch{}}),o.apply(this,t)}}}();