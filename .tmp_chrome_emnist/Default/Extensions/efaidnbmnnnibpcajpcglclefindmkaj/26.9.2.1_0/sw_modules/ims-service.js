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
import{common as e}from"./common.js";import{util as n}from"./util.js";import{OFFSCREEN_DOCUMENT_PATH as t}from"../common/constant.js";export const imsService=new function(){this._pendingTokenFetch=null,this._cachedToken=null,this._tokenExpiresAt=0,this.getToken=async function(e=!1){return e&&(this._cachedToken=null,this._tokenExpiresAt=0),this._cachedToken&&Date.now()<this._tokenExpiresAt?this._cachedToken:(this._pendingTokenFetch||(this._pendingTokenFetch=this._fetchGuestToken().then(({token:e,expiresIn:n})=>(this._cachedToken=e,this._tokenExpiresAt=Date.now()+1e3*n-9e5,e)).finally(()=>{this._pendingTokenFetch=null})),this._pendingTokenFetch)},this._fetchGuestToken=async function(){const o=e.getEnv(),i=`${t}?env=${o}`;await n.setupOffscreenDocument(i);const s=await chrome.runtime.sendMessage({main_op:"getImsToken",target:"offscreen"});if(s?.error){const e=new Error(`[ImsService] guest token fetch failed: ${s.error}`);throw e.code=s.error,e.isRideError=s.isRideError,e.jump=s.jump,e}return{token:s.token,expiresIn:s.expiresIn??3600}}};