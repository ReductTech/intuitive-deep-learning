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
const TOOLTIP_CLASS="acrobat-touch-point-tooltip",DEFAULT_GAP_PX=8,DEFAULT_DELAY_MS=400,DEFAULT_HIDE_DELAY_MS=100,VIEWPORT_MARGIN_PX=8;class AcrobatTouchpointTooltip{constructor({button:t,text:i,position:o="bottom",tooltipClass:s=TOOLTIP_CLASS,gapPx:e=8,signal:h}={}){this.button=t,this.text=i,this.position=o,this.tooltipClass=s,this.gapPx=e,this.signal=h,this.tooltip=null,this.visible=!1,this.hideOnScroll=this.hideOnScroll.bind(this)}addTooltipToDOM(t=400,i=()=>!1,o=100){if(!this.button)return;const s={signal:this.signal},e=()=>{clearTimeout(this.hideTimer),this.pendingShow=!0,setTimeout(()=>{this.pendingShow&&!i()&&this.showTooltip()},t)},h=()=>{this.pendingShow=!1,this.hideTimer=setTimeout(()=>this.hideTooltip(),o)};this.button.addEventListener("mouseenter",e,s),this.button.addEventListener("mouseleave",h,s),this.button.addEventListener("focusin",e,s),this.button.addEventListener("focusout",h,s)}showTooltip(){!this.visible&&this.text&&(this.tooltip=document.createElement("span"),this.tooltip.className=this.tooltipClass,this.tooltip.textContent=this.text,this.tooltip.classList.add(`${TOOLTIP_CLASS}-${this.position}`),this.tooltip.style.position="fixed",this.tooltip.style.visibility="hidden",document.body.appendChild(this.tooltip),this.positionTooltip(this.button.getBoundingClientRect()),this.tooltip.style.visibility="visible",this.visible=!0,document.addEventListener("scroll",this.hideOnScroll,{capture:!0,signal:this.signal}))}hideTooltip(){this.tooltip&&(document.removeEventListener("scroll",this.hideOnScroll,{capture:!0}),this.tooltip.remove(),this.tooltip=null,this.visible=!1)}hideOnScroll(){this.hideTooltip()}positionTooltip(t){if(!this.tooltip)return;const i=this.tooltip.getBoundingClientRect(),o=document.documentElement.clientWidth,s=document.documentElement.clientHeight;let e,h;switch(this.position){case"top":e=t.top-i.height-this.gapPx,h=t.left+(t.width-i.width)/2;break;case"left":e=t.top+(t.height-i.height)/2,h=t.left-i.width-this.gapPx;break;case"right":e=t.top+(t.height-i.height)/2,h=t.right+this.gapPx;break;default:e=t.bottom+this.gapPx,h=t.left+(t.width-i.width)/2}h=Math.max(8,Math.min(h,o-i.width-8)),e=Math.max(8,Math.min(e,s-i.height-8)),"bottom"===this.position&&(e=Math.max(e,t.bottom)),"top"===this.position&&(e=Math.min(e,t.top-i.height)),"right"===this.position&&(h=Math.max(h,t.right)),"left"===this.position&&(h=Math.min(h,t.left-i.width)),this.tooltip.style.top=`${e}px`,this.tooltip.style.left=`${h}px`}}export default AcrobatTouchpointTooltip;