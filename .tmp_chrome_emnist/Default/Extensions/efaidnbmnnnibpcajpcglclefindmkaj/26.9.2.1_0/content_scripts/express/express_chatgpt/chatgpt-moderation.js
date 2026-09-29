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
import expressUtils from"../express-utils.js";class ChatGPTModeration{static CONNECTED_APP_STATUS_KEY="adobeAcrobatExpressConnectedAppStatus";static CONNECTED_APP_APIS_KEY="adobeAcrobatExpressConnectedAppAPIs";constructor(e={}){this.config=e.config||{},this.onConnectedAppDetected=e.onConnectedAppDetected||(()=>{})}enable=()=>{this.addApiResponseListener(),this.injectApiInterceptor()};disable=()=>{sessionStorage.getItem(this.constructor.CONNECTED_APP_APIS_KEY)&&sessionStorage.removeItem(this.constructor.CONNECTED_APP_APIS_KEY),localStorage.getItem(this.constructor.CONNECTED_APP_STATUS_KEY)&&localStorage.removeItem(this.constructor.CONNECTED_APP_STATUS_KEY)};injectApiInterceptor=()=>{const e=this.config?.config?.apis;sessionStorage.setItem(ChatGPTModeration.CONNECTED_APP_APIS_KEY,JSON.stringify(e));const t=document.createElement("script");t.src=chrome.runtime.getURL("content_scripts/express/express_chatgpt/chatgpt-inject.js"),t.onload=()=>{t.remove()},document.head?.appendChild(t)};addApiResponseListener=()=>{document.addEventListener("acrobat-chatgpt-api-response",e=>{this.handleApiResponse(e.detail)})};handleApiResponse=e=>{if(e.success)try{const t=JSON.parse(e.responseData),s=this.config?.config?.connectors;if(!t?.links||!Array.isArray(t.links)||0===t.links.length)return;if(!s||!Array.isArray(s)||0===s.length)return;const n=t.links.find(e=>"ENABLED"===e.connector_status&&(s.includes(e.connector_id)||s.includes(e.connector_name)));!!n?(this.setStatusOfConnectedApp(!0),expressUtils.sendAnalyticsEventOncePerDay("DCBrowserExt:Express:ChatGPT:ConnectedAppDetected"),this.onConnectedAppDetected()):this.setStatusOfConnectedApp(!1)}catch(e){expressUtils.sendErrorLog("Error processing ChatGPT API response",e.message||e.toString())}else expressUtils.sendErrorLog("ChatGPT API interception failed",e.error||"Unknown error")};setStatusOfConnectedApp=e=>{localStorage.setItem(this.constructor.CONNECTED_APP_STATUS_KEY,e)};getStatusOfConnectedApp=()=>localStorage.getItem(this.constructor.CONNECTED_APP_STATUS_KEY);isConnectedAppEnabled=()=>"true"===this.getStatusOfConnectedApp()}export default ChatGPTModeration;