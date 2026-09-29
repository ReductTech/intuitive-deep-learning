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
const GMAIL_EMAIL_PDF_TOUCHPOINT_CLASS="acrobat-gmail-email-pdf-touchpoint",GMAIL_EMAIL_PDF_FTE_STORAGE_KEY="acrobat-gmail-email-pdf-fte-config",GMAIL_EMAIL_PDF_FTE_CONTAINER_CLASS="acrobat-fte-tooltip-container-gmail-email-to-pdf",GMAIL_EMAIL_PDF_FTE_SOURCE="gmail_chrome-convert_to_pdf_from_email",GMAIL_EMAIL_PDF_FTE_WORKFLOW="html-to-pdf";class GmailEmailPdfFte{id="GmailEmailPdfFte";timeout=3e3;static GMAIL_DOMAINS=["mail.google.com"];constructor(){const t=window.location.hostname;if(!GmailEmailPdfFte.GMAIL_DOMAINS.some(e=>t.includes(e)))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices()}async loadServices(){[this.fteUtils,this.state,this.gmailFteService]=await Promise.all([import(chrome.runtime.getURL("content_scripts/utils/fte-utils.js")),import(chrome.runtime.getURL("content_scripts/gmail/state.js")).then(t=>t.default),import(chrome.runtime.getURL("content_scripts/gmail/gmail-fte-service.js"))])}async render(){const t=this.state?.gmailConvertEmailToPdfConfig;this.gmailFteService?.addFTE(GMAIL_EMAIL_PDF_TOUCHPOINT_CLASS,GMAIL_EMAIL_PDF_FTE_CONTAINER_CLASS,GMAIL_EMAIL_PDF_FTE_STORAGE_KEY,{fteTooltipStrings:t?.fteToolTipStrings,fteConfig:{tooltip:t?.fteConfig}},"gmail-email-to-pdf",GMAIL_EMAIL_PDF_FTE_SOURCE,"html-to-pdf"),GmailEmailPdfFte.keepFteAlive()}static keepFteAlive(){const t=document.querySelector(`.${GMAIL_EMAIL_PDF_FTE_CONTAINER_CLASS}`);if(!t)return;let e=t.parentElement;const i=e?.parentElement;if(!i)return;const o=new MutationObserver(()=>{if(t.isConnected)return;if(e?.isConnected)return void o.disconnect();const i=document.querySelector(`.${GMAIL_EMAIL_PDF_TOUCHPOINT_CLASS}`);i&&(i.appendChild(t),e=i)});o.observe(i,{childList:!0,subtree:!0})}async isEligible(){const t=await chrome.runtime.sendMessage({main_op:"gmail-convert-email-pdf-init"});if(!t?.enableGmailConvertEmailToPdfTouchpoint)return!1;if(!t?.fteEnabled)return!1;await this.initPromise;const e=await(this.fteUtils?.initFteStateAndConfig(GMAIL_EMAIL_PDF_FTE_STORAGE_KEY)),i=t?.fteConfig,o=document.getElementsByClassName(GMAIL_EMAIL_PDF_TOUCHPOINT_CLASS),n=await(this.fteUtils?.shouldShowFteTooltip(i,e,t.fteEnabled));return o?.length>0&&n}}