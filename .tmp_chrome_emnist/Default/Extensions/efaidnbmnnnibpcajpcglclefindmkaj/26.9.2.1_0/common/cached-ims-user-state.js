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
import{CACHED_IMS_USER_STATE_KEY as e}from"./constant.js";import{dcLocalStorage as t}from"./local-storage.js";function s(e){return"string"==typeof e&&e.length>0}export function getCachedImsUserState(){const r=t.getItem(e);return function(e){return e&&"object"==typeof e&&s(e.userId)&&"anon"!==e.userId&&s(e.imsToken)}(r)?r:null}export function getCachedImsUserId(){return getCachedImsUserState()?.userId||null}export function getCachedImsUserStatePingFields(){const e=getCachedImsUserState();return{userType:e?.userType||"anon",subscriptionType:e?.subscriptionType||"Free"}}export function clearCachedImsUserState(){t.removeItem(e)}export function persistCachedImsUserState(s){if(!s?.isSignedIn||!s.userId||"anon"===s.userId)return void clearCachedImsUserState();if(!s.imsToken)return;const r=t.getItem(e),n={userId:s.userId,imsToken:s.imsToken,imsTokenExpiry:s.imsTokenExpiry,lastSyncAt:Date.now()};null!=s.userType&&null!=s.subscriptionType?(n.userType=s.userType,n.subscriptionType=s.subscriptionType):r&&"object"==typeof r&&(null!=r.userType&&(n.userType=r.userType),null!=r.subscriptionType&&(n.subscriptionType=r.subscriptionType)),t.setItem(e,n)}export function touchCachedImsUserStateLastSyncAt(){const s=getCachedImsUserState();s&&(s.lastSyncAt=Date.now(),t.setItem(e,s))}