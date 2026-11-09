import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";

export function courseAssetUrl(relativePath: string): string {
  return moduleAssetUrl(relativePath);
}
