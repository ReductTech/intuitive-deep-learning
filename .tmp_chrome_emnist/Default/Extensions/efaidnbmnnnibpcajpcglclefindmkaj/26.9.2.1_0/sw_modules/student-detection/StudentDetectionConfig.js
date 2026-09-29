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
import{loggingApi as e}from"../../common/loggingApi.js";import{CACHE_PURGE_SCHEME as a}from"../constant.js";import{floodgate as n}from"../floodgate.js";import{BROWSER_STUDENT_DETECTION_FLAG as o,DEFAULT_CLASSIFICATION_RULES as s,DEFAULT_STUDENT_DETECTION_CONFIG as t}from"./constants.js";const i=(e,a)=>{const n=Number(e);return Number.isFinite(n)&&n>0?Math.floor(n):a};export const getStudentDetectionConfig=async()=>{try{await n.hasFlag(o,a.NO_CALL);const e=n.getFeatureMeta(o);if(!e)return{...t,classificationRules:{...s}};const r=JSON.parse(e);return{learnerRetentionDays:i(r?.learnerRetentionDays,t.learnerRetentionDays),classificationRules:{uniqueDomainThreshold:i(r?.uniqueDomainThreshold,s.uniqueDomainThreshold),activeDayThreshold:i(r?.activeDayThreshold,s.activeDayThreshold),engagementSpanDays:i(r?.engagementSpanDays,s.engagementSpanDays),windowDays:i(r?.windowDays,s.windowDays)}}}catch(a){return e.warn({message:"Failed to parse browser student detection floodgate meta",error:a?.message||a?.stack}),{...t,classificationRules:{...s}}}};export const applyFloodgateClassificationRules=(e,a)=>{const n=a?.classificationRules??s;return{uniqueDomainThreshold:e?.uniqueDomainThreshold??n.uniqueDomainThreshold,activeDayThreshold:e?.activeDayThreshold??n.activeDayThreshold,engagementSpanDays:e?.engagementSpanDays??n.engagementSpanDays,windowDays:e?.windowDays??n.windowDays}};