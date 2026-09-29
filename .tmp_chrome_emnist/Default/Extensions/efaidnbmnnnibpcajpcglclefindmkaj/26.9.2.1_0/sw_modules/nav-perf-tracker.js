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
import{loggingApi as e}from"../common/loggingApi.js";const r=new Map;function t(){if(r.size<=300)return;const t=r.size-300+5,n=r.keys();for(let e=0;e<t;e+=1){const{value:e,done:t}=n.next();if(t)break;r.delete(e)}e.warn({message:`DC Acrobat Extn: navPerfByTab exceeded 300 entries — evicted ${t} oldest`})}function n(e,n,s){const o=Number(e);if(!o||o<0||"number"!=typeof s)return;t();const c=r.get(o)||{};c[n]=s,r.set(o,c)}export function recordMainFrameNavStart(e,n,s){const o=Number(e);!o||o<0||"number"!=typeof n||(t(),r.set(o,{navStartTs:n}))}export function recordRequestObserved(e,r){n(e,"requestObservedTs",r)}export function recordViewerRedirectStart(e,r){n(e,"viewerRedirectTs",r)}export function getNavPerfMarkers(e){const t=r.get(Number(e));return{navStartTs:t?.navStartTs??-1,requestObservedTs:t?.requestObservedTs??-1,viewerRedirectTs:t?.viewerRedirectTs??-1}}export function clearNavPerfMarkers(e){r.delete(Number(e))}