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
var dialogToBeReopened,overflowStyleBeforeExpressOpened;function createDomAnchor(e,t=2147483646){if(document.querySelector(`#${e}`))return document.querySelector(`#${e}`);const o=document.createElement("div");return o.id=e,o.style.position="fixed",o.style.zIndex=`${t}`,o.style.width="100%",o.style.height="100%",o.style.top="0",o.style.pointerEvents="auto",o.style.colorScheme="light",o.style.backgroundColor="rgba(0, 0, 0, 0.5)",o.style.display="block",overflowStyleBeforeExpressOpened=document.body.style.overflow,document.body.style.overflow="hidden",o}function createExpressUrl(e){return chrome.runtime.getURL("browser/js/express.html")+`?sessionId=${e}`}function openExpressEditorInFrame(e){const t=createDomAnchor("expressAcrobatExtension"),o=document.createElement("iframe");o.setAttribute("src",e),o.setAttribute("id","expressAcrobatExtensionIframe"),o.setAttribute("allowfullscreen","true"),o.setAttribute("allow","clipboard-read; clipboard-write;"),o.style.setProperty("width","100%","important"),o.style.setProperty("height","100%","important"),o.style.setProperty("border","none","important"),o.style.setProperty("overflow","hidden","important");const r=document.getElementsByTagName("dialog");for(let e of r)if(e&&e.open){dialogToBeReopened=e,e.close();break}t.appendChild(o),document.body.insertBefore(t,document.body.childNodes[0]),window.addEventListener("popstate",()=>{chrome.runtime.sendMessage({main_op:"closeExpressApp"})})}function isSessionStorageAccessible(){try{return sessionStorage.getItem("check"),!0}catch(e){return!1}}function openExpressInNewTab(e){chrome.runtime.sendMessage({main_op:"createNewTabWithUrl",url:e})}chrome.runtime.sendMessage({main_op:"get-express-modal-session-id"},e=>{if(e?.sessionId){const t=createExpressUrl(e.sessionId);isSessionStorageAccessible()?openExpressEditorInFrame(t):openExpressInNewTab(t)}});