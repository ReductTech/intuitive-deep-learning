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
import{useEffect,useState}from"react";export const useTranslation=()=>{const[e,t]=useState({});return useEffect(()=>{const e={};["tooltipTextEnabled","tooltipTextDisabled","tooltipTextSubText","hideForNow","hideFabForDomain","neverDisplayFab","preferences","fabPillsHeaderText","fabPillsFteHeaderText","fabHomeTooltipFteText","fabPillSummarize","fabPillAskAI","fabPillConvertToPDF","askAIAssistantSelectedContent","summarizeWebpageSelectedContent","studentToolsTouchpointFabFlashcards","studentToolsTouchpointFabQuiz","studentToolsTouchpointFabStudyGuide","studentToolsTouchpointFabMindmap","studentToolsTouchpointFabNotes","explainSelectedContent","fabNudgeLabelArticleAbout","fabNudgeLabelPageAbout","fabNudgeLabelKeyTakeaways","fabNudgeLabelMainThemes","fabNudgeLabelSimplify","fabNudgeLabelKeyTerms","fabNudgeLabelKeyFigures"].forEach(t=>{e[t]=chrome.i18n.getMessage(t)||t}),t(e)},[]),t=>e[t]||t};