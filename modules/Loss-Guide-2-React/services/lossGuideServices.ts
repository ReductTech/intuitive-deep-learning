import type { ProbabilityLossDesign } from '../model/lossGuideMath';
export type { ProbabilityLossDesign } from '../model/lossGuideMath';

type UnknownRecord = Record<string, unknown>;

export type ShortAnswerLevel = 'correct' | 'close' | 'incorrect';
export type ShortAnswerVerdict = '正确' | '接近正确' | '错误';

export interface ShortAnswerFeedbackResult {
  verdict: ShortAnswerVerdict;
  level: ShortAnswerLevel;
  is_correct: boolean;
  explanation: string;
  task_id: string;
}

export type SigmoidTransformFeedback = ShortAnswerFeedbackResult;
export type CrossEntropySignFeedback = ShortAnswerFeedbackResult;

export interface LossGuideRequestOptions {
  signal?: AbortSignal;
}

export const LOSS_GUIDE_ENDPOINTS = Object.freeze({
  sigmoidTransform:
    'http://127.0.0.1:59414/loss/sigmoid-transform-feedback',
  probabilityDesign:
    'http://127.0.0.1:59414/loss/probability-design',
  crossEntropySign:
    'http://127.0.0.1:59414/loss/cross-entropy-sign-feedback',
});

const SERVICE_ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  MODEL_RESPONSE_FORMAT_ERROR: '分析结果格式异常，请重新提交。',
  INVALID_JSON: '分析服务返回了无法识别的数据，请稍后再试。',
  INVALID_REQUEST_BODY: '提交内容格式不正确，请刷新页面后重试。',
  INVALID_REQUEST: '提交内容不完整，请检查后重试。',
  REQUEST_BODY_TOO_LARGE: '提交内容过长，请精简后重试。',
  AI_CONFIGURATION_ERROR: '分析服务尚未配置完成，请联系管理员。',
  AI_QUOTA_EXHAUSTED: '分析服务额度已用完，请联系管理员后再试。',
  AI_RATE_LIMITED: '提交过于频繁，请稍后再试。',
  AI_AUTHENTICATION_FAILED: '分析服务认证失败，请联系管理员。',
  AI_REQUEST_TIMEOUT: '分析超时，请稍后再试。',
  AI_NETWORK_ERROR: '暂时无法连接分析服务，请稍后再试。',
  AI_INVALID_RESPONSE: '分析服务返回了异常结果，请稍后再试。',
  AI_EMPTY_RESPONSE: '分析服务没有返回内容，请稍后再试。',
  AI_SERVICE_UNAVAILABLE: '分析服务暂时不可用，请稍后再试。',
  INTERNAL_ERROR: '分析过程出现异常，请稍后再试。',
  NOT_FOUND: '当前分析功能暂不可用，请联系管理员。',
});

const LOSS_FAMILIES = new Set([
  'negative_log',
  'linear',
  'quadratic',
  'inverse',
  'absolute',
]);
const SHORT_ANSWER_LEVELS = new Set(['correct', 'close', 'incorrect']);
const SHORT_ANSWER_VERDICTS = new Set(['正确', '接近正确', '错误']);

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null
    ? value as UnknownRecord
    : {};
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function serviceErrorMessage(payload: UnknownRecord): string {
  const warning = asRecord(payload.warning);
  const code = String(payload.errorCode ?? warning.code ?? '').trim();
  return (
    SERVICE_ERROR_MESSAGES[code]
    ?? nonEmptyString(payload.error)
    ?? nonEmptyString(warning.message)
    ?? '分析服务暂时不可用，请稍后再试。'
  );
}

export class LossGuideServiceError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly userFacing = true;

  constructor(
    payload: UnknownRecord,
    fallback?: string,
  ) {
    const warning = asRecord(payload.warning);
    super(fallback || serviceErrorMessage(payload));
    this.name = 'LossGuideServiceError';
    this.code = String(
      payload.errorCode ?? warning.code ?? 'SERVICE_UNAVAILABLE',
    );
    this.retryable = payload.retryable !== false;
  }
}

export function lossGuideServiceErrorMessage(error: unknown): string {
  if (error instanceof LossGuideServiceError) return error.message;
  if (
    typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'
  ) {
    return '请求已取消。';
  }
  return '暂时无法连接分析服务，请稍后再试。';
}

