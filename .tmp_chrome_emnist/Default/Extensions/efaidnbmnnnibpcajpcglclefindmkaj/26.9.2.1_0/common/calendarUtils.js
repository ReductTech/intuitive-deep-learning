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
const e=864e5,t=6048e5,r=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"numeric",day:"numeric"}),n=e=>{const t=r.formatToParts(new Date(e)),n={};return t.forEach(({type:e,value:t})=>{n[e]=parseInt(t,10)}),n},a=e=>n(e).year,o=e=>n(e).month-1,m=e=>n(e).day,u=e=>{const{year:t,month:r,day:a}=n(e);return new Date(Date.UTC(t,r-1,a)).getUTCDay()},c=(e,t)=>a(t)-a(e)||o(t)-o(e),i=(r,n)=>{if(n-r>t)return 1;if(r-n>t)return-1;if(n-r===0)return 0;const a=u(r),o=u(n);return o===a?n-r<e?0:n-r:(n-r)*(o-a)>0?0:n-r},s=(e,t)=>c(e,t)||m(t)-m(e);export{c as compareCalendarMonth,i as compareCalendarWeek,s as compareCalendarDay};