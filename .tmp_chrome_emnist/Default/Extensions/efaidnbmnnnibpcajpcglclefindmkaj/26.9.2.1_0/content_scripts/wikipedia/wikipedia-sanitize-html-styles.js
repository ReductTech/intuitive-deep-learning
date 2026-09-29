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
window.overrideHTMLForConvertHTMLToPDFOp=async e=>{let t=null;try{t=await new Promise(e=>{chrome.runtime.sendMessage({main_op:"get-wikipedia-html-to-pdf-config"},t=>{e(t??null)})})}catch(e){}if(!t)return;const o=t=>{const o=t??[];for(let t=0;t<o.length;t+=1){const n=e.querySelector(o[t]);if(n)return n}return null};(t.selectorsToRemove??[]).forEach(t=>{e.querySelectorAll(t).forEach(e=>e.remove())});const n=o(t.pageContainer);n&&(n.style.display="block");const r=o(t.content);r&&(r.style.marginLeft="0",r.style.marginRight="0")};