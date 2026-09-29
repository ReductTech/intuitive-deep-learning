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
import{floodgate as t}from"../floodgate.js";import{loggingApi as e}from"../../common/loggingApi.js";import{CACHE_PURGE_SCHEME as n}from"../constant.js";import{QualifyingListLoader as r}from"../student-detection/QualifyingListLoader.js";import{QualifyingListMatcher as o}from"../student-detection/QualifyingListMatcher.js";import{HostnameNormalizer as i}from"../student-detection/HostnameNormalizer.js";export const STUDENT_TOOLS_STUDENT_SITES_FLAG="dc-cv-student-tools-student-sites";let s,a;export function pathPatternToRegExp(t){if(!t||"string"!=typeof t)return null;const e=(t.startsWith("/")?t:`/${t}`).split("/").filter(Boolean);if(0===e.length)return null;const n=e.map(t=>t.replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,"[^/]+"));try{return new RegExp(`^/${n.join("/")}/?$`,"i")}catch{return null}}export function pathnameMatchesPattern(t,e){const n=pathPatternToRegExp(e);return!!n&&n.test(t||"/")}export function matchStudentSiteTouchpointEntry(t,e,n={}){const r=e?.entries;if(!t||!Array.isArray(r)||0===r.length)return null;let o;try{o=new URL(t)}catch{return null}if("http:"!==o.protocol&&"https:"!==o.protocol)return null;const{tier:i,surface:s}=n;return r.find(t=>(null==i||t.tier===i)&&(!(s&&Array.isArray(t.surfaces)&&!t.surfaces.includes(s))&&(!!function(t,e){const n=e?.toLowerCase();if(!n||!t)return!1;const r=t.toLowerCase();return r===n||r.endsWith(`.${n}`)}(o.hostname,t.host)&&pathnameMatchesPattern(o.pathname,t.pathPattern))))||null}export async function resolveStudentSiteTouchpointEligibility(l,u){try{if(!await t.hasFlag(STUDENT_TOOLS_STUDENT_SITES_FLAG,n.NO_CALL))return{eligible:!1,entry:null};const e=i.hostnameFromUrl(l);if(!e)return{eligible:!1,entry:null};const u=await(s||(s=new r),s).load(),c=(a||(a=new o),a).findMatch(e,u);return{eligible:!!c,entry:c?.entry??null}}catch(t){return e.warn({message:"Failed to resolve student site touchpoint eligibility",error:t?.message,stack:t?.stack,context:{surface:u}}),{eligible:!1,entry:null}}}