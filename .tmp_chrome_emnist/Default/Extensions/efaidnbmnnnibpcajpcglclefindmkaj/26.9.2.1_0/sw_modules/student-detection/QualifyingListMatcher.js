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
import{HostnameNormalizer as t}from"./HostnameNormalizer.js";import{RegistrableDomainUtil as e}from"./RegistrableDomainUtil.js";import{KeywordMatchStrategy as r}from"./matchers/KeywordMatchStrategy.js";import{DomainMatchStrategy as a}from"./matchers/DomainMatchStrategy.js";import{PatternMatchStrategy as i}from"./matchers/PatternMatchStrategy.js";import{RegexMatchStrategy as n}from"./matchers/RegexMatchStrategy.js";export class QualifyingListMatcher{constructor(){this.strategies=new Map([["keyword",new r],["domain",new a],["pattern",new i],["regex",new n]])}static createDomainUtil(t){const r=(t?.entries||[]).filter(t=>"pattern"===t.matchType).map(t=>t.value);return new e(r)}findMatch(e,r){const a=t.normalize(e);if(!a||!r?.entries?.length)return null;const i=QualifyingListMatcher.createDomainUtil(r),n=r.entries.find(t=>{const e=this.strategies.get(t.matchType);return e?.matches(a,t)});if(!n)return null;const s="domain"===n.matchType?n.value.toLowerCase():i.getRegistrableDomain(a);return{entry:n,registrableDomain:s||a}}}