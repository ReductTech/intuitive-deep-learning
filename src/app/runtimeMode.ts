/** Only the dedicated Vite development preview runs without business services. */
export const isLocalPreview = import.meta.env.DEV && import.meta.env.MODE === 'preview';
