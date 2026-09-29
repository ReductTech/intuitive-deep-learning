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
import{dcLocalStorage as e}from"../../common/local-storage.js";import{loggingApi as t}from"../../common/loggingApi.js";import{floodgate as r}from"../floodgate.js";export const getAccountSpecificRedirectUrl=(e,t,r)=>{let o="0";if(e)try{const t=new URL(e),r=t?.pathname?.match(/\/mail\/u\/(\d+)/);if(r&&r.length>1)o=r[1];else{const e=t?.searchParams?.get("authuser");e&&(o=e)}}catch(e){}return`${t}${r}u/${o}`};const o=(t,r,o)=>{const a=e.getItem(t),c="en-US"===a||"en-GB"===a;return c&&r||!c&&o};export const checkViewerLocaleEnabled=(e,t)=>o("appLocale",e,t);export const checkUserLocaleEnabled=(e,t)=>o("locale",e,t);export const safeParseFeatureFlag=e=>{try{return JSON.parse(r.getFeatureMeta(e))}catch(r){return t.error({context:"TouchPoint feature flag parsing",message:`Failure in parsing FeatureFlag ${e}`,error:r.message||r.toString()}),{}}};