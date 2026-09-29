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
"use strict";class MagicScanDropHook{constructor(){this._pendingFile=null,this._ctrlPort=null,this._origItems=Object.getOwnPropertyDescriptor(DataTransfer.prototype,"items"),this._origTypes=Object.getOwnPropertyDescriptor(DataTransfer.prototype,"types"),this._ourTransfers=new WeakSet}install(){this._onDropCaptureBound=e=>this._onDropCapture(e),window.addEventListener("drop",this._onDropCaptureBound,!0),this._onDropBound=()=>this._onDrop(),document.addEventListener("drop",this._onDropBound,!1),this._installOverrides(),this._handleTransferRequest()}_onDropCapture(e){this._pendingFile&&e.dataTransfer&&this._ourTransfers.add(e.dataTransfer)}_handleTransferRequest(){const e=document.documentElement.dataset.msn;if(!e)return;delete document.documentElement.dataset.msn;const{port1:t,port2:r}=new MessageChannel,{port1:n,port2:s}=new MessageChannel;t.onmessage=e=>{try{this._pendingFile=new File([e.data.buffer],e.data.name,{type:e.data.mime})}catch(e){console.error("[MagicScan] file reconstruction error:",e),Object.defineProperty(DataTransfer.prototype,"items",this._origItems),Object.defineProperty(DataTransfer.prototype,"types",this._origTypes)}t.postMessage({type:"ack"}),t.close()},this._ctrlPort&&this._ctrlPort.close(),this._ctrlPort=n,n.onmessage=()=>{this._installOverrides(),this._handleTransferRequest()},window.postMessage({type:e},"*",[r,s])}_onDrop(){this._pendingFile&&this._cleanUp()}_cleanUp(){this._pendingFile=null,Object.defineProperty(DataTransfer.prototype,"items",this._origItems),Object.defineProperty(DataTransfer.prototype,"types",this._origTypes)}_installOverrides(){const e=this;Object.defineProperty(DataTransfer.prototype,"types",{get(){return e._pendingFile&&e._ourTransfers.has(this)?["Files"]:e._origTypes.get.call(this)},configurable:!0}),Object.defineProperty(DataTransfer.prototype,"items",{get(){return e._pendingFile&&e._ourTransfers.has(this)?e._buildItemList(e._pendingFile):e._origItems.get.call(this)},configurable:!0})}_buildItemList(e){const t=this._buildFileEntry(e),r={kind:"file",type:e.type,getAsFile:()=>e,getAsString:()=>{},webkitGetAsEntry:()=>t};return{0:r,length:1,[Symbol.iterator](){let e=!1;return{next:()=>e?{done:!0}:(e=!0,{value:r,done:!1})}}}}_buildFileEntry(e){return{isFile:!0,isDirectory:!1,name:e.name,fullPath:"/"+e.name,filesystem:null,file(t,r){try{t(e)}catch(e){r?.(e)}},createReader:()=>({readEntries:e=>e([])})}}}window.__magicScanHookInstalled||(window.__magicScanHookInstalled=!0,(new MagicScanDropHook).install());