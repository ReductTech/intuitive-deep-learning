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
(async()=>{const e=document.createElement("iframe");e.id="third-party-cookies-checker-cdn",e.style.display="none";const t=new URL((await chrome.storage.local.get("cdnUrl"))?.cdnUrl??"https://acrobat.adobe.com"),o=(await chrome.storage.local.get("env"))?.env??"prod",r=`${t.origin}${"local-dev"!==o?"/dc-chrome-extension":""}/extn-util.html?cdn_op=checkThirdPartyCookies`;var c;e.src=r;const n=o=>{o.origin===t.origin&&"thirdPartyCookiesChecked"===o.data.main_op&&(e.remove(),window.removeEventListener("message",n),chrome.tabs.getCurrent(e=>{chrome.tabs.sendMessage(e.id,{content_op:"thirdPartyCookiesChecked",status:o?.data?.thirdPartyCookiesBlocked})}),c&&clearTimeout(c))};window.addEventListener("message",n);document.getElementById("Adobe-dc-cookie-check").appendChild(e),c=setTimeout(()=>{try{document.getElementById("third-party-cookies-checker-cdn")&&(e?.remove?.(),window.removeEventListener("message",n),chrome.tabs.getCurrent(e=>{chrome.tabs.sendMessage(e.id,{content_op:"thirdPartyCookiesChecked",status:!1})}))}catch(e){}},1e4)})();