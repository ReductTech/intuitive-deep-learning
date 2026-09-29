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
import{decodeStudentSiteTouchpointEntries as t,encodeDomain as e}from"./domain-encoding.js";describe("decodeStudentSiteTouchpointEntries",()=>{it("round-trips obfuscated host and pathPattern fields",()=>{const o={id:"pmc",host:"pmc.ncbi.nlm.nih.gov",pathPattern:"/articles/PMC*/*",tier:1,surfaces:["context-menu","extension-menu"]},n=[{...o,host:e(o.host),pathPattern:(s=o.pathPattern,s.toLowerCase().split("").map(t=>{const e="abcdefghijklmnopqrstuvwxyz0123456789.-^{}()|?[]*$#<>_/\\".indexOf(t);return e>=0?"k3_v[8b(j1y\\4^q0cd.gu9t>eaw6sn/rp{2i7m#z5|hfxol*?]$)-}<"[e]:t}).join(""))}];var s;const a=t(n);expect(a[0].host).toBe(o.host),expect(a[0].pathPattern.toLowerCase()).toBe(o.pathPattern.toLowerCase())}),it("drops entries with a missing or empty host",()=>{const o=[{id:"no-host",pathPattern:"/*"},{id:"empty-host",host:"",pathPattern:"/*"},{id:"pmc",host:e("pmc.ncbi.nlm.nih.gov"),pathPattern:"/*"}],n=t(o);expect(n).toHaveLength(1),expect(n[0].id).toBe("pmc")})});