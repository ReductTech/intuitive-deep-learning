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
import{dcLocalStorage as t}from"../../../common/local-storage.js";import{PDF_FETCH_RETRY_DEFAULTS as e}from"../../../common/constant.js";import{loggingApi as r}from"../../../common/loggingApi.js";import{getUrlOriginWithPathname as s}from"../../../common/util.js";export async function getRetryConfig(){const r=!0===t.getItem("pdfFetchRetry");let s=0,o=e.RETRY_DELAY_MS,n=e.RETRYABLE_STATUS_CODES;if(r)try{const t=await chrome.runtime.sendMessage({main_op:"getFloodgateMeta",flag:"dc-cv-pdf-fetch-retry"});if(t){const r=JSON.parse(t);s=r.maxRetryAttempts??e.MAX_RETRY_ATTEMPTS,o=r.retryDelayMs??e.RETRY_DELAY_MS,n=r.retryableStatusCodes??e.RETRYABLE_STATUS_CODES}else s=e.MAX_RETRY_ATTEMPTS}catch(t){s=e.MAX_RETRY_ATTEMPTS}return{maxRetries:s,retryDelayMs:o,retryableStatusCodes:n}}export function createRetryState(){let t=0,e=null;return{get retryCount(){return t},get lastFailedStatus(){return e},increment:()=>(t+=1,t),setLastStatus(t){e=t}}}export function isRetryableStatus(t,e){return e.includes(t)}export function logRetryAttempt(t,e,o={}){r.info({message:t,url:s(e),...o})}export function logRetrySuccess(t,e,o){r.info({message:"PDF buffer fetch succeeded after retry",url:s(t),previousStatus:e,retryCount:o})}export function handleRetry({retryState:t,maxRetries:e,statusOrType:r,logMessage:s,pdfURL:o,attemptFetch:n,retryDelayMs:a,onMaxRetriesExceeded:u,retryableStatusCodes:c=null}){const m="number"==typeof r;if((!m||isRetryableStatus(r,c))&&t.retryCount<e){t.setLastStatus(r);return logRetryAttempt(s,o,{...m?{status:r}:{},retryAttempt:t.increment()}),setTimeout(n,a),!0}return u(),!1}