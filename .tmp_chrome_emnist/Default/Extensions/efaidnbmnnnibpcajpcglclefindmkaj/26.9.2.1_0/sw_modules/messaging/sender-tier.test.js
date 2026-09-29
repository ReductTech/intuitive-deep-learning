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
import{classify as e}from"./sender-tier.js";const s="id",r=`chrome-extension://${s}`;describe("sender-tier classify",()=>{it("classifies a service-worker sender",()=>{expect(e({id:s})).toBe("service-worker")}),it("classifies a service-worker sender whose sender.url is its own script path (real Chrome behavior — sender.url is not always falsy for SW-originated messages, unlike the older !sender.tab && !sender.url check)",()=>{expect(e({id:s,url:`${r}/service-worker.js`})).toBe("service-worker")}),it("classifies an offscreen sender via exact offscreen document URL match",()=>{expect(e({url:`${r}/browser/js/offscreen/offscreen.html`})).toBe("offscreen")}),it("classifies an offscreen sender whose URL carries the ?env= query string it's always created with",()=>{expect(e({url:`${r}/browser/js/offscreen/offscreen.html?env=prod`})).toBe("offscreen")}),it("does NOT classify a URL that merely contains the offscreen path as a substring",()=>{expect(e({url:`${r}/browser/js/offscreen/offscreen.html/../frame.html`})).toBe("extension-page-opened-directly")}),it("classifies a content-script sender",()=>{expect(e({tab:{id:1,url:"https://example.com"},url:void 0})).toBe("content-script")}),it("classifies an external sender",()=>{expect(e({id:"some-other-extension-id"})).toBe("external")}),it("classifies an unknown sender",()=>{expect(e(null)).toBe("unknown"),expect(e({})).toBe("unknown")}),it("classifies a WAR sender with no sender.tab as opened directly",()=>{expect(e({url:`${r}/browser/js/popup.html`})).toBe("extension-page-opened-directly")}),it("classifies a WAR sender whose sender.tab.url is the extension's own origin as opened directly",()=>{expect(e({url:`${r}/browser/js/popup.html`,tab:{id:1,url:`${r}/browser/js/popup.html`}})).toBe("extension-page-opened-directly")}),it("classifies a WAR sender whose sender.tab.url is a foreign page as embedded",()=>{expect(e({url:`${r}/browser/js/frame.html`,tab:{id:1,url:"https://attacker.example.com"}})).toBe("extension-page-embedded-in-foreign-tab")}),it("fails closed to embedded when sender.tab is set but sender.tab.url is undefined",()=>{expect(e({url:`${r}/browser/js/frame.html`,tab:{id:1}})).toBe("extension-page-embedded-in-foreign-tab")})});