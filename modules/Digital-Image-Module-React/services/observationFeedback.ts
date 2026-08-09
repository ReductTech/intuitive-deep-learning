import type { ShortAnswerReview } from '../../shared/react';

const ENDPOINT =
  'http://127.0.0.1:59414/image/observation-feedback';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null
    ? value as UnknownRecord
    : {};
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function serviceMessage(payload: UnknownRecord) {
  const warning = asRecord(payload.warning);
  return (
    text(payload.error)
    ?? text(warning.message)
    ?? '评阅服务暂时不可用，请稍后重试。'
  );
}

export async function reviewPixelObservation(
  answers: string[],
): Promise<ShortAnswerReview> {
  const answer = String(answers[0] ?? '').trim();
  let response: Response;
  let payload: UnknownRecord;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    payload = asRecord(await response.json().catch(() => null));
  } catch {
    throw new Error('暂时无法连接分析服务，请稍后重试。');
  }

  if (!response.ok || payload.ok !== true || payload.structured === false) {
    throw new Error(serviceMessage(payload));
  }
  const result = asRecord(payload.result);
  const level = text(result.level);
  const explanation = text(result.explanation);
  const verdict = text(result.verdict);
  if (
    !['correct', 'close', 'incorrect'].includes(String(level))
    || typeof result.is_correct !== 'boolean'
    || !explanation
  ) {
    throw new Error('评阅服务返回了异常结果，请稍后重试。');
  }

  return {
    ok: result.is_correct,
    tone: level === 'correct'
      ? 'correct'
      : level === 'close'
        ? 'hint'
        : 'wrong',
    message: verdict ? `${verdict}：${explanation}` : explanation,
  };
}

