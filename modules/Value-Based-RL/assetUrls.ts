import { moduleAssetUrl } from '../shared/react/assets';

/** Published from this module's assets directory by the Vite configuration. */
export function valueBasedRlAssetUrl(relativePath: string): string {
  return moduleAssetUrl('value-based-rl', relativePath);
}
