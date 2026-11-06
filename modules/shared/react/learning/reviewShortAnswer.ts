import type { ShortAnswerReview } from './Question';

const ENDPOINT = `${(import.meta.env.VITE_LLM_SERVICE_URL || 'http://127.0.0.1:28432').replace(/\/$/, '')}/short-answer/evaluate`;

/** Sends an inline question by default; taskId keeps existing question-bank tasks compatible. */
export async function reviewShortAnswer(input: { question: string; referenceAnswer: string; answer: string; taskId?: string }): Promise<ShortAnswerReview> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.taskId
      ? { task_id: input.taskId, answer: input.answer }
      : { question: input.question, reference_answer: input.referenceAnswer, answer: input.answer }),
  });
  const envelope: unknown = await response.json();
  if (!response.ok || !envelope || typeof envelope !== 'object') throw new Error('简答题评阅服务不可用。');
  const payload = envelope as { structured?: unknown; result?: unknown };
  if (payload.structured !== true || !payload.result || typeof payload.result !== 'object') throw new Error('评阅服务没有返回结构化结果。');
  const result = payload.result as { level?: unknown; explanation?: unknown };
  if (!['correct', 'close', 'incorrect'].includes(String(result.level)) || typeof result.explanation !== 'string') throw new Error('评阅服务返回了无效结果。');
  const tone = result.level === 'correct' ? 'correct' : result.level === 'close' ? 'hint' : 'wrong';
  const label = result.level === 'correct' ? '正确' : result.level === 'close' ? '接近正确' : '需要修正';
  return { ok: result.level === 'correct', tone, message: `${label}：${result.explanation}` };
}
