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
"use strict";class WorkdayJobsSite{config={disabled:!1,minExtensionVersion:null,minChromeVersion:null,minEdgeVersion:null,selector:'input[data-automation-id="file-upload-input-ref"]',guardSelector:'div[data-automation-id="applyFlowAutoFillPage"]',footerSelector:'div[data-automation-id="pageFooter"]',containerStyle:"display:inline-flex;vertical-align:middle;margin-right:auto;",themeStyles:{btn:"background: transparent;"},allowedFileSize:5242880};constructor(){this.INJECTED_ATTR=magicScanCore.INJECTED_ATTR,this.inputButtonMap=new Map,this.domObserver=null}async run(){await magicScanCore.init()&&(this.config={...this.config,...magicScanCore.siteConfig??{}},!this.config.disabled&&magicScanCore.meetsMinVersions(this.config)&&(this.domObserver=magicScanCore.observeDOM(()=>this.scanAndInject()),this.scanAndInject()))}scanAndInject(){if(!document.querySelector(this.config.guardSelector))return void document.querySelectorAll(`${this.config.selector}[${this.INJECTED_ATTR}]`).forEach(t=>{this.inputButtonMap.has(t)&&(this.removeButton(t),t.removeAttribute(this.INJECTED_ATTR))});this.inputButtonMap.forEach((t,e)=>{e.isConnected||(t.remove(),this.inputButtonMap.delete(e))});const t=document.querySelector(`${this.config.selector}:not([${this.INJECTED_ATTR}])`);t&&this.injectButton(t)}injectButton(t){if(this.inputButtonMap.has(t))return;const e=document.querySelector(this.config.footerSelector);if(!e)return;const i=document.createElement("span");i.style.cssText=this.config.containerStyle,e.prepend(i),magicScanCore.renderButton(i,{isDarkMode:!1,themeStyles:this.config.themeStyles,selector:this.config.selector,inputButtonMap:this.inputButtonMap,allowedFileSize:this.config.allowedFileSize,onHide:()=>this.cleanup()}),this.inputButtonMap.set(t,i),t.setAttribute(this.INJECTED_ATTR,"true")}cleanup(){this.domObserver?.disconnect(),this.removeAllButtons()}removeButton(t){this.inputButtonMap.get(t)?.remove(),this.inputButtonMap.delete(t)}removeAllButtons(){this.inputButtonMap.forEach((t,e)=>{e.removeAttribute(this.INJECTED_ATTR),t.remove()}),this.inputButtonMap.clear()}}const workdayJobsSite=new WorkdayJobsSite;workdayJobsSite.run();