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
export class ConfigLoader{constructor(){this.CONFIG_PATH=chrome.runtime.getURL("dist/preferences-config.json"),this.fetchPromise=null}async init(){}async loadConfiguration(){return this.fetchPromise||(this.fetchPromise=(async()=>{try{const r=await fetch(this.CONFIG_PATH);if(!r.ok)throw new Error(`Failed to load config: ${r.status} ${r.statusText}`);const e=await r.json();if(!e||!e.tabs)throw new Error("Invalid config structure: missing 'tabs' property");return e}catch(r){throw console.error("Error loading preferences config:",r),chrome.runtime.sendMessage({main_op:"log-error",log:{message:"Failed to load preferences config",error:r?.message||r?.toString(),errorStack:r?.stack,configPath:this.CONFIG_PATH}}),r}finally{this.fetchPromise=null}})()),this.fetchPromise}}