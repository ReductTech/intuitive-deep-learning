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
import{floodgate as e}from"./floodgate.js";import{dcLocalStorage as t,dcSessionStorage as s}from"../common/local-storage.js";import{loggingApi as a}from"../common/loggingApi.js";import{safeJsonParse as o}from"../common/util.js";import{communicate as r}from"./communicate.js";import{Proxy as i}from"./proxy.js";import{getStorageEstimation as n,formatSize as l}from"./storage-analyzer-utils.js";import{USE_STABLE_FLAG as y}from"./migrate-legacy-keys.js";let g=null;class c{constructor(){this.proxy=i.proxy.bind(this)}calculateSize(e){try{return null==e?0:"string"==typeof e?e.length:new Blob([JSON.stringify(e)]).size}catch(e){return 0}}calculateStorageStats(e){const t={totalSize:0,totalKeys:0,keys:[],timestamp:Date.now()};return e?(Object.keys(e).forEach(s=>{const a=e[s],o=this.calculateSize(a);t.keys.push({key:s,size:o}),t.totalSize+=o}),t.totalKeys=t.keys.length,t.keys.sort((e,t)=>t.size-e.size),t):t}getTopKeys(e,t=20){const s=e.slice(0,t);return{topKeysString:s.map((e,t)=>`${t+1}. ${e.key}: ${l(e.size)}`).join(" | "),topKeys:s}}async analyzeStorage(e,t={}){const{topKeysLimit:s=20,includeAllKeys:a=!1}=t,o=this.calculateStorageStats(e),r=await n(),i=this.getTopKeys(o.keys,s);return{totalKeysSizeBytes:o.totalSize,totalKeys:o.totalKeys,storageQuotaBytes:r.quota,storageUsageBytes:r.usage,storageUsagePercent:r.usagePercent,totalKeysSizeFormatted:l(o.totalSize),storageCapacityInfo:r.capacityInfo,storageUsageDetails:r.usageDetailsString,topKeysString:i.topKeysString,usageDetailsBreakdown:r.usageDetailsBreakdown,allKeys:a?JSON.stringify(o.keys):""}}async handleQuotaError(r){try{if(!await e.hasFlag("dc-cv-storage-analyzer"))return;const{storageType:i,errorMessage:n="Unknown error",key:l="unknown"}=r,g="local"===i?t:s;await g.init();const c=e.getFeatureMeta("dc-cv-storage-analyzer"),m=o(c,{topKeysLimit:20,includeAllKeys:!1}),u=await this.analyzeStorage(g.storage,m),p=chrome.runtime.getManifest().version,K=t.getItem("anonUserUUID"),S="true"===t.getItem(y);a.error({storageType:i,message:n,key:l,totalKeysSizeBytes:u.totalKeysSizeBytes,totalKeys:u.totalKeys,storageQuotaBytes:u.storageQuotaBytes,storageUsageBytes:u.storageUsageBytes,storageUsagePercent:u.storageUsagePercent,totalKeysSizeFormatted:u.totalKeysSizeFormatted,storageCapacityInfo:u.storageCapacityInfo,storageUsageDetailsString:u.storageUsageDetails,topKeysString:u.topKeysString,allKeys:u.allKeys,extensionVersion:p,userUUID:K,useStableKeys:S})}catch(e){}}}g||(g=new c),r.registerHandlers({"log-quota-error":g.proxy(g.handleQuotaError)});export const storageAnalyzer=g;