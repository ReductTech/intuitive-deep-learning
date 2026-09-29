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
import{getContract as e}from"./message-registry.js";import{MODE as o,DECISION as t}from"./messaging-constants.js";import{validateSchema as n,permit as s,resolveTier as r,evaluateContract as i,describeTargetEndpoint as a}from"./mediation-helpers.js";export{n as validateSchema,s as permit};export async function mediate({busId:n,op:s,envelopeFields:d,request:p,sender:c,endpoint:m,resolveModeFn:u,reportRejectionFn:l}){const E=e(s);if(!E)return{decision:t.UNMIGRATED};const A=await u(n,s);if(A===o.UNMIGRATED)return{decision:t.UNMIGRATED};const D=await r(n,c),{passes:I,reason:R}=i(E,D,p,d,m);return I||l({bus:n,op:s,tier:D??null,endpoint:a(E.targetEndpoint),reason:R,timestamp:Date.now()}),A===o.DARK_LAUNCH?{decision:t.DARK_LAUNCH_PASS}:I?{decision:t.PERMITTED}:{decision:t.REJECTED,reason:R}}export async function snapshot(t){const{resolveMode:n}=await import("./op-migration-state.js");return Promise.all(t.map(async({busId:t,op:s})=>{const r=e(s);if(!r||r.bus!==t)return{busId:t,op:s,mode:o.UNMIGRATED,contract:null};const{allowedSenderTiers:i,schema:a,targetEndpoint:d}=r;return{busId:t,op:s,mode:await n(t,s),contract:{allowedSenderTiers:i,schema:a,targetEndpoint:d}}}))}