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
describe("SummaryBarBootstrap",()=>{beforeEach(()=>{jest.resetModules(),delete window.initSummaryBar,delete window.startSummaryBar,global.chrome.runtime.sendMessage=jest.fn()}),it("does not inject scripts when domain gate fails",async()=>{chrome.runtime.sendMessage=jest.fn(e=>"evaluateSummaryBarDomain"===e?.main_op?Promise.resolve(!1):Promise.resolve()),require("./SummaryBarBootstrap.js"),await window.initSummaryBar(),expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1),expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({main_op:"evaluateSummaryBarDomain"})}),it("injects scripts and starts Summary Bar when domain gate passes",async()=>{chrome.runtime.sendMessage=jest.fn(e=>"evaluateSummaryBarDomain"===e?.main_op?Promise.resolve(!0):"injectSummaryBarScripts"===e?.main_op?(window.startSummaryBar=jest.fn(),Promise.resolve(!0)):Promise.resolve()),require("./SummaryBarBootstrap.js"),await window.initSummaryBar(),expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({main_op:"injectSummaryBarScripts"}),expect(window.startSummaryBar).toHaveBeenCalledTimes(1)}),it("calls startSummaryBar directly when modules are already loaded",async()=>{window.startSummaryBar=jest.fn(),require("./SummaryBarBootstrap.js"),await window.initSummaryBar(),expect(window.startSummaryBar).toHaveBeenCalledTimes(1),expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()})});