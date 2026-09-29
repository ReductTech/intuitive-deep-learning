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
import{util as r}from"../../js/content-util.js";import{loggingApi as e}from"../../../common/loggingApi.js";import{analytics as o}from"../../../common/analytics.js";const t="Error in Conversion Error Screen:";async function n(){try{o.event("DCBrowserExt:Viewer:WebpageConversion:ErrorScreen:GoToAcrobat:Clicked");const r=await chrome.runtime.sendMessage({main_op:"get-welcome-pdf-url"}),e=(await chrome.tabs.getCurrent())?.id;chrome.tabs.update(e,{url:r})}catch(r){e.error({message:t,error:`handleGoToAcrobatClick: ${r}`})}}function i(){try{o.event("DCBrowserExt:Viewer:WebpageConversion:ErrorScreen:ReportError:Clicked"),window.location.href="https://acrobat.uservoice.com/forums/931921-adobe-acrobat-in-browsers"}catch(r){e.error({message:t,error:`handleReportErrorClick: ${r}`})}}!async function(){try{r.translateElements(".translate");const a=document.getElementById("goToAcrobatBtn");a?a.addEventListener("click",n):e.error({message:`${t} initialize: Go to Acrobat button not found`});const c=document.getElementById("reportErrorBtn");c?c.addEventListener("click",i):e.error({message:`${t} initialize: Report error button not found`}),o.event("DCBrowserExt:Viewer:WebpageConversion:ErrorScreen:Shown")}catch(r){e.error({message:t,error:`initialize: Error in initialization: ${r}`})}}();