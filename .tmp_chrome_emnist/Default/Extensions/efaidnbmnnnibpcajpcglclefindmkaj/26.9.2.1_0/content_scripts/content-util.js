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
const util={getTranslation:(e,t)=>{if(e)return t?chrome.i18n.getMessage(e,t):chrome.i18n.getMessage(e)},translateElements:(e,t)=>{const n=(t||document).querySelectorAll(e);for(let e=0;e<n.length;e+=1){const t=n[e],o=util.getTranslation(t.id);"INPUT"===t.tagName?t.value=o:t.textContent=o}},consoleLog:function(...e){SETTINGS.DEBUG_MODE&&console.log(...e)}};