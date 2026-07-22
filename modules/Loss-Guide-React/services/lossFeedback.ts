import type { ShortAnswerReview } from '../../shared/react/learning/Question';

const endpoint = 'http://127.0.0.1:59414/loss/compare-feedback';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

/** 与旧版 Loss-Guide 相同的 L1/L2 简答评阅接口。 */
export async function reviewLossComparison(answer: string): Promise<ShortAnswerReview> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  const body = asRecord(await response.json().catch(() => null));
  if (!response.ok || body?.ok !== true) throw new Error(typeof body?.error === 'string' ? body.error : '评阅服务暂时不可用');
  const result = asRecord(body.result);
  if (!result) throw new Error('评阅服务没有返回可用结果');
  const explanation = result?.explanation;
  if (typeof explanation !== 'string') throw new Error('评阅服务没有返回可用解释');
  const correct = result.is_correct === true || result.level === 'correct';
  return { ok: correct, tone: correct ? 'correct' : 'wrong', message: explanation };
}
