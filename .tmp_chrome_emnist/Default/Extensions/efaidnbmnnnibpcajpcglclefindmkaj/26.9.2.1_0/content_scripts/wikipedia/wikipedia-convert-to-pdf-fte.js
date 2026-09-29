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
const WIKIPEDIA_HOSTNAME_PATTERN=/(^|\.)wikipedia\.org$/i;class WikipediaConvertToPdfFte{id="wikipediaconverttopdffte";constructor(){if(!WIKIPEDIA_HOSTNAME_PATTERN.test(window.location.hostname))return this.isEligible=async()=>!1,void(this.render=async()=>{});this.initPromise=this.loadServices(),this.config=null}async loadServices(){this.wikipediaFteService=await import(chrome.runtime.getURL("content_scripts/wikipedia/wikipedia-convert-to-pdf-fte-service.js"))}async render(){await this.initPromise,this.config&&await this.wikipediaFteService.tryShowFte(this.config)}async isEligible(){let i;await this.initPromise;try{i=await chrome.runtime.sendMessage({main_op:"wikipedia-convert-to-pdf-init"})}catch(i){return!1}const e=await this.wikipediaFteService.isWikipediaConvertToPdfFteEligible(i);return e&&(this.config=i),e}}window.WikipediaConvertToPdfFte=WikipediaConvertToPdfFte;