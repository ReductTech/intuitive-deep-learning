import { moduleAssetUrl } from '../shared/react/assets';
import paths from './assets/manifest.json';
const available = new Set(paths);

export function courseAssetUrl(relativePath: string): string {
  if (!available.has(relativePath)) throw new Error(`Unknown course asset: ${relativePath}`);
  return moduleAssetUrl("ce19337d-405b-47ff-92a9-9890127b5365", relativePath);
}
