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
import{loggingApi as e}from"../../common/loggingApi.js";import{util as t}from"../../browser/js/content-util.js";export async function fetchAndSendHtmlContent({cdn:n,tabId:o,touchpoint:a}){let i;try{i=await chrome.tabs.sendMessage(o,{main_op:"getHtmlContent"})}catch(t){e.error({message:"Sidepanel getHtmlContent failed",error:String(t),tabId:o,touchpoint:a})}t.consoleLog("HTML: Response from content script: ",i),i||e.error({message:"Sidepanel getHtmlContent returned empty response",tabId:o,touchpoint:a});const r=await async function(e){return(await chrome.i18n.detectLanguage(e)).languages.reduce((e,t)=>e.percentage>t.percentage?e:t,{language:"en",percentage:0})}(i?.textContent||"");n.sendMessage({type:"sidepanelHtmlContent",htmlContent:i?.htmlContent||"",initialQuestion:i?.initialQuestion,disqualified:i?.disqualified??!0,htmlContentForDocOverview:i?.htmlContentForDocOverview,pageLanguage:r.language,url:i?.url,touchpoint:a,webpageSelectionInfo:i?.webpageSelectionInfo,webpageSelectionIntent:i?.webpageSelectionIntent})}