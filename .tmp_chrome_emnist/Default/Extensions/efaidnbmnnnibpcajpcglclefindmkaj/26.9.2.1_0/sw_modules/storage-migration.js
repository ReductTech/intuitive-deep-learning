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
import{dcLocalStorage as e}from"../common/local-storage.js";import{loggingApi as o}from"../common/loggingApi.js";import{isMigrationCompleted as r,isMigrationCleanupCompleted as t}from"../common/util.js";import{floodgate as n}from"./floodgate.js";import{CACHE_PURGE_SCHEME as a}from"./constant.js";const i=["localFontPrimingDialogShownCount","disableGuestGenAI","enableEditForUpsellUser","freevspaidshown","discoveryCachePurge","anonUserUUID","localFileAccessPrompt","summaryNudgeData","scannedFileBannerData","userPrefs","ratingWidgetData","defaultOwnerShipExperiment","shareTooltipShown","onBoardingDialogShown","fillSignTourShown","editGuidedTourShown","nightModeTourShown","signInExperimentShown","inlineOrganiseTourShown","tryAgainSignIn","yoloCooldown","yoloData","bookmarkWeb","openInDesktopTooltipShown","lastSetupTime","rideErrorConfig_ride_AdobeID_acct_eoaChoose"],s="dc-cv-storage-async-migration";export const performSyncToAsyncStorageMigration=async()=>{try{if(!await n.hasFlag(s,a.NO_CALL))return;if(!r()){const r=e.getItem("viewerStorage")||{},t=e.getItem("viewerStorageAsync")||{};for(const e of i){const o=r[e];null!=o&&(t[e]=o)}return e.setItem("viewerStorageAsync",t),e.setItem("migrationOfSyncToAsyncStorage","true"),void o.info({message:"Storage migration copy completed"})}}catch(e){o.error({message:"Storage migration failed",error:e})}};export const performAsyncStorageCleanup=async()=>{try{if(!await n.hasFlag(s,a.NO_CALL))return;if(r()&&!t()){const r=e.getItem("viewerStorage")||{};for(const e of i)Object.prototype.hasOwnProperty.call(r,e)&&delete r[e];e.setItem("viewerStorage",r),e.setItem("migrationOfSyncToAsyncStorageCleanup","true"),o.info({message:"Storage migration cleanup completed (ready-triggered)"})}}catch(e){o.error({message:"Storage migration cleanup failed",error:e})}};