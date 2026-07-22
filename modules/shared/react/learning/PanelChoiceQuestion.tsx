import { useState, type ReactNode } from 'react';
import { Feedback } from '../feedback/Feedback';
import { classNames } from '../utils';

export interface PanelChoiceOption {
  key?: ReactNode;
  value: string;
  title: ReactNode;
  caption?: ReactNode;
  media: ReactNode;
}

export interface PanelChoiceQuestionProps {
  title: ReactNode;
  options: PanelChoiceOption[];
  answer: string;
  typeLabel?: ReactNode;
  feedback?: { initial?: ReactNode; correct?: ReactNode; wrong?: ReactNode };
}

export function PanelChoiceQuestion({
  title,
  options,
  answer,
  typeLabel = '面板单选题',
  feedback = {},
}: PanelChoiceQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = selected === answer;
  const message = selected === null ? feedback.initial : correct ? feedback.correct : feedback.wrong;

  return (
    <section className="dl-question" aria-label={String(typeLabel)}>
      <header className="dl-question-head">
        <span className="dl-question-type">{typeLabel}</span>
        <strong className="dl-question-stem">{title}</strong>
      </header>
      <div className="dl-panel-choice-grid" role="radiogroup">
        {options.map((option, index) => {
          const chosen = selected === option.value;
          return (
            <button
              className={classNames('dl-panel-choice', chosen && (correct ? 'is-correct' : 'is-wrong'))}
              key={option.value}
              type="button"
              role="radio"
              aria-checked={chosen}
              onClick={() => setSelected(option.value)}
            >
              <div className="dl-panel-choice-media">{option.media}</div>
              <div className="dl-panel-choice-answer">
                <span className="dl-panel-choice-key">{option.key ?? String.fromCharCode(65 + index)}</span>
                <span className="dl-panel-choice-copy">
                  <strong className="dl-panel-choice-title">{option.title}</strong>
                  {option.caption !== undefined && <span className="dl-panel-choice-caption">{option.caption}</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <Feedback status={selected === null ? 'info' : correct ? 'correct' : 'wrong'} message={message} />
    </section>
  );
}
