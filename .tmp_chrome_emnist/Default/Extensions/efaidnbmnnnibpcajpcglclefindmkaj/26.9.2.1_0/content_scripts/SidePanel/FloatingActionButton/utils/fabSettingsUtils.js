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
import{sendAnalyticsEvent}from"./fabUtils";const hideFabForDomain=async e=>{await initDcLocalStorage();const n=window.dcLocalStorage.getItem("hideFabDomainList")||[];n.includes(e)||n.push(e),window.dcLocalStorage.setItem("hideFabDomainList",n),chrome.runtime.sendMessage({main_op:"log-info",log:{message:"FAB hidden for domain",domain:e}})},neverDisplayFab=async()=>{await initDcLocalStorage(),window.dcLocalStorage.setItem("enableGenAIFab","false")};export const handleHideForNow=e=>{const n=new URL(window.location.href).hostname;e.isFABHiddenForNow=!0,e.removeFAB(),chrome.runtime.sendMessage({main_op:"log-info",log:{message:"FAB hide for now clicked",domain:n}}),sendAnalyticsEvent([["DCBrowserExt:SidePanel:SettingsMenu:RemoveFab"]])};export const handleHideFabForDomain=async e=>{const n=new URL(window.location.href).hostname;await hideFabForDomain(n),e.isFABHiddenForNow=!0,e.removeFAB(),sendAnalyticsEvent([["DCBrowserExt:SidePanel:SettingsMenu:RemoveFabForDomain"]])};export const handleNeverDisplayFab=async e=>{const n=new URL(window.location.href).hostname;await neverDisplayFab(),e.removeFAB(),chrome.runtime.sendMessage({main_op:"log-info",log:{message:"FAB never display clicked",domain:n}}),sendAnalyticsEvent([["DCBrowserExt:SidePanel:SettingsMenu:NeverDisplay"]])};export const handleOpenPreferences=async()=>{await initDcLocalStorage(),window.dcLocalStorage.setItem("optionsPageSource","FAB_MENU");const e=window.dcLocalStorage.getItem("isSidePanelHomeEnabled"),n=window.dcLocalStorage.getItem("sidePanelRegistered"),o=e&&n;chrome.runtime.sendMessage({type:"open_options_page",preferenceTabId:o?"connected-apps":"generative-ai",controlId:o?"fab-webpages-section":"fab-section",highlightSection:["ai-assistant-banner-header-wrapper","fab-preference-toggle"]}),sendAnalyticsEvent([["DCBrowserExt:SidePanel:SettingsMenu:PreferencesClicked"]])};