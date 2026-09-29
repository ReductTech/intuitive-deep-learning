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
!function(){function e(e){return chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:e,cachePurge:"NO_CALL"}).then(e=>!0===e).catch(()=>!1)}window.addEventListener("message",n=>{if(n.source!==window)return;if(n.origin!==window.location.origin)return;if("adobe.com"!==(t=window.location.hostname)&&!t.endsWith(".adobe.com"))return;var t;const r=n.data?.dcImsBridgeV1;r&&"object"==typeof r&&async function(){try{const[n,t]=await Promise.all([e("dc-cv-sid-enabled"),e("dc-cv-sid-ims-network-hook")]);return n&&t}catch{return!1}}().then(e=>{if(!e)return;const n=r.userId;if(!function(e){if(null==e||"string"!=typeof e)return!1;const n=e.trim();return!(0===n.length||n.length>320)&&"anon"!==n&&/^[a-zA-Z0-9_.@+-]+$/.test(n)}(n))return;const t=r.url;null!=t&&"string"!=typeof t||chrome.runtime.sendMessage({main_op:"imsNetworkUserIdDetected",userId:n.trim()}).catch(()=>{})}).catch(()=>{})})}();