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
!function(){const t=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(n,e,...o){if(e&&"string"==typeof e&&(()=>{try{const t=new URL(e);return"docs.google.com"===t.hostname&&t.pathname.includes("/u/")}catch{return!1}})()){const t=function(t){try{const n=t.match(/u\/([^/]+)/);return n?n[1]:null}catch(t){return null}}(e);null!==t&&function(t){if(null!=t){const n=new CustomEvent("acrobat-extension-authuser",{detail:{authuser:t}});document.dispatchEvent(n)}}(t)}return t.apply(this,[n,e,...o])}}();