import type { ShortAnswerReview } from '../../shared/react';

const ENDPOINT = 'http://127.0.0.1:59414/digit/vector-order-feedback';

export async function reviewVectorOrder(answer: string, selectedOrder?: string): Promise<ShortAnswerReview> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, selected_order: selectedOrder }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as { verdict?: string; level?: string; is_correct?: boolean; explanation?: string };
  const tone: ShortAnswerReview['tone'] = data.level === 'correct' ? 'correct' : data.level === 'close' ? 'hint' : 'wrong';
  return {
    ok: data.is_correct === true,
    tone,
    message: [data.verdict, data.explanation].filter(Boolean).join('：') || '统一顺序能让每个位置始终表达同一个区域，模型才可以比较不同样本。',
  };
}
