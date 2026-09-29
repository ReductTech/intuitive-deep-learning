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
import{getAttachmentByFileTypeSelectors,getElementBasedOnSelector,getElementsByClassNameSelectors,getMimeTypeFromAttachmentName,sendAnalyticsEvent,updateDriveNonPDFUrl}from"./util.js";import state from"./state.js";import{getAttachmentCardElement,getMessageView,getParentElementForAcrobatIcon}from"./message-view-touch-point-service.js";import{addCommonClickListener,markElementAsProcessed}from"./gmail-verb-native-viewer.js";const addHyperlinkEventListener=(e,t)=>{addCommonClickListener(e,t,"messageView",state?.eventControllerSignal)},getAttachmentsFromMessageView=e=>getElementsByClassNameSelectors(e,"attachmentIcon","messageView")||[],getAllAttachments=()=>{const e=getMessageView();let t=[];if(!e||0===e.length)return t;for(const s of e){const e=getAttachmentsFromMessageView(s);e.length>0&&t.push(...e)}return t},getMessageViewAttachmentsUnprocessed=()=>{const e=getAllAttachments();return getAttachmentByFileTypeSelectors(e,state?.gmailConvertToPdfConfig?.metadata?.selectors)},getAttachmentDetails=e=>{const t=e?.closest("a");let s=t?.getAttribute("href");const a=getElementBasedOnSelector(t,"attachmentName","messageView")?.textContent;let n=!1;return s&&(()=>{try{const e=new URL(s).hostname;return"drive.google.com"===e||"docs.google.com"===e}catch{return!1}})()&&(n=!0,s=updateDriveNonPDFUrl(s)),{attachmentATag:t,hrefValue:s,attachmentName:a,isDriveAsset:n}},canProcessAttachment=(e,t)=>{const{hrefValue:s,attachmentName:a,isDriveAsset:n}=e;if(!s)return!1;const r=state?.gmailConvertToPdfConfig?.metadata?.fileExtToMimeTypeMap;if(!getMimeTypeFromAttachmentName(a,r))return!1;const o=getAttachmentCardElement(t);return getParentElementForAcrobatIcon(o)},processAttachment=e=>{const t=getAttachmentDetails(e);if(!canProcessAttachment(t,e))return;const{attachmentATag:s,hrefValue:a,attachmentName:n,isDriveAsset:r}=t;markElementAsProcessed(e);addHyperlinkEventListener(s,{url:a,name:n,isDriveAsset:r})},processMessageView=e=>{e?.forEach((e,t)=>{processAttachment(e)})},addTouchpointToNativeViewerViaMessageView=()=>{try{const e=getMessageViewAttachmentsUnprocessed();e&&e.length>0&&processMessageView(e)}catch(e){sendAnalyticsEvent("DCBrowserExt:MessageView:ProcessingFailed",{source:"Gmail",workflow:"ConvertToPdf"})}};export{addTouchpointToNativeViewerViaMessageView};