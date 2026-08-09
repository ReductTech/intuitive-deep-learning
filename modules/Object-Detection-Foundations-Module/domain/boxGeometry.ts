export interface DetectionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ScoredDetection extends DetectionBox {
  id: string;
  score: number;
  label: string;
}

export function boxArea(box: DetectionBox) {
  return Math.max(0, box.x2 - box.x1) * Math.max(0, box.y2 - box.y1);
}

export function intersectionBox(a: DetectionBox, b: DetectionBox): DetectionBox {
  return {
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
    x2: Math.min(a.x2, b.x2),
    y2: Math.min(a.y2, b.y2),
  };
}

export function intersectionArea(a: DetectionBox, b: DetectionBox) {
  return boxArea(intersectionBox(a, b));
}

export function boxIou(a: DetectionBox, b: DetectionBox) {
  const intersection = intersectionArea(a, b);
  const union = boxArea(a) + boxArea(b) - intersection;
  return union <= 0 ? 0 : intersection / union;
}

export function nonMaximumSuppression(detections: ScoredDetection[], threshold: number) {
  const pending = [...detections].sort((a, b) => b.score - a.score);
  const kept: ScoredDetection[] = [];

  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) break;
    kept.push(current);
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const candidate = pending[index];
      if (candidate.label === current.label && boxIou(current, candidate) > threshold) {
        pending.splice(index, 1);
      }
    }
  }

  return kept;
}
