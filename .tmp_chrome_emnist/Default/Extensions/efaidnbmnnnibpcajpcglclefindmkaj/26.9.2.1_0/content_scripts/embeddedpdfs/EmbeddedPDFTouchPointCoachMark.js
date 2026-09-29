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
const FTE_STATE_STORAGE_KEY="embeddedPDFTouchPointFTEState";class EmbeddedPDFTouchPointCoachMark{shouldResetFteToolTip(o,e){return-1!==o?.resetDay&&e>o?.resetDay}static BLOCKED_DOMAINS=["outlook.office365.com","outlook.office.com","outlook.live.com","outlook.cloud.microsoft","www.linkedin.com","mail.google.com","www.google.com","drive.google.com","www.facebook.com","web.whatsapp.com"];async initFteStateAndConfig(o){const e=(new Date).getTime();let t={count:0,nextDate:e};t=(await chrome.storage.local.get(FTE_STATE_STORAGE_KEY))?.[FTE_STATE_STORAGE_KEY]||t;const i=o?.touchPointConfig?.tooltip;return this?.shouldResetFteToolTip(i,e)&&(t.count=0,t.nextDate=e),chrome.storage.local.set({[FTE_STATE_STORAGE_KEY]:t}),t}constructor(){const o=window.location.hostname;if(EmbeddedPDFTouchPointCoachMark.BLOCKED_DOMAINS.some(e=>o.includes(e)))return this.isEligible=async()=>!1,void(this.render=async()=>{});import(chrome.runtime.getURL("content_scripts/utils/fte-utils.js")).then(o=>this.fteUtils=o)}id="embeddedpdfscoachmark";timeout=3e3;async render(){const o=await chrome.runtime.sendMessage({main_op:"embedded-pdf-touch-point-config"});o?.enableEmbeddedPDFTouchPoint&&chrome.runtime.sendMessage({main_op:"embedded-pdf-touch-point-fte",frameId:this.frameId})}isTouchPointPresent(){return embeddedPDFTouchPointAddedPromise}isTouchPointPositionAllowsForFTE(o){return o?.top>=0&&o?.left>=0&&o?.bottom+50<=window.innerHeight&&o?.right<=window.innerWidth}async isEligible(){let o;const e=await chrome.runtime.sendMessage({main_op:"embedded-pdf-touch-point-config"});if(!e?.enableEmbeddedPDFTouchPoint)return Promise.resolve(!1);let t=new Promise(e=>{o=e});const i=await this.initFteStateAndConfig(e),{isTouchPointPresent:n,frameId:s,position:c}=await this.isTouchPointPresent();if(this.frameId=s,n&&this.isTouchPointPositionAllowsForFTE(c)){const t=e?.touchPointConfig?.tooltip,n=await(this.fteUtils?.shouldShowFteTooltip(t,i,!!t));o(n)}return t}}