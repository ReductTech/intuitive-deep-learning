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
let timer,windowFocused=!1;function initialize(){if(!windowFocused){windowFocused=!0,clearTimeout(timer);try{chrome.runtime.sendMessage({main_op:"focus_window"})}catch(e){}}}(()=>{const e=e=>{if("Escape"===e.key)try{chrome.runtime.sendMessage({type:"close_upsell_popup"})}catch(e){}};try{document.title="Adobe Acrobat",chrome.runtime.sendMessage({type:"getWindowType"},t=>{!chrome.runtime.lastError&&t?.isPopup&&document.addEventListener("keydown",e,!0)})}catch(e){}timer=setTimeout(initialize,6e3)})(),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",initialize):initialize();