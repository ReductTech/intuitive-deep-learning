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
import{loggingApi as t}from"../../common/loggingApi.js";import{floodgate as i}from"../floodgate.js";import{CACHE_PURGE_SCHEME as n}from"../constant.js";import{SITE_SIGNAL_VISITED_LOG_MESSAGE as r,SITE_SIGNAL_ANALYTICS_FLAG as e}from"./constants.js";import{QualifyingListMatcher as o}from"./QualifyingListMatcher.js";import{studentDetectionModule as s}from"./StudentDetectionModule.js";const a=new o;export async function checkSiteSignalVisit(o){if("string"!=typeof o||!o.startsWith("http://")&&!o.startsWith("https://"))return;if(!await(async()=>{try{return await i.hasFlag(e,n.NO_CALL)}catch{return!1}})())return;let c;try{c=new URL(o).hostname}catch{return}if(!c)return;const m=await s.getConfig(),f=m?.siteSignals?.entries;if(!f?.length)return;const g=a.findMatch(c,{entries:f});g&&(i=>{try{t.info({message:r,domain:i})}catch{}})(g.registrableDomain)}export function initSiteSignalAnalytics(){chrome.tabs.onUpdated.addListener((t,i,n)=>{"complete"===i?.status&&n?.url&&checkSiteSignalVisit(n.url).catch(()=>{})})}