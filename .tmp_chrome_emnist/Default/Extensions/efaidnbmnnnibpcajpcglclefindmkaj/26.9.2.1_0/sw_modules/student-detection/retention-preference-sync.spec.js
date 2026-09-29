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
import{StudentStateManager as e}from"./StudentStateManager.js";import{QualifyingListLoader as t}from"./QualifyingListLoader.js";import{BROWSER_STUDENT_STATE_KEY as o,DEFAULT_CLASSIFICATION_RULES as s,ENGAGEMENT_STATE_TAG_FIELD as n,ENGAGEMENT_STATE_IDENTIFIED_AT_FIELD as a,ENGAGEMENT_STATE_EVENT_SENT_FIELD as l,ENGAGEMENT_STATE_ROLLING_WINDOW_FIELD as r,STUDY_SPACE_EXPERIENCE_ENABLED_KEY as c}from"./constants.js";import{dcLocalStorage as i}from"../../common/local-storage.js";jest.mock("../../common/local-storage.js",()=>({dcLocalStorage:{init:jest.fn().mockResolvedValue(void 0),getItem:jest.fn(),setItem:jest.fn(),removeItem:jest.fn()}})),jest.mock("../../common/analytics.js",()=>({analytics:{addUserTags:jest.fn(),removeUserTags:jest.fn(),getStoredUserTags:jest.fn(()=>["learner"]),event:jest.fn()}})),jest.mock("../add-webpage-to-project.js",()=>({refreshAddWebpageContextMenusForAllTabs:jest.fn().mockResolvedValue(void 0)})),jest.mock("../floodgate.js",()=>({floodgate:{hasFlag:jest.fn().mockResolvedValue(!0),getFeatureMeta:jest.fn().mockReturnValue(null)}})),jest.mock("./StudentDetectionConfig.js",()=>({getStudentDetectionConfig:jest.fn().mockResolvedValue({learnerRetentionDays:365,classificationRules:{uniqueDomainThreshold:5,activeDayThreshold:4,engagementSpanDays:5,windowDays:28}}),applyFloodgateClassificationRules:jest.requireActual("./StudentDetectionConfig.js").applyFloodgateClassificationRules})),describe("StudentStateManager retention preference sync",()=>{const m={};beforeEach(()=>{jest.clearAllMocks(),Object.keys(m).forEach(e=>delete m[e]),i.getItem.mockImplementation(e=>m[e]??null),i.setItem.mockImplementation(async(e,t)=>{m[e]=t}),i.removeItem.mockImplementation(async e=>{delete m[e]})}),it("clears cvXpEn after retention expiry re-classifies to non_learner",async()=>{const m=new Date;m.setUTCDate(m.getUTCDate()-366);const d={[n]:"learner",[a]:m.toISOString(),[l]:!0,[r]:{}},f={getState:jest.fn().mockResolvedValue(d),saveState:jest.fn().mockImplementation(async e=>{await i.setItem(o,JSON.stringify(e))})};jest.spyOn(t.prototype,"load").mockResolvedValue({version:"1.0.0",rules:s,entries:[]});const j=new e(f);await j.expireRetentionIfNeeded(),expect(i.removeItem).toHaveBeenCalledWith(c)})});