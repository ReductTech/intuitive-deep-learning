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
import{util as s}from"../js/content-util.js";import{onReady as t,onClick as e}from"../../common/dom-utils.js";t(()=>{s.translateElements(".translate"),e("#closeSuccessToast",()=>{chrome.tabs.query({active:!0,currentWindow:!0},function(s){chrome.tabs.sendMessage(s[0]?.id,{content_op:"dismissBanner"})})})});