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
import{dcLocalStorage as e}from"../../../common/local-storage.js";import{loggingApi as r}from"../../../common/loggingApi.js";await e.init();let a=null;a||(a=new function(){this.cleanUrl=async a=>{try{const t=await chrome.runtime.sendMessage({main_op:"getFloodgateMeta",flag:"dc-cv-url-param-cleanup"});if(!t)return r.info({message:"URL cleanup skipped - no floodgate meta"}),a;const s=JSON.parse(t);if(!Array.isArray(s))return a;const o=new URL(a),c=e.getItem("viewerStorage")||{};let n=!1,l={},i=!1;const m=o.searchParams.get("storage");if(m)try{l=JSON.parse(m)}catch(e){l={}}return s.forEach(e=>{const{op:r,k:a}=e;a&&Array.isArray(a)&&a.forEach(e=>{switch(r){case 1:o.searchParams.delete(e);break;case 2:Object.prototype.hasOwnProperty.call(c,e)&&(delete c[e],n=!0),Object.prototype.hasOwnProperty.call(l,e)&&(delete l[e],i=!0);break;case 3:Object.keys(c).forEach(r=>{r.startsWith(e)&&(delete c[r],n=!0)}),Object.keys(l).forEach(r=>{r.startsWith(e)&&(delete l[r],i=!0)})}})}),n&&e.setItem("viewerStorage",c),i&&o.searchParams.set("storage",JSON.stringify(l)),o.href}catch(e){return r.error({message:"URL param cleanup failed",error:e?.message,stack:e?.stack}),a}}});export const urlParamCleanup=a;