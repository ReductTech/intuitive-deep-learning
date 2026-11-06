import type { ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { Question, type QuestionCheckResult } from './Question';

export interface PanelChoiceOption {
  key?: ReactNode;
  value: string;
  title: ReactNode;
  caption?: ReactNode;
  media: ReactNode;
  wrongFeedback?: ReactNode;
}

export interface PanelChoiceQuestionProps {
  title: ReactNode;
  options: PanelChoiceOption[];
  answer: string;
  typeLabel?: ReactNode;
  feedback?: { initial?: ReactNode; correct?: ReactNode; wrong?: ReactNode };
  persistenceKey?: string;
  onCheck?: (result: QuestionCheckResult) => void;
  showFeedback?: boolean;
}

export function PanelChoiceQuestion({ title, options, answer, typeLabel = '面板单选题', feedback, persistenceKey, onCheck, showFeedback = true }: PanelChoiceQuestionProps) {
  return (
    <Question
      className="dl-question--panel"
      type="choice"
      typeLabel={typeLabel}
      title={title}
      answer={answer}
      feedback={feedback}
      persistenceKey={persistenceKey}
      onCheck={onCheck}
      showFeedback={showFeedback}
      options={options.map((option) => ({
        key: option.key,
        value: option.value,
        wrongFeedback: option.wrongFeedback,
        label: <span className="dl-panel-option"><span className="dl-panel-option-media">{option.media}</span><span className="dl-panel-option-copy"><Typography as="strong" variant="bodySmall">{option.title}</Typography>{option.caption !== undefined && <Typography as="span" variant="bodySmall" tone="muted">{option.caption}</Typography>}</span></span>,
      }))}
    />
  );
}
