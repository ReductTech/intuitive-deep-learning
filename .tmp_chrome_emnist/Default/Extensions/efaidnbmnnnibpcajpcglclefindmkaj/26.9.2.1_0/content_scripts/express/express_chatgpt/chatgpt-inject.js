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
!function(){function t(t,e){document.dispatchEvent(new CustomEvent(t,{detail:e}))}const e=["/backend-api/aip/connectors/links/list_accessible"];!function(){const n=window.fetch;window.fetch=function(...s){return n.apply(this,s).then(n=>(Promise.resolve().then(()=>{try{const s=new URL(n.url);if(function(t,e){return"chatgpt.com"===t.hostname&&e.some(e=>t.pathname.includes(e))}(s,function(){try{const t=sessionStorage.getItem("adobeAcrobatExpressConnectedAppAPIs");if(!t)return e;const n=JSON.parse(t);return Array.isArray(n)?n:e}catch(t){return e}}())){n.clone().text().then(e=>{t("acrobat-chatgpt-api-response",{success:!0,responseData:e,responseUrl:n.url,status:n.status})}).catch(e=>{t("acrobat-chatgpt-api-response",{success:!1,error:e.message})})}}catch(t){}}),n)).catch(t=>{throw t})}}()}();