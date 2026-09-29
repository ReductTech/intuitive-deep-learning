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
import{removeExperimentCodeForAnalytics as e,setExperimentCodeForAnalytics as t}from"../common/experimentUtils.js";import{dcLocalStorage as o}from"../common/local-storage.js";import{target as r,getOfferData as a}from"./target.js";const n="welcomePdfCtaVariant",m="DCExt_Welcome_PDF_CTA_Test",l="WPC",c="WPCC";async function i(){const i=await r.getTargetOffer([m]),s=a(i,m);return!0===s?.enable?(e(c),t(l),o.setItem(n,"challenger"),{variant:"challenger"}):!1===s?.enable?(e(l),t(c),o.setItem(n,"control"),{variant:"control"}):(e(l),e(c),o.removeItem(n),{variant:null})}export{i as welcomePdfTargetInit};