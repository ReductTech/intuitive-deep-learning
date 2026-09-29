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
import{CACHE_STORAGE_DUMMY_BASE_URL as e}from"../common/constant.js";export default class{constructor(e="default-cache"){this.cacheName=e}async set(t,a){try{if("undefined"==typeof caches)return null;const c=await caches.open(this.cacheName);await(c?.put?.(`${e}${t}`,new Response(JSON.stringify(a))))}catch(e){console.error("Cache set failed:",e)}}async setWithTTL(e,t,a){try{const c=Date.now()+a;await chrome.storage.local.set({[`${this.cacheName}-${e}-expiry`]:c}),await this.set(e,t)}catch(e){console.error("Cache setWithTTL failed:",e)}}async get(t){try{if("undefined"==typeof caches)return null;const a=await caches.open(this.cacheName),c=await(a?.match?.(`${e}${t}`));return c?await c.json():null}catch(e){return console.error("Cache get failed:",e),null}}async getWithTTL(e){try{const t=`${this.cacheName}-${e}-expiry`,a=(await chrome.storage.local.get(t))[t];return a&&Date.now()>a?(this.delete(e),null):await this.get(e)}catch(e){return console.error("Cache getWithTTL failed:",e),null}}async delete(t){try{if("undefined"==typeof caches)return;const a=await caches.open(this.cacheName);await(a?.delete?.(`${e}${t}`)),await chrome.storage.local.remove(`${this.cacheName}-${t}-expiry`)}catch(e){console.error("Cache delete failed:",e)}}}