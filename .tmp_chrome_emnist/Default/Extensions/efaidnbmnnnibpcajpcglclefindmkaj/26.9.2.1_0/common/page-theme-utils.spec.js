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
import{createPageThemeWatcher as e,detectPageTheme as t}from"./page-theme-utils.js";function o(e){return jest.spyOn(window,"getComputedStyle").mockImplementation(t=>({backgroundColor:e.backgroundColor?.(t)??"rgba(0, 0, 0, 0)",colorScheme:e.colorScheme?.(t)??""}))}describe("page-theme-utils",()=>{afterEach(()=>{jest.restoreAllMocks(),jest.useRealTimers()}),it("uses root background",()=>{o({backgroundColor:e=>e===document.body?"rgb(0, 0, 0)":"rgba(0, 0, 0, 0)"}),expect(t()).toBe("dark")}),it("walks context parent chain first",()=>{const e=document.createElement("div"),n=document.createElement("h1");e.appendChild(n),document.body.appendChild(e),o({backgroundColor:t=>t===e?"rgb(255, 255, 255)":t===document.body?"rgb(0, 0, 0)":"rgba(0, 0, 0, 0)"}),expect(t({contextEl:n})).toBe("light")}),it("reads color-scheme from html",()=>{document.documentElement.style.colorScheme="dark",expect(t()).toBe("dark")}),it("fires onChange when root theme flips",async()=>{jest.useFakeTimers(),o({backgroundColor:e=>e===document.body&&document.body.classList.contains("night")?"rgb(0, 0, 0)":"rgb(255, 255, 255)"});const t=jest.fn(),n=e({onChange:t,debounceMs:0});n.start(),document.body.classList.add("night"),await Promise.resolve(),jest.runOnlyPendingTimers(),expect(t).toHaveBeenCalledWith("dark"),n.stop()}),it("ignores unrelated attribute churn",async()=>{jest.useFakeTimers(),o({backgroundColor:()=>"rgb(255, 255, 255)"});const t=jest.fn(),n=e({onChange:t,debounceMs:0});n.start(),document.body.setAttribute("data-x","1"),await Promise.resolve(),jest.runOnlyPendingTimers(),expect(t).not.toHaveBeenCalled(),n.stop()})});