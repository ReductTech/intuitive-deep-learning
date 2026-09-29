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
import{dcLocalStorage as t}from"../../common/local-storage.js";import{loggingApi as o}from"../../common/loggingApi.js";import{communicate as e}from"../communicate.js";import{ensureAndExtractWebpageHTML as s}from"../add-webpage-to-project.js";import{util as n}from"../util.js";import{getStudentToolsTouchpointConfig as a}from"../../common/student-tools-touchpoint-registry.js";import{resolveStudentToolsSurfaceEligibility as r,sendStudentToolsTouchpointEvent as i,constructStudentToolsCreateUrlForSurface as c}from"./student-tools-touchpoint-module.js";export async function resolveAndSyncStudentToolsFabState(e){try{const o=await chrome.tabs.get(e),{source:s,touchpointIds:n}=await r(o,"fab"),i=n[0]||null,c=i?a(i):null;i&&c?.fabLabelKey?(t.setItem("studentToolsFabTouchpointId",i),t.setItem("studentToolsFabEligibilitySource",s||""),t.setItem("studentToolsFabLabelKey",c.fabLabelKey)):(t.removeItem("studentToolsFabTouchpointId"),t.removeItem("studentToolsFabEligibilitySource"),t.removeItem("studentToolsFabLabelKey"))}catch(s){t.removeItem("studentToolsFabTouchpointId"),t.removeItem("studentToolsFabEligibilitySource"),t.removeItem("studentToolsFabLabelKey"),o.warn({message:"Failed to resolve student tools FAB state",error:s?.message||s?.stack,context:{tabId:e}})}}e.registerHandlers({studentToolsFabLaunch:async function(t,e){const r=e?.tab,{touchpointId:l,eligibilitySource:m}=t||{},u=a(l);if(r?.id&&u?.fabRoutingContext)try{const t=await async function(t,o){const e=a(o);if(!e?.fabRoutingContext)throw new Error(`Unknown student tools FAB touchpoint: ${o}`);return c(t,o,e.fabRoutingContext)}(r,l),o=n.hostnameFromTabUrl(r);i(l,"fab","clicked",{domain:o,eligibilitySource:m}),await s(r.id),chrome.tabs.create({url:t,active:!0})}catch(t){o.error({message:"Error in student tools FAB launch flow",error:t?.message,stack:t?.stack,context:{touchpointId:l}})}}});