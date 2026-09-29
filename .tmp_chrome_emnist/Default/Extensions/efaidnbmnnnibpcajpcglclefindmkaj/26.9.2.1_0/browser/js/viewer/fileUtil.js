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
const e={getFileBufferRange:(e,t)=>new Promise((s,r)=>{const a=(new Date).getTime(),n=new XMLHttpRequest;n.open("GET",e.url),n.responseType="arraybuffer",n.setRequestHeader("Range",`bytes=${t.start}-${t.end}`),n.onload=()=>{if(4===n.readyState&&206===n.status)s({buffer:n.response,startTime:a,endTime:(new Date).getTime()});else if(200===n.status){const e={status:n.status,statusText:n.statusText,rangeBufferSize:n.response.byteLength,range:t};r({message:"Unexpected response to get file buffer range",error:e})}else{const e={status:n.status,statusText:n.statusText,range:t};r({message:"Invalid response to get file buffer range",error:e})}},n.onerror=e=>{r({message:"Error to get file buffer range",error:e})},n.ontimeout=e=>{r({message:"Timeout to get file buffer range due to timeout",error:e})},n.send()})};export{e as fileUtil};