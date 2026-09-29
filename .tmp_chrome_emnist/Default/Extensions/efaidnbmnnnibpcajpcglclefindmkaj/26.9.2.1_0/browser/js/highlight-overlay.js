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
import{createEl as t,appendChild as i,setStyles as e}from"../../common/dom-utils.js";export default class n{constructor(){this.overlay=null,this.innerRectangle=null,this.originalBoundingBox=null,this.animationInterval=null,this.highlightedSections=[]}create(n,o=[]){this.remove(),this.originalBoundingBox=n,this.highlightedSections=o,this.overlay=t("div",{class:"highlight-overlay-component",css:{position:"absolute",top:n.top+"px",left:n.left+"px",width:n.width+"px",height:n.height+"px",pointerEvents:"none",opacity:0,zIndex:1}}),this.innerRectangle=t("div",{class:"highlight-inner-rectangle"}),this.overlay.appendChild(this.innerRectangle),i(document.body,this.overlay),requestAnimationFrame(()=>{e(this.overlay,{opacity:1})}),this.startPaddingAnimation()}startPaddingAnimation(){let t=0;this.animationInterval=setInterval(()=>{if(!this.overlay||!this.originalBoundingBox)return;const i=t/120,n=1-(Math.cos(i*Math.PI*2)+1)/2,o=0+4*n,h=38+4*n,r=n,l=this.interpolateColor({r:21,g:122,b:243},{r:137,g:188,b:249},r),a=this.interpolateColor({r:134,g:186,b:249},{r:208,g:229,b:253},r);e(this.overlay,{top:this.originalBoundingBox.top-o+"px",left:this.originalBoundingBox.left-h+"px",width:this.originalBoundingBox.width+2*h+"px",height:this.originalBoundingBox.height+2*o+"px",borderColor:`rgba(${l.r}, ${l.g}, ${l.b}, 1)`}),this.innerRectangle&&e(this.innerRectangle,{borderColor:`rgba(${a.r}, ${a.g}, ${a.b}, 1)`}),t=(t+1)%120},1e3/60)}interpolateColor(t,i,e){return{r:Math.round(t.r+(i.r-t.r)*e),g:Math.round(t.g+(i.g-t.g)*e),b:Math.round(t.b+(i.b-t.b)*e)}}setupHoverDetection(e){this.detectionArea=t("div",{class:"highlight-detection-area",css:{position:"absolute",top:e.top+"px",left:e.left+"px",width:e.width+"px",height:e.height+"px",backgroundColor:"transparent",pointerEvents:"none",zIndex:1}}),i(document.body,this.detectionArea)}fadeOutAndRemove(){this.overlay?(e(this.overlay,{opacity:0}),setTimeout(()=>this.remove(),300)):this.remove()}checkAndRemoveIfHighlightedSettingChanged(t){if(!this.overlay||0===this.highlightedSections.length)return;const i=t instanceof Element?t:null;for(const t of this.highlightedSections)if(i?.closest(`.${t}`))return void this.fadeOutAndRemove()}remove(){this.overlay&&(this.overlay.remove(),this.overlay=null),this.innerRectangle&&(this.innerRectangle=null),this.animationInterval&&(clearInterval(this.animationInterval),this.animationInterval=null),this.originalBoundingBox=null,this.highlightedSections=[]}}