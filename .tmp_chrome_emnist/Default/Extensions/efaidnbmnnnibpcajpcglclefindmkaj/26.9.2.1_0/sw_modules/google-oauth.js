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
import{loggingApi as e}from"../common/loggingApi.js";import{dcLocalStorage as t}from"../common/local-storage.js";function n(e,t,n,o,r){const c=new URLSearchParams({client_id:e,redirect_uri:t,response_type:"token id_token",scope:n,nonce:crypto.randomUUID()});return o&&c.set("prompt",o),r&&c.set("login_hint",r),`https://accounts.google.com/o/oauth2/v2/auth?${c}`}function o(e,t){return new Promise((n,o)=>{chrome.identity.launchWebAuthFlow({url:e,interactive:t},e=>{chrome.runtime.lastError?o(new Error(chrome.runtime.lastError.message)):e?n(e):o(new Error("No response URL from OAuth flow"))})})}async function r(n,o,r,c){const{accessToken:s,idToken:i,expiresIn:a}=function(e){try{const t=new URL(e).hash.substring(1),n=new URLSearchParams(t);return{accessToken:n.get("access_token"),idToken:n.get("id_token"),expiresIn:parseInt(n.get("expires_in"),10)||null}}catch(e){return{accessToken:null,idToken:null,expiresIn:null}}}(n);if(!s)return null;const l=(i?function(t){try{const e=t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),{email:n}=JSON.parse(atob(e));return{email:n}}catch(t){return e.error({message:"Google OAuth: Failed to decode id_token"}),{}}}(i).email:null)||c;if(!l)throw new Error("Could not determine account email from OAuth response");return await async function(e,n,o,r,c){await t.setItem(e,{...n,[o]:{access_token:r,expires_at:Date.now()+1e3*(c||3600)}})}(o,r,l,s,a),s}export async function clearGoogleAccessToken(e,n){if(!n)return;const o=t.getItem(e)||{};o[n]&&(delete o[n],await t.setItem(e,o))}export async function getGoogleAccessToken(c,s,i,a=null,l=!1){if(!c)throw new Error("clientId not provided");const u=chrome.identity.getRedirectURL(),m=t.getItem(i)||{},p=a?m[a]:null;if(!l&&p?.access_token&&Date.now()<p.expires_at-3e5)return p.access_token;if(!l&&p?.access_token)try{const e=n(c,u,s,"none",a),t=await o(e,!1),l=await r(t,i,m,a);if(l)return l}catch(t){e.error({message:"Google OAuth: Silent token refresh failed"})}const h=n(c,u,s,"select_account",a),g=await o(h,!0),f=await r(g,i,m,a);if(!f)throw new Error("No access_token in OAuth response");return f}