function createTimeoutSignal(
  timeoutMs: number | null,
  externalSignal?: AbortSignal,
): {
  signal: AbortSignal | undefined;
  timedOut: () => boolean;
  cleanup: () => void;
} {
  if (timeoutMs === null && !externalSignal) {
    return {
      signal: undefined,
      timedOut: () => false,
      cleanup: () => undefined,
    };
  }
  if (timeoutMs === null) {
    return {
      signal: externalSignal,
      timedOut: () => false,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();
  let timeoutTriggered = false;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) {
    abortFromExternal();
  } else {
    externalSignal?.addEventListener('abort', abortFromExternal, {
      once: true,
    });
  }
  const timeoutId = window.setTimeout(() => {
    timeoutTriggered = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    timedOut: () => timeoutTriggered,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    },
  };
}

async function requestStructuredResult(
  endpoint: string,
  answer: string,
  timeoutMs: number | null,
  externalSignal?: AbortSignal,
): Promise<UnknownRecord> {
  const requestSignal = createTimeoutSignal(timeoutMs, externalSignal);
  let response: Response;
  let payload: UnknownRecord;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
      signal: requestSignal.signal,
    });
    payload = asRecord(await response.json().catch(() => null));
  } catch (error) {
    if (requestSignal.timedOut()) {
      throw new LossGuideServiceError({
        errorCode: 'AI_REQUEST_TIMEOUT',
      });
    }
    if (
      externalSignal?.aborted
      || (
        typeof error === 'object'
        && error !== null
        && 'name' in error
        && error.name === 'AbortError'
      )
    ) {
      throw error;
    }
    throw new LossGuideServiceError({
      errorCode: 'AI_NETWORK_ERROR',
    });
  } finally {
    requestSignal.cleanup();
  }

  if (!response.ok || payload.ok !== true) {
    if (response.ok && Object.keys(payload).length === 0) {
      throw new LossGuideServiceError({
        errorCode: 'AI_INVALID_RESPONSE',
      });
    }
    throw new LossGuideServiceError(payload);
  }
  if (payload.structured === false) {
    throw new LossGuideServiceError(
      {
        warning: Object.keys(asRecord(payload.warning)).length > 0
          ? payload.warning
          : { code: 'MODEL_RESPONSE_FORMAT_ERROR' },
      },
      '分析结果格式异常，请重新提交。',
    );
  }

  const result = asRecord(payload.result);
  if (Object.keys(result).length === 0) {
    throw new LossGuideServiceError(
      { errorCode: 'AI_INVALID_RESPONSE' },
      '分析服务返回了异常结果，请稍后再试。',
    );
  }
  return result;
}

function parseShortAnswerResult(value: UnknownRecord): ShortAnswerFeedbackResult {
  const verdict = nonEmptyString(value.verdict);
  const level = nonEmptyString(value.level);
  const explanation = nonEmptyString(value.explanation);
  const taskId = nonEmptyString(value.task_id);

  if (
    !verdict
    || !SHORT_ANSWER_VERDICTS.has(verdict)
    || !level
    || !SHORT_ANSWER_LEVELS.has(level)
    || typeof value.is_correct !== 'boolean'
    || !explanation
    || !taskId
    || value.is_correct !== (level === 'correct')
  ) {
    throw new LossGuideServiceError(
      { errorCode: 'AI_INVALID_RESPONSE' },
      '评阅服务返回了异常结果，请稍后再试。',
    );
  }

  return {
    verdict: verdict as ShortAnswerVerdict,
    level: level as ShortAnswerLevel,
    is_correct: value.is_correct,
    explanation,
    task_id: taskId,
  };
}

function parseProbabilityLossDesign(
  value: UnknownRecord,
): ProbabilityLossDesign {
  const family = nonEmptyString(value.family);
  const formula = nonEmptyString(value.formula);
  const derivative = nonEmptyString(value.derivative);
  const explanation = nonEmptyString(value.explanation);
  const scale = value.scale;
  const power = value.power;

  if (
    !family
    || !LOSS_FAMILIES.has(family)
    || typeof scale !== 'number'
    || !Number.isFinite(scale)
    || scale < 0.1
    || scale > 10
    || typeof power !== 'number'
    || !Number.isFinite(power)
    || power < 1
    || power > 4
    || !formula
    || !derivative
    || typeof value.is_negative_log !== 'boolean'
    || typeof value.is_meaningful !== 'boolean'
    || !explanation
  ) {
    throw new LossGuideServiceError(
      { errorCode: 'AI_INVALID_RESPONSE' },
      '损失函数服务返回了异常结果，请稍后再试。',
    );
  }

  return {
    family: family as ProbabilityLossDesign['family'],
    scale,
    power,
    formula,
    derivative,
    is_negative_log: value.is_negative_log,
    is_meaningful: value.is_meaningful,
    explanation,
  };
}

/** Legacy Sigmoid short-answer request: 12-second timeout. */
export async function requestSigmoidTransformFeedback(
  answer: string,
  options: LossGuideRequestOptions = {},
): Promise<ShortAnswerFeedbackResult> {
  return parseShortAnswerResult(
    await requestStructuredResult(
      LOSS_GUIDE_ENDPOINTS.sigmoidTransform,
      answer,
      12_000,
      options.signal,
    ),
  );
}

/**
 * Legacy probability-design request. The old page intentionally had no
 * client-side timeout; callers may still cancel it when a component unmounts.
 */
export async function requestProbabilityLossDesign(
  answer: string,
  options: LossGuideRequestOptions = {},
): Promise<ProbabilityLossDesign> {
  return parseProbabilityLossDesign(
    await requestStructuredResult(
      LOSS_GUIDE_ENDPOINTS.probabilityDesign,
      answer,
      null,
      options.signal,
    ),
  );
}

/** Legacy cross-entropy-sign short-answer request: 30-second timeout. */
export async function requestCrossEntropySignFeedback(
  answer: string,
  options: LossGuideRequestOptions = {},
): Promise<ShortAnswerFeedbackResult> {
  return parseShortAnswerResult(
    await requestStructuredResult(
      LOSS_GUIDE_ENDPOINTS.crossEntropySign,
      answer,
      30_000,
      options.signal,
    ),
  );
}

export const reviewSigmoidTransform = requestSigmoidTransformFeedback;
export const designProbabilityLoss = requestProbabilityLossDesign;
export const reviewCrossEntropySign = requestCrossEntropySignFeedback;
