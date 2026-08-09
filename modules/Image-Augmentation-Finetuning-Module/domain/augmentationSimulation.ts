export type SemanticStatus = 'safe' | 'warning' | 'broken';

export interface AugmentationMetrics {
  strength: number;
  trainAccuracy: number;
  validationAccuracy: number;
  gap: number;
  semanticStatus: SemanticStatus;
}

export function getAugmentationMetrics(rawStrength: number): AugmentationMetrics {
  const strength = Math.max(0, Math.min(100, Math.round(rawStrength)));
  const trainAccuracy = 99 - strength * 0.1;
  const validationAccuracy = 74 + strength * 0.65 - strength * strength * 0.007;
  const semanticStatus: SemanticStatus = strength <= 65 ? 'safe' : strength <= 82 ? 'warning' : 'broken';

  return {
    strength,
    trainAccuracy: Number(trainAccuracy.toFixed(1)),
    validationAccuracy: Number(Math.max(55, validationAccuracy).toFixed(1)),
    gap: Number(Math.abs(trainAccuracy - validationAccuracy).toFixed(1)),
    semanticStatus,
  };
}

export function metricPolyline(metric: 'trainAccuracy' | 'validationAccuracy') {
  return Array.from({ length: 11 }, (_, index) => {
    const metrics = getAugmentationMetrics(index * 10);
    const x = 14 + index * 27.2;
    const y = 116 - (metrics[metric] - 50) * 1.72;
    return `${x.toFixed(1)},${Math.max(12, Math.min(116, y)).toFixed(1)}`;
  }).join(' ');
}
