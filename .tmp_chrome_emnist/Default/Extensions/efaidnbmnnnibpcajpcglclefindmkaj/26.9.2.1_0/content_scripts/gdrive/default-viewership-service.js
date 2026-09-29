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
import state from"./state.js";import{removeAllTouchPoints}from"./touchpoint-service.js";import{createUrlForAcrobatTouchPoint}from"./util.js";const isDefaultViewershipFeatureForGdriveEnabled=()=>state?.config?.enableDefaultViewershipFeatureForGoogleDrive,isGdriveImplicitDefaultViewershipFeatureEnabled=()=>state?.gdriveImplicitDefaultViewershipConfig?.enableImplicitDefaultViewershipFeature,isDefaultViewer=()=>(isDefaultViewershipFeatureForGdriveEnabled()||isGdriveImplicitDefaultViewershipFeatureEnabled())&&state?.isAcrobatDefaultForGDrivePDFs&&chrome.runtime.id&&!1===state?.addOnStatus?.isAddOnDefault,takeDefaultViewerShip=()=>{!isDefaultViewershipFeatureForGdriveEnabled()&&!isGdriveImplicitDefaultViewershipFeatureEnabled()||isDefaultViewer()||(state.isAcrobatDefaultForGDrivePDFs=!0,removeAllTouchPoints())},resetDefaultViewership=()=>{state.isAcrobatDefaultForGDrivePDFs=!1,state.implicitToastShownInSession=!0},openPdfInNewTabForDV=(e,i,t)=>{e.preventDefault(),e.stopPropagation();const r=createUrlForAcrobatTouchPoint(i,t);window.open(r,"_blank"),chrome.runtime.sendMessage({main_op:"akamai-ping"})};export{isDefaultViewer,takeDefaultViewerShip,resetDefaultViewership,openPdfInNewTabForDV};