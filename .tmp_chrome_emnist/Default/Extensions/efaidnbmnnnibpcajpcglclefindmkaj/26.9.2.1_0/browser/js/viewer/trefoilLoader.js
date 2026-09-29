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
function e(){const e=document.getElementById("acrobat-trefoil-loader");if(e){const t=document.createElement("img");t.src=chrome.runtime.getURL("/browser/images/acrobat_trefoil_96.svg"),t.style.width="80px",t.style.height="80px",e.appendChild(t)}}window.hideLoader=function(){const e=document.querySelector(".loader-container");e&&!e.classList.contains("hidden")&&(e.classList.add("hidden"),setTimeout(()=>e.remove(),300))},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e):e();