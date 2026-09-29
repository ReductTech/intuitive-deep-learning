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
import{createTooltipElement}from"../utils/util.js";const TOOLTIP_CLASS="acrobat-touchpoint-tooltip",TOOLTIP_GAP_PX=12;let currentTooltipElement=null,currentTooltipTarget=null,scrollResizeHandler=null;const positionTooltip=(e,t)=>{if(!currentTooltipElement)return;const o=(e.querySelector("img")||e).getBoundingClientRect(),l=currentTooltipElement.getBoundingClientRect();currentTooltipElement.style.left=o.right-l.width/2+"px",currentTooltipElement.style.top=o.top-l.height-t+"px";const n=(l.width-o.width)/2;currentTooltipElement.style.setProperty("--tooltip-arrow-left",`${n}px`)},removeScrollResizeListeners=()=>{scrollResizeHandler&&(document.removeEventListener("scroll",scrollResizeHandler,{capture:!0}),window.removeEventListener("resize",scrollResizeHandler),scrollResizeHandler=null)},hideAttachmentTooltip=()=>{removeScrollResizeListeners(),currentTooltipTarget=null,currentTooltipElement?.remove(),currentTooltipElement=null},realignAttachmentTooltip=e=>{currentTooltipTarget&&document.contains(currentTooltipTarget)?positionTooltip(currentTooltipTarget,e):hideAttachmentTooltip()},addScrollResizeListeners=(e,t)=>{scrollResizeHandler||(scrollResizeHandler=()=>realignAttachmentTooltip(e),document.addEventListener("scroll",scrollResizeHandler,{capture:!0,signal:t}),window.addEventListener("resize",scrollResizeHandler,{signal:t}))},showAttachmentTooltip=(e,t,o,l,n)=>{t&&(hideAttachmentTooltip(),currentTooltipElement=createTooltipElement(o,t),document.body.appendChild(currentTooltipElement),positionTooltip(e,l),currentTooltipTarget=e,addScrollResizeListeners(l,n))},addAttachmentTooltip=(e,{tooltipText:t,tooltipClass:o=TOOLTIP_CLASS,gapPx:l=12,signal:n}={})=>{const i={signal:n};e.addEventListener("mouseenter",()=>showAttachmentTooltip(e,t,o,l,n),i),e.addEventListener("mouseleave",hideAttachmentTooltip,i),e.addEventListener("focus",()=>showAttachmentTooltip(e,t,o,l,n),i),e.addEventListener("blur",hideAttachmentTooltip,i)};export{addAttachmentTooltip,hideAttachmentTooltip};