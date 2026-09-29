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
import state from"./state.js";import{getParsedJSON}from"../utils/util.js";const parseMessageAndUpdateState=(e,t,n)=>{let s=state?.getLRUMessageData(e);s||(s={attachments:{}}),(t=t.trim())&&n&&(s.attachments[t]||(s.attachments[t]=[]),s.attachments[t].push(n)),state?.setLRUMessageData(e,s)},parseLinkedinChatMessagesResponse=e=>{const t=getParsedJSON(e),n=t?.data?.messengerMessagesBySyncToken?.elements||t?.data?.messengerMessagesByConversation?.elements||t?.data?.messengerMessagesByAnchorTimestamp?.elements||[];for(const e of n){const t=e?.entityUrn;if(!t)continue;const n=e?.renderContent||[];for(const e of n){const n=e?.file;"application/pdf"===n?.mediaType&&n?.url&&n?.name&&parseMessageAndUpdateState(t,n.name,n.url)}}},parseLinkedinFeedPostResponse=e=>{const t=getParsedJSON(e),n=t?.asset;if(!n)return;const s=t?.transcribedDocumentUrl;if(!s?.includes("document-pdf-analyzed"))return;const a=n.substring(n.lastIndexOf(":")+1);a&&(state?.getLRUFeedPostData(a)||state?.setLRUFeedPostData(a,{url:s}))},handleLinkedinDataEvent=(e,t,n)=>{t(e?.detail?.responseData),n()},addDeferredLinkedinEventListener=(e,t)=>{document.addEventListener(e,e=>{setTimeout(()=>t(e),0)},{signal:state?.eventControllerSignal})},addLinkedinDataEventListener=(e,t)=>{"linkedin-feed-post-data"===e?addDeferredLinkedinEventListener(e,e=>{handleLinkedinDataEvent(e,parseLinkedinFeedPostResponse,t)}):"linkedin-chat-messages-data"===e&&addDeferredLinkedinEventListener(e,e=>{handleLinkedinDataEvent(e,parseLinkedinChatMessagesResponse,t)})},LINKEDIN_INJECT_CONFIG_KEY="linkedinAcrobatInjectConfig",injectResponseListenerScript=()=>{if(state?.linkedinResponseListenerAdded)return;const e=!0===state?.config?.enableLinkedinPDFTouchPoint,t=!0===state?.config?.enableLinkedinChatPDFTouchPoint;if(!e&&!t)return;try{sessionStorage.setItem(LINKEDIN_INJECT_CONFIG_KEY,JSON.stringify({feedEnabled:e,chatEnabled:t}))}catch(e){return void(state.linkedinResponseListenerAdded=!1)}const n=document.createElement("script");n.setAttribute("id","linkedin-acrobat-response-interceptor"),n.src=chrome.runtime.getURL("content_scripts/linkedin/linkedin-inject.js"),(document.head||document.documentElement).appendChild(n),state.linkedinResponseListenerAdded=!0};export{injectResponseListenerScript,addLinkedinDataEventListener};