/** Only the dedicated Vite development preview runs without business services. */
export const isPublicPreview = import.meta.env.MODE === 'public-preview';
export const isLocalPreview = isPublicPreview || (import.meta.env.DEV && import.meta.env.MODE === 'preview');
