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
import{Mutex as t}from"./Mutex.js";const n=new t;let e=0,o=!1;export function getActiveTasks(){return e}export function setCloseRequested(t){o=t}export function wrapTask(t,r){return async function(...a){await async function(){const t=await n.lock();try{if(o)throw new Error("Close request received, not accepting new tasks.");e+=1}finally{t()}}();try{await r(...a)}catch(n){console.error(`Error in '${t}':`,n)}finally{await async function(){const t=await n.lock();try{e-=1}finally{t()}}()}}}