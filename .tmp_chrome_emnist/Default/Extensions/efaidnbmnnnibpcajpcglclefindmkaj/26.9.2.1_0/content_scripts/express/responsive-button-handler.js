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
class ResponsiveButtonHandler{constructor(t,e={}){this.button=t,this.buttonClass=e.buttonClass,this.smallScreenThreshold=e.smallScreenThreshold??1e3,this.widthSource=void 0!==e.widthSource?e.widthSource:null,this.compactClass=e.compactClass??null,this.minSpaceToShow=e.minSpaceToShow??null,this.hiddenClass=e.hiddenClass??null,this.resizeHandler=null}getButtonElement(){return this.button?.getElementsByClassName(this.buttonClass)[0]||null}getCompareWidth(){if("function"==typeof this.widthSource){const t=this.getButtonElement();return t?this.widthSource(t):window.innerWidth}return"number"==typeof this.widthSource?this.widthSource:window.innerWidth}toggleButtonSize(t){const e=this.getButtonElement();e&&this.compactClass&&e.classList.toggle(this.compactClass,t)}updateButtonStyles(){const t=this.getButtonElement();if(!t)return;this.hiddenClass&&this.button.classList.remove(this.hiddenClass),t.style.visibility="hidden",this.toggleButtonSize(!1);const e=t.offsetWidth,s=this.getCompareWidth();if(null!=this.minSpaceToShow&&this.hiddenClass){if(s<this.minSpaceToShow)return this.button.classList.add(this.hiddenClass),this.toggleButtonSize(!1),void(t.style.visibility="visible");this.button.classList.remove(this.hiddenClass)}const i=s-e<this.smallScreenThreshold;this.toggleButtonSize(i),t.style.visibility="visible"}handleResponsiveButton(){if(!this.button)return!1;return!!this.getButtonElement()&&(this.updateButtonStyles(),this.resizeHandler=()=>this.updateButtonStyles(),window.addEventListener("resize",this.resizeHandler),!0)}cleanup(){this.resizeHandler&&(window.removeEventListener("resize",this.resizeHandler),this.resizeHandler=null)}}export default ResponsiveButtonHandler;