import { Question, type QuestionProps } from '../../../shared/react';
import './RtgQuestion.css';

const PAGE_LOAD_ID = typeof performance !== 'undefined' ? String(performance.timeOrigin) : String(Date.now());

export interface RtgQuestionProps extends Omit<QuestionProps, 'persistenceKey'> {
  pageId: string;
  questionId: string;
}

export function RtgQuestion({ pageId, questionId, className, ...props }: RtgQuestionProps) {
  return (
    <Question
      {...props}
      className={`rtg-question${className ? ` ${className}` : ''}`}
      persistenceKey={`resnet-transfer-guide:${pageId}:${questionId}:${PAGE_LOAD_ID}`}
    />
  );
}
