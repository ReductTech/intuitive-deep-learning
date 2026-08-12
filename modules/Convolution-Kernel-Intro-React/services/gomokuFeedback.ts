import type { ShortAnswerReview } from '../../shared/react';
import { BOARD_SIZE, getPlayerName, getWinDirectionLabel } from '../model/gomokuEngine';
import type { GomokuSessionSnapshot } from '../model/sessionTypes';

const ENDPOINT = 'http://127.0.0.1:59414/kernel/gomoku-win-feedback';

const GROUND_TRUTH = [
  '棋盘可以表示成二维数组或矩阵。',
  '每个格子存储空、黑子、白子这样的状态。',
  '每次落子后，沿横向、竖向、两条斜线四个方向检查。',
  '在同一方向上把正反两边连续同色棋子加起来，再加当前棋子。',
  '连续同色棋子数量达到 5，就判定对应玩家获胜。',
];

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function serviceError(payload: UnknownRecord) {
  const warning = record(payload.warning);
  return text(payload.error) ?? text(warning.message) ?? '评阅服务暂时不可用，请稍后重试。';
}

export async function reviewGomokuAnswer(
  answers: string[],
  game: GomokuSessionSnapshot,
): Promise<ShortAnswerReview> {
  const answer = String(answers[0] ?? '').trim();
  let response: Response;
  let payload: UnknownRecord;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
        board_size: BOARD_SIZE,
        winner: getPlayerName(game.winner),
        win_direction: getWinDirectionLabel(game.winLine),
        win_line: game.winLine.map((cell) => [cell.row, cell.col]),
        ground_truth: GROUND_TRUTH,
      }),
    });
    payload = record(await response.json().catch(() => null));
  } catch {
    throw new Error('暂时无法连接分析服务，请稍后重试。');
  }

  if (!response.ok || payload.ok !== true || payload.structured === false) {
    throw new Error(serviceError(payload));
  }
  const result = record(payload.result);
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
    ok: true,
    tone: level === 'correct' ? 'correct' : level === 'close' ? 'hint' : 'wrong',
    message: verdict ? `${verdict}：${explanation}` : explanation,
  };
}
