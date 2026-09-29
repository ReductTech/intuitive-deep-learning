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
const GMAIL_FTE_TOOLTIP_STORAGE_KEY="acrobat-gmail-fte-config";class GmailAcrobatFteCoachmark{constructor(){this.timeout=2e3,this.id="GmailAcrobatFteCoachmark",this.eligibilityDeferred=Deferred(),this.render=()=>{},"mail.google.com"!==window.location.hostname&&this.eligibilityDeferred.resolve(!1)}async isEligible(){return this.eligibilityDeferred.promise}async setEligibility(e,i){const t=(await import(chrome.runtime.getURL("content_scripts/gmail/state.js"))).default;t?.implicitToastShownInSession&&(e=!1),this.eligibilityDeferred.resolve(e),e&&(this.render=async()=>{const e=(await chrome.storage.local.get("acrobat-gmail-fte-config"))["acrobat-gmail-fte-config"];e?.nextDate&&e.nextDate>Date.now()||i()})}}