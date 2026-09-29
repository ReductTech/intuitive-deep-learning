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
!function(){let a=!1;window.initSummaryBar=async function(){if(window.top===window)if("function"!=typeof window.startSummaryBar){if(!a){a=!0;try{if(!await chrome.runtime.sendMessage({main_op:"evaluateSummaryBarDomain"}))return;await chrome.runtime.sendMessage({main_op:"injectSummaryBarScripts"})&&"function"==typeof window.startSummaryBar&&window.startSummaryBar()}catch{}finally{a=!1}}}else window.startSummaryBar()}}();