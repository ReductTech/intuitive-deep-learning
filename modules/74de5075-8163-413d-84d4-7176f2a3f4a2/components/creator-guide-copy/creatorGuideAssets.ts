import { moduleAssetUrl } from '../../../shared/react';

/** The copied lessons use their own asset snapshot inside the current module. */
export const creatorGuideAssetUrl=(_sourceModuleId:string,path:string)=>
 moduleAssetUrl('74de5075-8163-413d-84d4-7176f2a3f4a2',`creator-guide-copy/${path}`);
