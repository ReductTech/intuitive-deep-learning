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
import{floodgate as t}from"./floodgate.js";import{fetchDefaultViewershipConfig as o}from"../content_scripts/utils/util.js";import{gmailConvertToPdfInit as a}from"./gmail-convert-to-pdf-module.js";async function i(i){const[e,l,c,r,s]=await Promise.all([t.hasFlag("dc-cv-gmail-acrobat-touch-point"),t.hasFlag("dc-cv-gmail-convert-to-pdf"),t.hasFlag("dc-cv-gmail-implicit-default-viewership"),chrome.storage.local.get("acrobat-touch-points-in-other-surfaces"),o("gmail")]),n="false"!==r["acrobat-touch-points-in-other-surfaces"];let m=null;l&&(m=await new Promise(t=>{a(t)})),i({enableGmailTouchPoint:e,enableImplicitDefaultViewershipFeature:c,touchPointSettingEnabled:n,isAcrobatDefaultForSurface:s,gmailConvertToPdfConfig:m})}export{i as gmailDocumentStartInit};