import type { ShortAnswerReview } from './Question';
import {evaluateShortAnswer} from '@shuku/course-runtime/react/assessment';

/** Style-specific wording and feedback tones for the platform assessment result. */
export async function reviewShortAnswer(input: { question: string; referenceAnswer: string; answer: string }): Promise<ShortAnswerReview> {
  const result = await evaluateShortAnswer(input);
  const tone = result.verdict === '正确' ? 'correct' : result.verdict === '接近正确' ? 'hint' : 'wrong';
  return { ok: result.verdict === '正确', tone, message: `${result.verdict}：${result.explanation}` };
}
