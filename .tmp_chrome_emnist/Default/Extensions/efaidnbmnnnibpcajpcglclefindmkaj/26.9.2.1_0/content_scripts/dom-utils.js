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
window.domUtils={qs:function(e,t){return(t||document).querySelector(e)},onReady:function(e){"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e):e()},setStyles:function(e,t){e&&t&&Object.assign(e.style,t)},getOffset:function(e){if(!e)return{};var t=e.getBoundingClientRect();return{top:t.top+window.scrollY,left:t.left+window.scrollX}},createIframe:function(e,t,n){var r=document.createElement("iframe");return e&&(r.id=e),t&&function(e){if("string"!=typeof e)return!1;var t=e.trim().toLowerCase();return 0!==t.indexOf("javascript:")&&0!==t.indexOf("data:")}(t)&&(r.src=t),n&&Object.assign(r.style,n),r},appendTo:function(e,t){var n="string"==typeof t?document.querySelector(t)||document.documentElement:t;return n&&e&&n.appendChild(e),e},attachZoomPrevention:function(e){e&&(e.addEventListener("wheel",e=>{e.ctrlKey&&e.preventDefault()}),e.addEventListener("keydown",e=>{e.ctrlKey&&-1!==[187,189,107,109].indexOf(e.keyCode)&&e.preventDefault()}))}};