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
const abortController=new AbortController,state={config:{},expressConfig:{},gdriveImplicitDefaultViewershipConfig:{},addOnStatus:{},userId:0,selectedView:"",driveUrlPath:"",prevDriveUrlPath:"",adobeCleanFontAdded:!1,pageLoaded:!1,eventListenerAdded:!1,fteToolTip:{},acrobatIconPath:"",searchFileList:[],createStateTransferObject(){return{config:this.config,userId:this.userId,addOnStatus:this.addOnStatus,selectedView:this.selectedView,pageLoaded:this.pageLoaded,fteToolTip:this.fteToolTip,isAcrobatDefaultForGDrivePDFs:this.isAcrobatDefaultForGDrivePDFs}},updateStateFromTransferObject(e){this.config=e?.config,this.userId=e?.userId,this.addOnStatus=e?.addOnStatus,this.selectedView=e?.selectedView,this.pageLoaded=e?.pageLoaded,this.fteToolTip=e?.fteToolTip,this.isAcrobatDefaultForGDrivePDFs=e?.isAcrobatDefaultForGDrivePDFs},get eventControllerSignal(){return abortController.signal},disconnectEventListeners(){abortController?.abort()},imageState:{nativeViewerTouchpointVisible:!1,imageURL:null,mimeType:null,fileName:null,fileId:null,tooltip:null},isAcrobatDefaultForGDrivePDFs:!1,implicitToastShownInSession:!1};export default state;