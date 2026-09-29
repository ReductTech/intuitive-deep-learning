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
const lruChatLoadedData=new Map,DEFAULT_MAX_LRU_SIZE=1e3,abortController=new AbortController,responseFteAbortController=new AbortController,chatFteAbortController=new AbortController,state={config:{},geminiAPIResponseInterceptorAdded:!1,shouldAddResponseFteListener:!0,currentHoveredResponseMoreMenuContainer:null,getLRUData(e){if(!lruChatLoadedData.has(e))return null;const t=lruChatLoadedData.get(e);return lruChatLoadedData.delete(e),lruChatLoadedData.set(e,t),t},setLRUData(e,t){const a=state.config?.maxLRUSizeForChatLoadedData||1e3;if(lruChatLoadedData.has(e))lruChatLoadedData.delete(e);else if(lruChatLoadedData.size===a){const e=lruChatLoadedData.keys().next().value;lruChatLoadedData.delete(e)}lruChatLoadedData.set(e,t)},get eventControllerSignal(){return abortController.signal},get responseFteSignal(){return responseFteAbortController.signal},get chatFteSignal(){return chatFteAbortController.signal},disconnectResponseFteListeners(){responseFteAbortController.abort()},disconnectChatFteListeners(){chatFteAbortController.abort()},disconnectEventListeners(){abortController?.abort()}};export default state;