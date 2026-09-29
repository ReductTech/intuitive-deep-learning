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
import{loggingApi as t}from"../../common/loggingApi.js";import{common as e}from"../common.js";import{floodgate as r}from"../floodgate.js";import{forceResetService as o}from"../force-reset-service.js";import s from"../CacheStore.js";import{CACHE_PURGE_SCHEME as a}from"../constant.js";import{busFlagId as n,MASTER_ENABLE_FLAG as i}from"./flag-ids.js";import{busOpManifests as c}from"./op-manifest.default.js";import{MODE as f}from"./messaging-constants.js";const m="op-manifest",u=new s;let p=null;async function l(){const t=await fetch(e.getOpManifestUrl());if(!t.ok)throw new Error(`HTTP ${t.status}`);const r=await t.json();if(!r||"object"!=typeof r||Array.isArray(r))throw new Error("op-manifest: unexpected shape");return r}export async function getBusManifest(e){p||(p=async function(){o.executeFeature(m,async()=>{const t=await l();return await u.set(m,t),t}).catch(e=>t.error({message:"[op-manifest] refresh error",error:e?.message}));const e=await u.get(m);if(e)return e;try{const t=await l();return await u.set(m,t),t}catch{return c}}(),setTimeout(()=>{p=null},9e5));return(await p)[e]??{}}export async function resolveMode(t,e){const[o,s]=await Promise.all([r.hasFlag(i,a.NO_CALL),r.hasFlag(n(t),a.NO_CALL)]);if(!o||!s)return f.UNMIGRATED;const c=(await getBusManifest(t))[e];return c===f.DARK_LAUNCH||c===f.ENFORCE?c:f.UNMIGRATED}export function resetManifestCacheForTests(){p=null}