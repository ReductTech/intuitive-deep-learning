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
import state from"./state.js";import{sendAnalytics,sendErrorLog}from"../utils/util.js";const ERROR_TOAST_CONTAINER_ID="acrobat-error-toast-container",ERROR_TOAST_TITLE_ID="error-toast-title",ERROR_TOAST_MESSAGE_ID="error-toast-message",ERROR_TOAST_CLOSE_BUTTON_ID="acrobat-error-close-btn",ERROR_TOAST_ICON_ID="acrobat-error-icon",documentListenerOptions={signal:state?.eventControllerSignal},removeErrorToast=()=>{const t=document.getElementById(ERROR_TOAST_CONTAINER_ID);t&&(t.remove(),document.removeEventListener("click",handleOutsideClick,documentListenerOptions))},handleOutsideClick=t=>{const r=document.getElementById(ERROR_TOAST_CONTAINER_ID);r&&!r.contains(t?.target)&&removeErrorToast()},addErrorToastDismissListeners=t=>{const r=t.querySelector("#acrobat-error-close-btn");r?.addEventListener("click",()=>{removeErrorToast()}),document.addEventListener("click",handleOutsideClick,documentListenerOptions)},setErrorToastText=t=>{const r=t.querySelector("#error-toast-title");r&&(r.textContent=state?.config?.errorToastStrings?.title);const e=t.querySelector("#error-toast-message");e&&(e.textContent=state?.config?.errorToastStrings?.description)},setErrorToastIcons=t=>{const r=t.querySelector(`#${ERROR_TOAST_ICON_ID}`);r&&(r.src=chrome.runtime.getURL("browser/images/outlook-error-toast-icon.svg"));const e=t.querySelector("#acrobat-error-close-btn");e&&(e.src=chrome.runtime.getURL("browser/images/outlook-error-toast-close.svg"))},addErrorToast=async()=>{const t=document.createElement("div");t.id=ERROR_TOAST_CONTAINER_ID;const r=await fetch(chrome.runtime.getURL("resources/outlook/error-toast.html")),e=await r.text();t.innerHTML=e,setErrorToastIcons(t),setErrorToastText(t),document.body.appendChild(t),addErrorToastDismissListeners(t)},showErrorToast=async()=>{try{if(document.getElementById(ERROR_TOAST_CONTAINER_ID))return;await addErrorToast(),sendAnalytics([["DCBrowserExt:Outlook:ErrorToast:Shown"]])}catch(t){sendErrorLog("OutlookTouchPoint","Failure in showErrorToast")}};export{showErrorToast,removeErrorToast};