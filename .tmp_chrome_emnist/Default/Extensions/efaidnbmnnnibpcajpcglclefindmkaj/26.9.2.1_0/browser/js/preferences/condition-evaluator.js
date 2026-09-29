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
import{PreferenceUtils as t}from"./preference-utils.js";export async function evaluateSingleCondition(n,e){if(n.customFunction){if("function"==typeof t[n.customFunction]){const e=t[n.customFunction]();return e instanceof Promise?await e:e}return!0}if(n.flag)try{const t=await chrome.runtime.sendMessage({main_op:"getFloodgateFlag",flag:n.flag});return String(t)===String(n.value)}catch(t){return!1}if(n.settingsKey)try{const t=SETTINGS[n.settingsKey];return"exists"===n.operator?null!=t:"notExists"===n.operator?null==t:String(t)===String(n.value)}catch(t){return!1}if(n.storageKey){const t=await e.getValue(n.storageKey,null);return"exists"===n.operator?null!=t:"notExists"===n.operator?null==t:String(t)===String(n.value)}return!0}export async function evaluateCondition(n,e){if("custom"===n.type&&n.function){if("function"==typeof t[n.function]){const e=t[n.function](...n.args||[]);return e instanceof Promise?await e:e}return!0}if(!n.conditions||0===n.conditions.length)return!0;const o=[];for(const t of n.conditions){const n=await evaluateSingleCondition(t,e);o.push(n)}return"and"===n.type?o.every(t=>!0===t):"or"!==n.type||o.some(t=>!0===t)}