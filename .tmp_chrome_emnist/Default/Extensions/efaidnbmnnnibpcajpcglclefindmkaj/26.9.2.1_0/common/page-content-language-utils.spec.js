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
import{getPageContentLanguage as e,normalizeLanguageTag as t}from"./page-content-language-utils.js";describe("page-content-language-utils",()=>{beforeEach(()=>{document.documentElement.lang="",document.body.innerHTML="",global.chrome.i18n.detectLanguage=jest.fn()}),it("normalizes language tags",()=>{expect(t("en-US")).toBe("en"),expect(t("fr_FR")).toBe("fr")}),it("returns declared and detected page language",async()=>{document.documentElement.lang="en",document.body.textContent="Hello world, this is an English article about technology. ".repeat(5),chrome.i18n.detectLanguage.mockResolvedValue({languages:[{language:"en",percentage:98}]});const t=await e(document);expect(t.declaredLanguage).toBe("en"),expect(t.dominantLanguage).toBe("en"),expect(t.percentage).toBe(98),expect(t.textLength).toBeGreaterThan(0)})});