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
import{SESSION_TYPES as e}from"../sw_modules/session-store.js";export function mintUpsellSession(s){return new Promise(n=>{chrome.runtime.sendMessage({main_op:"create-session",type:e.UPSELL,tabId:s,tab:{id:s},data:{}},e=>n(e?.sessionId??null))})}export async function resolveUpsellTabId(s){if(!s)return NaN;const n=await(o=s,new Promise(s=>{chrome.runtime.sendMessage({main_op:"get-session",type:e.UPSELL,sessionId:o},e=>s(e?.data?.sourceTabId??null))}));var o;return Number.isInteger(n)?n:NaN}