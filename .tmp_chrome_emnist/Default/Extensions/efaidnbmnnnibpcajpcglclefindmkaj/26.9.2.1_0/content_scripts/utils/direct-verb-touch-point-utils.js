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
import{getElementFromParent}from"./util.js";export const TOUCH_POINT_CLASSES={touchPointClass:"acrobat-convert-to-pdf-touch-point",loadingClass:"loading",loaderClass:"acrobat-convert-to-pdf-touch-point-loader",touchPointTextClass:"acrobat-convert-to-pdf-touch-point-text",tooltipClass:"acrobat-convert-to-pdf-touch-point-tooltip"};const addLoaderToTouchPoint=(t,o=TOUCH_POINT_CLASSES.loaderClass)=>{const e=document.createElement("div");e.classList.add(o),t.appendChild(e)},showTouchPointLoadingState=(t,{touchPointText:o,tooltipText:e,progressCircleManager:a,loaderInitialValue:s=10,classes:n=TOUCH_POINT_CLASSES})=>{if(!t)return;t.classList.add(n.loadingClass);const r=getElementFromParent([n.tooltipClass],t);r&&e&&(r.textContent=e);const l=getElementFromParent([n.touchPointTextClass],t);l&&o&&(l.textContent=o);const i=getElementFromParent([n.loaderClass],t);i&&a&&a.mountProgressCircle(i,{value:s})},resetTouchPointToDefaultState=(t,{defaultTouchPointText:o,defaultTooltipText:e,progressCircleManager:a,classes:s=TOUCH_POINT_CLASSES})=>{if(!t)return;t.classList.remove(s.loadingClass);const n=getElementFromParent([s.tooltipClass],t);n&&e&&(n.textContent=e);const r=getElementFromParent([s.touchPointTextClass],t);r&&o&&(r.textContent=o);const l=getElementFromParent([s.loaderClass],t);l&&a&&a.unmountProgressCircle(l)},isTouchPointInLoadingState=(t,o=TOUCH_POINT_CLASSES.loadingClass)=>!!t?.classList.contains(o),updateTouchPointProgress=(t,o,e)=>{if(!t)return;const{progressCircleManager:a,classes:s=TOUCH_POINT_CLASSES}=e,n=getElementFromParent([s.loaderClass],t);n&&a&&(a.updateProgressCircle(n,{value:o}),100===o&&resetTouchPointToDefaultState(t,e))};export{addLoaderToTouchPoint,isTouchPointInLoadingState,showTouchPointLoadingState,resetTouchPointToDefaultState,updateTouchPointProgress};