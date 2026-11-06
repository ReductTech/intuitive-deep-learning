import { moduleAssetUrl } from '../../../shared/react';

/** The copied lessons use their own asset snapshot inside the current module. */
export const creatorGuideAssetUrl=(_sourceModuleId:string,path:string)=>
 moduleAssetUrl('b8d86e85-2150-47e3-9e1a-aa7cc7cce15c',`creator-guide-copy/${path}`);
