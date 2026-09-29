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
import e from"../../libs/readability.js";import{SIDE_PANEL_HASH_ROUTES as t}from"../../common/constant.js";const{Readability:n,isProbablyReaderable:r}=e;export const getSidePanelTabId=()=>parseInt(new URLSearchParams(window.location.search).get("tabId"),10);export const sendMessageWithTab=(e,t)=>chrome.runtime.sendMessage({...e,tab:{id:t}});export const createSendAnalytics=e=>t=>{t&&sendMessageWithTab({main_op:"analytics",analytics:[t]},e)};function a(e){return e.clientHeight>0&&e.clientWidth>0}async function s(e,t=!0){const n=()=>r(e,{visibilityChecker:t?a:void 0});if(n())return!0;const s=(await chrome.runtime.sendMessage({type:"get_sidepanel_state"})).isOpen?1500:5e3;return new Promise(e=>{const t=setInterval(()=>{n()&&(clearInterval(t),clearTimeout(r),e(!0))},300),r=setTimeout(()=>{clearInterval(t),e(!1)},s)})}function o(e){try{const t=e.cloneNode(!0),r=new n(t).parse();return!!r&&r.textContent.trim().length>=140}catch{return!1}}async function i(e){const t=(new DOMParser).parseFromString(e,"text/html");if(await s(t,!1)){return new n(t).parse().content}return e}export const isGenAiRoute=e=>e.startsWith(t.SIDE_PANEL);export const isHomeShellRoute=e=>!isGenAiRoute(e);export function connectSidePanelPort(e,t){const n=chrome.runtime.connect({name:`sidepanel_${e}_${t}`}),r=setInterval(()=>{try{n.postMessage({action:"keep_alive"})}catch{clearInterval(r)}},2e4);return n.onDisconnect.addListener(()=>clearInterval(r)),n}export{s as isProbablyReaderableAsync,o as isFullParseReaderable,i as getReadableContent};