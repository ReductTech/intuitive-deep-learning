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
import{getContract as e}from"./message-registry.js";import{DECISION as n}from"./messaging-constants.js";import{describeTargetEndpoint as t}from"./mediation-helpers.js";async function r({op:e,contract:r,request:i,sender:o,discriminatorField:s,endpoint:d,mediateFn:a,reportRejectionFn:p}){const c=r?.bus;try{const{decision:n}=await a({busId:c,op:e,envelopeFields:[s],request:i,sender:o,endpoint:d});return n}catch(i){return p({bus:c,op:e,tier:null,endpoint:t(r?.targetEndpoint),reason:`mediateFn threw: ${i?.message||i}`,timestamp:Date.now()}),n.REJECTED}}export function wrapRuntimeMessageListener(t,i,{mediateFn:o,endpoint:s,reportRejectionFn:d}){return function(a,p,c){if(void 0!==a?.dcMsgOp)return;const m=a?.[t];if(void 0===m)return i(a,p,c);const u={...a};return r({op:m,contract:e(m),request:u,sender:p,discriminatorField:t,endpoint:s,mediateFn:o,reportRejectionFn:d}).then(e=>{e!==n.REJECTED&&i(u,p,c)}),!0}}export function registerRuntimeMessageHandler(e,n,{endpoint:t,mediateFn:r,reportRejectionFn:i}){const o={mediateFn:r,endpoint:t,reportRejectionFn:i};chrome.runtime.onMessage.addListener(wrapRuntimeMessageListener(e,n,o))}export function wrapPortMessageListener(t,i,{mediateFn:o,endpoint:s,reportRejectionFn:d}){return function(a,p){const c=a?.[t];if(void 0===c)return i(a,p);r({op:c,contract:e(c),request:a,sender:p.sender,discriminatorField:t,endpoint:s,mediateFn:o,reportRejectionFn:d}).then(e=>{e!==n.REJECTED&&i(a,p)})}}export function registerPortMessageHandler(e,n,t,{endpoint:r,mediateFn:i,reportRejectionFn:o}){const s={mediateFn:i,endpoint:r,reportRejectionFn:o};e.onMessage.addListener(wrapPortMessageListener(n,t,s))}