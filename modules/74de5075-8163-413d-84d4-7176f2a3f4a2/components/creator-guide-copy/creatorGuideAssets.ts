import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';


/** The copied lessons use their own asset snapshot inside the current module. */
export const creatorGuideAssetUrl=(_sourceModuleId:string,path:string)=>
 moduleAssetUrl(`creator-guide-copy/${path}`);
