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
import{dcLocalStorage as t}from"../common/local-storage.js";import{loggingApi as o}from"../common/loggingApi.js";import{CACHE_PURGE_SCHEME as r}from"./constant.js";import{floodgate as a}from"./floodgate.js";var i=null;class e{constructor(){this.flagsToMigrate={gvt:"dc-cv-gdrive-grid-view-touchpoint",lvt:"dc-cv-gdrive-list-view-touchpoint"}}async init(){try{if(await t.getItem("floodgateMigrationDone"))return;await this.migrateFlags()}catch(t){o.error({message:"Error in floodgate migration",error:t})}}async migrateFlags(){try{await Promise.all(Object.entries(this.flagsToMigrate).map(async([o,i])=>{await a.hasFlag(i,r.NO_CALL)&&t.setItem(o,i)})),t.setItem("floodgateMigrationDone",!0)}catch(t){o.error({message:"Error in floodgate migration",error:t})}}}i||(i=new e);export const floodgateMigration=i;