export const MANUAL_FEATURE_EPOCHS = 10;
const courseId = '80396753-7fc8-4f55-9188-bddbdb828169';
const base = (import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431').replace(/\/$/, '');
const endpoint = '/visual-feature-learning/manual-feature-train';

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

interface ManualJob {
  job_id?: string; status: 'queued' | 'running' | 'complete' | 'error';
  history?: ManualEpoch[]; result?: ManualTrainingResult; error?: string; cached?: boolean;
}
async function request(path: string, signal: AbortSignal, body?: object): Promise<ManualJob> {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET', signal,
    headers: { 'Content-Type': 'application/json', 'X-Course-ID': courseId },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || data.detail || '训练服务暂不可用，请重试。');
  return data.result;
}
function delay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 500);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
}
export async function trainManualClassifier(seed: number, signal: AbortSignal, progress: (record: ManualEpoch) => void) {
  let job = await request(endpoint, signal, { seed, async: true });
  const deadline = Date.now() + 10 * 60 * 1000;
  while (job.status !== 'complete') {
    const last = job.history?.at(-1);
    if (last) progress(last);
    if (job.status === 'error') throw new Error(job.error || '训练失败，请重试。');
    if (!job.job_id) throw new Error('训练服务未返回任务标识。');
    if (Date.now() > deadline) throw new Error('训练等待超时，请重试。');
    await delay(signal);
    job = await request(endpoint + '-status?job_id=' + encodeURIComponent(job.job_id), signal);
  }
  if (!job.result?.classifier || job.result.epochs !== MANUAL_FEATURE_EPOCHS || !Number.isFinite(job.result.val_accuracy)) {
    throw new Error('训练结果缺少权重或指标。');
  }
  latestClassifier = job.result;
  classifierListeners.forEach(listener => listener(job.result!));
  return { result: job.result, cached: job.cached === true };
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
