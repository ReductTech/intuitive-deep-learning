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
import{HostnameNormalizer as t}from"./HostnameNormalizer.js";export class RegistrableDomainUtil{constructor(t=[]){const e=t.filter(Boolean).map(t=>t.startsWith(".")?t.slice(1):t);this.patternSuffixes=[...new Set(e)].sort((t,e)=>e.length-t.length)}getRegistrableDomain(e){const n=t.normalize(e);if(!n)return"";const i=this.patternSuffixes.map(t=>{if(n!==t&&!n.endsWith(`.${t}`))return null;const e=t.split(".").length,i=n.split(".");return i.length<=e?n:i.slice(-(e+1)).join(".")}).find(t=>null!==t);if(i)return i;const s=n.split(".");return s.length<=2?n:s.slice(-2).join(".")}}