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
class GmailConvertAttachmentCardFte{timeout=1500;static GMAIL_DOMAINS=["mail.google.com"];constructor(e,t){this.id=e,this.storageKey=t;const i=window.location.hostname;if(!GmailConvertAttachmentCardFte.GMAIL_DOMAINS.some(e=>i.includes(e)))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.eligibilityDeferred=Deferred(),this.render=()=>{}}async isEligible(){return this.eligibilityDeferred.promise}setEligibility=async(e,t)=>{if(this.eligibilityDeferred.resolve(e),e){const{storageKey:e}=this;this.render=async()=>{const i=(await chrome.storage.local.get(e))[e];i?.nextDate&&i.nextDate>Date.now()||t()}}}}