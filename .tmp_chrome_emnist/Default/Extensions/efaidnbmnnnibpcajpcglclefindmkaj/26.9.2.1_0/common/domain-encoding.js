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
export const CONTENT_SIGNAL_RULES_ENCODING="obfuscated";let t=null,n=null,e=null,r=null;function o(t,n){const e={};for(let r=0;r<t.length;r+=1)e[t[r]]=n[r];return e}function u(t){const n={};return Object.entries(t).forEach(([t,e])=>{n[e]=t}),n}function a(){return t||(t=o("abcdefghijklmnopqrstuvwxyz0123456789.-","tubg6lxdq8jc1m9-vw.pfhskar0oi5zn372ye4")),t}function i(){return n||(n=u(a())),n}function c(){return r||(r=u((e||(e=o("abcdefghijklmnopqrstuvwxyz0123456789.-^{}()|?[]*$#<>_/\\","k3_v[8b(j1y\\4^q0cd.gu9t>eaw6sn/rp{2i7m#z5|hfxol*?]$)-}<")),e))),r}function l(t,n){return t.toLowerCase().split("").map(t=>n[t]||t).join("")}export function encodeDomain(t){return l(t,a())}export function decodeDomain(t){return l(t,i())}export function decodeContentSignalEntryValue(t,n){return t&&"string"==typeof t?l(t,"regex"===n?c():i()):t}export function decodeContentSignalRulesEntries(t){return Array.isArray(t)?t.map(t=>({...t,value:decodeContentSignalEntryValue(t.value,t.matchType)})):[]}export function decodeStudentSiteTouchpointEntries(t){return Array.isArray(t)?t.filter(t=>!!t.host).map(t=>({...t,host:decodeDomain(t.host),pathPattern:t.pathPattern?decodeContentSignalEntryValue(t.pathPattern,"regex"):t.pathPattern})):[]}