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
import{EXPERIMENT_VARIANTS_STORAGE_KEY as t}from"../sw_modules/constant.js";import{dcLocalStorage as n}from"./local-storage.js";function r(){return o().sort().join("_")}function o(){const r=n.getItem(t);return Array.isArray(r)?r:[]}function e(r){if(!r)return;const e=o();e.includes(r)||(e.push(r),n.setItem(t,e))}function s(r){let e=o();e.includes(r)&&(e=e.filter(t=>t!==r),n.setItem(t,e))}export{r as getActiveExperimentAnalyticsString,o as getActiveExperimentAnalyticsArray,e as setExperimentCodeForAnalytics,s as removeExperimentCodeForAnalytics};