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
describe("message-registry",()=>{let e,t,o,r;beforeEach(()=>{jest.resetModules(),({register:e,getContract:t,listRegisteredOps:o,assertNoDuplicate:r}=require("./message-registry.js"))});const s={op:"test-op",bus:"runtime-message",allowedSenderTiers:["service-worker"],schema:{foo:{required:!0,type:"string"}}};it("registers a contract and makes it retrievable via getContract",()=>{e(s),expect(t("test-op")).toEqual(s)}),it("returns undefined from getContract for an unregistered op",()=>{expect(t("does-not-exist")).toBeUndefined()}),it("lists all registered ops",()=>{e(s),e({...s,op:"second-op"}),expect(o().sort()).toEqual(["second-op","test-op"])}),it("throws on registering a duplicate op",()=>{e(s),expect(()=>e(s)).toThrow(/duplicate op/)}),it("assertNoDuplicate throws for an already-registered op",()=>{e(s),expect(()=>r("test-op")).toThrow(/duplicate op/)}),it("assertNoDuplicate is a no-op for an unregistered op",()=>{expect(()=>r("unused-op")).not.toThrow()}),it("throws on a malformed schema field (missing type)",()=>{const t={...s,op:"bad-op",schema:{foo:{required:!0}}};expect(()=>e(t)).toThrow(/invalid schema/)}),it("throws on a malformed schema field (non-boolean required)",()=>{const t={...s,op:"bad-op2",schema:{foo:{required:"yes",type:"string"}}};expect(()=>e(t)).toThrow(/invalid schema/)}),it("throws when the schema itself is an array (typeof [] === 'object' pitfall)",()=>{const t={...s,op:"bad-op3",schema:[{required:!0,type:"string"}]};expect(()=>e(t)).toThrow(/invalid schema/)}),it("throws on a field def with an unrecognized type value (e.g. a typo)",()=>{const t={...s,op:"bad-op4",schema:{foo:{required:!0,type:"stirng"}}};expect(()=>e(t)).toThrow(/unknown type/)}),it("throws when a non-object field def declares a nested schema",()=>{const t={...s,op:"bad-op5",schema:{foo:{required:!0,type:"string",schema:{bar:{required:!0,type:"string"}}}}};expect(()=>e(t)).toThrow(/only valid on type "object"/)}),it("accepts every schema type value validateSchema can ever compare against",()=>{const t={...s,op:"ok-op-all-types",schema:{a:{required:!0,type:"string"},b:{required:!0,type:"number"},c:{required:!0,type:"boolean"},d:{required:!0,type:"object"},e:{required:!0,type:"null"}}};expect(()=>e(t)).not.toThrow()})});