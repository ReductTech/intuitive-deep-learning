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
import{dcLocalStorage as t}from"../common/local-storage.js";export const FLOODGATE_KEY="Floodgate";export const COMMUNICATE_KEY="Communicate";export const COMMON_KEY="Common";export const STABLE_KEYS=["Floodgate","Communicate","Common"];export const USE_STABLE_FLAG="_hydrateUseStableKeys";export const HYDRATE_TS_KEY="_hydrateTs";export const HYDRATE_STABLE_MIGRATION_LS="hydrateStableKeys";function e(t){if("string"!=typeof t||t.length<2)return null;try{const e=JSON.parse(t);if(Array.isArray(e)&&e.every(t=>Array.isArray(t)&&2===t.length)){const t=e.find(t=>"_hydrateTs"===t[0]);return{entries:e,ts:t&&Number(t[1])||0}}if(e&&Array.isArray(e.data)&&e.data.every(t=>Array.isArray(t)&&2===t.length))return{entries:e.data,ts:Number(e.ts)||0}}catch{return null}return null}const r=[["floodgateUri","featureGroups","featuresMeta","clientId","env"],["tabs","version","NMHConnStatus","activeTab","isAllowedLocalFileAccess"],["settings","server","globals"]];export function migrateLegacyKeysToStable(){const n=t.getAllItems();if(!n||"object"!=typeof n)return;const o=t.getItem(USE_STABLE_FLAG),s=Object.entries(n).filter(([t,r])=>!STABLE_KEYS.includes(t)&&t!==USE_STABLE_FLAG&&void 0!==r&&""!==r&&function(t){return null!==e(t)}(r));if(o)return void s.forEach(([e])=>t.removeItem(e));if(0===s.length)return void t.setItem(USE_STABLE_FLAG,"true");const a=new Set;STABLE_KEYS.forEach((n,o)=>{if(t.getItem(n))return;const i=r[o];let c=null,l=-1;if(s.forEach(([t,r])=>{if(a.has(t))return;const n=e(r);n&&function(t,e){const r=new Set(t.map(([t])=>t));return e.every(t=>r.has(t))}(n.entries,i)&&n.ts>l&&(l=n.ts,c=t)}),c){const r=e(t.getItem(c));r&&(t.setItem(n,JSON.stringify(r.entries)),a.add(c))}}),s.forEach(([e])=>t.removeItem(e)),t.setItem(USE_STABLE_FLAG,"true")}