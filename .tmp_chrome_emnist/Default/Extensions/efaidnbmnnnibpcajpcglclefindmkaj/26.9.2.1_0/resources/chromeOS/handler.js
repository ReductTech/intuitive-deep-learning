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
import{indexedDBScript as e}from"../../common/indexDB.js";"launchQueue"in window?launchQueue.setConsumer(async o=>{for(const n of o.files)try{const o=await n.getFile(),r=await o.arrayBuffer(),t=URL.createObjectURL(o);e.storeFileByHash(r,`chrome-extension://${chrome.runtime.id}/${t}`).then(()=>{const e=chrome.runtime.getURL("viewer.html")+"?pdfurl="+encodeURIComponent(t)+"&pdffilename="+encodeURIComponent(n.name)+"&olfs=COS_LF";window.location.href=e}).catch(e=>{console.error("Error storing file:",n.name,e)})}catch(e){console.error("Error handling file:",n.name,e)}}):console.warn("File System Access API not supported");