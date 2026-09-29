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
import{dcLocalStorage as C}from"../common/local-storage.js";import{removeExperimentCodeForAnalytics as e}from"../common/experimentUtils.js";import{floodgate as r}from"./floodgate.js";import{cleanupOldPdfRenderingTrackingStorage as t}from"../common/pdf-rendering-tracking.js";const i=["DCBrowserExt:OneNote:Visited","DCBrowserExt:DocsGoogle:Visited:Document","DCBrowserExt:DocsGoogle:Visited:Spreadsheet","DCBrowserExt:DocsGoogle:Visited:Presentation","DCBrowserExt:Gdrive:Image:Opened","DCBrowserExt:Gmail:Image","DCBrowserExt:Gmail:ImageAttachment:Opened","gmail-pdf-default-viewership-session-count","gdrive-pdf-default-viewership-session-count","DCBrowserExt:ChatGPT:DownloadAsPdf:Clicked","DCBrowserExt:GDrive:TripleDotMenuClicked","DCBrowserExt:GDrive:TopFileBarMenuClicked:SingleSelect","DCBrowserExt:GDrive:TopFileBarMenuClicked:MultiSelect","DCBrowserExt:GDrive:RightClickMenuClicked:SingleSelect","DCBrowserExt:GDrive:RightClickMenuClicked:MultiSelect","AiMarkerRanking","AiMarkerVariant","aiMarkers"],o=["GDCT","GDCC","GDIF","GDTT","GDTF","GDCF","OT","OTC","EMP","LI","LIC","LC","LCC","LFP","LFF","LFC","GIT","GIC","GIDN","GDIN","GDIT","GDIC","GSH","GSHC","GST","GSC","GCO","GCOC","CRT","CRI","CRC","CCT","CCTC","CDR","CDRC","GMPC","GMP1","GMP2","GCI","GCIC","GCIW","GCIWC","GCEP","GCEPC","GEP","GEPC","GMC","GMCC","GCP","GCPC","CCPC","CCP1","CCP2","SPH","ASCT","ASC1","ASC2","EGW","EGMS","LFS","CLP","CLP1","CLP2","LSC","LSC1","LSC2","LSC3","GPT","GPTC","EGC","EGCC","GCC","GCD","GCS","GCE","GCEC","EFM","EFMC","DCE","DCEC","DCEP","DCEPC","DCIW","DCIWC","EAI","EAIC","EDE","EDEC","EDR","EDRC","EDC","EDCC","GRP","GRPC","DCI","DCIC"],G=async()=>{((C=[])=>{Array.isArray(C)&&0!==C.length&&C.forEach(C=>{e(C)})})(o),(async()=>{try{const e=C.getAllItems(),t=[];Object.keys(e).forEach(e=>{const i=e.match(/^DCBrowserExt:([^:]+):Visited$/);if(i&&i.length>1){const o=`dc-cv-${i[1].toLowerCase()}-analytics-visited`;t.push((async()=>{await r.hasFlag(o)||await C.removeItem(e)})())}}),await Promise.all(t)}catch(C){}})(),t(),((e=[])=>{Array.isArray(e)&&0!==e.length&&e.forEach(e=>{C.getItem(e)&&C.removeItem(e)})})(i)};export{G as clearEventsFromLocalStorage};