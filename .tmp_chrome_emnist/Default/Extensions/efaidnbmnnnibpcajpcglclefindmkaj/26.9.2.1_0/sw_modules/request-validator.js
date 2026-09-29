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
import{loggingApi as e}from"../common/loggingApi.js";const s=36e5,r=100,t=new Map,o=(s,o,u)=>{if(t.size>=r){e.warn({message:"Max pending requests reached",requestId:s,count:t.size});const r=t.keys().next().value;t.delete(r),e.warn({message:"Removed oldest request",requestId:r})}t.set(s,{timestamp:Date.now(),used:!1,source:o,tabId:u})},u=r=>{if(!r)throw new Error("Request ID is missing");const o=t.get(r);if(!o)throw e.error({message:"Request validation: Unknown request ID",requestId:r}),new Error("Request ID is not registered or removed due to expiry");if(Date.now()-o.timestamp>s)throw t.delete(r),e.error({message:"Request validation: Request expired",requestId:r,source:o.source}),new Error("Request ID is expired");if(o.used)throw e.error({message:"Request validation: Request ID already used",requestId:r,source:o.source}),new Error("Request ID is already used");return o.used=!0,t.set(r,o),!0},n=()=>{const e=Date.now();t.forEach((r,o)=>{(e-r.timestamp>s||r.used)&&t.delete(o)})},a=e=>{const s=t.get(e);return s?.source||null},d=e=>{const s=t.get(e);return s?.tabId??null};export{o as registerRequestId,u as isRequestIdValid,n as cleanupUsedOrExpiredRequests,a as getRequestContext,d as getRequestTabId};