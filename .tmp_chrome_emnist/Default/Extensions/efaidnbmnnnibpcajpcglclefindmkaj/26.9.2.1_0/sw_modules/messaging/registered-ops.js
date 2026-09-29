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
import{register as e}from"./message-registry.js";import{OP as E}from"./op-ids.js";import{BUS as r,SENDER_TIER as t}from"./messaging-constants.js";e({op:E.KW_PERF_MARK,bus:r.RUNTIME_MESSAGE,allowedSenderTiers:[t.CONTENT_SCRIPT,t.EXTENSION_PAGE_EMBEDDED_IN_FOREIGN_TAB],schema:{data:{required:!0,type:"object",schema:{requestId:{required:!0,type:"string"},name:{required:!0,type:"string"},metadata:{required:!1,type:"object"},timestamp:{required:!0,type:"number"}}}},targetEndpoint:"add-webpage-to-project"}),e({op:E.CLOSE_ALL_IFRAMES,bus:r.POST_MESSAGE,allowedSenderTiers:[t.CDN_POSTMESSAGE],schema:{},targetEndpoint:"add-webpage-to-project"}),e({op:E.RESET_DIRECT_VERB_CTA,bus:r.RUNTIME_MESSAGE,allowedSenderTiers:[t.SERVICE_WORKER],schema:{},targetEndpoint:["google-docs-content-script","wikipedia-content-script"]}),e({op:E.UPDATE_DIRECT_VERB_PROGRESS,bus:r.RUNTIME_MESSAGE,allowedSenderTiers:[t.SERVICE_WORKER],schema:{progress:{required:!0,type:"number"}},targetEndpoint:["google-docs-content-script","wikipedia-content-script"]}),e({op:E.DETECT_EXTENSION,bus:r.EXTERNAL_MESSAGE,allowedSenderTiers:[t.CONTENT_SCRIPT],schema:{type:{required:!0,type:"string"}},targetEndpoint:"externalClients"}),e({op:E.KEEP_ALIVE,bus:r.RUNTIME_CONNECT,allowedSenderTiers:[t.EXTENSION_PAGE_EMBEDDED_IN_FOREIGN_TAB],schema:{},targetEndpoint:"sidepanel-port"}),e({op:E.CREATE_IFRAME_TO_LOAD_AJS_WORKER,bus:r.RUNTIME_MESSAGE,allowedSenderTiers:[t.SERVICE_WORKER],schema:{target:{required:!0,type:"string"},rrvEnabled:{required:!0,type:"boolean"},env:{required:!0,type:"string"},anonUserUUID:{required:!0,type:"string"}},targetEndpoint:"offscreen"});