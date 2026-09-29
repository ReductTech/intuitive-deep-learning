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
import{forceResetService as t}from"./force-reset-service.js";import{common as i}from"./common.js";import{floodgate as r}from"./floodgate.js";import{loggingApi as e}from"../common/loggingApi.js";import s from"./CacheStore.js";export const promptPriorityList=new class{syncCacheDuration=9e5;constructor(){this.priorityList=null,this.cacheStore=new s}async fetch(t){const i=await fetch(t);if(!i.ok)throw new Error(`Failed to fetch priority list from ${t}: ${i.statusText}`);return(await i.text()).split("\n").map(t=>t.trim()).filter(t=>t.length>0)}async isCDNPriorityListEnabled(){return await r.hasFlag("dc-cv-prompt-priority-list")}isPriorityListNonEmpty(){return this.priorityList&&this.priorityList.length>0}setClearCacheTimeout(){this.clearCacheTimeout=this.clearCacheTimeout||setTimeout(()=>{this.priorityList=null,this.clearCacheTimeout=void 0},this.syncCacheDuration)}async getPriorityList(){if(!await this.isCDNPriorityListEnabled())return null;if(this.isPriorityListNonEmpty())return this.priorityList;return t.executeFeature("prompt-priority-list",async()=>{const t=i.getPromptPriorityListUrl();return this.fetch(t).then(t=>(this.cacheStore.set("prompt-priority-list",t),t)).catch(t=>(e.error({message:"Error in fetching priority list",error:t}),null))}).then(t=>{t.callbackExecuted&&t.executionResult&&(this.priorityList=t.executionResult,this.setClearCacheTimeout())}),this.priorityList=await this.cacheStore.get("prompt-priority-list"),this.isPriorityListNonEmpty()?(this.setClearCacheTimeout(),this.priorityList):null}};