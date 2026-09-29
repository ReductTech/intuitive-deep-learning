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
import SummarizeIcon from"./icons/SDC_AISummary_18_N.svg";import ChatIcon from"./icons/SDC_AIChat_18_N.svg";import PDFIcon from"./icons/SDC_PDF_18_N.svg";import{openQnAPanel,openSummarizeWebpage,convertWebpageToPDF,SELECTION_INTENTS}from"./utils/fabUtils";export const PILLS_CONFIG=[{id:"summarize",labelKey:"fabPillSummarize",icon:SummarizeIcon,onClick:openSummarizeWebpage,isGenAIPill:!0},{id:"ask-ai",labelKey:"fabPillAskAI",icon:ChatIcon,onClick:()=>openQnAPanel("FABPill:AskAI"),isGenAIPill:!0},{id:"convert-pdf",labelKey:"fabPillConvertToPDF",icon:PDFIcon,onClick:convertWebpageToPDF,featureFlag:"enableHtmlToPdfPill"},{id:"selection-summarize",labelKey:"summarizeWebpageSelectedContent",icon:SummarizeIcon,intent:SELECTION_INTENTS.SUMMARIZE,featureFlag:"enableFabTextSelection",isGenAIPill:!0},{id:"selection-explain",labelKey:"explainSelectedContent",icon:ChatIcon,intent:SELECTION_INTENTS.EXPLAIN,featureFlag:"enableFabTextSelection",isGenAIPill:!0},{id:"selection-ask",labelKey:"askAIAssistantSelectedContent",icon:ChatIcon,intent:SELECTION_INTENTS.ASK,featureFlag:"enableFabTextSelection",isGenAIPill:!0}];