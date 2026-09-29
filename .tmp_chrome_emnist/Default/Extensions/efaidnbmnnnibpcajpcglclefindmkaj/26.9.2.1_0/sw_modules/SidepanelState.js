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
class e{LOAD_STATE={NOT_LOADED:0,CDN_READY:1,FULLY_LOADED:2};constructor(){if(e.instance)return e.instance;e.instance=this,this.tabStates={},this.loadStates={},this.closeReasons={},this.renderModes={}}setIsOpen(e,t){this.tabStates[e]=t}getIsOpen(e){return this.tabStates[e]??!1}setLoadState(e,t){this.loadStates[e]=t}getLoadState(e){return this.loadStates[e]??this.LOAD_STATE.NOT_LOADED}setCloseReason(e,t){this.closeReasons[e]=t}getCloseReason(e){return this.closeReasons[e]??null}setRenderMode(e,t){this.renderModes[e]=t}getRenderMode(e){return this.renderModes[e]??null}clear(e){delete this.tabStates[e],delete this.loadStates[e],delete this.closeReasons[e],delete this.renderModes[e]}}const t=new e;export{t as sidepanelState};