import { recyclingDataset } from './recyclingDataset';
const base = (import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431').replace(/\/$/, '');
export interface HeadEpoch {
  epoch: number; train_loss: number; val_loss: number; train_correct: number; val_correct: number;
  probabilities: number[][];
}
export interface HeadTrainingResult {
  run_id: string; seed: number; epochs: number; best_epoch: number; history: HeadEpoch[];
  train_count: number; val_count: number; test_count: number; classes: string[];
  validation_samples: { id: string; label: number }[]; duration_ms: number; dataset_revision: string;
  session_id?: string;
  audit: { backbone_frozen: boolean; batchnorm_frozen: boolean; backbone_max_change: number;
    head_max_change: number; trainable_parameters: number; feature_cache_hit: boolean };
}
export interface HeadTestResult {
  run_id: string; count: number; correct: number;
  samples: { id: string; label: number; prediction: number; probabilities: number[] }[];
}
export interface TrainingProgress { progress?: number; message?: string; history?: HeadEpoch[]; }
export interface BackboneSession { session_id: string; dataset_revision: string; old_classes: number; feature_dimensions: number; backbone_frozen: boolean; }
export interface NewHeadSession extends BackboneSession { new_classes: number; head_parameters: number; initial_probabilities: number[][]; }
function prediction(probabilities: number[]) { return probabilities.indexOf(Math.max(...probabilities)); }
function validProbabilities(probabilities: number[]) {
  return Array.isArray(probabilities) && probabilities.length === 3
    && probabilities.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
    && Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 1) < 1e-5;
}
interface Job extends TrainingProgress {
  id: string; status: 'queued' | 'running' | 'complete' | 'error' | 'cancelled'; error?: string;
  result?: { ok: boolean; result?: unknown };
}
async function request(path: string, signal: AbortSignal, body?: object): Promise<Job> {
  let response: Response;
  try {
    response = await fetch(base + path, { signal, method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('真实训练服务暂时无法连接，请启动本地视觉计算服务后重试。');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.error || '训练服务返回失败。');
  if (!['queued', 'running', 'complete', 'error', 'cancelled'].includes(data.status) || typeof data.id !== 'string') {
    throw new Error('训练服务返回了无效任务状态。');
  }
  return data;
}
function delay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 300);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
}
async function run(endpoint: string, payload: object, signal: AbortSignal, onProgress?: (job: TrainingProgress) => void) {
  let job = await request('/v1/jobs', signal, { endpoint, payload });
  const deadline = Date.now() + 180000;
  while (true) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (job.history) onProgress?.(job);
    else onProgress?.({ progress: job.progress, message: job.message });
    if (job.status === 'complete') {
      if (!job.result?.ok || !job.result.result) throw new Error('训练任务缺少真实计算结果。');
      return job.result.result;
    }
    if (job.status === 'error' || job.status === 'cancelled') throw new Error(job.error || '计算已中止，请重试。');
    if (Date.now() > deadline) throw new Error('训练等待超时，请重试。');
    await delay(signal);
    job = await request('/v1/jobs/' + encodeURIComponent(job.id), signal);
  }
}
export async function loadRecyclingBackbone(signal: AbortSignal, progress: (job: TrainingProgress) => void) {
  const dataset = await recyclingDataset.load();
  signal.throwIfAborted();
  const result = await run('/resnet/recycling/load-backbone', {}, signal, progress) as BackboneSession;
  if (!/^[0-9a-f]{32}$/.test(result.session_id) || result.dataset_revision !== dataset.revision
    || result.old_classes !== 1000 || result.feature_dimensions !== 512 || result.backbone_frozen !== true) throw new Error('预训练权重装入结果无法校验。');
  return result;
}
export async function replaceRecyclingHead(sessionId: string, seed: number, signal: AbortSignal) {
  const dataset = await recyclingDataset.load();
  signal.throwIfAborted();
  const result = await run('/resnet/recycling/replace-head', { session_id: sessionId, seed }, signal) as NewHeadSession;
  if (result.session_id !== sessionId || result.dataset_revision !== dataset.revision || result.new_classes !== 3 || result.head_parameters !== 1539
    || result.initial_probabilities?.length !== dataset.split_counts.validation
    || result.initial_probabilities.some(p => !validProbabilities(p))) throw new Error('新分类头的初始参数无法校验。');
  return result;
}
export async function trainRecyclingHead(sessionId: string, signal: AbortSignal, progress: (job: TrainingProgress) => void) {
  const dataset = await recyclingDataset.load();
  signal.throwIfAborted();
  const result = await run('/resnet/recycling/train-head', { session_id: sessionId }, signal, progress) as HeadTrainingResult;
  const expected = dataset.samples.filter(p => p.split === 'validation');
  if (!/^[0-9a-f]{32}$/.test(result.run_id) || result.epochs !== 20 || result.history?.length !== 21
    || result.session_id !== sessionId || result.train_count !== dataset.split_counts.train || result.val_count !== dataset.split_counts.validation || result.test_count !== dataset.split_counts.test
    || !result.audit?.backbone_frozen || !result.audit.batchnorm_frozen || result.audit.backbone_max_change !== 0
    || !(result.audit.head_max_change > 0) || result.dataset_revision !== dataset.revision || result.validation_samples?.length !== expected.length
    || result.validation_samples.some((p, i) => p.id !== expected[i].id || p.label !== expected[i].label)
    || !Number.isInteger(result.best_epoch) || result.best_epoch < 1 || result.best_epoch > 20
    || result.history.some((row, i) => row.epoch !== i || !Number.isFinite(row.train_loss) || !Number.isFinite(row.val_loss)
      || !Number.isInteger(row.train_correct) || row.train_correct < 0 || row.train_correct > result.train_count
      || !Number.isInteger(row.val_correct) || row.val_correct < 0 || row.val_correct > result.val_count
      || row.probabilities?.length !== expected.length || row.probabilities.some(p => !validProbabilities(p))
      || row.val_correct !== row.probabilities.filter((p, index) => prediction(p) === expected[index].label).length)) {
    throw new Error('训练结果缺少完整曲线、参数校验或独立数据划分。');
  }
  const lowest = result.history.slice(1).reduce((a, b) => a.val_loss <= b.val_loss ? a : b);
  if (result.best_epoch !== lowest.epoch) throw new Error('保存轮次与最低验证损失不一致。');
  return result;
}
export async function evaluateRecyclingHead(runId: string, signal: AbortSignal) {
  const dataset = await recyclingDataset.load();
  signal.throwIfAborted();
  const result = await run('/resnet/recycling/evaluate-head', { run_id: runId }, signal) as HeadTestResult;
  const expected = dataset.samples.filter(p => p.split === 'test');
  if (result.run_id !== runId || result.count !== expected.length || result.samples?.length !== expected.length
    || !Number.isInteger(result.correct) || result.correct < 0 || result.correct > result.count
    || result.samples.some((p, i) => p.id !== expected[i].id || p.label !== expected[i].label || !Number.isInteger(p.prediction) || p.prediction < 0 || p.prediction > 2
      || !validProbabilities(p.probabilities) || p.prediction !== prediction(p.probabilities))
    || result.correct !== result.samples.filter(p => p.prediction === p.label).length) {
    throw new Error('独立测试结果无法校验。');
  }
  return result;
}
