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
const abortController=new AbortController,lruMessagesData=new Map,lruFeedPostData=new Map,DEFAULT_MAX_LRU_SIZE=6e3,lruGet=(e,t)=>{const s=e.get(t);return s?(e.delete(t),e.set(t,s),s):null},lruSet=(e,t,s,a)=>{if(e.has(t))e.delete(t);else if(e.size>=a){const t=e.keys().next().value;e.delete(t)}e.set(t,s)},state={config:{},linkedinResponseListenerAdded:!1,getLRUMessageData:e=>lruGet(lruMessagesData,e),setLRUMessageData(e,t){const s=this.config?.maxLRUSizeForMessageData||6e3;lruSet(lruMessagesData,e,t,s)},getLRUFeedPostData:e=>lruGet(lruFeedPostData,e),setLRUFeedPostData(e,t){const s=this.config?.maxLRUSizeForFeedPostData||6e3;lruSet(lruFeedPostData,e,t,s)},getFileUrlForChatMessage(e,t,s){const a=this.getLRUMessageData(e);if(!a)return null;const r=a.attachments[t];if(!r?.length)return null;for(const e of r)if(!s.includes(e))return s.push(e),e;return null},getFileUrlForFeed(e){const t=this.getLRUFeedPostData(e)?.url;return t||null},get eventControllerSignal(){return abortController.signal},disconnectEventListeners(){abortController?.abort()}};export default state;