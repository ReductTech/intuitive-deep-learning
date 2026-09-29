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
export const dcLocalStorage={getItem:e=>chrome.runtime.sendMessage({type:"getItem",key:e}),setItem:(e,t)=>chrome.runtime.sendMessage({type:"setItem",key:e,value:t}),removeItem:e=>chrome.runtime.sendMessage({type:"removeItem",key:e})};export const offscreenConfig={"local-dev":{ajs_worker_uri:"https://local-test.acrobat.adobe.com:9019/ajs-worker.html",acrobat_viewer_origin:"https://local-test.acrobat.adobe.com:9019",target_uri:"https://local-test.acrobat.adobe.com:9019/target.html",kw_ingestion_uri:"https://local-test.acrobat.adobe.com:1900/react-index.html",ims_uri:"https://local-test.acrobat.adobe.com:9019/ims.html"},dev:{ajs_worker_uri:"https://dev.acrobat.adobe.com/dc-chrome-extension/ajs-worker.html",acrobat_viewer_origin:"https://dev.acrobat.adobe.com",target_uri:"https://dev.acrobat.adobe.com/dc-chrome-extension/target.html",kw_ingestion_uri:"https://dev.acrobat.adobe.com/dc-hosted-extension/react-index.html",ims_uri:"https://dev.acrobat.adobe.com/dc-hosted-extension/ims.html"},stage:{ajs_worker_uri:"https://stage.acrobat.adobe.com/dc-chrome-extension/ajs-worker.html",acrobat_viewer_origin:"https://stage.acrobat.adobe.com",target_uri:"https://stage.acrobat.adobe.com/dc-chrome-extension/target.html",kw_ingestion_uri:"https://stage.acrobat.adobe.com/dc-hosted-extension/react-index.html",ims_uri:"https://stage.acrobat.adobe.com/dc-hosted-extension/ims.html"},prod:{ajs_worker_uri:"https://acrobat.adobe.com/dc-chrome-extension/ajs-worker.html",acrobat_viewer_origin:"https://acrobat.adobe.com",target_uri:"https://acrobat.adobe.com/dc-chrome-extension/target.html",kw_ingestion_uri:"https://acrobat.adobe.com/dc-hosted-extension/react-index.html",ims_uri:"https://acrobat.adobe.com/dc-hosted-extension/ims.html"}};export const logInfo=(...e)=>{chrome.runtime.sendMessage({main_op:"log-info",target:"background",tab:{id:"offscreenTabId"},log:{message:e[0],...e[1]}})};export const logError=(...e)=>{chrome.runtime.sendMessage({main_op:"log-error",target:"background",tab:{id:"offscreenTabId"},log:{message:e[0],...e[1]}})};