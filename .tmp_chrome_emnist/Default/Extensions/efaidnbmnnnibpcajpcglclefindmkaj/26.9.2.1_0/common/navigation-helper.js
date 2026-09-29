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
function e(r,o,t=0){t>10||chrome.tabs.sendMessage(r,{requestType:"OPTIONS_HIGHLIGHT_SECTION",...o},()=>{chrome.runtime.lastError&&setTimeout(()=>e(r,o,t+1),100)})}export function openPreferences(r=null){chrome.runtime.openOptionsPage(()=>{chrome.runtime.lastError?console.error("Failed to open options page:",chrome.runtime.lastError):r&&setTimeout(()=>{chrome.tabs.query({url:chrome.runtime.getURL("browser/js/options.html")},o=>{o&&o.length>0&&e(o[0].id,r)})},300)})}