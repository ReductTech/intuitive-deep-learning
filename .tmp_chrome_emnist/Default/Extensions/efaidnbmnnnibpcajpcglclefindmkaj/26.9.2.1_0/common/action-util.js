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
import{dcLocalStorage as e}from"./local-storage.js";import{POPUP_CONTEXT as t,SIDE_PANEL_SURFACE as o}from"./constant.js";import{getFloodgateFlag as n}from"./util.js";import r from"../sw_modules/dynamic-tab-context-manager.js";import{getDirectFlowShowCount as a,getDirectFlowCompleteItemsFiltered as i}from"../sw_modules/direct-verb-utils.js";import{loggingApi as c}from"./loggingApi.js";import{analytics as p,events as s}from"./analytics.js";export function logHomeOpenedProtocol(e){p.setArg("protocol",p.parseURL(e).protocol),p.event(s.HOME_OPENED_PROTOCOL)}async function u(e){e?await chrome.action.setPopup({popup:"browser/js/popup.html",tabId:e}):c.error("Tab ID is required — cannot configure toolbar action for unknown tab")}async function l(t){return e.getItem("isSidePanelHomeEnabled")?async function(e){e?await chrome.action.setPopup({popup:"",tabId:e}):c.error("Tab ID is required — cannot configure toolbar action for unknown tab")}(t):u(t)}export async function clearTabPopupOverride(e){return l(e)}export async function openTabPopupOverride(e,t){try{return await u(t),await chrome.action.openPopup(e)}catch(e){return c.error("Error in opening the extension popup menu:",e),await clearTabPopupOverride(t),Promise.reject()}}export async function getTabPopupContext(e,o){if(o)try{const e=new URL(o).searchParams.get("context");if(e)return e}catch(e){}const c=r.getPopupContext(e,o);if(c&&c!==t.DEFAULT)return c;if(await n("dc-cv-inactive-tab-direct-flow")){const e=a(),o=await i();if(e<2&&Array.isArray(o)&&o.length>0)return t.DIRECT_FLOW_COMPLETE}return t.DEFAULT}export async function configureActionOnTabContext(e){const o=await chrome.tabs.get(e).catch(()=>null),n=o?.url||o?.pendingUrl;return await getTabPopupContext(e,n)!==t.DEFAULT?u(e):l(e)}export function registerSidePanelClickHandler(t){chrome.action.onClicked.addListener(async n=>{if(!!!e.getItem("isSidePanelHomeEnabled"))return p.event(s.EXT_MENU_ICON_CLICKED),void await openTabPopupOverride({},n.id);p.event(s.EXT_MENU_ICON_CLICKED,{eventContext:o.HOME}),t.getIsOpen(n.id)?chrome.sidePanel.close({tabId:n.id}).catch(e=>c.warn("Failed to close side panel via action click:",e)):(logHomeOpenedProtocol(n.url),chrome.sidePanel.open({tabId:n.id}).catch(e=>c.warn("Failed to open side panel via action click:",e)))})}