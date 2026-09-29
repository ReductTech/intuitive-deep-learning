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
import{loggingApi as r}from"./loggingApi.js";export function errForLog(r){if(null==r)return{};const e={errorName:r.name,errorMessage:r.message};return void 0!==r.code&&(e.errorCode=r.code),r.stack&&(e.errorStack=String(r.stack).slice(0,500)),e}export function getOsForLog(){if("undefined"==typeof navigator)return"unknown";const r=navigator.userAgent||"";if(r.includes("CrOS"))return"Chrome OS";if(navigator.userAgentData?.platform){const r=navigator.userAgentData.platform.toLowerCase();if(r.includes("win"))return"Windows";if(r.includes("mac"))return"Mac";if(r.includes("linux"))return"Linux"}return r.includes("Win")?"Windows":r.includes("Mac")?"Mac":r.includes("Linux")?"Linux":"unknown"}export function logIdbError(e,n,o={}){r.error({message:e,...errForLog(n),os:getOsForLog(),...o})}