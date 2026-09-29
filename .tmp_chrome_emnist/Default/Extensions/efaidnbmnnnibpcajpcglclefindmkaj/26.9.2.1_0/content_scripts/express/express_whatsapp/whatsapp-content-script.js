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
class WhatsappExpressIntegration{whatsappExpressStateKey="whatsappExpressState";setTouchpointClickedForFteState=async e=>{let t=await chrome.storage.local.get(this.whatsappExpressStateKey);t=t?.whatsappExpressState?t.whatsappExpressState:{},t[e]=!0,chrome.storage.local.set({[this.whatsappExpressStateKey]:t})};addThumbnailAndImagePreviewerObserver=()=>{new MutationObserver(e=>{this.config.enableWhatsappPreviewExpressMenu&&this.previewFeature?.imagePreviewerObserverHandler(),this.config.enableWhatsappHoverExpressMenu&&this.hoverFeature?.imageHoverObserverHandler(e)}).observe(document.body,{childList:!0,subtree:!0})};init=async()=>{const e=await chrome.runtime.sendMessage({main_op:"whatsapp-express-init"});if(this.config=e,!this.config.enableWhatsappPreviewExpressMenu&&!this.config.enableWhatsappHoverExpressMenu)return;const t=chrome.runtime.getURL("content_scripts/express/express_whatsapp/whatsapp-image-preview.js"),s=chrome.runtime.getURL("content_scripts/express/express_whatsapp/whatsapp-image-on-hover.js"),a=chrome.runtime.getURL("content_scripts/express/express-precaching.js"),[r,i,p]=await Promise.all([import(t),import(s),import(a)]);this.expressPrecaching=p.default,this.expressPrecaching.precache(),this.previewFeature=new r.default({selectors:this.config.selectors,setTouchpointClickedForFteState:this.setTouchpointClickedForFteState}),this.hoverFeature=new i.default({selectors:this.config.selectors,setTouchpointClickedForFteState:this.setTouchpointClickedForFteState}),this.addThumbnailAndImagePreviewerObserver()}}const whatsappExpressIntegration=new WhatsappExpressIntegration;whatsappExpressIntegration.init();