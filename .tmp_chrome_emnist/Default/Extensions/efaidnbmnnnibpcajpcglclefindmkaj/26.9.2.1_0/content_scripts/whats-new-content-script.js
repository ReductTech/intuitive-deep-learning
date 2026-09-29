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
if(void 0!==chrome.runtime){function notifyWebpage(e,t){const n=new CustomEvent("acrobatWhatsNewUpdate",{detail:{action:e,data:t}});document.dispatchEvent(n)}document.addEventListener("whatsNewReady",async()=>{chrome.runtime.sendMessage({main_op:"getWhatsNewData"},e=>{notifyWebpage("contentScriptReady",{extensionId:chrome.runtime.id,...e})})})}