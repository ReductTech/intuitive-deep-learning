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
import{floodgate as t}from"./floodgate.js";import{util as o}from"./util.js";import{dcLocalStorage as e}from"../common/local-storage.js";import{resolveInactiveTabChallenger as a}from"./direct-verb-inactive-tab-utils.js";async function n(n){const[r,i,s]=await Promise.all([t.hasFlag("dc-cv-gmail-convert-to-pdf"),t.hasFlag("dc-cv-gmail-convert-to-pdf-fte"),t.hasFlag("dc-cv-gmail-convert-to-pdf-control")]),c=t.getFeatureMeta("dc-cv-gmail-convert-to-pdf-fte"),l=t.getFeatureMeta("dc-cv-gmail-convert-to-pdf"),T=t.getFeatureMeta("dc-cv-gmail-convert-to-pdf-control");let g,f;try{g=JSON.parse(c),f=r?JSON.parse(l):JSON.parse(T)}catch(t){}const d=function(t,o){const a=e.getItem("locale"),n="en-US"===a||"en-GB"===a;return n&&t||!n&&o}(f?.enLocaleEnabled,f?.nonEnLocaleEnabled);let m=!1;r&&d&&(m=await a("gmail"));const v=await async function(o){const e=[];let a={};const n=o.map(async o=>{const n=`dc-cv-gmail-${o}-metadata`;if(!await t.hasFlag(n))return;const r=t.getFeatureMeta(n);if(!r)return;let i;try{i=JSON.parse(r)}catch(t){}i?.selectors?.forEach(t=>e.push(t)),a={...a,...i?.types}});return await Promise.all(n),{selectors:e,fileExtToMimeTypeMap:a}}(f?.fileTypes||[]);n({enableConvertToPdfTouchpointInGmail:r&&d,enableGmailConvertToPdfFteToolTip:i&&d,acrobatTouchPointText:o.getTranslation("gmailConvertToPdf"),passwordProtectedConvertError:o.getTranslation("convertToPdfPasswordProtectedError"),enableConvertToPdfTouchpointInGmailControl:s&&d,fteTooltipStrings:{title:o.getTranslation("gmailConvertToPdfFteToolTipTitle"),description:o.getTranslation("gmailConvertToPdfFteToolTipDescription"),button:o.getTranslation("closeButton")},fteConfig:g,metadata:v,inactiveTabDirectVerbProcessingEnabled:m,convertToPdfToastMessage:o.getTranslation("convertToPdfToastMessage"),convertingTooltip:o.getTranslation("convertingTooltip"),convertingTouchPointText:o.getTranslation("convertingTouchPointText"),convertToPdfErrorToastMessage:o.getTranslation("convertToPdfErrorToastMessage"),convertToPdfTabCloseErrorToastMessage:o.getTranslation("convertToPdfTabCloseErrorToastMessage"),tryAgain:o.getTranslation("tryAgain"),surfaceName:o.getTranslation("surfaceNameGmail")})}export{n as gmailConvertToPdfInit};