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
import{dcTabStorage as e}from"../tab-storage.js";export function handleOutlookAttachmentFlow(o,t){return new Promise((s,r)=>{const n=Date.now()+45e3,a=()=>{chrome.runtime.sendMessage({main_op:"get-session",type:"outlook-pdf",sessionId:o}).then(o=>{const i=o?.data;if(i?.url){i.outlookTabUrl&&e.setItem("outlookTabUrl",i.outlookTabUrl);const o=new URL(i.url);Object.entries(i.queryParams||{}).forEach(([e,t])=>{o.searchParams.set(e,t)});const r=i.tokenHeaderName||"X-Token",n="Authorization"===r?`Bearer ${i.token}`:i.token,a=i.token?{[r]:n}:{};return t(o.toString(),a),void s()}"error"!==i?.status?Date.now()<n?setTimeout(a,250):r({message:"Timed out waiting for outlook attachment session"}):r({message:"Outlook attachment resolve failed",error:i.error})}).catch(e=>{r({message:"Failed to resolve outlook attachment session",error:e?.toString()})})};a()})}export function handleMsWordDownloadFlow(e,o){return new Promise((t,s)=>{chrome.runtime.sendMessage({main_op:"get-session",type:"msword-document",sessionId:e}).then(e=>{const r=e?.data;if(!r?.url)return void s({message:"No msword download session"});const n=new URL(r.url);Object.entries(r.queryParams||{}).forEach(([e,o])=>{n.searchParams.set(e,o)}),o(n.toString()),t()}).catch(e=>{s({message:"Failed to resolve msword download session",error:e?.toString()})})})}