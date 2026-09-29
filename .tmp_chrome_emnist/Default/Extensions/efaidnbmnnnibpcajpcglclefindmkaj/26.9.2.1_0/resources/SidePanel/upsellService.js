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
import{dcLocalStorage as e}from"../../common/local-storage.js";import{mintUpsellSession as a}from"../../common/upsellSessionClient.js";const t={getGspParameters:async()=>{const e=new URLSearchParams(window.location.search),t=parseInt(e.get("tabId"));return`ca=${chrome.runtime.id}&initSrc=extn_side_panel_assistant&tabId=${await a(t)}`},getFullScreenUpsellParams:async()=>{const e=await t.getGspParameters();return`?gsp=${encodeURIComponent(e)}&svar=chrome_etxn_sidepanel_ai`},clickSubscribeNow:async()=>{const a=`${e.getItem("genAIPricingUri")}${await t.getFullScreenUpsellParams()}`;window.open(a)}};export{t as upsellService};