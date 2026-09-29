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
import{PreferenceUtils as t}from"./preference-utils.js";export async function evaluateDefaultValue(r){if(null==r)return r;if("object"==typeof r&&!Array.isArray(r)&&r.function){const n=r.function,e=r.args||[];try{if("function"==typeof t[n]){const r=t[n](...e);return r instanceof Promise?await r:r}return}catch(t){return}}return r}