import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { moduleJson } from "@shuku/course-runtime/react/moduleJson";
export const atlasIndex = moduleJson<Record<string, AtlasRegion>>('image-atlases/index.json');

export type AtlasRegion = {sheet:string;x:number;y:number;width:number;height:number;sheetWidth:number;sheetHeight:number};
let regions: Map<string, AtlasRegion> | undefined;
export const atlasRegion = (src:string) => {
 if(!regions)regions=new Map(Object.entries(atlasIndex.read()).map(([path, region]) => [moduleAssetUrl(path),region]));
 return regions.get(src);
};
export const atlasSheetUrl = (region:AtlasRegion) => moduleAssetUrl(region.sheet);
const sheets = new Map<string,Promise<HTMLImageElement>>();
const crops = new Map<string,Promise<string>>();
/** Canvas/WebGL consumers receive the exact original-size pixels, without another HTTP request. */
export function atlasCropUrl(src:string):Promise<string> {
 return atlasIndex.load().then(() => cropFromAtlas(src));
}
function cropFromAtlas(src:string):Promise<string> {
 const region=atlasRegion(src);if(!region)return Promise.resolve(src);
 const cached=crops.get(src);if(cached)return cached;
 const url=atlasSheetUrl(region);
 let sheet=sheets.get(url);
 if(!sheet){sheet=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`Image atlas unavailable: ${url}`));im.src=url;});sheets.set(url,sheet);sheet.catch(()=>sheets.delete(url));}
 const crop=sheet.then(im=>{const canvas=document.createElement('canvas');canvas.width=region.width;canvas.height=region.height;const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');context.drawImage(im,region.x,region.y,region.width,region.height,0,0,region.width,region.height);return canvas.toDataURL('image/png');});
 crops.set(src,crop);crop.catch(()=>crops.delete(src));return crop;
}
