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
import t from"../sw_modules/CacheStore.js";import{floodgate as e}from"../sw_modules/floodgate.js";import{dcLocalStorage as s}from"./local-storage.js";import{forceResetService as a}from"../sw_modules/force-reset-service.js";import{common as c}from"../sw_modules/common.js";import{CACHE_PURGE_SCHEME as n}from"../sw_modules/constant.js";const r="splunkAllowedEvents",o="dc-cv-splunk-allowed-events-enabled";function i(t){const e=(s=t,s.replaceAll(/[.*+?^${}()|[\]\\]/g,String.raw`\$&`)).replaceAll(/\\\*/g,".*");var s;return new RegExp(`^${e}$`)}const l=new class{constructor(){this.promise=null,this.cacheStore=new t("splunk-allowed-events"),this.exactMatches=[],this.patternMatches=[]}async fetchAllowedEventsList(){try{const t=c.getSplunkAllowedEventsUrl();if(!t)return await this.cacheStore.get(r)||[];const e=async()=>{const e=await async function(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to fetch allowed events list from ${t}: ${e.statusText}`);return(await e.text()).split("\n").map(t=>t.trim()).filter(t=>t.length>0&&!t.startsWith("#"))}(t);return e?.length>0&&await this.cacheStore.set(r,e),e||[]},{executionResult:s}=await a.executeFeature("splunk-allowed-events",e);if(s?.length>0)return s}catch{}return await this.cacheStore.get(r)||[]}async fetchAllowedEventsIfEnabled(){await s.init();return await e.hasFlag(o,n.NO_CALL)?this.fetchAllowedEventsList():[]}async getAllowedEvents(){if(!this.promise){this.promise=this.fetchAllowedEventsIfEnabled();const t=function(){try{const t=e.getFeatureMeta(o);if(t){const e=JSON.parse(t);if(e.cacheTTL&&"number"==typeof e.cacheTTL&&e.cacheTTL>0)return e.cacheTTL}}catch{}return 18e5}();setTimeout(()=>{this.promise=null},t)}return this.promise}processEventsList(t){this.exactMatches=[],this.patternMatches=[],Array.isArray(t)&&t.forEach(t=>{if(t.includes("*"))try{this.patternMatches.push(i(t))}catch{}else this.exactMatches.push(t)})}async syncAllowedEvents(){try{const t=await this.getAllowedEvents();this.processEventsList(t)}catch{const t=await this.cacheStore.get(r);this.processEventsList(t)}}getAllowedEventsSync(){return this.exactMatches}isEventAllowed(t){return!!this.exactMatches.includes(t)||this.patternMatches.some(e=>e.test(t))}};export default l;