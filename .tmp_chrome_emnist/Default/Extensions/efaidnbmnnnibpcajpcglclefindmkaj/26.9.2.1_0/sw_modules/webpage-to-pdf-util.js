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
export const WebpageToPdfToolState=Object.freeze({LOADING:"LOADING",ELIGIBLE:"ELIGIBLE",INELIGIBLE:"INELIGIBLE"});export const WEBPAGE_TO_PDF_ELIGIBILITY_MESSAGE="webpageToPdfEligibility";export const openWebpageToPdfViewerForTab=(e,t,o)=>{if(!e||!e.id||!t)return;const a=o||"webpage_chrome-convert_to_pdf",i=(e.title||"webpage").replace(/[<>:"/\\|?*\x00-\x1F]/g,"").replace(/\s+/g," ").trim().substring(0,200)||"webpage",n=i.endsWith(".html")?i:`${i}.html`,l=`https://convert-pdf-webpage/?htmlToPdfSessionId=${encodeURIComponent(t)}`,p=chrome.runtime.getURL("viewer.html"),r=`${l}&acrobatPromotionSource=${encodeURIComponent(a)}`,d=`${p}?pdfurl=${encodeURIComponent(r)}&pdffilename=${encodeURIComponent(n)}&acrobatPromotionWorkflow=${encodeURIComponent("html-to-pdf")}`;chrome.tabs.create({url:d,active:!0})};export function relayWebpageToPdfEligibility(e,t){e.sendMessage({type:"webpageToPdfEligibility",state:t})}export function resolveWebpageToPdfToolState({is_pdf:e,isBlacklistedUrl:t}){return e||t?WebpageToPdfToolState.INELIGIBLE:WebpageToPdfToolState.ELIGIBLE}export async function sendWebpageToPdfEligibilityOnCdnReady(e,t){try{const o=await chrome.runtime.sendMessage({main_op:"get-webpage-to-pdf-eligibility",tab:{id:t}});relayWebpageToPdfEligibility(e,o?resolveWebpageToPdfToolState(o):WebpageToPdfToolState.INELIGIBLE)}catch{relayWebpageToPdfEligibility(e,WebpageToPdfToolState.INELIGIBLE)}}function e(e,t){chrome.runtime.sendMessage({main_op:"webpage_to_pdf_eligibility",tabId:e,state:t}).catch(()=>{})}async function t(t,o){try{const a=await t.resolveWebpageToPdfEligibilityContext(o);e(o.id,resolveWebpageToPdfToolState(a))}catch{e(o.id,WebpageToPdfToolState.INELIGIBLE)}}export async function handleWebpageToPdfEligibilityOnNavigation(o,a,i,n){if(i.url||"loading"===i.status)if(e(a,WebpageToPdfToolState.LOADING),i.url)await t(o,{...n,id:a,pendingUrl:i.url});else try{const e=await chrome.tabs.get(a);await t(o,e)}catch{e(a,WebpageToPdfToolState.INELIGIBLE)}}