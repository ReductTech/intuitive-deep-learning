import {loadRecord} from './precomputedRecord';
// Legacy IDs remain type-compatible with the archived original page; requests use the four active kernels below.
export type KernelId = 'edge' | 'vertical' | 'horizontal' | 'corner' | 'diag_down' | 'diag_up' | 'center';

export interface Classifier {
  weights: number[][];
  bias: number[];
  mean: number[];
  std: number[];
  kernels: KernelId[];
}

export interface TrainResult {
  train_accuracy: number;
  val_accuracy: number;
  train_count: number;
  val_count: number;
  classifier: Classifier;
}

export async function trainFixedDigitClassifier(kernels: KernelId[], input: AbortSignal | number[][]): Promise<TrainResult> {
 const signal=input instanceof AbortSignal?input:new AbortController().signal;
 const order:KernelId[]=['edge','vertical','horizontal','corner'];
 const result=await loadRecord<TrainResult>('lenet5.fixed-kernel-train',{kernels:order.filter(id=>kernels.includes(id)),seed:0},signal);
 if(!result?.classifier||result.classifier.bias.length!==10||!Number.isFinite(result.val_accuracy))throw new Error('演示缓存缺少分类器或验证指标。');
 return result;
}
