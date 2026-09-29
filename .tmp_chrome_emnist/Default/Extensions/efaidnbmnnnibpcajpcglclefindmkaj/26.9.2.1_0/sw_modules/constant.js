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
export const CACHE_PURGE_SCHEME={EAGER:"EAGER",LAZY:"LAZY",NO_CALL:"NO_CALL"};export const ADOBE_INTERNAL="dc-cv-adobe-internal";export const EDGE_USER_STATE={free:"signinstate_free",subscribed:"signinstate_subscribed",pending:"signinstate_pending"};export const JUMP_URL_STATUS={FREEZE_YOLO:"freezeYolo",ERROR:"error",SUCCESS:"success"};export const ADOBE_YOLO_ERROR_CODES={1:"signedOut",2:"staleUser",3:"sanityFailure",4:"timedOut",5:"jumpFailed",101:"jumpNotGenerated",102:"guidNotGenerated",103:"acrobatConnectionFailed"};export const ACROBAT_USER_STATE={free:"Free"};export const DECLARATIVE_IMS_REFERER_HEADER=11;export const EVAR_KEYS={eVar1:"extension.version",eVar4:"shim",eVar31:"viewer.enable.source",eVar41:"viewer.visitor.id",evar60:"install.type",evar153:"env",eVar233:"mv3.mimehandler"};export const LOGGING_URI={"local-dev":"https://dc-api-dev.adobe.io",dev:"https://dc-api-dev.adobe.io",test:"https://dc-api-dev.adobe.io",stage:"https://dc-api-stage.adobe.io",prod:"https://dc-api.adobe.io"};export const COI_HEADERS="coiHeaders";export const EXPRESS={CONTEXT_MENU_INTERACTION_DONE:"expressContextMenuInteractionDone",EXPRESS_SESSIONS:"expressSessions",TOU_ACCEPTED:"expressTouAccepted",REFERRER:"acrobat-reader-chrome",PERF_METRIC_LOG_MESSAGE:"Express asset loaded time",SESSIONS_WHERE_MODAL_LOADING:"expressSessionsWhereModalLoading",VERBS:{EDIT_IMAGE:"editImage",REMOVE_BACKGROUND_IMAGE:"removeBackgroundImage",CROP_IMAGE:"cropImage",EFFECTS_IMAGE:"effectsImage",INSERT_OBJECT:"insertObjectImage",REMOVE_OBJECT:"removeObjectImage"},RESPONSE_STATUS:{SUCCESS:"success",FAILED:"failed"},EXTERNAL_MESSAGING_ERROR_CODES:{INVALID_REQUEST:"INVALID_REQUEST",IMAGE_FETCH_FAILED:"IMAGE_FETCH_FAILED"},SUPPORTED_TYPES:["image/jpeg","image/png","image/webp","image/svg+xml","image/gif","image/bmp","image/avif"]};export const EXPRESS_CONTEXT_MENU_ENABLED_VERBS=[EXPRESS.VERBS.EDIT_IMAGE,EXPRESS.VERBS.REMOVE_BACKGROUND_IMAGE,EXPRESS.VERBS.CROP_IMAGE];export const EXPERIMENT_VARIANTS_STORAGE_KEY="experiment-variants";export const MIME_COHORT_SHORT_CODES={master:"m",reserved:"r",chromeMimeHandler:"cmh",chromeNonMimeHandler:"cnmh",pending:"p"};export const STORAGE_KEYS={KW_FTE_COMPLETED:"kwFTECompleted"};