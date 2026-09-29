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
import{removeExperimentCodeForAnalytics as e,setExperimentCodeForAnalytics as t}from"../common/experimentUtils.js";import{floodgate as a}from"./floodgate.js";import{target as m,getOfferData as r}from"./target.js";const o="DCExt_Target_Dummy_Test_Build";async function l(l){if(!await a.hasFlag("dc-cv-gmail-dummy-target-test"))return void l({enableGmailDummyTargetTest:!1});const n=await m.getTargetOffer([o]),i=r(n,o);!0===i?.enable?(e("GDTC"),t("GDT")):!1===i?.enable?(e("GDT"),t("GDTC")):(e("GDTC"),e("GDT")),l({enableGmailDummyTargetTest:!0===i?.enable,enableGmailDummyTargetTestControl:!1===i?.enable})}export{l as gmailDummyTargetTestInit};