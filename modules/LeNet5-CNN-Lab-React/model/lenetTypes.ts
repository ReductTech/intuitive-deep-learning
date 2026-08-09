export type Matrix = number[][];

export type FixedKernelId =
  | 'edge'
  | 'vertical'
  | 'horizontal'
  | 'diag_down'
  | 'diag_up'
  | 'center';

export interface FixedKernelDefinition {
  id: FixedKernelId;
  name: string;
  values: Matrix;
}

export interface LenetDatasetDescription {
  images: string;
  labels: string;
  count: number;
  class_count?: number;
  reject_label?: number;
  feature_map: string;
  [key: string]: unknown;
}

export interface FixedKernelSample {
  index: number;
  label: number;
  prediction: number;
  probs: number[] | null;
  image: Matrix;
  feature_maps: Partial<Record<FixedKernelId, Matrix>>;
  feature_map: Matrix;
  feature_max: number;
}

export interface LenetClassifier {
  /** One row per flattened feature, one column per output class. */
  weights: number[][];
  bias: number[];
  mean: number[];
  std: number[];
  kernels: FixedKernelId[];
  class_count: number;
  reject_label: number;
}

export interface TrainingHistoryPoint {
  epoch: number;
  loss: number;
  train_accuracy: number;
  val_accuracy: number;
}

export interface FixedKernelResult {
  dataset: LenetDatasetDescription;
  kernels: FixedKernelDefinition[];
  samples: FixedKernelSample[];
  durationMs: number;
  train_count?: number;
  val_count?: number;
  train_accuracy?: number;
  val_accuracy?: number;
  history?: TrainingHistoryPoint[];
  classifier?: LenetClassifier;
}

export interface LenetClassifierSession {
  signature: string;
  selectedKernels: FixedKernelId[];
  classifier: LenetClassifier;
  trainAccuracy: number;
  valAccuracy: number;
  trainedAt: number;
}

export interface FixedKernelPreviewRequest {
  kernels: FixedKernelId[];
  sampleIndex?: number;
  image?: Matrix;
  signal?: AbortSignal;
}

export interface FixedKernelTrainRequest {
  kernels: FixedKernelId[];
  trainRatio?: number;
  image?: Matrix;
  signal?: AbortSignal;
}

export interface FixedKernelActivityState {
  version: 1;
  selectedKernels: FixedKernelId[];
  activeKernel: FixedKernelId;
  previewSampleIndex: number;
  sampleIndex: number;
  handwritingMode: boolean;
  customImage: Matrix;
  userHasWritten: boolean;
  classifierSession: LenetClassifierSession | null;
}

export interface SequenceDigitBox {
  digit: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SequenceSample {
  digits: string;
  image: Matrix;
  width: number;
  height: number;
  boxes: SequenceDigitBox[];
  spacing: number;
  margin: number;
  seed: number | null;
  sampleSalts: number[];
  durationMs: number;
}
