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
import{util as t}from"../js/content-util.js";import{dcLocalStorage as n}from"../../common/local-storage.js";import{COOLDOWN_FOR_DOWNLOAD_BANNER as e}from"../../common/constant.js";import{events as o}from"../../common/analytics.js";import{onReady as s,onClick as a,qs as i,getOffset as l}from"../../common/dom-utils.js";var c=null;const m=async()=>c||new Promise(t=>{chrome.tabs.query({active:!0,currentWindow:!0},function(n){c=n[0],t(n[0])})});s(()=>{t.translateElements(".translate"),a("#turnOnButton",()=>{n.setWithTTL("downloadBanner",!0,e),t.sendAnalytics(o.DOWNLOAD_BANNER_TURN_ON_CLICKED),m().then(e=>{t.openExtensionSettingsInWindow({tab:e,action:"localFileAccess"},function(){chrome.tabs.sendMessage(e.id,{content_op:"dismissBanner"})}),n.setItem("lastOpenTabId",e.id)})}),a("#tripleDotMenu",()=>{const n=document.getElementById("menuList"),e=i("#tripleDotMenu");n.style.display&&"none"!==n.style.display?n.style.display="none":(t.sendAnalytics(o.DOWNLOAD_BANNER_MENU_SHOWN),n.style.top=l(e).top-110+"px",n.style.display="block")}),a("#closeButton",()=>{t.sendAnalytics(o.DOWNLOAD_BANNER_CLOSE_CLICKED),m().then(t=>{chrome.tabs.sendMessage(t.id,{content_op:"dismissBanner"})})}),a("#doNotShowButton",()=>{t.sendAnalytics(o.DOWNLOAD_BANNER_DONT_SHOW_AGAIN_CLICKED),m().then(t=>{chrome.tabs.sendMessage(t.id,{content_op:"dismissBanner"});const e=n.getItem("downloadBannerData")||{};e.doNotShow=!0,n.setItem("downloadBannerData",e)})})});