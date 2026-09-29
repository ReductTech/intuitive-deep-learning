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
(()=>{let e=null;(async()=>{const{enableGeminiChatConvertToPdfTouchpoint:i}=await chrome.runtime.sendMessage({main_op:"gemini-convert-to-pdf-init"}).catch(()=>({}));i&&(await Promise.all([import(chrome.runtime.getURL("content_scripts/gemini/gemini-api-response-service.js"))]).then(i=>{e=i[0]}),e.injectGeminiAPIResponseInterceptor(),e.addGeminiDataEventListener())})()})();