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
!function(){const e=XMLHttpRequest.prototype,t=e.send;e.send=function(){let e="";return this.addEventListener("progress",function(){if(!this.responseURL.includes("/cloudsearch/request"))return;const t=this.responseText.slice(e.length);e+=t,t.includes("table cellpadding")&&(document.dispatchEvent(new CustomEvent("gdrive-search-bar-api-response",{detail:{searchResponse:e}})),e="")}),this.addEventListener("load",function(){const e=new URL(this.responseURL);if(e&&"clients6.google.com"===e?.hostname&&e?.pathname?.includes("/drive/v2internal/apps")){const e=this.response;document.dispatchEvent(new CustomEvent("acrobat-addon-status-data",{detail:{responseData:e,url:this.responseURL}}))}}),t.apply(this,arguments)}}();