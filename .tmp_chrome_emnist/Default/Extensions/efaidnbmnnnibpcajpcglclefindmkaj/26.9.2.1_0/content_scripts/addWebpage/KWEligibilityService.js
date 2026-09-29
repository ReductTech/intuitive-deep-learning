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
class KWEligibilityService{static shouldShow=null;static _hasOfficeTitle(){const t=document.title.toLowerCase();return[/^.+ google docs$/,/^.+ google sheets$/,/^.+ google slides$/,/\.(docx?|xlsx?|pptx?)$/].some(e=>e.test(t))}static async isOfficeDocument(){return(await Promise.all([this._hasOfficeTitle()])).filter(Boolean).length>0}static isCurrentTabExtensionViewer(t){if(!t)return!1;const e=`chrome-extension://${chrome.runtime.id}`;return t.startsWith(`${e}/http`)||t.startsWith(`${e}/https`)||t.startsWith(`${e}/viewer.html`)||t.startsWith(`${e}/file`)||t.startsWith(`${e}/blob`)}static async _shouldShowTouchpoints(t){if(!await await chrome.runtime.sendMessage({main_op:"isAddWebpageToProjectEnabled"}))return!1;if(this.isCurrentTabExtensionViewer(t.tabURL))return!1;if(document.contentType&&document.contentType.includes("application/pdf"))return!1;try{const{isPdfViewerTab:t}=await chrome.runtime.sendMessage({main_op:"is-pdf-viewer-tab"});if(t)return!1}catch(t){}if(await this.isOfficeDocument())return!1;const e=new URL(t.tabURL).hostname;return!await chrome.runtime.sendMessage({main_op:"kw-is-blocked-domain",domain:e})}static async shouldShowAddWebpageToProjectTouchpoint(t){return null!==this.shouldShow||(this.shouldShow=await this._shouldShowTouchpoints(t)),this.shouldShow}}