import type { CSSProperties } from 'react';
import { withAssetResources } from "@shuku/course-style/react/withAssetResources";
import { atlasRegion, atlasSheetUrl, atlasIndex } from '../services/imageAtlas';
type Props={src:string;alt:string;className?:string;style?:CSSProperties;onError?:()=>void};
/** SVG viewBox crops a shared sheet without resampling the source pixels. */
function AtlasImageContent({src,alt,className='',style,onError}:Props){
 const region=atlasRegion(src);
 if(!region)return <img shuku-edit-id="e-01a2d548-e4ac-483c-9a70-f06488b6aa26" src={src} alt={alt} className={className} style={style} onError={onError}/>;
 return <svg shuku-edit-id="e-3b66b7e4-ac1d-47c2-b797-695d0a8d42c2" data-ppt-viewport="按图集区域裁切当前特征图" role="img" aria-label={alt} className={`vfl-atlas-image ${className}`} viewBox={`${region.x} ${region.y} ${region.width} ${region.height}`} preserveAspectRatio="xMidYMid meet" style={{aspectRatio:`${region.width}/${region.height}`,overflow:'hidden',...style}}>
  <image shuku-edit-id="e-e99d1c2a-c1f3-4f64-b588-6a9b7b11baaa" href={atlasSheetUrl(region)} x="0" y="0" width={region.sheetWidth} height={region.sheetHeight} onError={onError}/>
 </svg>;
}

export const AtlasImage = withAssetResources(AtlasImageContent, [atlasIndex]);
