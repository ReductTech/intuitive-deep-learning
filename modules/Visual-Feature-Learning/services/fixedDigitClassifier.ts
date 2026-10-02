export type KernelId = 'edge' | 'vertical' | 'horizontal' | 'diag_down' | 'diag_up' | 'center';

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

const SERVICE_URL = `${(import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431').replace(/\/$/, '')}/lenet5/fixed-kernel-train`;

export async function trainFixedDigitClassifier(kernels: KernelId[], image: number[][]): Promise<TrainResult> {
  const response = await fetch(SERVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kernels, train_ratio: 0.9, image }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || '训练服务返回失败。');
  const trained = payload.result as TrainResult;
  if (!trained.classifier || !Number.isFinite(trained.val_accuracy)) throw new Error('训练结果缺少分类器或验证指标。');
  return trained;
}
