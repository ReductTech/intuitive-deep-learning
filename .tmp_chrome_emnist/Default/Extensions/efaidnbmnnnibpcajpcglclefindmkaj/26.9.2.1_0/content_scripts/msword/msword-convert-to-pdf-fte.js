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
const WORD_CLOUD_MICROSOFT_HOSTNAME="word.cloud.microsoft",SHAREPOINT_OR_ONEDRIVE_HOSTNAME=/(^|\.)sharepoint\.com$|^onedrive\.live\.com$/i,looksLikeMSWordPage=()=>{const{hostname:o}=window.location;return"word.cloud.microsoft"===o||SHAREPOINT_OR_ONEDRIVE_HOSTNAME.test(o)};let mswordTouchPointAdded=!1;class MSWordConvertToPdfFte{id="mswordconverttopdffte";constructor(){if(!looksLikeMSWordPage())return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices()}async loadServices(){const o=chrome.runtime.getURL("content_scripts/msword/msword-convert-to-pdf-fte-service.js");this.mswordFteService=await import(o)}async isEligible(){return!!mswordTouchPointAdded&&(await this.initPromise,this.configPromise||(this.configPromise=chrome.runtime.sendMessage({main_op:"msword_init"}).catch(()=>null)),this.config=await this.configPromise,!!this.config&&this.mswordFteService.isMSWordConvertToPdfFteEligible(this.config))}async render(){await chrome.runtime.sendMessage({main_op:"msword-render-fte"})}}window.MSWordConvertToPdfFte=MSWordConvertToPdfFte,chrome.runtime.onMessage.addListener(o=>{"acrobat-msword-touch-point-added"===o?.content_op&&(mswordTouchPointAdded=!0)});