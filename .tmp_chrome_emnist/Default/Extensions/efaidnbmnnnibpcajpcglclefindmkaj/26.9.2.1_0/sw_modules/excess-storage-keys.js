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
import{dcLocalStorage as e}from"../common/local-storage.js";import{loggingApi as t}from"../common/loggingApi.js";import{floodgate as s}from"./floodgate.js";import{CACHE_PURGE_SCHEME as o}from"./constant.js";import{encodedActiveStorageKeys as a}from"../common/active-storage-keys-data.js";const r="storage-scan-complete",c=async()=>{const s=(({activeKeys:e,activeKeysRegex:t})=>{const s=new Set(e||[]),o=(t||[]).map(e=>new RegExp(e));return e=>s.has(e)||o.some(t=>t.test(e))})(JSON.parse(atob(a)));await e.init();const o=Object.keys(e.getAllItems()).filter(e=>!s(e));o.length>0&&(e=>{((e,t)=>{const s=[];for(let o=0;o<e.length;o+=t)s.push(e.slice(o,o+t));return s})(e,10).forEach(e=>{t.info({message:"Excess chrome.storage.local keys detected",keys:e})})})(o),await e.setItem(r,!0)};export const scanForExcessStorageKeys=async()=>{try{if(!await s.hasFlag("dc-cv-log-excess-storage",o.NO_CALL))return;if(await e.init(),e.getItem(r))return;await c()}catch(e){t.error({message:"Excess storage key scan failed",error:e})}};