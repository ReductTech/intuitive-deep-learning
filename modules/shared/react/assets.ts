import assetFormats from './asset-formats.json';
const configuredAssetBase = import.meta.env.VITE_ASSET_BASE_URL?.trim();
const defaultAssetBase = import.meta.env.PROD ? 'https://image.reduct.cn/cloud-IDL/assets' : import.meta.env.BASE_URL;

/** Build a stable module asset URL shared by local development and CDN hosting. */
export function moduleAssetUrl(moduleAssetId: string, relativePath: string): string {
  relativePath = (assetFormats as Record<string,string>)[moduleAssetId+'/'+relativePath] || relativePath;
  const offline=(globalThis as {__SHUKU_OFFLINE_ASSET__?:(key:string)=>string}).__SHUKU_OFFLINE_ASSET__;
  if(offline)return offline('assets/'+moduleAssetId+'/'+relativePath);
  const assetBase = (configuredAssetBase || defaultAssetBase).replace(/\/+$/, '');
  const safeId = encodeURIComponent(moduleAssetId);
  const safePath = relativePath
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${assetBase}/${safeId}/${safePath}`;
}
