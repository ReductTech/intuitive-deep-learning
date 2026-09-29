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
"use strict";import{buildAcrobatPromotionSource,sendAnalytics}from"../utils/util.js";export function processFileUrl(e,r,i={}){let o=e;return"createpdf"===r?o=e?.replace("disp=inline","disp=safe"):"compresspdf"!==r&&"editpdf"!==r||(o=e?.replace("disp=safe","disp=inline")),i.isDriveAsset&&i.driveUrlConverter&&(o=i.driveUrlConverter(o)||o),o}export function executeVerb({fileUrl:e,fileName:r,verb:i,promotionSourcePrefix:o,promotionSourceSuffix:t,viewerURLPrefix:n,inactiveTabDirectVerbProcessingEnabled:c=!1,verbConfig:s,sourceTabUrl:l,authContext:a,directVerbSessionId:u}){const d=buildAcrobatPromotionSource(o,t),f=n||chrome.runtime.getURL("viewer.html");chrome.runtime.sendMessage({main_op:"execute-direct-verb",fileUrl:e,fileName:r,viewerURL:f,promotionSource:d,verb:i,clickTimestamp:Date.now(),inactiveTabDirectVerbProcessingEnabled:c,verbConfig:s,sourceTabUrl:l,authContext:a,directVerbSessionId:u})}export function fireTouchpointAnalytics(e,{source:r,workflow:i,eventContext:o}){const t=`DCBrowserExt:DirectVerb:CTA:${e}`,n={source:r,workflow:i};o&&(n.eventContext=o),sendAnalytics([[t,n]])}