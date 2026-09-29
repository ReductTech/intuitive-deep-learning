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
import expressUtils from"./express-utils.js";class ExpressPrecaching{async isPrecachingEnabled(){return await chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:"dc-cv-express-precaching"})||!1}async precache(){try{if(!await this.isPrecachingEnabled())return;const e="express_precaching",t=24*30*60*60*1e3,r=window.location.hostname,s=(await chrome.storage.local.get(e))[e]||{},n=s[r];if(n){if(Date.now()-n<t)return}expressUtils.sendAnalyticsEvent([["DCBrowserExt:Express:Precaching:Op:Success",{domain:r}]]),this.openExpressEditorInFrame(),s[r]=Date.now(),await chrome.storage.local.set({[e]:s})}catch(e){expressUtils.sendErrorLog("Error during precaching in express",e)}}createDomAnchor(e){const t=document.getElementById(e);if(t)return t;const r=document.createElement("div");return r.id=e,r.style.position="fixed",r.style.top="-9999px",r.style.left="-9999px",r.style.width="1px",r.style.height="1px",r.style.visibility="hidden",r.style.pointerEvents="none",r.style.opacity="0",r.style.zIndex="-1",r}openExpressEditorInFrame(){const e=this.createDomAnchor("expressAcrobatExtensionPrecaching"),t=`${chrome.runtime.getURL("browser/js/express.html")}?precache=true`,r=document.createElement("iframe");r.setAttribute("src",t),r.setAttribute("id","expressAcrobatExtensionPrecachingIframe"),r.style.setProperty("width","1px","important"),r.style.setProperty("height","1px","important"),r.style.setProperty("border","none","important"),e.appendChild(r),document.body.insertBefore(e,document.body.childNodes[0])}}const expressPrecaching=new ExpressPrecaching;export default expressPrecaching;