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
import{MatchStrategy as t}from"./MatchStrategy.js";const e=new Map;export class RegexMatchStrategy extends t{constructor(){super("regex")}static toRegExp(t){if(!t||"string"!=typeof t)return null;if(e.has(t))return e.get(t);const r=t.toLowerCase().replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,"[^.]+");try{const s=new RegExp(`^${r}$`);return e.set(t,s),s}catch{return null}}matches(t,e){const r=RegexMatchStrategy.toRegExp(e?.value);return!!r?.test(t)}}