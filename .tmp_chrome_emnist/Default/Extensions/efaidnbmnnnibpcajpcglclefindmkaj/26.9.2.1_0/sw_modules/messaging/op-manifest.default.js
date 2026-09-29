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
import{OP as E}from"./op-ids.js";import{BUS as _,MODE as A}from"./messaging-constants.js";export const busOpManifests={[_.CUSTOM_EVENT]:{},[_.RUNTIME_MESSAGE]:{[E.KW_PERF_MARK]:A.DARK_LAUNCH,[E.RESET_DIRECT_VERB_CTA]:A.DARK_LAUNCH,[E.CREATE_IFRAME_TO_LOAD_AJS_WORKER]:A.DARK_LAUNCH,[E.UPDATE_DIRECT_VERB_PROGRESS]:A.DARK_LAUNCH},[_.RUNTIME_MESSAGE_RELAY]:{},[_.POST_MESSAGE]:{[E.CLOSE_ALL_IFRAMES]:A.DARK_LAUNCH},[_.EXTERNAL_MESSAGE]:{[E.DETECT_EXTENSION]:A.DARK_LAUNCH},[_.RUNTIME_CONNECT]:{[E.KEEP_ALIVE]:A.DARK_LAUNCH}};