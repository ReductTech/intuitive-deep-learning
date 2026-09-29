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
const loadSummaryBarArticleGate=()=>(jest.resetModules(),delete window.SummaryBarConfig,delete window.SummaryBarArticleGate,require("./SummaryBarConfig.js"),require("./SummaryBarArticleGate.js"),window.SummaryBarArticleGate),setLocation=e=>{Object.defineProperty(window,"location",{configurable:!0,writable:!0,value:new URL(e)})};describe("SummaryBarArticleGate",()=>{beforeEach(()=>{document.head.innerHTML="",document.body.innerHTML=""}),it("rejects NYT section listing URL before og:type article short-circuit",()=>{document.head.innerHTML='<meta property="og:type" content="article">',setLocation("https://www.nytimes.com/international/section/us?page=2");const e=loadSummaryBarArticleGate();expect(e.evaluate(document)).toEqual({ok:!1,reason:"listingUrl"})}),it("allows a dated article URL with og:type article",()=>{document.head.innerHTML='<meta property="og:type" content="article">',setLocation("https://www.nytimes.com/2026/05/22/us/politics/example-article.html");const e=loadSummaryBarArticleGate();expect(e.evaluate(document)).toEqual({ok:!0,reason:"ogType:article"})}),it("detects card-feed listing layout when no positive signal exists",()=>{setLocation("https://www.example.com/app/view/feed"),document.body.innerHTML=`\n            <h1>Section</h1>\n            ${Array.from({length:12},(e,t)=>`<h3><a href="/story-${t+1}">Story headline number ${t+1}</a></h3>`).join("")}\n        `;const e=loadSummaryBarArticleGate();expect(e.evaluate(document)).toEqual({ok:!1,reason:"listingLayout"})}),it("allows Wikipedia article URL when JSON-LD declares Article schema",()=>{document.head.innerHTML='\n            <script type="application/ld+json">\n                {"@context":"https://schema.org","@type":"Article","name":"India"}\n            <\/script>\n        ',setLocation("https://en.wikipedia.org/wiki/India");const e=loadSummaryBarArticleGate();expect(e.evaluate(document)).toEqual({ok:!0,reason:"jsonLdArticle"})})});