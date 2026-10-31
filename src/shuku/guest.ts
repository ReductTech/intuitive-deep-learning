// This flag controls the browsing UI only; it is never an authentication token.
import {isLocalPreview,isPublicPreview} from '../app/runtimeMode';
// Temporary guest-by-default preview. Set false to restore mandatory login.
export const TEMPORARY_OPEN_PREVIEW = true;
const key=TEMPORARY_OPEN_PREVIEW?'shuku:guest-preview:v1':'shuku:guest';
let memory=TEMPORARY_OPEN_PREVIEW;
export function isGuestMode(){try{const saved=sessionStorage.getItem(key);return saved===null?memory:saved==='1';}catch{return memory;}}
export function setGuestMode(value:boolean){memory=value;try{if(value||TEMPORARY_OPEN_PREVIEW)sessionStorage.setItem(key,value?'1':'0');else sessionStorage.removeItem(key);}catch{/* Browsing still works without storage. */}}
export function requestSignIn(){if(isPublicPreview)return;if(isLocalPreview){const url=new URL(location.pathname+location.search,'http://localhost:5175');url.searchParams.set('login','1');location.assign(url.href);return;}setGuestMode(false);window.dispatchEvent(new Event('shuku-login-requested'));}
