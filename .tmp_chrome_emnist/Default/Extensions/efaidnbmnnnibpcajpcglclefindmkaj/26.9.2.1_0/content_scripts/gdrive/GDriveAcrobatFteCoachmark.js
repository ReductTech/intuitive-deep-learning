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
const GDRIVE_FTE_TOOLTIP_STORAGE_KEY="acrobat-gdrive-fte-state";class GDriveAcrobatFteCoachmark{constructor(){this.timeout=500,this.id="GDriveAcrobatFteCoachmark",this.eligibilityDeferred=Deferred(),this.render=()=>{},"drive.google.com"!==window.location.hostname&&this.eligibilityDeferred.resolve(!1)}async isEligible(){return this.eligibilityDeferred.promise}setEligibility(e,t){this.eligibilityDeferred.resolve(e),e&&(this.render=async()=>{const e=(await chrome.storage.local.get("acrobat-gdrive-fte-state"))["acrobat-gdrive-fte-state"];e?.nextDate&&e.nextDate>Date.now()||t()})}}