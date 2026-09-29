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
import{initFteStateAndConfig,shouldShowFteTooltip}from"../utils/fte-utils.js";import AcrobatTouchpointFTE from"../acrobat-touchpoint/touchpoint-fte.js";const MSWORD_FTE_STORAGE_KEY="acrobat-msword-fte-state",FTE_TYPE="msword-convert-to-pdf";let currentFte=null;export async function isMSWordConvertToPdfFteEligible(t){if(!t?.enableConvertToPDFTouchPoint||!t?.enableFte)return!1;const e=await initFteStateAndConfig(MSWORD_FTE_STORAGE_KEY);return shouldShowFteTooltip(t.fteConfig,e,t.enableFte)}export async function tryShowMSWordFte({touchPoint:t,fteTooltipStrings:e,fteConfig:o,source:r,workflow:n}){t&&(currentFte=new AcrobatTouchpointFTE({analyticsSource:r,workflow:n,ctaButtonElement:t,fteStrings:e,fteType:FTE_TYPE,storageKey:MSWORD_FTE_STORAGE_KEY,fteConfig:o,analyticsEvents:{shown:"DCBrowserExt:DirectVerb:Fte:Shown",dismissed:"DCBrowserExt:DirectVerb:Fte:Dismissed",closed:"DCBrowserExt:DirectVerb:Fte:Closed"}}),await currentFte.render())}export function markMSWordFteConsumed(){return currentFte?.destroy(),currentFte=null,AcrobatTouchpointFTE.markConsumed(MSWORD_FTE_STORAGE_KEY)}export function removeMSWordFte(){currentFte?.destroy(),currentFte=null}