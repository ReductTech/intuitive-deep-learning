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
(()=>{let t=!1,e=!1,n=!1,o=null,c=null,s=null,r=null,i=null;const a=()=>{chatgptExpressIntegration?.expressEnabled&&chatgptExpressIntegration.tryInject(),t&&o.tryInject(),e&&c.tryInject(),n&&s.tryInject()},p=new MutationObserver(()=>{if(p.takeRecords(),!chrome?.runtime?.id)return p.disconnect(),chatgptExpressIntegration?.cleanup(),t&&o?.removeAllTouchpoints(),e&&c?.removeAllTouchpoints(),n&&s.removeAllTouchpoints(),r?.disconnectEventListeners(),t=!1,e=!1,void(n=!1);a()}),m=()=>{document?.body?p.observe(document.body,{childList:!0,subtree:!0}):setTimeout(m,500)},h=async()=>{[{ChatGPTConvertToPdf:o},c,s,{default:r},i]=await Promise.all([import(chrome.runtime.getURL("content_scripts/chatgpt/chatgpt-convert-to-pdf.js")),import(chrome.runtime.getURL("content_scripts/chatgpt/chatgpt-response-convert-to-pdf.js")),import(chrome.runtime.getURL("content_scripts/chatgpt/chatgpt-canvas-convert-to-pdf.js")),import(chrome.runtime.getURL("content_scripts/chatgpt/state.js")),import(chrome.runtime.getURL("content_scripts/utils/util.js"))])};(async()=>{const[,c,s,p]=await Promise.all([h(),chrome.runtime.sendMessage({main_op:"chatgpt-response-convert-to-pdf-init"}),chrome.runtime.sendMessage({main_op:"chatgpt-canvas-convert-to-pdf-init"}),chrome.runtime.sendMessage({main_op:"chatgpt-chat-convert-to-pdf-init"}),chatgptExpressIntegration?.initPromise]);t=await o.init(),e=c?.chatgptResponseTouchpointEnabled,n=s?.chatgptCanvasTouchpointEnabled,(chatgptExpressIntegration?.expressEnabled||t||e||n)&&(e&&(r.config.response=c),n&&(r.config.canvas=s),t&&(r.config.chat=p),i?.addFontToDocument(r),a(),m())})()})();