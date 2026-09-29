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
const e=1024,t=1048576;function a(a){return a<e?`${a} B`:a<t?`${(a/e).toFixed(2)} KB`:`${(a/t).toFixed(2)} MB`}function s(e){if(!e||"object"!=typeof e)return"";return Object.entries(e).filter(([,e])=>e>0).map(([e,t])=>`${e}: ${a(t)}`).join(" | ")}async function i(){const e={quota:0,usage:0,usagePercent:0,capacityInfo:"",usageDetailsString:"",usageDetailsBreakdown:[]};try{if(!navigator?.storage?.estimate)return e;const t=await navigator.storage.estimate(),i=t.quota||0,o=t.usage||0,n=i>0?parseFloat((o/i*100).toFixed(2)):0,r=(i/1073741824).toFixed(2),u=[];t.usageDetails&&"object"==typeof t.usageDetails&&Object.entries(t.usageDetails).forEach(([e,t])=>{t>0&&u.push({type:e,sizeBytes:t,sizeFormatted:a(t)})}),e.quota=i,e.usage=o,e.usagePercent=n,e.capacityInfo=`Usage: ${a(o)} / ${r} GB (${n}%)`,e.usageDetailsString=s(t.usageDetails),e.usageDetailsBreakdown=JSON.stringify(u)}catch(e){}return e}export{i as getStorageEstimation,a as formatSize,s as formatUsageDetails};