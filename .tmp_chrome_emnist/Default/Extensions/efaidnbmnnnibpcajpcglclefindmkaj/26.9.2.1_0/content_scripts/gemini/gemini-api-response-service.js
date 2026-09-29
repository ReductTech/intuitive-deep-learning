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
import state from"./state.js";const EMPTY_CHAT_TOKEN_RESULT={chatId:void 0,chatTokenValue:void 0},injectGeminiAPIResponseInterceptor=()=>{if(state?.geminiAPIResponseInterceptorAdded)return;const e=document.createElement("script");e.src=chrome.runtime.getURL("content_scripts/gemini/gemini-inject.js"),e.onload=function(){this.remove()},(document.head||document.documentElement).appendChild(e),state.geminiAPIResponseInterceptorAdded=!0},getParsedJSON=e=>{let t;try{t=JSON.parse(e)}catch(e){}return t},getSanitizedAPIResponseData=e=>{if("string"!=typeof e||!e)return null;const t=e.replace(/^\)\]\}'\s*/,""),n=t.search(/[[{]/);if(-1===n)return null;const a=[];let r=-1;for(let e=n;e<t.length;e+=1){const n=t[e];if("["===n||"{"===n)a.push(n);else if(("]"===n||"}"===n)&&(a.pop(),0===a.length)){r=e+1;break}}return-1===r?null:t.slice(n,r)},getChatTokenValue=e=>{const t=getParsedJSON(e?.[0]?.[2]);if(null==t)return EMPTY_CHAT_TOKEN_RESULT;const n=t?.[1];let a=t?.[0]?.[0]?.[0]?.[0];return"string"==typeof a&&a.startsWith("c_")?(a=a.slice(2),{chatId:a,chatTokenValue:n}):EMPTY_CHAT_TOKEN_RESULT},parseDataForChatFullyLoaded=e=>{const t=getSanitizedAPIResponseData(e);if(!t)return EMPTY_CHAT_TOKEN_RESULT;const n=getParsedJSON(t);return getChatTokenValue(n)},geminiDataHandler=e=>{const{chatId:t,chatTokenValue:n}=parseDataForChatFullyLoaded(e?.detail?.responseData);if(!t||void 0===n)return;const a=null===n;state.setLRUData(t,a)},addGeminiDataEventListener=()=>{state.eventControllerSignal.aborted||document.addEventListener("acrobat-gemini-api-data",geminiDataHandler,{signal:state.eventControllerSignal})};export{injectGeminiAPIResponseInterceptor,addGeminiDataEventListener};