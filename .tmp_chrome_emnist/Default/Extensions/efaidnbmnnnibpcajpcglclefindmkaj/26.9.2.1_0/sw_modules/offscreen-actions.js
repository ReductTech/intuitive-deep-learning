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
import{OFFSCREEN_DOCUMENT_PATH as e}from"../common/constant.js";import{dcLocalStorage as n}from"../common/local-storage.js";import{common as t}from"./common.js";import{communicate as o}from"./communicate.js";import{Proxy as s}from"./proxy.js";import{util as r}from"./util.js";let a=null;a||(a=new function(){this.proxy=s.proxy.bind(this);const o=()=>n.getItem("anonUserUUID")||t.createAnonUserUUID();this.getDocState=function(e){const t=n.getItem("filesData")||{};if(t.filePath)try{const n=new Map(JSON.parse(t.filePath));if(!n.has(e))return;return n.get(e)}catch(e){}},this.setupWorkerOffscreen=async function(s){if(n.getItem("rrv")){const a=t.getEnv(),i=`${e}?env=${a}&rrv=true`;await r.setupOffscreenDocument(i);const c=o(),p=await chrome.runtime.sendMessage({main_op:"createIframeToLoadAjsWorker",target:"offscreen",rrvEnabled:!0,env:a,anonUserUUID:c}),f=n.getItem("lrrv");if(p.iframeLoaded&&f&&s&&!s.startup&&s.acceptRanges&&s.pdfSize>0){const e=this.getDocState(s.pdfURL)||{};chrome.runtime.sendMessage({main_op:"getLinearizedRendition",target:"offscreen",tabId:s.tabId,viewerInstanceId:s.viewerInstanceId,pdfURL:decodeURIComponent(s.pdfURL),pdfSize:s.pdfSize,docLastOpenState:e})}}},this.closeOffscreenDocument=function(){chrome.offscreen.closeDocument()},this.rapidRenditionResponse=function(e){delete e.main_op,e.content_op="rapidRenditionResponse",chrome.tabs.sendMessage(e.tabId,e)},this.rapidRenditionError=function(e){delete e.main_op,e.content_op="rapidRenditionError",chrome.tabs.sendMessage(e.tabId,e)},this.documentMetadataResponse=function(e){delete e.main_op,e.content_op="documentMetadataResponse",chrome.tabs.sendMessage(e.tabId,e)},this.handleFgResponseFromCDN=async function(s){const a=s.response,i=JSON.parse(a);i.timestamp=Date.now(),n.setItem("ffResponse_anon",JSON.stringify(i));const c=t.getEnv(),p=`${e}?env=${c}`;await r.setupOffscreenDocument(p);const f=o();setTimeout(()=>{chrome.runtime.sendMessage({main_op:"fgResponseFromCDN",target:"offscreen",response:JSON.stringify(i),iframeURL:t.getSignInUrl(),anonUserUUID:f})},50)}}),o.registerHandlers({setupWorkerOffscreen:a.proxy(a.setupWorkerOffscreen),closeOffscreenDocument:a.proxy(a.closeOffscreenDocument),rapidRenditionResponse:a.proxy(a.rapidRenditionResponse),rapidRenditionError:a.proxy(a.rapidRenditionError),documentMetadataResponse:a.proxy(a.documentMetadataResponse),fgResponseFromCDN:a.proxy(a.handleFgResponseFromCDN)});export const offscreenActions=a;