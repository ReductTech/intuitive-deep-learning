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
(()=>{let e,t,i,n,o,s,r=!1,c=!1,a=!1;const m=()=>{r&&(n?.messageAreaObserverHandler(),n?.imagePreviewerObserverHandler()),c&&(t?.addChatConvertToPDFTouchpoint?.(),t?.updateChatTouchpointBasedOnWidthAvailable?.()),a&&i?.addResponseConvertToPDFTouchpoint?.()},p=new MutationObserver(()=>{if(p.takeRecords(),!chrome?.runtime?.id)return p.disconnect(),t?.removeAllAcrobatTouchPoint?.(),i?.removeAllAcrobatTouchPoint?.(),n?.removeAllTouchpoints?.(),e?.disconnectEventListeners?.(),e?.disconnectResponseFteListeners?.(),e?.disconnectChatFteListeners?.(),r=!1,c=!1,void(a=!1);m()}),u=()=>{if(document?.body)try{p.observe(document.body,{attributes:!0,attributeFilter:["class"],childList:!0,subtree:!0})}catch(e){}else setTimeout(u,500)},l=async()=>{[s,e,t,i,o,n]=await Promise.all([import(chrome.runtime.getURL("content_scripts/utils/util.js")),import(chrome.runtime.getURL("content_scripts/gemini/state.js")).then(e=>e.default),import(chrome.runtime.getURL("content_scripts/gemini/gemini-chat-touchpoint-service.js")),import(chrome.runtime.getURL("content_scripts/gemini/gemini-response-touchpoint-service.js")),import(chrome.runtime.getURL("content_scripts/gemini/gemini-convert-to-pdf-fte-service.js")),import(chrome.runtime.getURL("content_scripts/express/gemini/gemini-express-touchpoint-service.js")).then(e=>e.geminiExpressTouchpointService)])};(async()=>{const[,t]=await Promise.all([l(),Promise.all([chrome.runtime.sendMessage({main_op:"gemini-express-init"}),chrome.runtime.sendMessage({main_op:"gemini-convert-to-pdf-init"})])]),i=t[0]??{},p=t[1]??{},h=i.enableGeminiPreviewExpressMenu||i.enableGeminiChatViewExpressMenu,d=p.enableGeminiChatConvertToPdfTouchpoint,g=p.enableGeminiResponseConvertToPdfTouchpoint;(h||d||g)&&(r=h,c=d,a=g,s?.addFontToDocument(e),await(async(t,i,s,r,c)=>{(r||c)&&e&&(e.config=s),c&&await(o?.initResponseFteEligibilityFromStorage?.()),i&&n&&(n.applyExpressSelectors(t),await n.loadContentScripts())})(i,h,p,d,g),m(),u())})()})();