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
const r=new class{_logError(r,t,a){try{chrome.runtime.sendMessage({type:"log-error",log:{message:`Large Blob Storage: ${r}`,error:t?.toString()||"Unknown error",key:a,context:"large-blob-storage"}})}catch(r){}}async setItem(r,t){try{const a=await navigator.storage.getDirectory(),e=await a.getFileHandle(r,{create:!0}),o=await e.createWritable();await o.write(t),await o.close()}catch(t){this._logError("Error saving data",t,r)}}async getItem(r,t="text"){try{const a=await navigator.storage.getDirectory(),e=await a.getFileHandle(r),o=await e.getFile();switch(t){case"text":return await o.text();case"blob":return await o.blob();case"arrayBuffer":return await o.arrayBuffer();default:throw new Error(`Unsupported format: ${t}`)}}catch(t){"NotFoundError"!==t.name&&this._logError("Error retrieving data",t,r)}}async removeItem(r){try{const t=await navigator.storage.getDirectory();await t.removeEntry(r)}catch(t){"NotFoundError"!==t.name&&this._logError("Error removing data",t,r)}}async clear(){try{const r=await navigator.storage.getDirectory();for await(const[t]of r.entries())await r.removeEntry(t,{recursive:!0})}catch(r){this._logError("Error clearing storage",r,"all")}}};export{r as largeBlobStorage};