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
import state from"./state.js";import*as gmailResponseService from"./gmail-response-service.js";import{removeAllAcrobatTouchPoints,createURLForAttachment}from"./util.js";const isDefaultViewershipFeatureForGmailEnabled=()=>state?.gmailConfig?.enableDefaultViewershipFeatureForGmail,isGmailImplicitDefaultViewershipFeatureForGmailEnabled=()=>state?.gmailImplicitDefaultViewershipConfig?.enableImplicitDefaultViewershipFeature,isDefaultViewer=()=>(isDefaultViewershipFeatureForGmailEnabled()||isGmailImplicitDefaultViewershipFeatureForGmailEnabled())&&state.isAcrobatDefaultForGmailPDFs&&chrome.runtime.id,takeDefaultViewerShip=()=>{!isDefaultViewershipFeatureForGmailEnabled()&&!isGmailImplicitDefaultViewershipFeatureForGmailEnabled()||isDefaultViewer()||(state.isAcrobatDefaultForGmailPDFs=!0,state?.resetDOMElementListener(),gmailResponseService.init(),removeAllAcrobatTouchPoints())},resetDefaultViewership=()=>{state.isAcrobatDefaultForGmailPDFs=!1,state.implicitToastShownInSession=!0,state?.resetDOMElementListener(),removeAllAcrobatTouchPoints(),gmailResponseService.init()},openPdfInNewTab=e=>{const i=createURLForAttachment(e.url,e.touchPoint,e.attachmentName);chrome.runtime.sendMessage({main_op:"createNewTabWithUrl",url:i}),chrome.runtime.sendMessage({main_op:"akamai-ping"})};export{takeDefaultViewerShip,resetDefaultViewership,isDefaultViewer,openPdfInNewTab};