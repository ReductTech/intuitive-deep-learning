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
import expressUtils from"../express-utils.js";class ExpressContextualFTE{CSS_CLASSNAME_PREFIX="ae1eed7c";constructor(t){this.initPromise=this.init(),this.touchpoint=t.touchpoint,this.ctaButtonElement=t.ctaButtonElement,this.fteStrings=t.fteStrings,this.updateFteStateCallback=t.updateFteStateCallback,this.renderCallback=t.renderCallback,this.fteRemovedCallback=t.fteRemovedCallback,this.positionFteCallback=()=>{t.positionFteCallback(this.fte,this.ctaButtonElement)},this.handleResize=this.handleResize.bind(this),this.handleDocumentClick=this.handleDocumentClick.bind(this),this.fte=null}getFteElement(){return this.fte}async init(){await expressUtils.addFontToDocument(),this.htmlDataPromise=fetch(chrome.runtime.getURL("resources/express/expressContextualFTE.html")).then(t=>t.text()).then(t=>{this.htmlData=t})}async render(){await this.initPromise;if(document.getElementById("express-contextual-fte"))return;await this.htmlDataPromise,this.fte=document.createElement("div"),this.fte.id="express-contextual-fte",this.fte.innerHTML=this.htmlData,this.fte.className=this.touchpoint,this.positionFteCallback(),this.addFteStrings(),this.addDismissListener(),this.windowResizeListener(),this.renderCallback(this.fte);const t=new URL(window.location.href),e=t.hostname||t.protocol;expressUtils.sendAnalyticsEvent([["DCBrowserExt:Express:FTE:Shown",{domain:e,expressTouchpoint:this.touchpoint},{uniqueIdentifier:{props:["prop1"]}}]]),this.updateFteStateCallback()}addFteStrings(){const t=this.fte.getElementsByClassName(`${this.CSS_CLASSNAME_PREFIX}-express-contextual-fte-title`)?.[0],e=this.fte.getElementsByClassName(`${this.CSS_CLASSNAME_PREFIX}-express-contextual-fte-desc`)?.[0],s=this.fte.getElementsByClassName(`${this.CSS_CLASSNAME_PREFIX}-express-contextual-fte-cta`)?.[0];t&&(t.textContent=this.fteStrings?.fteTitle),e&&(e.textContent=this.fteStrings?.fteDescription),s&&(s.textContent=this.fteStrings?.fteCtaLabel)}addDismissListener(){const t=this.fte.getElementsByClassName(`${this.CSS_CLASSNAME_PREFIX}-express-contextual-fte-cta`)?.[0];t&&(t.onclick=()=>{this.remove()}),document.addEventListener("click",this.handleDocumentClick,{capture:!0,once:!0})}windowResizeListener(){window.addEventListener("resize",this.handleResize)}handleDocumentClick(){this.remove()}handleResize(){this.positionFteCallback()}remove(){this.fte?.remove(),this.fte=null,document.removeEventListener("click",this.handleDocumentClick),window.removeEventListener("resize",this.handleResize),this.fteRemovedCallback?.()}}export default ExpressContextualFTE;