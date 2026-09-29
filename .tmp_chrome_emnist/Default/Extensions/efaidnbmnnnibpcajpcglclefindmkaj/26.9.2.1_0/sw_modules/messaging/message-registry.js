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
const e=new Map,o=new Set(["string","number","boolean","object","null"]);function r(e,t,n=""){if(!t||"object"!=typeof t||Array.isArray(t))throw new Error(`invalid schema for op: ${e}`);Object.entries(t).forEach(([t,i])=>{const a=n?`${n}.${t}`:t;if(!i||"object"!=typeof i||"boolean"!=typeof i.required||"string"!=typeof i.type)throw new Error(`invalid schema for op: ${e} (field: ${a})`);if(!o.has(i.type))throw new Error(`invalid schema for op: ${e} (field: ${a}, unknown type: ${i.type})`);if(void 0!==i.schema){if("object"!==i.type)throw new Error(`invalid schema for op: ${e} (field: ${a}, 'schema' is only valid on type "object")`);r(e,i.schema,a)}})}export function assertNoDuplicate(o){if(e.has(o))throw new Error(`duplicate op: ${o}`)}export function register(o){assertNoDuplicate(o.op),r(o.op,o.schema),e.set(o.op,o)}export function getContract(o){return e.get(o)}export function listRegisteredOps(){return Array.from(e.keys())}