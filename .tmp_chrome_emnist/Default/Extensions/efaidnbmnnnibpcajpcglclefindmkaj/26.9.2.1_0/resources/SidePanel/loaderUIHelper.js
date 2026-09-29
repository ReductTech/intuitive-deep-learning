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
import{dcLocalStorage as e}from"../../common/local-storage.js";import{checkForImsSidCookie as o}from"../../common/util.js";import{largeBlobStorage as t}from"../../common/large-blob-storage.js";import n from"../../libs/lottie-light-esm.js";import{isGenAiRoute as r,getSidePanelTabId as i}from"./sidePanelUtil.js";export const hideTrefoilLoader=()=>{document.querySelector(".loader-container")?.classList.add("hidden")};export const showTrefoilLoader=()=>{document.querySelector(".loader-container").classList.remove("hidden"),n.loadAnimation({container:document.getElementById("lottie-animation"),renderer:"svg",loop:!0,autoplay:!0,path:chrome.runtime.getURL("/resources/SidePanel/TrefoilLoader-NoPad.json")})};export const getGenAiPrerenderState=async(n,s)=>{if(!r(n))return null;const a=await(async()=>{try{const e=i();if(!Number.isFinite(e))return!1;const o=await chrome.tabs.sendMessage(e,{main_op:"hasPendingInitialQuestion"});return!!o?.hasPendingInitialQuestion}catch{return!1}})();if(a)return{showPreRendered:!1,ssrHtml:null,hasPendingPrompt:a};const l=!await o(),m=e.getItem("enableCSSSRForAnon"),d=e.getItem("enableCSSSRForSignedIn"),c=l?!!m:!!d,u=l?"anonGenAISSRHtml":"signedInGenAISSRHtml",g=await t.getItem(u);return{showPreRendered:c&&!!g,ssrHtml:g}};export const shouldShowTrefoilLoader=e=>!e?.showPreRendered;