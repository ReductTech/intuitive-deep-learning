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
import{sendErrorLog,getParsedJSON,extractFileIdFromDriveUrl,sendAnalyticsOncePerMonth}from"../utils/util.js";import state from"./state.js";const PDF_MIME_TYPE="application/pdf",GSUITE_ADDON_ID="80763634447",processSearchApiResponse=e=>{try{const r=e?.detail?.searchResponse;if(!r)return;const s=r.split("\n"),t=s[s.length-1],n=getParsedJSON(t);if(!Array.isArray(n)||n.length<5||!Array.isArray(n[4]))return;const i=e=>Array.isArray(e)&&e.length>12,a=n[4].every(i)?n[4].map(getFileDetailsFromApiResponse):[];state.searchFileList=a.filter(e=>e.mimeType===PDF_MIME_TYPE)}catch(e){sendErrorLog("Error in GSuite",`processSearchApiResponse : Failure in parsing GDrive search API response with error: ${e}`)}},getFileDetailsFromApiResponse=e=>({id:extractFileIdFromDriveUrl(e[5]),mimeType:e[11],title:e[12]}),handleGDriveInstalledAppResponse=e=>{try{const r=JSON.parse(e?.detail?.responseData);if(!r)return void sendErrorLog("Error in GSuite","handleGDriveInstalledAppResponse : Failure in GDrive Add-on API Parsing: Response Missing");if(state.addOnStatus={},!(Array.isArray(r?.items)&&r.items.length>0))return void sendErrorLog("Error in GSuite","handleGDriveInstalledAppResponse : Failure in GDrive Add-on API Parsing: Response parsing failed");if(state.addOnStatus.isAddOnInstalled=r.items.some(e=>"80763634447"===e.id),!state?.addOnStatus?.isAddOnInstalled)return void(state.addOnStatus.isAddOnDefault=!1);sendAnalyticsOncePerMonth("DCBrowserExt:Gdrive:AddOn:Installed"),Array.isArray(r?.defaultAppIds)&&r.defaultAppIds.length>0?(state.addOnStatus.isAddOnDefault=r?.defaultAppIds?.includes("80763634447"),state?.addOnStatus?.isAddOnDefault&&sendAnalyticsOncePerMonth("DCBrowserExt:Gdrive:AddOn:Default")):sendErrorLog("Error in GSuite","handleGDriveInstalledAppResponse : Failure in GDrive Add-on API Parsing: Default Status parsing failed")}catch(e){sendErrorLog("Error in GSuite",`handleGDriveInstalledAppResponse : Failure in GDrive Add-on API Parsing: Response parsing failed with error : ${e}`)}};export{processSearchApiResponse,handleGDriveInstalledAppResponse};