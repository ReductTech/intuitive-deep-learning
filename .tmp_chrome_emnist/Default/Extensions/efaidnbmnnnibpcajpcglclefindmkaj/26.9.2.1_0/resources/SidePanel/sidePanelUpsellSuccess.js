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
import{dcLocalStorage as e}from"../../common/local-storage.js";import{signInUtil as n}from"../../browser/js/viewer/signInUtils.js";import{resolveUpsellTabId as s}from"../../common/upsellSessionClient.js";(async()=>{const r=new URLSearchParams(window.location.search),o=function(e){if(!e)return null;try{return new URLSearchParams(decodeURIComponent(e))}catch(e){return null}}(r.get("gsp"));if(function(e,n){const s=e.get("pdfspaceupsell")||n?.get("pdfspaceupsell");return"1"===s||"true"===s}(r,o)){const e=r.get("tabId")||o?.get("tabId"),n=await s(e);Number.isNaN(n)?window.close():function(e){chrome.runtime.sendMessage({main_op:"post_pdfspace_upsell",tabId:e},()=>{chrome.runtime.lastError&&console.error("Error sending post_pdfspace_upsell:",chrome.runtime.lastError.message),window.close()})}(n)}else{const o=await s(r.get("tabId"));Number.isNaN(o)?window.close():async function(s){if(await e.init(),e.getItem("upsellFromAnon")){const r=await chrome.tabs.query({active:!0,currentWindow:!0});if(r.length>0){const o=r[0].id;e.setItem("signInOriginHash","#/side-panel"),n.sidepanelPostAnonUpsellSignIn(!0,o,s),chrome.runtime.sendMessage({main_op:"post_upsell_anon",tabId:s})}return}chrome.runtime.sendMessage({main_op:"post_upsell",tabId:s},()=>{try{chrome.runtime.lastError&&console.error("Error sending message:",chrome.runtime.lastError.message)}finally{window.close()}})}(o)}})();