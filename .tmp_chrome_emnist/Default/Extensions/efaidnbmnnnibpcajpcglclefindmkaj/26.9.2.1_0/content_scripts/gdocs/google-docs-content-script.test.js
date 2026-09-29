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
describe("google-docs-content-script — § Amendment / Item 3 mediation wiring",()=>{let e;beforeAll(()=>{chrome.runtime.sendMessage=jest.fn().mockResolvedValue(void 0),require("../content-script-messaging-gateway.js"),require("./google-docs-content-script.js"),[[e]]=chrome.runtime.onMessage.addListener.mock.calls}),beforeEach(()=>{chrome.runtime.sendMessage.mockClear?.()}),it("still calls the underlying handler for reset-direct-verb-cta exactly as before wrapping (legacy/mediated behavioral parity — wrapContentScriptListener always invokes handler)",()=>{expect(()=>e({content_op:"reset-direct-verb-cta"},{},()=>{})).not.toThrow()}),it("reports a rejection for a content_op outside the declared allowedOps list, but still invokes the handler (never-blocks proof)",()=>{chrome.runtime.sendMessage.mockImplementation((e,t)=>(t&&t(),Promise.resolve())),expect(()=>e({content_op:"not-a-real-op"},{},()=>{})).not.toThrow();const t=chrome.runtime.sendMessage.mock.calls.filter(([e])=>"log-warn"===e?.main_op);expect(t).toHaveLength(1),expect(t[0][0].log).toEqual(expect.objectContaining({bus:"runtime-message-relay",op:"not-a-real-op"}))}),it("does not report a rejection for a recognized content_op",()=>{e({content_op:"reset-direct-verb-cta"},{},()=>{});const t=chrome.runtime.sendMessage.mock.calls.filter(([e])=>"log-warn"===e?.main_op);expect(t).toHaveLength(0)}),it("still calls the underlying handler for update-direct-verb-progress exactly as before wrapping (legacy/mediated behavioral parity)",()=>{expect(()=>e({content_op:"update-direct-verb-progress",progress:75},{},()=>{})).not.toThrow()}),it("does not report a rejection for update-direct-verb-progress",()=>{e({content_op:"update-direct-verb-progress",progress:75},{},()=>{});const t=chrome.runtime.sendMessage.mock.calls.filter(([e])=>"log-warn"===e?.main_op);expect(t).toHaveLength(0)})});