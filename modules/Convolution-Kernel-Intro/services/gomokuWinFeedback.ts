import type { ShortAnswerReview } from '../../shared/react';
import moduleOutline from '../outlines.json';

const ENDPOINT = 'http://127.0.0.1:59414/kernel/gomoku-win-feedback';

/** 课程标识取自模块根目录的 outlines.json，云端按它分组每门课的缓存。 */
const COURSE_ID = moduleOutline.id;

const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'X-Course-ID': COURSE_ID,
};

interface ServiceEnvelope {
  ok?: boolean;
  structured?: boolean;
  result?: unknown;
  error?: unknown;
  warning?: { message?: unknown };
}

export interface GomokuWinContext {
  boardSize: number;
  winner: string;
  direction: string;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/** 把服务返回的三级评阅映射成共享 Question 组件认识的反馈样式。 */
export async function reviewGomokuWinAnswer(answer: string, context: GomokuWinContext): Promise<ShortAnswerReview> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: REQUEST_HEADERS,
      body: JSON.stringify({
        answer,
        board_size: context.boardSize,
        winner: context.winner,
        win_direction: context.direction,
        board_matrix: '前一页把棋盘写成了数字矩阵：赢方的子记 1、输方的子记 -1、空点记 0，因此学习者用 1 / -1 / 0 描述棋盘同样算说清。',
      }),
    });
  } catch {
    throw new Error('评阅服务未启动或无法连接，请先启动课程后台服务。');
  }
  const envelope = await response.json().catch(() => ({})) as ServiceEnvelope;
  if (!response.ok || envelope.ok !== true) {
    throw new Error(typeof envelope.error === 'string' ? envelope.error : '评阅服务暂时不可用。');
  }
  if (envelope.structured !== true || !envelope.result) {
    throw new Error(typeof envelope.warning?.message === 'string' ? envelope.warning.message : '评阅结果无法解析，请重试。');
  }
  const result = asRecord(envelope.result, '评阅服务没有返回有效结果。');
  const explanation = typeof result.explanation === 'string' && result.explanation.trim()
    ? result.explanation.trim()
    : '已收到你的说明。';
  const level = typeof result.level === 'string' ? result.level : 'incorrect';
  if (level === 'correct') return { ok: true, tone: 'correct', message: explanation };
  if (level === 'close') return { ok: false, tone: 'hint', message: explanation };
  return { ok: false, tone: 'wrong', message: explanation };
}
