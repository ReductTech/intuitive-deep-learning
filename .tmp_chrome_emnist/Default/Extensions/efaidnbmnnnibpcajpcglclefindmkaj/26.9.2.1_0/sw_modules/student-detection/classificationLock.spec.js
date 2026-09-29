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
import{withClassificationLock as t}from"./classificationLock.js";describe("withClassificationLock",()=>{it("never overlaps two concurrently-started calls — the second only starts once the first settles",async()=>{const e=[];let s;const a=t(()=>new Promise(t=>{e.push("first:start"),s=()=>{e.push("first:end"),t()}})),o=t(async()=>{e.push("second:start")});await Promise.resolve(),await Promise.resolve(),expect(e).toEqual(["first:start"]),s(),await a,await o,expect(e).toEqual(["first:start","first:end","second:start"])}),it("still advances the queue for the next caller when a locked call rejects",async()=>{const e=[];await expect(t(async()=>{throw e.push("first"),new Error("boom")})).rejects.toThrow("boom"),await t(async()=>{e.push("second")}),expect(e).toEqual(["first","second"])}),it("propagates each call's own return value/rejection independently",async()=>{await expect(t(async()=>42)).resolves.toBe(42),await expect(t(async()=>{throw new Error("fails")})).rejects.toThrow("fails"),await expect(t(async()=>"ok")).resolves.toBe("ok")})});