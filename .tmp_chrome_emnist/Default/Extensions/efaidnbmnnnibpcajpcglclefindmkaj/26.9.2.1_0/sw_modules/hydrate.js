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
import{floodgate as t}from"./floodgate.js";import{communicate as s}from"./communicate.js";import{dcLocalStorage as e,callWithStorage as n}from"../common/local-storage.js";import{common as r}from"./common.js";import{migrateLegacyKeysToStable as i,FLOODGATE_KEY as a,COMMUNICATE_KEY as o,COMMON_KEY as c,USE_STABLE_FLAG as m,HYDRATE_TS_KEY as h,HYDRATE_STABLE_MIGRATION_LS as f}from"./migrate-legacy-keys.js";function y(){return"true"===e.getItem(m)||!0===e.getItem(f)}function l(t,s){return y()&&e.getItem(m)?s:t.constructor.name}const u=new function(){this.instances=[[t,a],[s,o],[r,c]],this.status={},this.instances.forEach(([,t])=>{this.status[t]=!1}),this.syncInterval=null,this.lastSynced={},this.do=()=>{y()&&i(),this.instances.forEach(([t,s])=>{if(!this.status[s]){const n=l(t,s),r=e.getItem(n)||"[]";let i=[];try{const t=JSON.parse(r);Array.isArray(t)?i=t:Array.isArray(t?.data)&&(i=t.data)}catch(t){i=[]}i.forEach(([s,e])=>{t[s]=e}),this.status[s]=!0}}),this.sync()},this.sync=()=>{this.syncInterval||(this.syncInterval=setInterval(()=>{this.instances.forEach(([t,s])=>{const n=Object.entries(t).filter(([t])=>t!==h),r=JSON.stringify(n);if(r===this.lastSynced[s])return;this.lastSynced[s]=r,t[h]=Date.now();const i=l(t,s);e.setItem(i,JSON.stringify(Object.entries(t)))})},1e3))}},g=(...t)=>n(u.do,...t);export{g as hydrateWithStorage};