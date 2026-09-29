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
export function resolveTheme(e){return e&&"auto"!==e?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}export function applyBodyTheme(e){const t=resolveTheme(e);document.body.classList.toggle("theme-dark","dark"===t)}export function watchSystemThemeChanges(e){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{const t=e();t&&"auto"!==t||applyBodyTheme(t)})}function e(e,t){e?applyBodyTheme(t()):document.body.classList.remove("theme-dark")}export function initShellTheme({getDarkModeEnabled:t,getTheme:o}){let a=t();e(a,o),chrome.storage.onChanged.addListener((t,n)=>{a=function(t,o,a,n){if("local"!==o)return a;if(t.isSidePanelDarkModeEnabled){const o=t.isSidePanelDarkModeEnabled.newValue;return e(o,n),o}return t.theme&&a&&applyBodyTheme(t.theme.newValue),a}(t,n,a,o)}),watchSystemThemeChanges(()=>a?o():"light")}