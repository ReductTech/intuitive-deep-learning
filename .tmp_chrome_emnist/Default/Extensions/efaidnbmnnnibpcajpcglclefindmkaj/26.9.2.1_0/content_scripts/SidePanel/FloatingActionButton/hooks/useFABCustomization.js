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
import{useEffect}from"react";export const useFABCustomization=e=>{useEffect(()=>{const i=setTimeout(async()=>{await initDcLocalStorage(),customizeFABOpacity(e)},250);return()=>clearTimeout(i)},[e])};const customizeFABOpacity=e=>{let i,t;document.addEventListener("scroll",()=>{e.makeFABTransparent(),t&&clearTimeout(t),t=setTimeout(()=>{e.cursorXPosition>.8*window.innerWidth&&e.makeFABOpaque(),t=void 0},50)}),document.addEventListener("mousemove",async t=>{if(e.cursorXPosition=t.clientX,e.cursorXPosition>.8*window.innerWidth){if(i)return;i=setTimeout(async()=>{if("undefined"!=typeof GenAIWebpageEligibilityService){await GenAIWebpageEligibilityService.shouldShowTouchpoints()&&e.makeFABOpaque()}i=void 0},200)}else i&&(clearTimeout(i),i=void 0)})};