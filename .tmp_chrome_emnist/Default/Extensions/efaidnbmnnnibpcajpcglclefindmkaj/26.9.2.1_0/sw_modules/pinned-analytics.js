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
import{analytics as e}from"../common/analytics.js";import{dcLocalStorage as n}from"../common/local-storage.js";import{checkForImsSidCookie as t}from"../common/util.js";const o="extensionPinnedState",s=e=>e?"Pinned":"Unpinned",c=e=>e?"SignedIn":"Anon",a=async({isOnToolbar:a})=>{const i=s(a),r=await t();e.event(e.e.EXTENSION_PINNED_CHANGED,{STATE:i,source:c(r)}),n.setItem(o,i)},i=async()=>{try{const[{isOnToolbar:i},r]=await Promise.all([chrome.action.getUserSettings(),t()]);((t,a)=>{const i=s(t),r=c(a);e.logEventOnce(e.e.EXTENSION_PINNED_STATE,{storageKey:"pinnedStateAnalyticsLogged",STATE:i,source:r});const m=n.getItem(o);m&&m!==i&&e.event(e.e.EXTENSION_PINNED_CHANGED,{STATE:i,source:r}),n.setItem(o,i)})(i,r),chrome.action.onUserSettingsChanged&&chrome.action.onUserSettingsChanged.addListener(a)}catch(e){}};export{i as initPinnedAnalytics};