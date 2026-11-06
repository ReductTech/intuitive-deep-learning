interface Bounds { left: number; top: number; width: number; height: number; }
export interface PictureTravel { x: number; y: number; scale: number; }

// Convert screen coordinates back to the slide's logical pixels, including PPT zoom.
export function pictureTravel(source?: Bounds, destination?: Bounds, logicalWidth = 0): PictureTravel {
  if (!source || !destination || source.width <= 0 || destination.width <= 0 || logicalWidth <= 0) return { x: 0, y: 0, scale: 1 };
  const zoom = destination.width / logicalWidth;
  return {
    x: (source.left + source.width / 2 - destination.left - destination.width / 2) / zoom,
    y: (source.top + source.height / 2 - destination.top - destination.height / 2) / zoom,
    scale: source.width / destination.width,
  };
}

// Reveal the actual signed-difference visualization, not a blend or a fake edge filter.
export function drawResidualReveal(context: CanvasRenderingContext2D, target: ImageData, residual: ImageData, progress: number) {
  const columns = Math.round(target.width * Math.max(0, Math.min(1, progress)));
  context.putImageData(target, 0, 0);
  if (columns > 0) context.putImageData(residual, 0, 0, 0, 0, columns, target.height);
  return columns;
}
