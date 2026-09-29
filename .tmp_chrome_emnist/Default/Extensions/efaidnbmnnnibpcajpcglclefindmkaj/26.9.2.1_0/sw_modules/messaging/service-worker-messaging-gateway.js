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
import{resolveMode as e}from"./op-migration-state.js";import{loggingApi as n}from"../../common/loggingApi.js";import{mediate as t}from"./mediation-pipeline.js";import{wrapRuntimeMessageListener as r,wrapPortMessageListener as i}from"./message-gateway-core.js";function o(e){n.warn({message:"DCBrowserExt:Messaging:Rejected",...e})}function s(n){return t({...n,resolveModeFn:e,reportRejectionFn:o})}export function wrapRuntimeMessageListener(e,n,{mediateFn:t=s,endpoint:i}={}){return r(e,n,{mediateFn:t,endpoint:i,reportRejectionFn:o})}export function registerRuntimeMessageHandler(e,n,{endpoint:t,mediateFn:r=s}={}){const i={mediateFn:r,endpoint:t};chrome.runtime.onMessage.addListener(wrapRuntimeMessageListener(e,n,i))}export function registerExternalMessageHandler(e,n,{endpoint:t,wrapListener:r}={}){const i=wrapRuntimeMessageListener(e,n,{mediateFn:s,endpoint:t});chrome.runtime.onMessageExternal.addListener(r?r(i):i)}export function wrapPortMessageListener(e,n,{mediateFn:t=s,endpoint:r}={}){return i(e,n,{mediateFn:t,endpoint:r,reportRejectionFn:o})}export function registerPortMessageHandler(e,n,t,{endpoint:r}={}){const i={mediateFn:s,endpoint:r};e.onMessage.addListener(wrapPortMessageListener(n,t,i))}