type AssetContext = typeof globalThis & {
  __SHUKU_COURSE_ID__?: string;
  __SHUKU_ASSET_URLS__?: Record<string, string>;
  __SHUKU_OFFLINE_ASSET__?: (key: string) => string;
};

/** Paths are relative to the course assets directory. Published URLs are platform-owned. */
export function moduleAssetUrl(relativePath: string): string;
export function moduleAssetUrl(moduleAssetId: string, relativePath: string): string;
export function moduleAssetUrl(first: string, second?: string): string {
  const context=globalThis as AssetContext;
  const moduleId=second===undefined?context.__SHUKU_COURSE_ID__:first;
  const relative=(second===undefined?first:second).replace(/^\.\//,'');
  if(!moduleId || !/^[a-zA-Z0-9_-]+$/.test(moduleId))throw new Error('Missing course asset context');
  if(!relative || relative.includes('\\') || /[:?#]/.test(relative) || relative.startsWith('/') || relative.split('/').some(part=>!part||part==='.'||part==='..')){
    throw new Error('Use a relative path inside the course assets directory: '+relative);
  }
  const key='assets/'+moduleId+'/'+relative;
  if(context.__SHUKU_OFFLINE_ASSET__)return context.__SHUKU_OFFLINE_ASSET__(key);
  if(context.__SHUKU_ASSET_URLS__){
    const url=context.__SHUKU_ASSET_URLS__[key];
    if(!url)throw new Error('Asset absent from this published version: '+relative);
    return url;
  }
  const base=(import.meta.env.VITE_ASSET_BASE_URL||import.meta.env.BASE_URL||'./').replace(/\/+$/,'');
  return base+'/'+encodeURIComponent(moduleId)+'/'+relative.split('/').map(encodeURIComponent).join('/');
}
