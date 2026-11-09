import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';


/** Keep the verification pair, triplet cards and animated points on the same identities. */
export const identityExamples = [
  { file: 'jason-statham-2018.jpg', name: '杰森·斯坦森 · 照片 1', shortName: '斯坦森 · 照片 1' },
  { file: 'jason-statham-2014.jpg', name: '杰森·斯坦森 · 照片 2', shortName: '斯坦森 · 照片 2' },
  { file: 'guo-da.jpg', name: '郭达', shortName: '郭达' },
] as const;

export const identityPhotoUrl = (file: string) => moduleAssetUrl(`open-identity/${file}`);
