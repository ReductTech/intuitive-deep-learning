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
import{loggingApi as e}from"../../common/loggingApi.js";import{connectSidePanelPort as o,getSidePanelTabId as n}from"./sidePanelUtil.js";import{hideTrefoilLoader as r}from"./loaderUIHelper.js";export function initOfflineMode(i){const s=n();o(s,i),chrome.runtime.sendMessage({type:"sidepanel_close_reason",tabId:s,reason:"Offline"}),r();const t=document.getElementById("offline-error");t?t.classList.remove("hidden"):e.debug({message:"offline-error element not found in DOM"})}