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
import{POST_PURCHASE_ACK_SW_FALLBACK_MS as e}from"../common/upsellPostPurchaseConstants.js";import{loggingApi as o}from"../common/loggingApi.js";export const reloadViewerAfterPostPurchase=async({tabId:a,upsellTouchpoint:s,popupWindowId:r})=>{let t=!1;const l=chrome.tabs.sendMessage(a,{main_op:"upsell_post_purchase",upsellTouchpoint:s}).catch(e=>(t=!0,o.error({message:"[Paywall] Post-purchase message delivery failed — viewer may not have been reachable",error:e?.message}),null));let c=!1;const i=new Promise(o=>{setTimeout(()=>{c=!0,o()},e)});await Promise.race([l,i]),c&&!t&&o.warn({message:"[Paywall] Post-purchase ack not received within timeout — reloading without CDN confirmation"}),null!=r&&chrome.windows.remove(r).catch(()=>null),chrome.tabs.reload(a).catch(e=>{o.error({message:"[Paywall] Viewer tab reload after post-purchase failed",error:e?.message})})};