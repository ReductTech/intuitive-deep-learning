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
import{useState,useEffect}from"react";export const usePillsPositioning=(t,e,n)=>{const[o,r]=useState(!1);return useEffect(()=>{if(t&&n.current){const t=n.current.getBoundingClientRect(),o=(e?56:24)+72+32,s=t.top;r(s<o+20)}},[t,e,n]),o};