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
import{OFFSCREEN_DOCUMENT_PATH as r}from"../../common/offscreen-document-path.js";import{SENDER_TIER as t}from"./messaging-constants.js";function E(){return`chrome-extension://${chrome.runtime.id}/`}export function classify(n){if(!n)return t.UNKNOWN;if(n.id===chrome.runtime.id&&!n.tab&&!n.url)return t.SERVICE_WORKER;if(n.url&&n.url.startsWith(E())){const e=function(r){const t=r.indexOf("?");return-1===t?r:r.slice(0,t)}(n.url);return e===`${E()}${r}`?t.OFFSCREEN:e===`${E()}service-worker.js`?t.SERVICE_WORKER:function(r){return r.tab?r.tab.url&&r.tab.url.startsWith(E())?t.EXTENSION_PAGE_OPENED_DIRECTLY:t.EXTENSION_PAGE_EMBEDDED_IN_FOREIGN_TAB:t.EXTENSION_PAGE_OPENED_DIRECTLY}(n)}return n.tab?t.CONTENT_SCRIPT:n.id&&n.id!==chrome.runtime.id?t.EXTERNAL:t.UNKNOWN}