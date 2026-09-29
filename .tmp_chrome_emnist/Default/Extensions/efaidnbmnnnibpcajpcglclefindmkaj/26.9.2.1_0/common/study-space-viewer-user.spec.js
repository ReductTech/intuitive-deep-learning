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
import{dcLocalStorage as e}from"./local-storage.js";import{BROWSER_STUDENT_IS_ENTERPRISE_FIELD as t,ENGAGEMENT_STATE_TAG_FIELD as s,ENGAGEMENT_STATE_ROLLING_WINDOW_FIELD as o}from"../sw_modules/student-detection/constants.js";import{markEnterpriseFromViewer as n,isBrowserStudentDetectionAllowed as a}from"./study-space-viewer-user.js";jest.mock("./local-storage.js",()=>({dcLocalStorage:{init:jest.fn().mockResolvedValue(void 0),getItem:jest.fn(),setItem:jest.fn(),removeItem:jest.fn()}})),describe("study-space-viewer-user",()=>{beforeEach(()=>{jest.clearAllMocks(),e.getItem.mockReturnValue(null)}),it("allows browser detection by default",async()=>{await expect(a()).resolves.toBe(!0)}),it("blocks browser detection when vEn is true",async()=>{e.getItem.mockImplementation(e=>"cvEngSt"===e?JSON.stringify({[t]:!0}):null),await expect(a()).resolves.toBe(!1)}),it("blocks browser detection for admin installSource",async()=>{e.getItem.mockImplementation(e=>"installSource"===e?"admin":null),await expect(a()).resolves.toBe(!1)}),it("blocks browser detection for admin users",async()=>{e.getItem.mockImplementation(e=>"isAdminUser"===e?"true":null),await expect(a()).resolves.toBe(!1)}),it("sets vEn on first enterprise mark and clears engagement",async()=>{e.getItem.mockReturnValue(JSON.stringify({[s]:"learner",[o]:{"2026-07-10":["abc"]}})),await expect(n(!0)).resolves.toBe(!0);const a=JSON.parse(e.setItem.mock.calls[0][1]);expect(a[t]).toBe(!0),expect(a[o]).toEqual({}),expect(a[s]).toBe("")}),it("does not update vEn after enterprise is already set",async()=>{e.getItem.mockReturnValue(JSON.stringify({[t]:!0})),await expect(n(!1)).resolves.toBe(!0),expect(e.setItem).not.toHaveBeenCalled()}),it("ignores non-enterprise mark when vEn is not set",async()=>{await expect(n(!1)).resolves.toBe(!1),expect(e.setItem).not.toHaveBeenCalled(),expect(e.removeItem).not.toHaveBeenCalled()})});