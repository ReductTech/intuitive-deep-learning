const configuredAssetBase = import.meta.env.VITE_ASSET_BASE_URL?.trim();
const defaultAssetBase = import.meta.env.BASE_URL;

/** Build a stable module asset URL shared by local development and CDN hosting. */
export function moduleAssetUrl(moduleAssetId: string, relativePath: string): string {
  const assetBase = (configuredAssetBase || defaultAssetBase).replace(/\/+$/, '');
  const safeId = encodeURIComponent(moduleAssetId);
  const safePath = relativePath
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${assetBase}/${safeId}/${safePath}`;
}
