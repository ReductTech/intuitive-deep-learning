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
import{createTouchpointInit as t}from"./touchpoint-init-factory.js";import{TOUCHPOINT_REGISTRY as o}from"./touchpoint-registry.js";export async function touchpointInitDispatch(r,n){try{if(o[r]){const o=t(r);await o(n)}else n({enabled:!1,state:"Error",error:`Unknown touchpoint: ${r}`})}catch(t){n({enabled:!1,state:"Error",error:t.message})}}