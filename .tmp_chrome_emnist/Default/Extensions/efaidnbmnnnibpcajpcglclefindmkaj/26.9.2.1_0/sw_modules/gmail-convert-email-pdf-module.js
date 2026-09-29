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
import{floodgate as t}from"./floodgate.js";import{util as o}from"./util.js";import{checkUserLocaleEnabled as e,safeParseFeatureFlag as i}from"./gsuite/util.js";async function l(l){const[a,n]=await Promise.all([t.hasFlag("dc-cv-gmail-convert-email-to-pdf"),t.hasFlag("dc-cv-gmail-convert-email-to-pdf-control")]);let c;a?c=i("dc-cv-gmail-convert-email-to-pdf"):n&&(c=i("dc-cv-gmail-convert-email-to-pdf-control"));const r=e(c?.enLocaleEnabled,c?.nonEnLocaleEnabled),m=c?.selectors,s=c?.fteConfig,g=c?.fteEnabled||!1,T=!o.isAcrobatTouchPointEnabled("acrobat-touch-point-in-gmail");l({enableGmailConvertEmailToPdfTouchpoint:a&&!T&&r,selectors:m,fteEnabled:g,fteConfig:s,fteToolTipStrings:{title:o.getTranslation("gmailConvertEmailToPDFFteTitle"),description:o.getTranslation("gmailConvertEmailToPDFFteDescription"),button:o.getTranslation("closeButton")},touchpointText:o.getTranslation("gmailConvertEmailToPDF"),tooltipText:o.getTranslation("gmailConvertEmailToPDFTooltip")})}export{l as gmailConvertEmailPdfInit};