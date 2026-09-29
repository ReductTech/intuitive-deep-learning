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
export const BROWSER_STUDENT_DETECTION_FLAG="dc-cv-browser-student-detection";export const REFERRAL_STUDENT_DETECTION_FLAG="dc-cv-referral-student-detection";export const CONTENT_SIGNAL_RULES_OTE_FEATURE="content-signal-rules";export const CONTENT_SIGNAL_RULES_CACHE_KEY="cvCsRl";export const BROWSER_STUDENT_STATE_KEY="cvEngSt";export const ENGAGEMENT_STATE_TAG_FIELD="tg";export const ENGAGEMENT_STATE_IDENTIFIED_AT_FIELD="idTs";export const ENGAGEMENT_STATE_RETENTION_EXPIRES_FIELD="rtEx";export const ENGAGEMENT_STATE_EVENT_SENT_FIELD="evSn";export const ENGAGEMENT_STATE_CONFIG_VERSION_FIELD="cfgV";export const ENGAGEMENT_STATE_ROLLING_WINDOW_FIELD="rw";export const BROWSER_STUDENT_IS_ENTERPRISE_FIELD="vEn";export const ENGAGEMENT_STATE_MECHANISM_FIELD="mech";export const ENGAGEMENT_STATE_REFERRAL_TIER_A_COUNT_FIELD="rfTierACt";export const ENGAGEMENT_STATE_REFERRAL_TIER_B_COUNT_FIELD="rfTierBCt";export const ENGAGEMENT_STATE_REFERRAL_TIER_A_WINDOW_FIELD="rfTierAW";export const ENGAGEMENT_STATE_REFERRAL_TIER_B_WINDOW_FIELD="rfTierBW";export const STUDY_SPACE_EXPERIENCE_ENABLED_KEY="cvXpEn";export const STUDY_SPACE_EXPERIENCE_PREFERENCE_SET_KEY="cvXpPs";export const LEARNER_TAG="learner";export const NON_LEARNER_TAG="non_learner";export const STUDENT_IDENTIFIED_EVENT="DCBrowserExt:Student:Identified";export const STUDENT_STATUS_UPDATED_EVENT="DCBrowserExt:Student:Status:Updated";export const STUDENT_STATUS_PROP_KEY="browserStudentStatus";export const SITE_SIGNAL_VISITED_LOG_MESSAGE="Site Signal Visited";export const SITE_SIGNAL_ANALYTICS_FLAG="dc-cv-site-signal-analytics";export const STUDENT_IDENTIFICATION_MECHANISM_BROWSER="browser";export const STUDENT_IDENTIFICATION_MECHANISM_REFERRAL="referral";export const STUDENT_IDENTIFIED_EVENT_CONTEXT_BROWSER="browser";export const STUDENT_IDENTIFIED_EVENT_CONTEXT_REFERRAL_TIER_A="referral:tierA";export const STUDENT_IDENTIFIED_EVENT_CONTEXT_REFERRAL_TIER_B="referral:tierB";export const DEFAULT_STUDENT_DETECTION_CONFIG={learnerRetentionDays:365};export const DEFAULT_CLASSIFICATION_RULES={uniqueDomainThreshold:5,activeDayThreshold:4,engagementSpanDays:5,windowDays:28};export const DEFAULT_REFERRAL_TIER_WINDOW_DAYS=28;export const DEFAULT_REFERRAL_TIER_A_THRESHOLD=2;export const DEFAULT_REFERRAL_TIER_B_THRESHOLD=3;