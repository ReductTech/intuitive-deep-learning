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
import{dcLocalStorage as o}from"../../../common/local-storage.js";import{isEdgeBrowser as t}from"../../../common/util.js";const c="wa_chrome",e="wa_edge",r="edit_in_acrobat";export function getAnalyticsInfo(){const n=o.getItem("extWhatsAppData");if(n?.xId&&n?.xLoc)return{xId:n.xId,xLoc:n.xLoc};return{xId:t()?e:c,xLoc:r}}