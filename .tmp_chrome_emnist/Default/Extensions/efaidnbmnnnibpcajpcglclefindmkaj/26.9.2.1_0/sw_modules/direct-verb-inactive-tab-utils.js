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
import{floodgate as e}from"./floodgate.js";import{safeParseFeatureFlag as t}from"./gsuite/util.js";const a="dc-cv-inactive-tab-direct-flow";export async function resolveInactiveTabChallenger(o){const c=await e.hasFlag(a)&&t(a),i=c?.enabledSurfaces?.includes(o);return!!i}