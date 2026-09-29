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
import{getContract as e}from"./message-registry.js";import{registerRuntimeMessageHandler as t,registerPortMessageHandler as n}from"./message-gateway-core.js";jest.mock("./message-registry.js",()=>({getContract:jest.fn()})),describe("registerRuntimeMessageHandler (message-gateway-core.js)",()=>{beforeEach(()=>{jest.clearAllMocks(),chrome.runtime.onMessage.addListener.mockClear(),e.mockReturnValue({op:"test-op",bus:"runtime-message"})}),it("registers a wrapped listener via chrome.runtime.onMessage.addListener using the given mediateFn/reportRejectionFn",async()=>{const e=jest.fn(),n=jest.fn().mockResolvedValue({decision:"PERMITTED"}),s=jest.fn();t("main_op",e,{endpoint:"offscreen",mediateFn:n,reportRejectionFn:s}),expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));(0,chrome.runtime.onMessage.addListener.mock.calls[0][0])({main_op:"test-op"},{},jest.fn()),await new Promise(e=>setTimeout(e,0)),expect(e).toHaveBeenCalled(),expect(s).not.toHaveBeenCalled()}),it("routes a mediateFn throw to the given reportRejectionFn and does not call handler",async()=>{const e=jest.fn(),n=jest.fn().mockRejectedValue(new Error("boom")),s=jest.fn();t("main_op",e,{endpoint:"offscreen",mediateFn:n,reportRejectionFn:s});(0,chrome.runtime.onMessage.addListener.mock.calls[0][0])({main_op:"test-op"},{},jest.fn()),await new Promise(e=>setTimeout(e,0)),expect(e).not.toHaveBeenCalled(),expect(s).toHaveBeenCalledWith(expect.objectContaining({op:"test-op",reason:expect.stringContaining("boom")}))})}),describe("registerPortMessageHandler (message-gateway-core.js)",()=>{beforeEach(()=>{jest.clearAllMocks(),e.mockReturnValue({op:"test-op",bus:"runtime-connect"})}),it("registers a wrapped listener via the given port's port.onMessage.addListener",async()=>{const e={onMessage:{addListener:jest.fn()},sender:{}},t=jest.fn(),s=jest.fn().mockResolvedValue({decision:"PERMITTED"}),o=jest.fn();n(e,"action",t,{endpoint:"my-port",mediateFn:s,reportRejectionFn:o}),expect(e.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));(0,e.onMessage.addListener.mock.calls[0][0])({action:"test-op"},e),await new Promise(e=>setTimeout(e,0)),expect(t).toHaveBeenCalled()})});