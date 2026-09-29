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
const e=2e5;let t=null;async function r(r,u,a){try{t=e+a%1e5;const n={id:t,priority:2,action:{type:"modifyHeaders",requestHeaders:[{header:"Referer",operation:"set",value:u}]},condition:{urlFilter:r,resourceTypes:["xmlhttprequest"]}};return await chrome.declarativeNetRequest.updateDynamicRules({addRules:[n],removeRuleIds:[t]}),t}catch(e){return null}}function u(){t&&chrome.declarativeNetRequest.updateDynamicRules({addRules:[],removeRuleIds:[t]}).catch(()=>{})}function a(){return t}export{r as createDynamicReferrerRule,u as cleanupDynamicReferrerRule,a as getCurrentDnrRuleId,e as DNR_DYNAMIC_RULE_MIN_ID};