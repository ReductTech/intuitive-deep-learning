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
(()=>{let e=null,t=null;!async function(){const r=chrome.runtime.getURL("content_scripts/wikipedia/wikipedia-touchpoint-service.js");if(t=await import(r).catch(()=>null),!t)return;let o;try{o=await chrome.runtime.sendMessage({main_op:"wikipedia-convert-to-pdf-init"})}catch(e){return}if(!o?.enableWikipediaConvertToPdfTouchpoint)return;await t.initTouchpointService(o),t.startInjectionObserver(),e=()=>t.syncStandaloneNav(),window.addEventListener("resize",e),window.acrobatExtensionMessaging.registerContentScriptMessageHandler("content_op",["show-direct-verb-toast","update-direct-verb-progress","reset-direct-verb-cta","show-direct-verb-error-toast","show-direct-verb-tab-close-error-toast"],e=>{const r=o;switch(e?.content_op){case"show-direct-verb-toast":r?.convertToPdfToastMessage&&t.showToast(t.TOAST_PROMOTION_SOURCE,r.convertToPdfToastMessage);break;case"update-direct-verb-progress":{const r=t.getTouchpointElement();t.updateProgress(r,e.progress);break}case"reset-direct-verb-cta":t.resetTouchpointState();break;case"show-direct-verb-error-toast":case"show-direct-verb-tab-close-error-toast":{const o=e=>e?.split("#")[0]??"";if(e.sourceTabUrl&&o(e.sourceTabUrl)!==o(window.location.href))break;t.resetTouchpointState();const s="show-direct-verb-tab-close-error-toast"===e.content_op?r?.convertToPdfTabCloseErrorToastMessage:r?.convertToPdfErrorToastMessage;if(!s)break;const a={variant:"error"};r?.tryAgainText&&(a.actionButton={text:r.tryAgainText,className:"acrobat-toast-action-button--link",onClick:()=>t.retryConversion()}),t.showToast(t.TOAST_PROMOTION_SOURCE,s,a);break}}},{endpoint:"wikipedia-content-script"})}()})();