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
import{acroActions as o}from"./acro-actions.js";import{util as r,INSTALLED_APP as t}from"./util.js";import{SETTINGS as s}from"./settings.js";import{dcLocalStorage as R}from"../common/local-storage.js";export async function versionChecks(){return new Promise((R,E)=>{o.getVersion(o=>{const E=r.getInstalledApp(o);s.IS_READER=E===t.READER||E===t.ERP_READER,s.IS_ERP_READER=E===t.ERP_READER,s.IS_ACROBAT=E===t.ACROBAT,R(o)})})}