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
import{dcLocalStorage as e}from"../../common/local-storage.js";await e.init();const n=new URLSearchParams(window.location.search).get("tabId"),a=e.getItem("signInOriginHash")||"#/side-panel";e.removeItem("signInOriginHash"),chrome.runtime.sendMessage({main_op:"reloadTab",tabId:n,touchpoint:"signInSuccess",hashRoute:a}),window.close();