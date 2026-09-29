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
import state from"./state.js";import{createFteTooltip,updateFteToolTipCoolDown,removeFteTooltip as removeFteTooltipUtil}from"../utils/fte-utils.js";import{sendAnalyticsOncePerMonth,sendErrorLog}from"../utils/util.js";const documentListenerOptions={signal:state?.eventControllerSignal},removeFteTooltip=e=>{removeFteTooltipUtil(e),document.removeEventListener("click",handleFteClickOutside,documentListenerOptions)},handleFteClickOutside=(e,t,o,n)=>{const i=document.getElementsByClassName(t);if(i.length>0&&e&&e.target){const s=i[0];s&&!s.contains(e.target)&&(removeFteTooltip(t),sendAnalyticsOncePerMonth("DCBrowserExt:DirectVerb:Fte:Dismissed",{source:o,workflow:n}))}},handleFteButtonClick=(e,t,o,n)=>{e.preventDefault(),removeFteTooltip(t),sendAnalyticsOncePerMonth("DCBrowserExt:DirectVerb:Fte:Closed",{source:o,workflow:n})},addFTETooltipEventListeners=(e,t,o,n)=>{const i=e?.getElementsByClassName("acrobat-fte-tooltip-button");i.length>0&&i[0].addEventListener("click",e=>handleFteButtonClick(e,t,o,n)),document.addEventListener("click",e=>handleFteClickOutside(e,t,o,n),documentListenerOptions)},addFTE=async(e,t,o,n,i,s,l)=>{try{const r=document.getElementsByClassName(e),a=document.getElementsByClassName(t);if(r?.length>0&&r[0]&&0===a?.length){const e=createFteTooltip(n?.fteTooltipStrings,i);addFTETooltipEventListeners(e,t,s,l),r[0].appendChild(e),sendAnalyticsOncePerMonth("DCBrowserExt:DirectVerb:Fte:Shown",{source:s,workflow:l}),await updateFteToolTipCoolDown(n?.fteConfig?.tooltip,o)}}catch(e){sendErrorLog(`Failure in adding FTE in ${s} for ${l}`,e)}};export{addFTE,removeFteTooltip};