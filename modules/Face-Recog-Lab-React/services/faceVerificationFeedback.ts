import type { ShortAnswerReview } from '../../shared/react';

export const FACE_FEEDBACK_SERVICE_ORIGIN = 'http://127.0.0.1:59414';
export const FACE_VERIFICATION_FEEDBACK_ENDPOINT = `${FACE_FEEDBACK_SERVICE_ORIGIN}/face/verification-feedback`;

type UnknownRecord = Record<string, unknown>;

interface FaceFeedbackEnvelope {
  ok?: unknown;
  result?: unknown;
  error?: unknown;
  warning?: unknown;
  structured?: unknown;
  rawText?: unknown;
}

export type FaceVerificationLevel = 'correct' | 'close' | 'incorrect' | 'unstructured';

export interface FaceVerificationReview extends ShortAnswerReview {
  message: string;
  level: FaceVerificationLevel;
  isCorrect: boolean;
  verdict?: string;
  explanation: string;
}

export interface FaceVerificationFeedbackRequest {
  answer: string;
  signal?: AbortSignal;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function nonEmptyText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function errorMessage(document: FaceFeedbackEnvelope, fallback: string) {
  const warning = asRecord(document.warning);
  return nonEmptyText(document.error)
    ?? nonEmptyText(warning.message)
    ?? fallback;
}

function normalizeStructuredReview(document: FaceFeedbackEnvelope): FaceVerificationReview {
  const result = asRecord(document.result);
  const level = nonEmptyText(result.level);
  const explanation = nonEmptyText(result.explanation);
  const verdict = nonEmptyText(result.verdict) ?? undefined;
  const isCorrect = result.is_correct === true;

  if (!['correct', 'close', 'incorrect'].includes(String(level)) || !explanation) {
    throw new Error('评阅服务返回了无法识别的结果，请稍后重试。');
  }

  const normalizedLevel = level as Exclude<FaceVerificationLevel, 'unstructured'>;
  return {
    ok: isCorrect,
    tone: normalizedLevel === 'correct'
      ? 'correct'
      : normalizedLevel === 'close'
        ? 'hint'
        : 'wrong',
    message: verdict ? `${verdict}：${explanation}` : explanation,
    level: normalizedLevel,
    isCorrect,
    verdict,
    explanation,
  };
}

/**
 * Calls the original Face lesson's real LangChain endpoint.
 *
 * A successfully returned but unstructured model response is still preserved
 * verbatim as feedback. It is never replaced with local or hard-coded praise.
 */
export async function requestFaceVerificationFeedback({
  answer,
  signal,
}: FaceVerificationFeedbackRequest): Promise<FaceVerificationReview> {
  const normalizedAnswer = String(answer ?? '').trim();
  if (!normalizedAnswer) throw new Error('请先写下你对人脸验证过程的解释。');

  let response: Response;
  try {
    response = await fetch(FACE_VERIFICATION_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: normalizedAnswer }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('暂时无法连接分析服务，请稍后重试。');
  }

  let document: FaceFeedbackEnvelope;
  try {
    document = await response.json() as FaceFeedbackEnvelope;
  } catch {
    throw new Error(`分析服务返回了非 JSON 响应（HTTP ${response.status}）。`);
  }

  if (!response.ok || document.ok !== true) {
    throw new Error(errorMessage(document, `分析服务请求失败（HTTP ${response.status}）。`));
  }

  if (document.structured === false) {
    const rawText = nonEmptyText(document.rawText);
    if (!rawText) {
      throw new Error(errorMessage(document, '分析服务没有返回可显示的评语，请稍后重试。'));
    }
    return {
      ok: false,
      tone: 'hint',
      message: rawText,
      level: 'unstructured',
      isCorrect: false,
      explanation: rawText,
    };
  }

  return normalizeStructuredReview(document);
}

/** Adapter matching the shared Question review signature. */
export function reviewFaceVerificationAnswer(
  answers: string[],
  signal?: AbortSignal,
): Promise<FaceVerificationReview> {
  return requestFaceVerificationFeedback({
    answer: String(answers[0] ?? ''),
    signal,
  });
}
