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
import{dcLocalStorage as e}from"./local-storage.js";import{loggingApi as t}from"./loggingApi.js";import{STUDY_SPACE_CONTEXT_MENU_FLAG as o,STUDY_SPACE_DEFAULT_LOCALES as a}from"./constant.js";import{floodgate as l}from"../sw_modules/floodgate.js";function n(t){const o="true"===e.getItem("adobeInternal");return{flagMeta:JSON.parse(l.getFeatureMeta(t)||"{}"),flagMetaInternal:o?JSON.parse(l.getFeatureMeta(`${t}-internal`)||"{}"):{}}}function r(e,t,o){const a=[...e.allowedLocales??[],...t.allowedLocales??[]];return a.length>0?a:o}export function getFloodgateAllowedLocales(e,o){try{const{flagMeta:t,flagMetaInternal:a}=n(e);return r(t,a,o)}catch(a){return t.error({message:`Failed to parse allowed locales for floodgate flag ${e}`,stack:a?.stack,context:{flag:e}}),o}}export function getStudySpaceContextMenuAllowedLocales(){return getFloodgateAllowedLocales(o,a)}export function isStudySpaceAllowedLocale(t){const o=t||e.getItem("appLocale")||chrome.i18n.getMessage("@@ui_locale");return getStudySpaceContextMenuAllowedLocales().includes(o)||o.startsWith("en")}export function getStudySpaceContextMenuFeatureConfig(){const e=o;try{const{flagMeta:t,flagMetaInternal:o}=n(e),l=r(t,o,a);return{allowedLocales:l,allowWithoutSignIn:!0===t.allowWithoutSignIn||!0===o.allowWithoutSignIn}}catch(o){return t.error({message:"Failed to parse Study Space context menu feature meta",stack:o?.stack,context:{flag:e}}),{allowedLocales:a,allowWithoutSignIn:!1}}}