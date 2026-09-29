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
(()=>{function t(){var t;(function(t){try{const e=new URL(t);return"gemini.google.com"===e.hostname&&e.pathname.includes("/_/BardChatUi/data/batchexecute")&&e.search.includes("rpcids=hNvQHb")}catch(t){return!1}})(this.responseURL)&&(t=this.response,document.dispatchEvent(new CustomEvent("acrobat-gemini-api-data",{detail:{responseData:t}})))}!function(){const e=XMLHttpRequest.prototype,n=e.send;e.send=function(...e){return this.addEventListener("load",t),n.apply(this,e)}}()})();