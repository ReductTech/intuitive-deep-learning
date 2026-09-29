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
export const MODE={UNMIGRATED:"unmigrated",DARK_LAUNCH:"dark-launch",ENFORCE:"enforce"};export const DECISION={UNMIGRATED:"UNMIGRATED",DARK_LAUNCH_PASS:"DARK_LAUNCH_PASS",PERMITTED:"PERMITTED",REJECTED:"REJECTED"};export const BUS={CUSTOM_EVENT:"custom-event",RUNTIME_MESSAGE:"runtime-message",RUNTIME_MESSAGE_RELAY:"runtime-message-relay",POST_MESSAGE:"post-message",EXTERNAL_MESSAGE:"external-message",RUNTIME_CONNECT:"runtime-connect"};export const SENDER_TIER={SERVICE_WORKER:"service-worker",OFFSCREEN:"offscreen",EXTENSION_PAGE_OPENED_DIRECTLY:"extension-page-opened-directly",EXTENSION_PAGE_EMBEDDED_IN_FOREIGN_TAB:"extension-page-embedded-in-foreign-tab",CONTENT_SCRIPT:"content-script",EXTERNAL:"external",UNKNOWN:"unknown",CDN_POSTMESSAGE:"cdn-postmessage"};export const CLASSIFIABLE_BUSES=[BUS.RUNTIME_MESSAGE,BUS.RUNTIME_MESSAGE_RELAY,BUS.EXTERNAL_MESSAGE,BUS.RUNTIME_CONNECT];export const FIXED_TIER_BUSES={[BUS.POST_MESSAGE]:SENDER_TIER.CDN_POSTMESSAGE};