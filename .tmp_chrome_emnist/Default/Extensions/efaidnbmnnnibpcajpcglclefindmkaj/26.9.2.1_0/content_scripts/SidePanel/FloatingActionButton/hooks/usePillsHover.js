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
import{useRef}from"react";import{FAB_HOME_TOOLTIP_FTE_SHOWN_KEY}from"./useFABHomeTooltipFTE";export const usePillsHover=(e,t,r,o,l)=>{const n=useRef(null);return{pillsHideTimeoutRef:n,handlePillsAreaMouseEnter:()=>{n.current&&(clearTimeout(n.current),n.current=null)},handlePillsAreaMouseLeave:()=>{l||(n.current=setTimeout(async()=>{await initDcLocalStorage();(window.dcLocalStorage?.getItem("fabPillsFTEShown")||window.dcLocalStorage?.getItem(FAB_HOME_TOOLTIP_FTE_SHOWN_KEY))&&!o&&(e(!1),t(!1),r(!1)),n.current=null},100))}}};