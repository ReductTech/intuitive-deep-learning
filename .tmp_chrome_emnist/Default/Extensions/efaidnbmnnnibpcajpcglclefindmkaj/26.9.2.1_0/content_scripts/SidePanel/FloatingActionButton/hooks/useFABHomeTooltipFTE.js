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
import{useState,useEffect,useRef}from"react";import{sendAnalyticsEvent}from"../utils/fabUtils";export const FAB_HOME_TOOLTIP_FTE_SHOWN_KEY="fabHomeTooltipFTEShown";let isFTESessionActiveForPage=!1;export const useFABHomeTooltipFTE=e=>{const[t,o]=useState(!1),s=useRef(isFTESessionActiveForPage),r=useRef(null);useEffect(()=>{if(e)return e.renderHomeFTE=()=>{window.dcLocalStorage?.setItem("fabHomeTooltipFTEShown",!0),isFTESessionActiveForPage=!0,s.current=!0,o(!0),r.current=setTimeout(()=>{o(!1),r.current=null,sendAnalyticsEvent([["DCBrowserExt:FABHomeTooltipFTE:AutoDismissed"]])},1e4)},()=>{e.renderHomeFTE=null,r.current&&clearTimeout(r.current)}},[e]);return{showTooltip:t,isFTESessionActiveRef:s,dismissTooltip:()=>{r.current&&(clearTimeout(r.current),r.current=null),o(e=>(e&&sendAnalyticsEvent([["DCBrowserExt:FABHomeTooltipFTE:Dismissed"]]),!1))}}};