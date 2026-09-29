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
global.window=global,global.window.dcLocalStorage={getItem:jest.fn(),setItem:jest.fn()},global.window.initDcLocalStorage=jest.fn().mockResolvedValue(void 0),global.window.location={hostname:"example.com",href:"https://example.com/page"},global.document=global.document||{title:"Test Page"},chrome.runtime.sendMessage=jest.fn().mockResolvedValue(void 0);const fabSettingsUtils=require("./fabSettingsUtils.js");describe("fabSettingsUtils",()=>{beforeEach(()=>{jest.clearAllMocks(),window.dcLocalStorage.getItem=jest.fn(),window.dcLocalStorage.setItem=jest.fn(),window.initDcLocalStorage=jest.fn().mockResolvedValue(void 0),chrome.runtime.sendMessage=jest.fn().mockResolvedValue(void 0)}),describe("handleOpenPreferences",()=>{it("sets optionsPageSource to FAB_MENU before routing",async()=>{await fabSettingsUtils.handleOpenPreferences(),expect(window.dcLocalStorage.setItem).toHaveBeenCalledWith("optionsPageSource","FAB_MENU")}),it("routes to Connected Apps / fab-webpages-section when the home cohort is active",async()=>{window.dcLocalStorage.getItem=jest.fn(()=>!0),await fabSettingsUtils.handleOpenPreferences(),expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({type:"open_options_page",preferenceTabId:"connected-apps",controlId:"fab-webpages-section"}))}),it("routes to Generative AI / fab-section when the home cohort is not active",async()=>{window.dcLocalStorage.getItem=jest.fn(()=>!1),await fabSettingsUtils.handleOpenPreferences(),expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({type:"open_options_page",preferenceTabId:"generative-ai",controlId:"fab-section"}))})})});