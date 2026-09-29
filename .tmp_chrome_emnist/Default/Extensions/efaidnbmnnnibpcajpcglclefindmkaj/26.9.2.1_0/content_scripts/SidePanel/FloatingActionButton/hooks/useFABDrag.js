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
import{useState,useEffect,useCallback,useRef}from"react";import{sendAnalyticsEvent}from"../utils/fabUtils";const DRAG_START_DELAY_MS=250;export const useFABDrag=({containerRef:e,iframeRef:t,fabManager:r,isDraggedRef:n,onDragStart:a,onDragEnd:o})=>{const[c,i]=useState(r.fabDraggedTop||null),[s,u]=useState(!1),g=useRef(0),l=useRef(null);useEffect(()=>{r.fabDraggedTop&&i(r.fabDraggedTop)},[r.fabDraggedTop]);const d=useCallback(t=>{if(0!==t.button||t.ctrlKey)return;t.stopPropagation(),"touch"!==t.pointerType&&"pen"!==t.pointerType&&t.preventDefault();try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}const a=t.clientY;l.current=setTimeout(()=>{u(!0),r.isFABActiveForDrag=!0,n.current=!1;const t=e.current;if(t){const e=t.getBoundingClientRect();g.current=a-e.top}},250)},[r,n,e]),f=useCallback(t=>{if(!s&&!r.isFABActiveForDrag)return;const o=e.current;if(!o)return;n.current||a?.(),n.current=!0;let c=t.clientY-g.current;const u=o.offsetHeight,l=window.innerHeight-u-20;c=Math.max(20,Math.min(l,c)),r.fabDraggedTop=c,i(c)},[s,r,n,e,a]),p=useCallback(e=>{clearTimeout(l.current);try{e.target.releasePointerCapture(e.pointerId)}catch{}(s||r.isFABActiveForDrag)&&(u(!1),r.isFABActiveForDrag=!1,n.current&&(window.dcLocalStorage.setItem("genAIFabTopPosition",r.fabDraggedTop),sendAnalyticsEvent([["DCBrowserExt:SidePanel:FabIcon:Dragged"]]),chrome.runtime.sendMessage({main_op:"log-info",log:{message:"FAB dragged",fabTop:`${r.fabDraggedTop}px`}}),o?.()))},[s,r,n,o]);useEffect(()=>(document.addEventListener("pointermove",f),document.addEventListener("pointerup",p),document.addEventListener("pointercancel",p),()=>{document.removeEventListener("pointermove",f),document.removeEventListener("pointerup",p),document.removeEventListener("pointercancel",p)}),[f,p]),useEffect(()=>()=>clearTimeout(l.current),[]);return{fabTop:c,handleDragHandleMouseDown:useCallback(e=>{d(e)},[d]),handleIconMouseDown:useCallback(e=>{d(e)},[d]),isFABActiveForDrag:s}};