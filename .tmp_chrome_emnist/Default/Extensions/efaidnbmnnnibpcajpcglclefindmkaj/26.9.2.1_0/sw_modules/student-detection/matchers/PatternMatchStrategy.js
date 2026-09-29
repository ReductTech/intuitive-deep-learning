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
import{MatchStrategy as t}from"./MatchStrategy.js";export class PatternMatchStrategy extends t{constructor(){super("pattern")}matches(t,e){const r=e?.value?.toLowerCase();if(!r)return!1;const s=r.startsWith(".")?r:`.${r}`;return t===s.slice(1)||t.endsWith(s)}}