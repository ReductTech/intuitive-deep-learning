import type { CSSProperties } from 'react';
import { withAssetResources } from '../../shared/react/withAssetResources';
import { atlasRegion, atlasSheetUrl, atlasIndex } from '../services/imageAtlas';
type Props={src:string;alt:string;className?:string;style?:CSSProperties;onError?:()=>void};
/** SVG viewBox crops a shared sheet without resampling the source pixels. */
function AtlasImageContent({src,alt,className='',style,onError}:Props){
 const region=atlasRegion(src);
 if(!region)return <img src={src} alt={alt} className={className} style={style} onError={onError}/>;
 return <svg role="img" aria-label={alt} className={`vfl-atlas-image ${className}`} viewBox={`${region.x} ${region.y} ${region.width} ${region.height}`} preserveAspectRatio="xMidYMid meet" style={{aspectRatio:`${region.width}/${region.height}`,overflow:'hidden',...style}}>
  <image href={atlasSheetUrl(region)} x="0" y="0" width={region.sheetWidth} height={region.sheetHeight} onError={onError}/>
 </svg>;
}

export const AtlasImage = withAssetResources(AtlasImageContent, [atlasIndex]);
