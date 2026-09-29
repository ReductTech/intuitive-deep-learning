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
import{floodgate as t}from"./floodgate.js";import{analytics as a}from"../common/analytics.js";import{dcLocalStorage as e}from"../common/local-storage.js";import{safeParseFeatureFlag as r}from"./gsuite/util.js";const s=new Map,n=async n=>{var o;if(n)try{if(!n.startsWith("http://")&&!n.startsWith("https://"))return;const i=new URL(n)?.hostname;let c=(t=>{try{return t&&t.replace(/^www\./i,"").split(".")[0]||null}catch(t){return null}})(i);if(!c)return;c=c.toLowerCase();const l=`dc-cv-${c}-analytics-visited`;if(!await t.hasFlag(l))return;const m=r(l);if(!(Array.isArray(m?.hostnames)?m.hostnames:[]).includes(i))return;const h=`DCBrowserExt:${c}:Visited`;o=h,s?.has(o)||await(async t=>{var r;if(t)try{if(!s?.has(t)){const n=`${(r=new Date).getUTCFullYear()}${(r.getUTCMonth()+1).toString().padStart(2,"0")}`;s.set(t,n);const o=e.getItem(t),i=o?.lastSentYearMonth;if(!i||n>i){a.event(t);const r={lastSentYearMonth:n};await e.setItem(t,r)}}}catch(t){}})(h)}catch(t){}},o=()=>{chrome.tabs.onUpdated.addListener((t,a,e)=>{"complete"===a?.status&&e?.url&&n(e.url)})};export{o as initSiteVisitAnalytics};