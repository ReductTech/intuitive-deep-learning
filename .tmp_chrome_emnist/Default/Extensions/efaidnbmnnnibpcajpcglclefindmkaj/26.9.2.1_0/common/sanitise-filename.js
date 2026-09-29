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
const e=/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;export const buildSafeFilename=(t,l,n="webpage")=>{let s=(t||"").toString().replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g,"").replace(/\s+/g," ").trim().replace(/[.\s]+$/,"");const c=s.split(".")[0];c&&e.test(c)&&(s=`_${s}`);const a=Math.max(1,240-l.length);if(s.length>a){let e=a;const t=s.charCodeAt(e-1);t>=55296&&t<=56319&&(e-=1),s=s.slice(0,e).replace(/[.\s]+$/,"")}return s||(s=n),s+l};export const HTML_FILE_EXTENSION=".html";export const buildSafeFilenameWithExt=(e,t)=>{const l=e||"",n=l.lastIndexOf("."),s=n>0?l.slice(0,n):l,c=n>0?l.slice(n):"";return buildSafeFilename(s,c,t)};