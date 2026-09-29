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
import{loggingApi as e}from"../common/loggingApi.js";import{initTemporaryURLBufferIndexedDB as r}from"../common/temporaryURLBufferIndexDB.js";import{TEMP_BUFFER_CLEAN_UP_ALARM_NAME as t}from"../common/constant.js";let n=new class{constructor(){this.deleteTempURLBufferEntries=this.deleteTempURLBufferEntries.bind(this)}temporaryBufferIndexedDB=null;getTemporaryBufferIndexedDB(){return this.temporaryBufferIndexedDB||(this.temporaryBufferIndexedDB=r()),this.temporaryBufferIndexedDB}async deleteTempURLBufferEntries(r){r&&r.name===t&&this.getTemporaryBufferIndexedDB().cleanTemporaryURLBufferEntries().then(async()=>{this.getTemporaryBufferIndexedDB().getCount().then(e=>{0===e&&chrome.alarms.clear(t)})}).catch(r=>{e.error({message:"Failed to clear old file buffer entries during scheduled cleanup",error:r})})}};export const tempUrlBufferClean=n;