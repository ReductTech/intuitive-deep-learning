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
export function normalizeLanguageTag(e){return e&&"string"==typeof e?e.trim().toLowerCase().split(/[-_]/)[0]:""}export async function getPageContentLanguage(e=document){const n=e?.documentElement?.getAttribute?.("lang")?.trim()||"",t=(e?.body?.innerText||e?.body?.textContent||e?.documentElement?.innerText||e?.documentElement?.textContent||"").replace(/\s+/g," ").trim().slice(0,8e3);if(!t)return{declaredLanguage:n,dominantLanguage:null,percentage:0,textLength:0};try{const e=await chrome.i18n.detectLanguage(t),a=e?.languages?.reduce((e,n)=>e.percentage>n.percentage?e:n,{language:null,percentage:0})??{language:null,percentage:0};return{declaredLanguage:n,dominantLanguage:a.language,percentage:a.percentage,textLength:t.length}}catch{return{declaredLanguage:n,dominantLanguage:null,percentage:0,textLength:t.length}}}