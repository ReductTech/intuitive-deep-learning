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
class Viewport{static isRangeVisible(t,e=50,n=50){const o=t.getBoundingClientRect();if(0===o.width||0===o.height)return!1;let i=t.startContainer.nodeType===Node.ELEMENT_NODE?t.startContainer:t.startContainer.parentElement;for(;i;){const t=window.getComputedStyle(i);if(0==t.opacity||"hidden"===t.visibility||"collapse"===t.visibility||t.transform.includes("scale(0)"))return!1;i=i.parentElement}let r=t.startContainer.nodeType===Node.ELEMENT_NODE?t.startContainer:t.startContainer.parentElement;for(;r;){if("visible"===window.getComputedStyle(r).overflow)break;{const t=r.getBoundingClientRect(),e=Math.max(o.top,t.top),n=Math.min(o.bottom,t.bottom),i=Math.max(o.left,t.left),s=Math.min(o.right,t.right);if(n-e<=0||s-i<=0)return!1}r=r.parentElement}const s=-e,a=window.innerHeight+n;if(o.bottom<s||o.top>a)return!1;const l=o.left+o.width/2,c=o.top+o.height/2,d=document.elementFromPoint(l,c);return!(d&&!t.startContainer.contains(d)&&!d.contains(t.startContainer))}static getVisibleTextNodes({topBuffer:t,bottomBuffer:e}){const n=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT,{acceptNode:function(t){return t.textContent?.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});let o;const i=[];let r=[],s=0,a=-1,l=-1;for(;o=n.nextNode();){const n=document.createRange();n.selectNodeContents(o);Viewport.isRangeVisible(n,t,e)&&(a=-1===a?s:a,l=s,i.push(o.textContent.trim())),r.push(o.textContent.trim()),s++}a-1>0&&i.unshift(...r.slice(a-1,a)||[]),-1!==l&&l+1<r.length&&i.push(...r.slice(l+1,l+2)||[]);return i.join("\n")}static getHtmlContent(){const t=Viewport.getVisibleTextNodes({topBuffer:0,bottomBuffer:1e3});return t?`<html><body>${t}</body></html>`:""}}