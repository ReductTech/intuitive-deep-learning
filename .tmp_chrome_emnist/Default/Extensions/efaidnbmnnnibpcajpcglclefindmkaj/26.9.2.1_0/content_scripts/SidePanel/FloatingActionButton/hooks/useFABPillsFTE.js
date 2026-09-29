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
import{useState,useEffect,useRef,useCallback}from"react";export const useFABPillsFTE=(e,t)=>{const[l,a]=useState(!1),[o,s]=useState(!1),c=useRef(null),r=useCallback(()=>{a(!1),e(!1),t(!1)},[a,e,t]);useEffect(()=>((async()=>{if(await initDcLocalStorage(),window.dcLocalStorage?.getItem("isSidePanelHomeEnabled"))return;const l=window.dcLocalStorage?.getItem("fabPillsFTEShown");l||(s(!0),a(!0),e(!0),t(!0),window.dcLocalStorage?.setItem("fabPillsFTEShown",!0),c.current=setTimeout(()=>{r(),s(!1),c.current=null},15e3))})(),()=>{c.current&&clearTimeout(c.current)}),[r]);return{showPills:l,setShowPills:a,isFTE:o,setIsFTE:s,handlePillsClose:async()=>{r(),s(!1),c.current&&(clearTimeout(c.current),c.current=null),await initDcLocalStorage(),window.dcLocalStorage?.setItem("fabPillsFTEShown",!0)},collapseFAB:r,pillsFTETimeoutRef:c}};