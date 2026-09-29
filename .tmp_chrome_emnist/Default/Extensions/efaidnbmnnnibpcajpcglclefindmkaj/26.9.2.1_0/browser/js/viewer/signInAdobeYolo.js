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
import{util as e}from"../content-util.js";import{dcSessionStorage as o}from"../../../common/local-storage.js";import{signInUtil as s}from"./signInUtils.js";import{privateApi as t}from"../../../common/private-api.js";import{setText as a}from"../../../common/dom-utils.js";function n(){var o,s,t;a("#adobe-yolo-message",e.getTranslation("adobeYoloMessage")),o=document.getElementsByClassName("loader-blue-line")[0],s=1,t=setInterval(function(){s>=100?clearInterval(t):(s++,o.style.width=s+"%")},20)}await o.init(),setTimeout(async function(){const e=o.getItem("adobeYoloTabsInfo");let a;if(s.sendAnalytics("DCBrowserExt:Viewer:Ims:Jump:Page:Launched"),n(),(await chrome.runtime.sendMessage({main_op:"checkUserIsSignedIn"})).signInStatus){if(e&&e.tabsInfo){const s=e.tabsInfo,n=await t.isMimeHandlerAvailable();chrome.tabs.query({},e=>{e&&e.forEach(e=>{s.includes(e.id)&&(a=e.id,chrome.tabs.reload(e.id),n||setTimeout(()=>{chrome.tabs.sendMessage(a,{main_op:"jumpUrlSuccess"})},1e3))})}),n&&setTimeout(()=>{chrome.runtime.sendMessage({main_op:"jumpUrlSuccess",tabInfo:s})},1e3),o.removeItem("adobeYoloTabsInfo")}}else o.removeItem("adobeYoloTabsInfo"),s.sendAnalytics("DCBrowserExt:Viewer:Ims:Jump:Page:UserNotSignedIn");setTimeout(()=>{const e={active:!0};a&&chrome.tabs.update(a,e),window.close()},2500)},200);