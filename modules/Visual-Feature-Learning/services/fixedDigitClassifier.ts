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

const SERVICE_URL = `${(import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431').replace(/\/$/, '')}/lenet5/fixed-kernel-train`;

export async function trainFixedDigitClassifier(kernels: KernelId[], input: AbortSignal | number[][]): Promise<TrainResult> {
  const signal = input instanceof AbortSignal ? input : new AbortController().signal;
  const order: KernelId[] = ['edge', 'vertical', 'horizontal', 'corner'];
  const canonical = order.filter(id => kernels.includes(id));
  async function request(url: string, body?: object) {
    const response = await fetch(url, { method: body ? 'POST' : 'GET', signal,
      headers: { 'Content-Type': 'application/json', 'X-Course-ID': '80396753-7fc8-4f55-9188-bddbdb828169' },
      body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || payload.detail || '训练服务返回失败。');
    return payload.result;
  }
  let job = await request(SERVICE_URL, { kernels: canonical, seed: Math.floor(Math.random() * 5), async: true });
  const deadline = Date.now() + 10 * 60 * 1000;
  while (job.status !== 'complete') {
    if (job.status === 'error') throw new Error(job.error || '训练失败');
    if (!job.job_id || Date.now() > deadline) throw new Error('训练等待超时或缺少任务标识');
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 500);
      if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
    });
    job = await request(SERVICE_URL + '-status?job_id=' + encodeURIComponent(job.job_id));
  }
  const trained = job.result as TrainResult;
  if (!trained?.classifier || trained.classifier.bias.length !== 10 || !Number.isFinite(trained.val_accuracy)) throw new Error('训练结果缺少分类器或验证指标。');
  return trained;
}
