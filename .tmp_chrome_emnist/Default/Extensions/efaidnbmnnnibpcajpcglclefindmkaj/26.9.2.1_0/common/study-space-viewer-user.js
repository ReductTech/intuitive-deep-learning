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
import{dcLocalStorage as t}from"./local-storage.js";import{EngagementWindowStore as e}from"../sw_modules/student-detection/EngagementWindowStore.js";import{BROWSER_STUDENT_IS_ENTERPRISE_FIELD as n}from"../sw_modules/student-detection/constants.js";export async function markEnterpriseFromViewer(t){const r=new e;if(!0===(await r.getState())[n])return!0;if(!0!==t)return!1;const o=e.createEmptyState();return o[n]=!0,await r.saveState(o),!0}export async function isBrowserStudentDetectionAllowed(){if(await t.init(),"admin"===t.getItem("installSource")||t.getItem("isAdminUser"))return!1;return!0!==(await(new e).getState())[n]}