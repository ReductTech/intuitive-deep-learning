import index from '../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/image-atlases/index.json';
import { moduleAssetUrl } from '../../shared/react';
export type AtlasRegion = {sheet:string;x:number;y:number;width:number;height:number;sheetWidth:number;sheetHeight:number};
const regions = new Map(Object.entries(index).map(([path, region]) => [moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',path),region as AtlasRegion]));
export const atlasRegion = (src:string) => regions.get(src);
export const atlasSheetUrl = (region:AtlasRegion) => moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',region.sheet);
const sheets = new Map<string,Promise<HTMLImageElement>>();
const crops = new Map<string,Promise<string>>();
/** Canvas/WebGL consumers receive the exact original-size pixels, without another HTTP request. */
export function atlasCropUrl(src:string):Promise<string> {
 const region=atlasRegion(src);if(!region)return Promise.resolve(src);
 const cached=crops.get(src);if(cached)return cached;
 const url=atlasSheetUrl(region);
 let sheet=sheets.get(url);
 if(!sheet){sheet=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`Image atlas unavailable: ${url}`));im.src=url;});sheets.set(url,sheet);sheet.catch(()=>sheets.delete(url));}
 const crop=sheet.then(im=>{const canvas=document.createElement('canvas');canvas.width=region.width;canvas.height=region.height;const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');context.drawImage(im,region.x,region.y,region.width,region.height,0,0,region.width,region.height);return canvas.toDataURL('image/png');});
 crops.set(src,crop);crop.catch(()=>crops.delete(src));return crop;
}
