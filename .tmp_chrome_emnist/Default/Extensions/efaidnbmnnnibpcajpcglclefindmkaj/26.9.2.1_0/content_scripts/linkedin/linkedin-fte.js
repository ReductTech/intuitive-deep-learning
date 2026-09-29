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
const LINKEDIN_FTE_STATE_STORAGE_KEY="acrobat-linkedin-fte-state",LINKEDIN_CHAT_FTE_STATE_STORAGE_KEY="acrobat-linkedin-chat-fte-state",FTE_TOOLTIP_CONTAINER_CLASS="acrobat-fte-tooltip-container";let linkedinTouchPointAddedPromiseResolve,linkedinTouchPointAddedPromise=new Promise(e=>{linkedinTouchPointAddedPromiseResolve=e});class LinkedInFte{id="linkedinfte";timeout=2e3;static LINKEDIN_DOMAINS=["www.linkedin.com"];constructor(){const e=window.location.hostname;if(!LinkedInFte.LINKEDIN_DOMAINS.some(t=>e.includes(t)))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices()}async loadServices(){[this.fteUtils]=await Promise.all([import(chrome.runtime.getURL("content_scripts/utils/fte-utils.js"))])}async render(){const e={main_op:"chat"===this.touchPointType?"linkedin-chat-fte-render":"linkedin-fte-render"};"feed"===this.touchPointType&&(e.frameId=this.frameId),chrome.runtime.sendMessage(e)}isTouchPointPresent(){return linkedinTouchPointAddedPromise}isTouchPointPositionAllowsForFTE(e){return!(e?.top<0||e?.left<0||e?.bottom+50>window.innerHeight||e?.right>window.innerWidth)}async shouldShowFteTooltipWithCadence(e,t){if(!t)return!1;if(document.getElementsByClassName(FTE_TOOLTIP_CONTAINER_CLASS).length>0)return!1;const i=Date.now(),n={feed:"acrobat-linkedin-fte-state",chat:"acrobat-linkedin-chat-fte-state"}[e];if(!n)return!1;const o=await chrome.storage.local.get(n),s=o?.[n]||{count:0,nextDate:i};return!(s?.touchPointClicked||!t)&&(await chrome.storage.local.set({[n]:s}),s.count<1&&i>=s.nextDate)}async isEligible(){const e=await chrome.runtime.sendMessage({main_op:"linkedin-init"});if(!e?.enableLinkedinPDFTouchPoint&&!e?.enableLinkedinChatPDFTouchPoint)return!1;await this.initPromise;const{isTouchPointPresent:t,touchPointType:i,frameId:n,position:o}=await this.isTouchPointPresent();this.touchPointType=i;let s=!0;if("feed"===i&&(this.frameId=n,s=this.isTouchPointPositionAllowsForFTE(o)),t&&s){const t="chat"===i?e?.enableLinkedinChatFteTooltip:e?.enableLinkedinFeedFteTooltip;return await this.shouldShowFteTooltipWithCadence(i,t)}return!1}}chrome.runtime.onMessage.addListener(e=>{"added-linkedin-pdf-touch-point"===e?.type?linkedinTouchPointAddedPromiseResolve({isTouchPointPresent:!0,touchPointType:"feed",frameId:e.frameId,position:e.position}):"added-linkedin-chat-pdf-touch-point"===e?.type&&linkedinTouchPointAddedPromiseResolve({isTouchPointPresent:!0,touchPointType:"chat"})});