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
const GENAI_WEBPAGE_BLOCKLIST=["teams.microsoft.com","documentcloud.adobe.com","acrobat.adobe.com","stage.acrobat.adobe.com","dev.acrobat.adobe.com","drive.google.com","amazon.com","github.com","mail.google.com","pinterest.com","reddit.com","twitter.com","youtube.com","app.slack.com","www.netflix.com","www.primevideo.com","www.hotstar.com","www.sonyliv.com","www.hotstar.com","www.zee5.com","www.jiocinema.com","www.mxplayer.in","tv.apple.com","www.hulu.com","www.linkedin.com","www.makemytrip.com","www.booking.com","outlook.office.com","outlook.office365.com","outlook.live.com","outlook.cloud.microsoft","www.google.com","x.com"],GENAI_WEBPAGE_REGEX_BLOCKLIST=[{pattern:"^www\\.amazon\\.[a-z.]+$",flags:"i"},{pattern:"^(?!(([a-z0-9.-]+\\.)?corp\\.adobe\\.com|experienceleague\\.adobe\\.com)$)([a-z0-9.-]+\\.)?adobe\\.com$",flags:"i"}];