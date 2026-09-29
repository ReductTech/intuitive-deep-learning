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
import{DEFAULT_CLASSIFICATION_RULES as e,DEFAULT_STUDENT_DETECTION_CONFIG as t,LEARNER_TAG as n,NON_LEARNER_TAG as i,ENGAGEMENT_STATE_TAG_FIELD as a,ENGAGEMENT_STATE_IDENTIFIED_AT_FIELD as r,ENGAGEMENT_STATE_EVENT_SENT_FIELD as s,ENGAGEMENT_STATE_ROLLING_WINDOW_FIELD as o}from"./constants.js";import{EngagementWindowStore as u}from"./EngagementWindowStore.js";export class StudentClassifier{static daySpanInclusive(e,t){const n=new Date(`${e}T00:00:00.000Z`),i=new Date(`${t}T00:00:00.000Z`);if(Number.isNaN(n.getTime())||Number.isNaN(i.getTime()))return 0;const a=i.getTime()-n.getTime();return Math.floor(a/864e5)+1}static classify(a,r={},s=t){const c=r.uniqueDomainThreshold??e.uniqueDomainThreshold,g=r.activeDayThreshold??e.activeDayThreshold,m=r.engagementSpanDays??e.engagementSpanDays,l=s.learnerRetentionDays??t.learnerRetentionDays;if(StudentClassifier.isWithinLearnerRetention(a,l))return{isLearner:!0,uniqueDomainCount:0,activeDayCount:0,engagementSpanDays:0,tag:n,retained:!0};const D=new Set,h=[],f=a[o],d=u.normalizeRollingWindow(f);Object.entries(d).forEach(([e,t])=>{t?.length&&(h.push(e),t.forEach(e=>D.add(e)))}),h.sort();const p=h[0],y=h[h.length-1],T=p&&y?StudentClassifier.daySpanInclusive(p,y):0,S=D.size>=c,C=h.length>=g,N=S&&C&&T>=m;return{isLearner:N,uniqueDomainCount:D.size,activeDayCount:h.length,engagementSpanDays:T,tag:N?n:i}}static isWithinLearnerRetention(e,t){if(!e?.[r])return!1;if(!(e[a]===n||!0===e[s]))return!1;const i=new Date(e[r]);if(Number.isNaN(i.getTime()))return!1;const o=new Date(i);return o.setUTCDate(o.getUTCDate()+t),new Date<=o}static retentionExpiresAt(e,t){if(StudentClassifier.isWithinLearnerRetention(e,t))return u.computeRetentionExpiresAt(e[r],t)}}