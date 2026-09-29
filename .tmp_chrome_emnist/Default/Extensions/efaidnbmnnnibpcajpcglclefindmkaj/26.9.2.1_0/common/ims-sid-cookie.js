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
export async function checkForImsSidCookie(){const e=await async function(){try{return await chrome.cookies.get({url:"https://www.services.adobe.com/",name:"ims_sid"})}catch{return null}}();if(!e?.value)return!1;if(null==e.expirationDate)return!0;return 1e3*e.expirationDate>(new Date).getTime()}