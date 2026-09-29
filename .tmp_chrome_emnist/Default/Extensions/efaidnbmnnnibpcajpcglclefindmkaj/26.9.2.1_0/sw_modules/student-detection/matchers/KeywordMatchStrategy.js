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
import{MatchStrategy as t}from"./MatchStrategy.js";export class KeywordMatchStrategy extends t{constructor(){super("keyword")}matches(t,e){const r=e?.value?.toLowerCase();if(!r)return!1;return t.split(".").some(t=>{if(t===r)return!0;if(t.split(/[-_]/).includes(r))return!0;if(t.startsWith(r)&&t.length>r.length){const e=t.charAt(r.length);if(!/[a-z0-9]/.test(e))return!0}if(t.endsWith(r)&&t.length>r.length){const e=t.charAt(t.length-r.length-1);if(!/[a-z0-9]/.test(e))return!0}return!1})}}