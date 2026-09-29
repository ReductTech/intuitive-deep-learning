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
import{util as e}from"./util.js";var r=[];function t(){return Math.ceil(1e6*Math.random())}function n(){try{return this.func.apply(this.context,this.args.concat(Array.prototype.slice.call(arguments,0)))}catch(a){if(!a.handled){a.handled=!0;var n={errnum:t(),name:a.name+(a.message?" "+a.message:""),source:"client",details:""},s=2048-(JSON.stringify(n).length+128);n.details=function(r){var t,n,s=r.split(e.stackDelimiter()),a=[],o=0;for(t=0;t<s.length;t+=1)-1===(n=s[t]).indexOf("run_function")&&o<1e3&&(o+=(n=(n=(n=(n=n.replace(/chrome\-extension:\/\/[a-zA-Z]*\//g,"")).replace(/jar:file:\S*\.xpi!/,"")).replace(/resource:\S+toolkit/,"")).replace(/resource:\S+jetpack/,"")).length,a.push(n));return a.join("\n")}(a.stack).substr(0,s),e.each(r,function(e,r){r(n,40,a)}),this.context.LOG(n,40)}throw a}}export const Proxy={proxy:function(e){return n.bind({func:e,context:this,args:Array.prototype.slice.call(arguments,1)})},REST_error:function(n,s,a){var o={errnum:t(),name:n.statusText,status:n.status,details:"HTTP error"};a&&(o=e.extend(o,a)),n.responseJSON&&(o.name=n.responseJSON.error.code,o.details=n.responseJSON.error.message),e.each(r,function(e,r){r(o,40)}),s.LOG(o,40)},handlers:function(e){r.push(e)}};