import type { ShortAnswerReview } from '../../shared/react';
import { classifierIsUsable, normalizeKernelIds } from '../model/fixedKernelMath';
import type {
  FixedKernelPreviewRequest,
  FixedKernelResult,
  FixedKernelSample,
  FixedKernelTrainRequest,
  Matrix,
  SequenceSample,
} from '../model/lenetTypes';

export const LENET_SERVICE_ORIGIN = 'http://127.0.0.1:59415';
export const FIXED_KERNEL_PREVIEW_ENDPOINT = `${LENET_SERVICE_ORIGIN}/lenet5/fixed-kernel-preview`;
export const FIXED_KERNEL_TRAIN_ENDPOINT = `${LENET_SERVICE_ORIGIN}/lenet5/fixed-kernel-train`;
export const SEQUENCE_SAMPLE_ENDPOINT = `${LENET_SERVICE_ORIGIN}/lenet5/sequence-sample`;
export const STRATEGY_SERVICE_ORIGIN = 'http://127.0.0.1:59414';
export const SEQUENCE_STRATEGY_ENDPOINT = `${STRATEGY_SERVICE_ORIGIN}/digit/sequence-strategy-feedback`;
export const DETECTION_STRATEGY_ENDPOINT = `${STRATEGY_SERVICE_ORIGIN}/digit/detection-strategy-feedback`;

interface ServiceEnvelope {
  ok?: unknown;
  result?: unknown;
  error?: unknown;
  warning?: unknown;
  structured?: unknown;
}

type UnknownRecord = Record<string, unknown>;

export interface BuildSequenceSampleRequest {
  digits: string;
  signal?: AbortSignal;
}

export interface ReviewSequenceStrategyRequest {
  answer: string;
  digits: string;
  signal?: AbortSignal;
}

export interface ReviewDetectionStrategyRequest {
  answer: string;
  signal?: AbortSignal;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function nonEmptyText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function serviceMessage(payload: ServiceEnvelope, fallback: string) {
  const warning = asRecord(payload.warning);
  return nonEmptyText(payload.error) ?? nonEmptyText(warning.message) ?? fallback;
}

function isMatrix(value: unknown): value is Matrix {
  return Array.isArray(value)
    && value.every((row) => Array.isArray(row) && row.every((cell) => Number.isFinite(Number(cell))));
}

function isSample(value: unknown): value is FixedKernelSample {
  if (!value || typeof value !== 'object') return false;
  const sample = value as Partial<FixedKernelSample>;
  return Number.isFinite(Number(sample.index))
    && Number.isFinite(Number(sample.label))
    && Number.isFinite(Number(sample.prediction))
    && isMatrix(sample.image)
    && Boolean(sample.feature_maps && typeof sample.feature_maps === 'object');
}

function parseResult(value: unknown, requireClassifier: boolean): FixedKernelResult {
  if (!value || typeof value !== 'object') throw new Error('LeNet 服务返回了无法识别的数据。');
  const result = value as Partial<FixedKernelResult>;
  if (!Array.isArray(result.samples) || !result.samples.every(isSample)) {
    throw new Error('LeNet 服务返回的样本数据不完整。');
  }
  if (!Array.isArray(result.kernels) || !result.dataset || typeof result.dataset !== 'object') {
    throw new Error('LeNet 服务返回的卷积核或数据集信息不完整。');
  }
  if (requireClassifier && !classifierIsUsable(result.classifier)) {
    throw new Error('LeNet 训练服务没有返回可用的分类器参数。');
  }
  return result as FixedKernelResult;
}

async function postDocument(
  endpoint: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ServiceEnvelope> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('无法连接所需服务，请确认本地课程服务已经启动。');
  }

  let document: ServiceEnvelope;
  try {
    document = await response.json() as ServiceEnvelope;
  } catch {
    throw new Error(`服务返回了非 JSON 响应（HTTP ${response.status}）。`);
  }
  if (!response.ok || document.ok !== true) {
    throw new Error(serviceMessage(document, `服务请求失败（HTTP ${response.status}）。`));
  }
  return document;
}

async function postJson(
  endpoint: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return (await postDocument(endpoint, payload, signal)).result;
}

export async function previewFixedKernel({
  kernels,
  sampleIndex,
  image,
  signal,
}: FixedKernelPreviewRequest): Promise<FixedKernelResult> {
  const result = await postJson(FIXED_KERNEL_PREVIEW_ENDPOINT, {
    kernels: normalizeKernelIds(kernels),
    sample_index: sampleIndex,
    image,
  }, signal);
  return parseResult(result, false);
}

