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
import{sendAnalytics}from"../utils/util.js";import state from"./state.js";const set=new Set,addDummyTargetTestTouchpoint=()=>{chrome?.runtime?.id&&state?.gmailDummyTargetTestConfig?.enableGmailDummyTargetTest&&(set.has("shown")||(sendAnalytics([["DCBrowserExt:Gmail:DummyTargetTest:Shown",{},{frequency:"monthly"}]]),set.add("shown")))};export{addDummyTargetTestTouchpoint};