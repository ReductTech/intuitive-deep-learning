import { moduleAssetUrl } from '../shared/react/assets';
import paths from './assets/manifest.json';
const available = new Set(paths);

export function courseAssetUrl(relativePath: string): string {
  if (!available.has(relativePath)) throw new Error(`Unknown course asset: ${relativePath}`);
  return moduleAssetUrl("0fd05cd8-c7f8-496b-88e1-441930abb5d5", relativePath);
}
