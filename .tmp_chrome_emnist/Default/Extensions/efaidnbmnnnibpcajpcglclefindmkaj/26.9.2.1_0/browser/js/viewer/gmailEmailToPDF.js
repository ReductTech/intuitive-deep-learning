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
import{extractWebpageHTML as e}from"../../../resources/addWebpage/extractWebpageHTML.js";export async function fetchGmailEmailHtml({gmailPrintUrl:t,pdffilename:r,sendPdfPerfMark:n}){const a=await fetch(t,{credentials:"include"});if(!a.ok)throw new Error(`HTTP ${a.status}`);const i=await a.text(),l=(new DOMParser).parseFromString(i,"text/html"),{html:m}=await e(l,{baseUrl:t,credentials:"include"}),o=(new TextEncoder).encode(m).buffer,c=r||"Gmail email",d=c.endsWith(".html")?c:`${c}.html`;return n("PDF_Convert_Source_File_Received",{fileSize:o.byteLength,contentType:"text/html"}),{buffer:o,mimeType:"text/html",downLoadEndTime:(new Date).getTime(),pdffilename:d}}