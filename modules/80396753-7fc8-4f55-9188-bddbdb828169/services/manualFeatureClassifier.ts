import {loadRecord} from './precomputedRecord';
export const MANUAL_FEATURE_EPOCHS = 10;

export interface ManualEpoch { epoch: number; loss: number; train_accuracy: number; val_accuracy: number }
export interface ManualClassifier {
  hidden_weights: number[][]; hidden_bias: number[];
  output_weights: number[][]; output_bias: number[]; areas: number[];
}
export interface ManualTrainingResult {
  seed: number; epochs: number; history: ManualEpoch[];
  train_accuracy: number; val_accuracy: number; train_count: number; val_count: number;
  classifier: ManualClassifier;
}
let latestClassifier: ManualTrainingResult | null = null;
export function getLatestManualClassifier() { return latestClassifier; }
const classifierListeners = new Set<(result: ManualTrainingResult) => void>();
export function subscribeManualClassifier(listener: (result: ManualTrainingResult) => void) {
  classifierListeners.add(listener);
  return () => { classifierListeners.delete(listener); };
}

export async function trainManualClassifier(seed: number, signal: AbortSignal, progress: (record: ManualEpoch) => void) {
 const result=await loadRecord<ManualTrainingResult>('visual-feature-learning.manual-feature-train',{seed},signal);
 if(!result?.classifier||result.epochs!==MANUAL_FEATURE_EPOCHS||!Number.isFinite(result.val_accuracy))throw new Error('演示缓存缺少权重或指标。');
 for(const row of result.history)progress(row);
 latestClassifier=result;classifierListeners.forEach(listener=>listener(result));return {result,cached:true};
}
export function predictManualDigit(counts: number[], model: ManualClassifier): number[] {
  const input = counts.map((count, i) => count / model.areas[i]);
  const hidden = model.hidden_weights.map((row, i) => Math.max(0, row.reduce((sum, w, j) => sum + w * input[j], model.hidden_bias[i])));
  const logits = model.output_weights.map((row, i) => row.reduce((sum, w, j) => sum + w * hidden[j], model.output_bias[i]));
  const max = Math.max(...logits);
  const values = logits.map(value => Math.exp(value - max));
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map(value => value / total);
}
