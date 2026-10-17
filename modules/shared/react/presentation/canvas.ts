import { useLayoutEffect, useState, type RefObject } from 'react';

export const SCENE_WIDTH = 1600;
export const SCENE_HEIGHT = 900;

/** Shared fixed-canvas fitting for the player and authoring workspaces. */
export function useSceneScale(viewportRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      if (document.fullscreenElement === viewport) return;
      const style = window.getComputedStyle(viewport);
      const width = viewport.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      const height = viewport.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
      if (!width || !height) return;
      const fit = parseFloat(style.getPropertyValue('--sd-stage-fit')) || 1;
      setScale(Math.min(1, width / SCENE_WIDTH, height / SCENE_HEIGHT) * fit);
    };
    update();
    const observer = new ResizeObserver(update); observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewportRef]);
  return scale;
}
