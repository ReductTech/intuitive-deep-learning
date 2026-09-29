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
import{dcLocalStorage as e}from"./local-storage.js";import{STUDY_SPACE_ADD_WEBPAGE_ELIGIBLE_KEY as t}from"./constant.js";import{BROWSER_STUDENT_STATE_KEY as n,STUDY_SPACE_EXPERIENCE_ENABLED_KEY as r,STUDY_SPACE_EXPERIENCE_PREFERENCE_SET_KEY as c,LEARNER_TAG as i,ENGAGEMENT_STATE_TAG_FIELD as a}from"../sw_modules/student-detection/constants.js";export async function isStudySpaceExperienceDetected(){await e.init();const r="true"===e.getItem(t),c=function(e){if(!e)return null;try{return"string"==typeof e?JSON.parse(e):e}catch{return null}}(e.getItem(n)),u=c?.[a];return u===i||r}export async function getStudySpaceExperienceDefault(){return isStudySpaceExperienceDetected()}export async function getStudySpaceExperienceFromPreference(){return await e.init(),"true"!==e.getItem(c)?null:"true"===e.getItem(r)}export async function resolveStudySpaceExperienceEnabled(){const e=await getStudySpaceExperienceFromPreference();return null!==e?e:isStudySpaceExperienceDetected()}export async function markStudySpaceExperiencePreferenceSet(){await e.init(),await e.setItem(c,"true")}export async function syncStudySpaceExperiencePreferenceFromDetection(){if(await e.init(),"true"===e.getItem(c))return;await isStudySpaceExperienceDetected()?await e.setItem(r,"true"):await e.removeItem(r)}