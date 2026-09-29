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
import{util as e}from"../../js/content-util.js";import{loggingApi as n}from"../../../common/loggingApi.js";import{analytics as r}from"../../../common/analytics.js";import{indexedDBScript as i}from"../../../common/indexDB.js";const o="Error in Session Expired Error Screen:";function t(){try{r.event("DCBrowserExt:Viewer:SessionExpired:SelectFile:Clicked");const e=document.createElement("input");e.type="file",e.accept=".pdf",e.style.display="none",document.body.appendChild(e),e.click(),e.onchange=async n=>{const r=n?.target?.files[0];if(!r)return void document.body.removeChild(e);const o=URL.createObjectURL(r),t=await r.arrayBuffer();i.storeFileByHash(t,`chrome-extension://${chrome.runtime.id}/${o}`).then(()=>{const e={main_op:"openLocalFileThroughFilePicker"};e.file_name=r.name,e.fileURL=o,e.openLocalFileSource="SessionExpiredScreen:SelectFile",chrome.runtime.sendMessage(e)}),document.body.removeChild(e)}}catch(e){n.error({message:o,error:`handleSelectFileClick: Error handling file selection: ${e}`})}}!async function(){try{e.translateElements(".translate");const i=document.getElementById("selectFileBtnContainer");i?i.addEventListener("click",t):n.error({message:`${o} initialize: Select file button not found`}),r.event("DCBrowserExt:Viewer:SessionExpired:ErrorScreen:Shown")}catch(e){n.error({message:o,error:`initialize: Error in initialization: ${e}`})}}();