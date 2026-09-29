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
import{util as t}from"./util.js";import{common as e}from"./common.js";import{forceResetService as s}from"./force-reset-service.js";import{floodgate as i}from"./floodgate.js";import o from"./CacheStore.js";import{CACHE_PURGE_SCHEME as n}from"./constant.js";import{dcLocalStorage as r}from"../common/local-storage.js";import{OFFSCREEN_DOCUMENT_PATH as c}from"../common/constant.js";const a="dcWebAnalyticsConfig",h={allowedEvents:[]};export const dcWebAnalyticsLogger=new class{constructor(){this.cacheStore=new o("dc-web-allowed-events"),this.promise=null,this.queue=[],this.flushTimer=null,this.isFlushing=!1}async fetchConfig(){try{const t=e.getDcWebAllowedEventsUrl();if(!t)return await this.cacheStore.get(a)||h;const i=async()=>{const e=await fetch(t);if(!e.ok)throw new Error(`Failed to fetch DCWeb analytics config from ${t}: ${e.statusText}`);const s=await e.json();return await this.cacheStore.set(a,s),s},{executionResult:o}=await s.executeFeature("dc-web-allowed-events",i);if(o)return o}catch{}return await this.cacheStore.get(a)||h}async getConfig(){return this.promise||(this.promise=this.fetchConfig(),setTimeout(()=>{this.promise=null},9e5)),this.promise}async logToDcWeb(t,e={},s={}){try{if(!await i.hasFlag("dc-cv-ext-analytics-to-cdn",n.NO_CALL))return;const{allowedEvents:o}=await this.getConfig();if(!o.includes(t))return;this.queue.push({pageName:t,eVars:e,props:s}),this.scheduleFlush()}catch(t){}}scheduleFlush(){this.isFlushing||this.flushTimer||(this.flushTimer=setTimeout(()=>this.flush(),1e4))}async flush(){if(this.flushTimer=null,this.isFlushing||!this.queue.length)return;const s=this.queue;this.queue=[],this.isFlushing=!0;try{const i=!0===r.getItem("ao"),o=`${c}?env=${e.getEnv()}`;await t.setupOffscreenDocument(o),await chrome.runtime.sendMessage({main_op:"logToDcWeb",target:"offscreen",iframeURL:e.getDcWebAnalyticsUrl(),ao:i,events:s})}catch(t){}finally{this.isFlushing=!1,this.queue.length&&this.scheduleFlush()}}};