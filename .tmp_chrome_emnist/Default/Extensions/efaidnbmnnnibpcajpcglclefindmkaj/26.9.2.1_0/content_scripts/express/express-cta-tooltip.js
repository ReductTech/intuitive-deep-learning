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
class ExpressCTATooltip{constructor(t){this.surface=t.surface,this.tooltipTextKey=t.tooltipTextKey||"expressDropdownMenuTooltip",this.tooltip=this.createTooltip(),this.mouseOver=!1,this.position=t.tooltipPosition||"bottom",this.button=t.button}createTooltip(){const t=document.createElement("div");t.className=`cc440d50ba-tooltiptext ${this.surface}`;const o=util.getTranslation(this.tooltipTextKey);return t.innerHTML=o,t}hideTooltip(){this.tooltip.style.visibility="hidden",this.tooltip.remove(),window.removeEventListener("scroll",this.hideTooltip.bind(this))}showTooltip(){this.tooltip.style.visibility="visible",document.body.appendChild(this.tooltip),window.addEventListener("scroll",this.hideTooltip.bind(this))}positionTooltip(t){switch(this.position){case"top":this.tooltip.style.top=t.top+window.scrollY-7+"px",this.tooltip.style.left=t.left+this.button.offsetWidth/2+window.scrollX+"px",this.tooltip.style.transform="translate(-50%, -100%)",this.tooltip.classList.add("cc440d50ba-tooltiptext-top");break;case"bottom":this.tooltip.style.top=t.top+this.button.offsetHeight+7+window.scrollY+"px",this.tooltip.style.left=t.left+this.button.offsetWidth/2+window.scrollX+"px",this.tooltip.style.transform="translate(-50%, 0%)",this.tooltip.classList.add("cc440d50ba-tooltiptext-bottom");break;case"left":this.tooltip.style.top=t.top+this.button.offsetHeight/2+window.scrollY+"px",this.tooltip.style.left=t.left+window.scrollX-7+"px",this.tooltip.style.transform="translate(-100%, -50%)",this.tooltip.classList.add("cc440d50ba-tooltiptext-left");break;case"right":this.tooltip.style.top=t.top+this.button.offsetHeight/2+window.scrollY+"px",this.tooltip.style.left=t.left+this.button.offsetWidth+7+window.scrollX+"px",this.tooltip.style.transform="translate(0%, -50%)",this.tooltip.classList.add("cc440d50ba-tooltiptext-right")}}attachTooltipToButton(t,o){const i=()=>{this.mouseOver=!0,setTimeout(()=>{const t=this.button.getBoundingClientRect();this.positionTooltip(t);document.getElementById("express-contextual-fte")||this.mouseOver&&!o()&&this.showTooltip()},t?t():400)},s=()=>{this.mouseOver=!1,setTimeout(()=>{this.hideTooltip()},100)};this.button.addEventListener("mouseenter",i),this.button.addEventListener("mouseleave",s),this.button.addEventListener("focusin",i),this.button.addEventListener("focusout",s)}addTooltipToDOM(t,o=()=>!1){this.attachTooltipToButton(t,o)}}export default ExpressCTATooltip;