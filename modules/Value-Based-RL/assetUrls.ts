import { moduleAssetUrl } from '../shared/react/assets';

/** Stored in repository-root assets under this course's stable UUID. */
export function valueBasedRlAssetUrl(relativePath: string): string {
  return moduleAssetUrl('aa380af5-efee-42a1-8896-16032f9331ea', relativePath);
}
