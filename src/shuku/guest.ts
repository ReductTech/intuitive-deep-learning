// This flag controls the browsing UI only; it is never an authentication token.
import {isLocalPreview} from '../app/runtimeMode';
const key='shuku:guest';
let memory=false;
export function isGuestMode(){try{return sessionStorage.getItem(key)==='1'||memory;}catch{return memory;}}
export function setGuestMode(value:boolean){memory=value;try{if(value)sessionStorage.setItem(key,'1');else sessionStorage.removeItem(key);}catch{/* Browsing still works without storage. */}}
export function requestSignIn(){if(isLocalPreview){location.assign('http://localhost:5175'+location.pathname+location.search);return;}setGuestMode(false);window.dispatchEvent(new Event('shuku-login-requested'));}
