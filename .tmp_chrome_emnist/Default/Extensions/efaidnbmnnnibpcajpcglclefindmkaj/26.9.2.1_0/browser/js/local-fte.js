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
import{dcLocalStorage as t}from"../../common/local-storage.js";import{analytics as e,events as o}from"../../common/analytics.js";import{LOCAL_FILE_PERMISSION_URL as n,ONE_WEEKS_IN_MS as i,POPUP_CONTEXT as a,TWO_WEEKS_IN_MS as s}from"../../common/constant.js";import{util as c}from"../js/content-util.js";import{onReady as l,qs as m,onClick as r,setStyles as d,qsa as L}from"../../common/dom-utils.js";import{openTabPopupOverride as _}from"../../common/action-util.js";await t.init();const{id:u,url:w}=await chrome.tabs.getCurrent(),A=t.getItem("showLocalisedGif");e.event(o.LOCAL_FTE_DISPLAYED,{VARIANT:A?"WithLocalisedGif":"WithoutLocalisedGif"});const I=t.getItem("dc")?i:s;t.setWithTTL("localFteCooldown",!0,I);const h=(t.getItem("localFteCount")||0)+1;t.setItem("localFteCount",h),l(()=>{c.translateElements(".translate");let i=chrome.i18n.getMessage("@@ui_locale");const s=A?"fte.svg":"fte_old.svg",l=m("#local-file-animated-fte");l&&d(l,{backgroundImage:`url(../images/LocalizedFte/${i}/${s}),url(../images/LocalizedFte/en_US/${s})`}),r("#closeLocalFte",()=>{c.sendAnalytics(o.LOCAL_FTE_CROSS_BUTTON_CLICKED),chrome.runtime.sendMessage({main_op:"closeLocalFte"})}),r("#continueLocalFte",async()=>{c.sendAnalytics(o.LOCAL_FTE_GO_TO_SETTINGS_CLICKED),t.setItem("pdfViewer","true");const i=t.getItem("openSettingsInWindow");if(i){const e=t.getItem("localFteWindow"),{id:o,height:i,width:s,left:l,top:m}=e;chrome.windows.remove(o),chrome.windows.create({height:i,width:1.2*s,left:l,top:m,focused:!0,type:"normal",url:c.constructUrlWithParams(n,{context:a.LOCAL_FILE_COACHMARK,autoDismiss:!0})},e=>{_({},e.tabs[0].id),t.setItem("settingsWindow",{id:e.tabs[0].id})})}else{const{id:t,windowId:e}=await chrome.tabs.create({url:c.constructUrlWithParams(n,{context:a.LOCAL_FILE_COACHMARK,autoDismiss:!0}),active:!0});chrome.windows.update(e,{focused:!0},()=>{_({},t)})}e.event(o.LOCAL_FTE_SETTINGS_OPENED,{VARIANT:i?"InWindow":"InTab"})}),r("#localFteDontShowAgainInput",()=>{document.getElementById("localFteDontShowAgainInput").checked?(e.event(o.LOCAL_FTE_DONT_ASK_CHECKED),t.setItem("localFteDontShowAgain",!0)):(e.event(o.LOCAL_FTE_DONT_ASK_UNCHECKED),t.removeItem("localFteDontShowAgain"))}),h>4&&L("#localFteDontShowAgainInput,#localFteDontShowAgainText").forEach(t=>{t.removeAttribute("hidden")}),window.onbeforeunload=()=>{c.sendAnalytics(o.LOCAL_FTE_WINDOW_CLOSED);const t=Date.now();for(;Date.now()-t<60;);},document.addEventListener("keydown",t=>{"F11"==t.key&&t.preventDefault()})});