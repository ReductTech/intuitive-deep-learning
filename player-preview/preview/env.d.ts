/// <reference types="vite/client" />

declare module 'virtual:preview-catalog' {
  interface Course {
    id: string; alias?: string; assetId: string; title: string;
    description?: string; badge?: string; entry?: string;
    ppt?: {entry?: string};
    pages: {id: string; title?: string; snippet?: unknown}[];
  }
  const courses: Course[];
  export default courses;
}
declare module '@preview/runtime' {
  import type {ComponentType} from 'react';
  export const SceneDeck: ComponentType<{
    catalog: {id: string; [key: string]: unknown}[];
    moduleId: string; assetId: string; progressKey: string;
    getNotes: (id: string) => {text: string; selectors: string[]}[];
  }>;
}
declare module '@preview/runtime-styles';
