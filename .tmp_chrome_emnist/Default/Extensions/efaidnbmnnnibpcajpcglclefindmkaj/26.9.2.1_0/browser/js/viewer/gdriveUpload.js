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
const e=5242880;function o(e,o,n,r,i,t={}){e({type:"uploadToGoogleDriveResult",success:r,error_type:i,mode:n,...t},o.origin)}function n(e,o,n){return new Promise(r=>{e(o,e=>{r(chrome.runtime.lastError||!e?n:e)})})}function r(e,n,r,i){i.newFileId&&i.newFileName&&(document.title=i.newFileName),o(e,n,r.mode,i.success,i.error_type,"copy"===r.mode?{newFileId:i.newFileId,newFileName:i.newFileName}:{})}export async function uploadToGoogleDrive(i,t,{sendToCDN:d,cdnDomain:l,sendMessage:s}){const{fileBuffer:a,...c}=i,u={...c,gdriveEmail:t};let m=0;a&&(a.endsWith("==")?m=2:a.endsWith("=")&&(m=1));const p=a?Math.floor(3*a.length/4)-m:0,f=a&&p>e,y=await n(s,{type:"uploadToGoogleDrive",...u,totalBinarySize:p,...f?{}:{fileBuffer:a}},{success:!1,error_type:"messaging_error"});if(!y?.ready)return void r(d,l,u,y);const{uploadId:g}=y,h=Math.ceil(a.length/e);for(let i=0;i<h;i+=1){const t=await n(s,{type:"gdriveResumableUploadChunk",uploadId:g,chunkIndex:i,totalChunks:h,totalBinarySize:p,mimeType:u.mimeType,mode:u.mode,chunk:a.slice(i*e,(i+1)*e)},{received:!1});if(!t.received&&!t.done)return void o(d,l,u.mode,!1,t.errorType||"messaging_error");if(t.done)return void r(d,l,u,t)}}