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
import{isChromeViewerOpened as t}from"./util.js";import{util as r}from"../sw_modules/util.js";export const HOST_PAGE_TYPE={EXTENSION_PDF_VIEWER:"extensionPDFViewer",ACROBAT_WEB:"acrobatWeb",DEFAULT:"default"};export async function getHostPageTypeForTab(e,E){try{if(!e&&!E)return;if(await async function(t){try{const{pdfViewerTabIds:r=[]}=await chrome.storage.session.get("pdfViewerTabIds");return r.includes(Number(t))}catch{return!1}}(e))return HOST_PAGE_TYPE.EXTENSION_PDF_VIEWER;const i=E??(await chrome.tabs.get(e))?.url;return t(i)?HOST_PAGE_TYPE.EXTENSION_PDF_VIEWER:r.isAcrobatOrigin(new URL(i).origin)?HOST_PAGE_TYPE.ACROBAT_WEB:HOST_PAGE_TYPE.DEFAULT}catch{return}}