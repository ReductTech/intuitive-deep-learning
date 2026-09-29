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
!function(){if(window.top===window.self)try{const e=window.location.href,t=new URL(e),o=new URLSearchParams(t.search).get("pdfUrl"),n=o&&decodeURIComponent(o);if(!n||!n.startsWith("file://"))return;chrome.tabs.getCurrent(e=>{e&&e.id&&chrome.tabs.update(e.id,{url:n})})}catch(e){}else window.location.replace("about:blank")}();