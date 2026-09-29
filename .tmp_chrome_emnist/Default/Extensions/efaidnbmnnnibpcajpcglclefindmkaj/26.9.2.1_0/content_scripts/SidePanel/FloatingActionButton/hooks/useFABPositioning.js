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
import{useCallback}from"react";import{sendAnalyticsEvent}from"../utils/fabUtils";export const useFABPositioning=({containerRef:t,buttonRef:e,fabManager:o})=>{const i=useCallback(e=>{const o=t.current;o&&e&&(o.style.top=`${e}px`,o.style.bottom="auto")},[t]);return{rePositionFABIfOverlapping:useCallback(()=>{try{const t=e.current;if(!t)return;if(void 0!==o.fabAutoRepositioningTop)return void i(o.fabAutoRepositioningTop);let n=0,r=null;for(;n<5;){const e="function"==typeof getClickableOverlappingElement?getClickableOverlappingElement(t,r):[];if(!e?.length)break;let o=Number.MAX_SAFE_INTEGER;if(e.forEach(t=>{const e=t.getBoundingClientRect();e.top<o&&(o=e.top)}),o===Number.MAX_SAFE_INTEGER)break;const i=t.getBoundingClientRect(),a=i.height,l=o-a,{left:p,right:s,bottom:g,width:c,height:u,x:f,y:b}=i;r={top:l,left:p,right:s,bottom:g,width:c,height:u,x:f,y:b},n++}if(o.fabAutoRepositioningTop=r?.top?r.top-36:0,o.fabAutoRepositioningTop<.5*window.innerHeight)return;i(o.fabAutoRepositioningTop),sendAnalyticsEvent([["DCBrowserExt:SidePanel:FabIcon:OverlappingRepositioned"]])}catch(t){chrome.runtime.sendMessage({main_op:"log-error",log:{message:"Error in repositioning the FAB if overlapping",error:t.toString()}})}},[e,o,i]),setFABTop:i}};