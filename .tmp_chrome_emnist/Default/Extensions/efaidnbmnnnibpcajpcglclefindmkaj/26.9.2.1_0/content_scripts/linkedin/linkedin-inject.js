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
!function(){const e="linkedinAcrobatInjectConfig";let n={feedEnabled:!1,chatEnabled:!1};try{const t=sessionStorage.getItem(e);t&&(n=JSON.parse(t))}finally{sessionStorage.removeItem(e)}const t=!0===n.feedEnabled,a=!0===n.chatEnabled;!function(){const e=window.fetch;window.fetch=function(...n){return e.apply(this,n).then(e=>(Promise.resolve().then(()=>{let n=null;try{const o=new URL(e.url);a&&"www.linkedin.com"===o.hostname&&o.pathname.includes("/voyager/api/voyagerMessagingGraphQL/graphql")&&decodeURIComponent(o.search).includes("urn:li:msg_conversation")?n="linkedin-chat-messages-data":t&&o.pathname.includes("feedshare-document-master-manifest")&&(n="linkedin-feed-post-data")}catch(e){}if(n)try{e.clone().text().then(e=>{document.dispatchEvent(new CustomEvent(n,{detail:{responseData:e}}))}).catch(()=>{})}catch(e){}}),e)).catch(e=>{throw e})}}()}();