import type { ShortAnswerReview } from './Question';
import {requestCourse} from '../courseRequests';

export async function reviewShortAnswer(input: { question: string; referenceAnswer: string; answer: string }): Promise<ShortAnswerReview> {
  const envelope=await requestCourse<unknown>({action:'compute',endpoint:'/short-answer/evaluate',payload:{question:input.question,reference_answer:input.referenceAnswer,answer:input.answer}});
  if (!envelope || typeof envelope !== 'object') throw new Error('简答题评阅服务不可用。');
  const payload = envelope as { structured?: unknown; result?: unknown };
  if (payload.structured !== true || !payload.result || typeof payload.result !== 'object') throw new Error('评阅服务没有返回结构化结果。');
  const result = payload.result as { verdict?: unknown; explanation?: unknown };
  if (!['正确', '接近正确', '错误'].includes(String(result.verdict)) || typeof result.explanation !== 'string') throw new Error('评阅服务返回了无效结果。');
  const tone = result.verdict === '正确' ? 'correct' : result.verdict === '接近正确' ? 'hint' : 'wrong';
  return { ok: result.verdict === '正确', tone, message: `${result.verdict}：${result.explanation}` };
}
