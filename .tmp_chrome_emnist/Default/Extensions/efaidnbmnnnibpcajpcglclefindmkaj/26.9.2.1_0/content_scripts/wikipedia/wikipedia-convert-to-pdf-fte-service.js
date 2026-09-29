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
import{sendAnalytics}from"../utils/util.js";import{createFteTooltip,shouldShowFteTooltip,initFteStateAndConfig,updateOneTimeFteToolTipCoolDown,removeFteTooltip,addFteCloseButtonListener,acrobatTouchPointClicked}from"../utils/fte-utils.js";export const WIKIPEDIA_CONVERT_TO_PDF_SOURCE="wikipedia_chrome";export const WIKIPEDIA_CONVERT_TO_PDF_WORKFLOW="convert_to_pdf_wikipedia";const FTE_ANALYTICS_PARAMS={source:"wikipedia_chrome",workflow:"convert_to_pdf_wikipedia"};export const WIKIPEDIA_CONVERT_TO_PDF_FTE_STORAGE_KEY="acrobat-wikipedia-convert-to-pdf-fte";export const FTE_ACTIVE_CLASS="wikipedia-convert-to-pdf-touchpoint-fte-active";export const WIKIPEDIA_CONVERT_TO_PDF_TOUCHPOINT_CONTAINER_CLASS="wikipedia-convert-to-pdf-touchpoint-container";const FTE_TYPE="wikipedia-convert-to-pdf",FTE_TOOLTIP_CONTAINER_CLASS="acrobat-fte-tooltip-container";export{removeFteTooltip};export function dismissWikipediaFteOnTouchpoint(t){t&&(t.classList.remove(FTE_ACTIVE_CLASS),removeFteTooltip())}export const markWikipediaConvertToPdfFteConsumed=t=>(removeFteTooltip(),acrobatTouchPointClicked(t));function attachFteListeners(t,e){const o=i=>{t.contains(i.target)||(dismissWikipediaFteOnTouchpoint(e),document.removeEventListener("click",o),sendAnalytics([["DCBrowserExt:DirectVerb:Fte:Dismissed",FTE_ANALYTICS_PARAMS]]))};addFteCloseButtonListener(t,{fteType:FTE_TYPE,onClose:()=>{dismissWikipediaFteOnTouchpoint(e),document.removeEventListener("click",o),sendAnalytics([["DCBrowserExt:DirectVerb:Fte:Dismissed",FTE_ANALYTICS_PARAMS]])}}),setTimeout(()=>{document.addEventListener("click",o)},0)}export async function tryShowFte(t,e){const o=e||document.querySelector(".wikipedia-convert-to-pdf-touchpoint-container");if(!o)return;const i=createFteTooltip(t.fteTooltipStrings,FTE_TYPE);attachFteListeners(i,o),o.classList.add(FTE_ACTIVE_CLASS),o.appendChild(i),updateOneTimeFteToolTipCoolDown("acrobat-wikipedia-convert-to-pdf-fte"),sendAnalytics([["DCBrowserExt:DirectVerb:Fte:Shown",FTE_ANALYTICS_PARAMS]])}export async function isWikipediaConvertToPdfFteEligible(t){if(!t?.enableWikipediaConvertToPdfTouchpoint||!t?.enableFte)return!1;if(!document.querySelector(".wikipedia-convert-to-pdf-touchpoint-container"))return!1;if(document.getElementsByClassName(FTE_TOOLTIP_CONTAINER_CLASS).length>0)return!1;const e=await initFteStateAndConfig("acrobat-wikipedia-convert-to-pdf-fte");return shouldShowFteTooltip(t.fteConfig?.tooltip,e,t.enableFte)}