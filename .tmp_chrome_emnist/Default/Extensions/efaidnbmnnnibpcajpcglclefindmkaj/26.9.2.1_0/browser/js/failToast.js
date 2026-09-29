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
import{util as e}from"./content-util.js";import{onReady as s,onClick as t,qs as o,addClass as r}from"../../common/dom-utils.js";s(()=>{const s=new URLSearchParams(window.location.search).get("errorType");if(s){if(document.getElementsByClassName("toastDescription")[0].id=s+"ToastText","sessionExpired"===s){const e=o("#refreshButton");e&&(e.style.display="")}}e.translateElements(".translate"),t("#closeFailToast",()=>{chrome.runtime.sendMessage({main_op:"closeExpressApp"})}),t("#refreshButton",()=>{r("#refreshButton","loading"),chrome.runtime.sendMessage({main_op:"reloadCurrentTab"})})});