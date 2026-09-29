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
import e from"../sw_modules/CacheStore.js";import{forceResetService as t}from"../sw_modules/force-reset-service.js";import{common as i}from"../sw_modules/common.js";import{util as r}from"../sw_modules/util.js";import{dcLocalStorage as o}from"./local-storage.js";class n{syncCacheDuration=9e5;static DEFAULT_CONFIG={end_date:null,frequency:"always",sampling_rate:100};getDefaultConfig(){const e=o.getItem("arfMetadata");return e?.config?{...n.DEFAULT_CONFIG,...e.config}:n.DEFAULT_CONFIG}async getOverrideConfig(){if(void 0!==this.config)return this.config;const r=new e;this.config=await r.get("analytics-override-config");return t.executeFeature("analytics-override-config",async()=>{const e=i.getAnalyticsOverrideConfigUri(),t=await fetch(e),o=await t.json();return await r.set("analytics-override-config",o),o}).then(async e=>{e.executionResult&&(this.config=e.executionResult)}),this.clearConfigCacheTimeout=this.clearConfigCacheTimeout||setTimeout(()=>{this.config=void 0,this.clearConfigCacheTimeout=void 0},this.syncCacheDuration),this.config}async getConfig(e,t={}){const i=await this.getOverrideConfig(),o=i?.block;if(o?.some(t=>{try{return new RegExp(t).test(e)}catch(e){return r.consoleError("AnalyticsOverrideConfigManager: Error in blocklist regex test",e),!1}}))return{is_blocked:!0};const n=i?.allow,s=n?.find(t=>{try{return new RegExp(t.name).test(e)}catch(e){return r.consoleError("AnalyticsOverrideConfigManager: Error in allowlist regex test",e),!1}})||{};return{...this.getDefaultConfig(),...t,...s}}}export const analyticsOverrideConfigManager=new n;