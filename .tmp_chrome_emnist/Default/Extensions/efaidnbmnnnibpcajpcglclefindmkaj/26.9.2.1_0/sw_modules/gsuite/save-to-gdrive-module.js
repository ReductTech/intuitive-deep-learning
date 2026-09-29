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
import{floodgate as e}from"../floodgate.js";import{removeExperimentCodeForAnalytics as o,setExperimentCodeForAnalytics as r}from"../../common/experimentUtils.js";import{safeParseFeatureFlag as n,checkViewerLocaleEnabled as t}from"./util.js";import{analytics as l}from"../../common/analytics.js";const i="dc-cv-gdrive-save-to-drive",a="dc-cv-gdrive-save-to-drive-control",c="GDS",s="GDSC",v="gdrive_chrome",m="save_to_gdrive";async function d(){const d=await e.hasFlag(i),p=await e.hasFlag(a),f=d&&n(i),u=p&&n(a),E=d&&t(f?.enLocaleEnabled,f?.nonEnLocaleEnabled),g=p&&t(u?.enLocaleEnabled,u?.nonEnLocaleEnabled);return E?(r(c),o(s),l.event("DCBrowserExt:GDrive:SaveToGDrive:CohortEnabled",{source:v,workflow:`${m}_challenger`},{frequency:"monthly",uniqueIdentifier:{props:["prop6"]}})):g?(r(s),o(c),l.event("DCBrowserExt:GDrive:SaveToGDrive:CohortEnabled",{source:v,workflow:`${m}_control`},{frequency:"monthly",uniqueIdentifier:{props:["prop6"]}})):(o(c),o(s)),{profileEmailSelector:f?.profileEmailSelector||null}}export{d as saveToGdriveInit};