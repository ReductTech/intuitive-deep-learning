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
function injectBannerInFrame(e){"use strict";const n=e.showToast?"50px":"100px",t=e.showToast?"450px":"100%";let o=document.getElementById("__acrobatBanner__");o?"none"===o.style.display&&"visible"===e.frame_visibility&&(o.style.display="block"):(o=document.createElement("iframe"),o.id="__acrobatBanner__",o.style.cssText=`\n            border: 0;\n            z-index: 2147483647;\n            position: fixed;\n            bottom: ${e.showToast?"25px":"0px"};\n            width: ${t};\n            height: ${n};\n            display: ${"hidden"===e.frame_visibility?"none":"block"};\n            margin: auto;\n            background: transparent;\n            color-scheme: auto;\n        `,e.showToast&&(o.style.right="calc(50% - 200px)",o.style.borderRadius="4px"),o.src=chrome.runtime.getURL(e.showToast?"browser/js/successToast.html":"browser/js/download-banner.html"),document.documentElement.appendChild(o))}void 0!==chrome.runtime&&chrome.runtime.onMessage.addListener(e=>{if("dismissBanner"===e.content_op){delete e.content_op;let n=document.getElementById("__acrobatBanner__");if(n)return n.remove(),void(n=null)}"load-downloadBanner"===e.panel_op&&injectBannerInFrame(e)});