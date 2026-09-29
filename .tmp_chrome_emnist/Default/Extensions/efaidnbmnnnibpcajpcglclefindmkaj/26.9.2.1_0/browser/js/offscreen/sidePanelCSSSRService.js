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
import{extractWebpageHTML as e}from"../../../resources/addWebpage/extractWebpageHTML.js";import{largeBlobStorage as t}from"../../../common/large-blob-storage.js";import{dcLocalStorage as n}from"./offscrenUtil.js";export const saveGenAISidePanelRenderedHTML=async r=>{if(document.querySelector("iframe#sidepanel"))return;const[a,o,s,i]=await Promise.all([n.getItem("sidepanelUrl"),n.getItem("appLocale"),n.getItem("theme"),n.getItem("isSidePanelDarkModeEnabled")]),m=new URL(a);m.hash=r.hashRoute;const l=m.origin;m.searchParams.append("la",!1),m.searchParams.append("ca",chrome.runtime.id),m.searchParams.append("locale",o),m.searchParams.append("utl",!0),i&&m.searchParams.append("theme",s||"auto");const d=(e=>{const t=document.createElement("iframe");return t.setAttribute("id","sidepanel"),t.width="373px",t.height="914px",t.border="none",t.onerror=e=>{console.error("Error in loading sidepanel iframe",e)},t.src=e,t})(m.href);let c;document.body.appendChild(d);let p,h=!1;const g=()=>{h||(h=!0,clearTimeout(p),c&&window.removeEventListener("message",c),d.remove())};p=setTimeout(g,35e3);const u=(()=>{let e;return{promise:new Promise((t,n)=>{const r=setTimeout(()=>{n(new Error("Hosted sidepanel ready event timeout"))},2e4);e=()=>{clearTimeout(r),t()}}),resolver:e}})();var w;c=async n=>{if(n.origin===l)switch(n.data.main_op){case"saveHtmlContent":window.removeEventListener("message",c),await async function(n){const r=(new DOMParser).parseFromString(n.htmlContent,"text/html"),a=await e(r),o=n.isAnonUser?"anonGenAISSRHtml":"signedInGenAISSRHtml";a?.html&&await t.setItem(o,a.html),g()}(n.data);break;case"cdnReady":u.resolver()}},window.addEventListener("message",c),w={type:"sidepanelHtmlContent",htmlContent:"<html><body><h1>Hello</h1></body></html>",disqualified:!1,pageLanguage:"en",url:"https://www.hello.com",touchpoint:"offscreen"},d&&u.promise.then(()=>d.contentWindow.postMessage(w,l)).catch(e=>{console.error("Error in sending message to sidepanel:",e.toString()),g()})};