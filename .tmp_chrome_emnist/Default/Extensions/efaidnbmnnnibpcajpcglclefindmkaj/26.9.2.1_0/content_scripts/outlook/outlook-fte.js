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
const OUTLOOK_FTE_TOOLTIP_CONTAINER_CLASS="acrobat-fte-tooltip-container",OUTLOOK_FTE_STATE_STORAGE_KEY="acrobat-outlook-fte-state",OUTLOOK_TOUCH_POINT_CLASS="outlook-acrobat-touch-point";class OutlookFte{id="outlookfte";timeout=2e3;eligibleFteVariant=null;static OUTLOOK_DOMAINS=["outlook.office365.com","outlook.office.com","outlook.live.com","outlook.cloud.microsoft"];constructor(){const t=window.location.hostname;if(!OutlookFte.OUTLOOK_DOMAINS.some(e=>t.includes(e)))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices()}async loadServices(){[this.state,this.fteService]=await Promise.all([import(chrome.runtime.getURL("content_scripts/outlook/state.js")).then(t=>t.default),import(chrome.runtime.getURL("content_scripts/outlook/outlook-fte-service.js"))])}getTouchPointElement=async()=>{for(let t=0;t<10;t++){const t=document.getElementsByClassName(OUTLOOK_TOUCH_POINT_CLASS);if(t?.length>0)return t[0];await new Promise(t=>setTimeout(t,100))}return null};async render(){if("listView"===this.eligibleFteVariant)return this.fteService?.renderListViewFte();"nativeView"===this.eligibleFteVariant&&chrome.runtime.sendMessage({main_op:"outlook-fte-render"})}async isEligible(){const t=await chrome.runtime.sendMessage({main_op:"outlook-init"});if(!t?.enableOutlookPDFTouchPoint&&!t?.enableOutlookListViewTouchPoint)return!1;if(await this.initPromise,t?.enableOutlookListViewTouchPoint&&await(this.fteService?.isListViewFteEligible(t)))return this.eligibleFteVariant="listView",!0;if(!t?.enableOutlookPDFTouchPoint||!t?.enableOutlookFteTooltip)return!1;if(document.getElementsByClassName("acrobat-fte-tooltip-container")?.length>0)return!1;const e=await(this.fteService?.getOneTimeFteState("acrobat-outlook-fte-state"));if(this.fteService?.isFteAlreadyShown(e)||this.state?.implicitToastShownInSession)return!1;const i=await this.getTouchPointElement();return i&&(this.eligibleFteVariant="nativeView"),i}}