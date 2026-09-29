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
import{busFlagId as e,MASTER_ENABLE_FLAG as s}from"./flag-ids.js";describe("flag-ids",()=>{it("MASTER_ENABLE_FLAG is the global kill switch flag id",()=>{expect(s).toBe("dc-cv-msg-gateway-master")}),it.each([["custom-event","dc-cv-msg-bus-custom-event"],["runtime-message","dc-cv-msg-bus-runtime-message"],["runtime-message-relay","dc-cv-msg-bus-runtime-message-relay"],["post-message","dc-cv-msg-bus-post-message"],["external-message","dc-cv-msg-bus-external-message"],["runtime-connect","dc-cv-msg-bus-runtime-connect"]])("busFlagId(%s) returns %s",(s,t)=>{expect(e(s)).toBe(t)})});