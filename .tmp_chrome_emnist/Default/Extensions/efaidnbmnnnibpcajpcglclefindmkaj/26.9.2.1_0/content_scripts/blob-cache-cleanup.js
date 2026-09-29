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
import{indexedDBScript}from"../common/indexDB.js";import{loggingApi}from"../common/loggingApi.js";const BLOB_CACHE_CLEANUP_ALARM="clearBlobCache",BLOB_CACHE_CLEANUP_INTERVAL=1440;async function initializeBlobCacheCleanupAlarm(){await chrome.alarms.get("clearBlobCache")||chrome.alarms.create("clearBlobCache",{periodInMinutes:1440})}function blobCacheCleanupAlarmHandler(e){e&&"clearBlobCache"===e.name&&(indexedDBScript.clearExpiredBlobBuffers().catch(e=>{loggingApi.error({message:"Failed to clear old file buffer entries during scheduled cleanup",error:e})}),indexedDBScript.clearFileHashOldEntries().catch(e=>{loggingApi.error({message:"Failed to clear old blob cache entries during scheduled cleanup",error:e})}))}chrome.alarms.onAlarm.addListener(blobCacheCleanupAlarmHandler);export{initializeBlobCacheCleanupAlarm};