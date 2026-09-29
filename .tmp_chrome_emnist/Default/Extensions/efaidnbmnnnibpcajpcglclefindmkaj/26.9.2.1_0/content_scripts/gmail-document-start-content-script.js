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
(()=>{let e,t;(async()=>{if(window.location?.search?.includes("acrobatPromotionSource"))return;const{enableGmailTouchPoint:i,enableImplicitDefaultViewershipFeature:n,touchPointSettingEnabled:o,isAcrobatDefaultForSurface:a,gmailConvertToPdfConfig:r}=await chrome.runtime.sendMessage({main_op:"gmail-document-start-init"});(i&&(o||"true"===a||n&&"false"!==a)||r?.enableConvertToPdfTouchpointInGmail&&o)&&(await(async()=>{const i=chrome.runtime.getURL("content_scripts/gmail/state.js"),n=chrome.runtime.getURL("content_scripts/gmail/gmail-response-service.js");return Promise.all([import(n),import(i)]).then(i=>{e=i[0],t=i[1]?.default})})(),r&&(t.gmailConvertToPdfConfig=r),e?.init())})()})();