import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";

/** Stored in repository-root assets under this course's stable UUID. */
export function valueBasedRlAssetUrl(relativePath: string): string {
  return moduleAssetUrl(relativePath);
}