export async function trainFixedKernel({
  kernels,
  trainRatio = 0.9,
  image,
  signal,
}: FixedKernelTrainRequest): Promise<FixedKernelResult> {
  const result = await postJson(FIXED_KERNEL_TRAIN_ENDPOINT, {
    kernels: normalizeKernelIds(kernels),
    train_ratio: trainRatio,
    image,
  }, signal);
  return parseResult(result, true);
}

function parseSequenceSample(value: unknown): SequenceSample {
  const result = asRecord(value);
  const digits = nonEmptyText(result.digits);
  const boxes = Array.isArray(result.boxes) ? result.boxes : [];
  if (!digits || !/^\d{1,12}$/.test(digits) || !isMatrix(result.image)) {
    throw new Error('序列生成服务返回了异常图像。');
  }
  if (!Number.isFinite(Number(result.width)) || !Number.isFinite(Number(result.height))) {
    throw new Error('序列生成服务返回了异常尺寸。');
  }
  const normalizedBoxes = boxes.map((box) => asRecord(box));
  if (normalizedBoxes.length !== digits.length || normalizedBoxes.some((box) => (
    !nonEmptyText(box.digit)
    || !Number.isFinite(Number(box.x))
    || !Number.isFinite(Number(box.y))
    || !Number.isFinite(Number(box.width))
    || !Number.isFinite(Number(box.height))
  ))) {
    throw new Error('序列生成服务返回的数字位置不完整。');
  }
  return {
    digits,
    image: result.image,
    width: Number(result.width),
    height: Number(result.height),
    boxes: normalizedBoxes.map((box) => ({
      digit: String(box.digit),
      x: Number(box.x),
      y: Number(box.y),
      width: Number(box.width),
      height: Number(box.height),
    })),
    spacing: Number(result.spacing) || 0,
    margin: Number(result.margin) || 0,
    seed: result.seed === null || result.seed === undefined ? null : Number(result.seed),
    sampleSalts: Array.isArray(result.sampleSalts) ? result.sampleSalts.map(Number) : [],
    durationMs: Number(result.durationMs) || 0,
  };
}

export async function buildSequenceSample({
  digits,
  signal,
}: BuildSequenceSampleRequest): Promise<SequenceSample> {
  const normalizedDigits = String(digits ?? '').replace(/\D/g, '').slice(0, 12);
  if (!normalizedDigits) throw new Error('请至少提供一个数字来生成序列。');
  const result = await postJson(SEQUENCE_SAMPLE_ENDPOINT, { digits: normalizedDigits }, signal);
  return parseSequenceSample(result);
}

async function reviewStrategy(
  endpoint: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ShortAnswerReview> {
  const document = await postDocument(endpoint, payload, signal);
  if (document.structured === false) {
    throw new Error(serviceMessage(document, '评阅服务没有返回结构化结果，请稍后重试。'));
  }
  const result = asRecord(document.result);
  const level = nonEmptyText(result.level);
  const explanation = nonEmptyText(result.explanation);
  const verdict = nonEmptyText(result.verdict);
  if (!['correct', 'close', 'incorrect'].includes(String(level))
    || typeof result.is_correct !== 'boolean'
    || !explanation) {
    throw new Error('评阅服务返回了异常结果，请稍后重试。');
  }
  return {
    // A valid service review counts as a submitted strategy; quality remains in tone.
    ok: true,
    tone: level === 'correct' ? 'correct' : level === 'close' ? 'hint' : 'wrong',
    message: verdict ? `${verdict}：${explanation}` : explanation,
  };
}

export function reviewSequenceStrategy({
  answer,
  digits,
  signal,
}: ReviewSequenceStrategyRequest): Promise<ShortAnswerReview> {
  const normalizedAnswer = String(answer ?? '').trim();
  if (!normalizedAnswer) return Promise.reject(new Error('请先写下你的识别思路。'));
  return reviewStrategy(SEQUENCE_STRATEGY_ENDPOINT, {
    answer: normalizedAnswer,
    digits: String(digits ?? '').replace(/\D/g, '').slice(0, 12),
  }, signal);
}

export function reviewDetectionStrategy({
  answer,
  signal,
}: ReviewDetectionStrategyRequest): Promise<ShortAnswerReview> {
  const normalizedAnswer = String(answer ?? '').trim();
  if (!normalizedAnswer) return Promise.reject(new Error('请先写下你的检测思路。'));
  return reviewStrategy(DETECTION_STRATEGY_ENDPOINT, { answer: normalizedAnswer }, signal);
}
