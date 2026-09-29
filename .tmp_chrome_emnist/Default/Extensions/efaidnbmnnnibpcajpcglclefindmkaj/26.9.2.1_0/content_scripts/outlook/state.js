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
const abortController=new AbortController,DEFAULT_MAX_LRU_SIZE_FOR_ATTACHMENTS=6e3,state={lastAttachmentURL:"",lastFileName:"",token:"",tokenHeaderName:"X-Token",downloadUrlBase:"",userEmail:"",conversationAttachmentsMap:new Map,mergeConversationAttachments(t){if(!Array.isArray(t))return;const e=this.config?.implicitDefaultViewershipConfig?.maxLRUSizeForAttachments??6e3;t.forEach(({conversationId:t,parentItemId:n,attachments:a})=>{if(!t||!n)return;const o=this.conversationAttachmentsMap.get(t)??new Map;if(this.conversationAttachmentsMap.has(t))this.conversationAttachmentsMap.delete(t);else if(this.conversationAttachmentsMap.size>=e){const t=this.conversationAttachmentsMap.keys().next().value;this.conversationAttachmentsMap.delete(t)}this.conversationAttachmentsMap.set(t,o),o.set(n,a)})},config:{},lastTabUrl:"",adobeCleanFontAdded:!1,get eventControllerSignal(){return abortController.signal},disconnectEventListeners(){abortController?.abort()},isAcrobatDefaultForOutlookPDFs:!1};export default state;