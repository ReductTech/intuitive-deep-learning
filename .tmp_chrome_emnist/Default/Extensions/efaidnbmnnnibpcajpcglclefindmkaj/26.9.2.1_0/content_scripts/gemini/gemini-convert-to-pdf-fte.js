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
const GEMINI_CONVERT_TO_PDF_TOUCHPOINT_CONTAINER_CLASS="gemini-convert-to-pdf-touchpoint-container",GEMINI_CHAT_FTE_STATE_STORAGE_KEY="acrobat-gemini-convert-to-pdf-fte",GEMINI_RESPONSE_FTE_STATE_STORAGE_KEY="acrobat-gemini-response-convert-to-pdf-fte",GEMINI_CONVERT_TO_PDF_FTE_CONTAINER_CLASS="acrobat-fte-tooltip-container";class GeminiConvertToPdfFte{id="geminiconverttopdffte";timeout=2e3;static GEMINI_DOMAINS=["gemini.google.com"];constructor(){const e=window.location.hostname;if(!GeminiConvertToPdfFte.GEMINI_DOMAINS.some(t=>e.includes(t)))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices(),this.pendingFteType=null}async loadServices(){const[e,t,i]=await Promise.all([import(chrome.runtime.getURL("content_scripts/utils/fte-utils.js")),import(chrome.runtime.getURL("content_scripts/gemini/gemini-convert-to-pdf-fte-service.js")),import(chrome.runtime.getURL("content_scripts/gemini/state.js"))]);this.fteUtils=e,this.geminiConvertToPdfFteService=t,this.state=i.default}async render(){"chat"===this.pendingFteType?await(this.geminiConvertToPdfFteService?.addChatFte?.()):"response"===this.pendingFteType&&await(this.geminiConvertToPdfFteService?.addResponseFte?.()),this.pendingFteType=null}async isEligible(){const e=await chrome.runtime.sendMessage({main_op:"gemini-convert-to-pdf-init"});if(!e?.chatFteEnable&&!e?.responseFteEnable)return!1;await this.initPromise;const{initFteStateAndConfig:t,shouldShowFteTooltip:i}=this.fteUtils;if(document.getElementsByClassName("acrobat-fte-tooltip-container").length>0)return!1;if(e.chatFteEnable){const n=document.getElementsByClassName("gemini-convert-to-pdf-touchpoint-container");if(n?.length){const n=await t(GEMINI_CHAT_FTE_STATE_STORAGE_KEY);if(await i(e.chatFteConfig,n,e.chatFteEnable))return this.pendingFteType="chat",!0}}if(e.responseFteEnable){const n=this.state?.currentHoveredResponseMoreMenuContainer;if(n){const n=await t(GEMINI_RESPONSE_FTE_STATE_STORAGE_KEY);if(await i(e.responseFteConfig,n,e.responseFteEnable))return this.pendingFteType="response",!0}}return!1}}window.GeminiConvertToPdfFte=GeminiConvertToPdfFte;