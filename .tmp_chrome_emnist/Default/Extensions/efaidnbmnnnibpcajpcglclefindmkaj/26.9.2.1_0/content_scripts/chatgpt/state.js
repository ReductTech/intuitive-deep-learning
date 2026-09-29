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
const abortController=new AbortController;let fteAbortController=new AbortController,longChatAbortController=new AbortController;export const MESSAGE_IMAGE_KEY_PREFIX="message-image-";const state={config:{},capturedMissingMessages:new Map,capturedImages:new Map,longChatRunning:!1,get longChatConversionSignal(){return longChatAbortController.signal},resetLongChatAbortController(){longChatAbortController?.abort(),longChatAbortController=new AbortController},abortLongChatConversion(){longChatAbortController?.abort()},clearConversionState(t=null){this.longChatConversionContext&&!this.longChatConversionContext.popoverDismissed&&this.longChatConversionContext.popover.hide(),this.longChatConversionContext=null,this.longChatRunning=!1,this.abortLongChatConversion(),t&&(Array.isArray(window.acrobatTargetSectionHtmlStore)&&(window.acrobatTargetSectionHtmlStore=window.acrobatTargetSectionHtmlStore.filter(o=>o.targetSectionId!==t)),this.capturedMissingMessages.delete(t),this.capturedImages.delete(t))},longChatConversionContext:null,fteConfig:{maxFteCount:2,shortCoolDown:7,longCoolDown:0},get eventControllerSignal(){return abortController.signal},disconnectEventListeners(){abortController?.abort(),fteAbortController?.abort()},get fteEventControllerSignal(){return fteAbortController.signal},disconnectFteEventListeners(){fteAbortController?.abort(),fteAbortController=new AbortController}};export default state;