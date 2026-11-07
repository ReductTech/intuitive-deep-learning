const SHORT_ANSWER_ENDPOINT = 'http://127.0.0.1:59414/short-answer/evaluate';

export interface AiShortAnswerEvaluation {
  verdict: '正确' | '接近正确' | '错误';
  level: 'correct' | 'close' | 'incorrect';
  isCorrect: boolean;
  explanation: string;
}

interface ServiceEnvelope {
  ok?: boolean;
  structured?: boolean;
  result?: unknown;
  error?: unknown;
  warning?: { message?: unknown };
}

export async function evaluateAiShortAnswer(
  taskId: string,
  answer: string,
  context: Record<string, unknown> = {},
): Promise<AiShortAnswerEvaluation> {
  let response: Response;
  try {
    response = await fetch(SHORT_ANSWER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, answer, ...context }),
    });
  } catch {
    throw new Error('AI 点评服务未启动或暂时无法连接。');
  }

  const envelope = await response.json().catch(() => ({})) as ServiceEnvelope;
  if (!response.ok || envelope.ok !== true) {
    throw new Error(typeof envelope.error === 'string' ? envelope.error : 'AI 点评服务暂时不可用。');
  }
  if (envelope.structured !== true || !envelope.result || typeof envelope.result !== 'object') {
    throw new Error(typeof envelope.warning?.message === 'string' ? envelope.warning.message : 'AI 点评返回格式无法解析。');
  }

  const result = envelope.result as Record<string, unknown>;
  const verdict = result.verdict;
  const level = result.level;
  const explanation = result.explanation;
  if ((verdict !== '正确' && verdict !== '接近正确' && verdict !== '错误')
    || (level !== 'correct' && level !== 'close' && level !== 'incorrect')
    || typeof explanation !== 'string') {
    throw new Error('AI 点评返回了无效结果。');
  }

  return {
    verdict,
    level,
    isCorrect: result.is_correct === true,
    explanation,
  };
}
