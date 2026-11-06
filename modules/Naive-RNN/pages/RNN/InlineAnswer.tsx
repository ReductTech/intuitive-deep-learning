import { useState, type ReactNode } from 'react';
import { Button, Feedback, Typography, type FeedbackStatus } from '../../../shared/react';
import './InlineAnswer.css';

export interface InlineAnswerProps {
  className?: string;
  typeLabel: ReactNode;
  /** 题干，填空就出现在末尾。 */
  stem: ReactNode;
  placeholder?: string;
  /**
   * 可以接受的答案，用 0–1 的概率表示：100% 写作 1，50% 写作 0.5。
   * 这样「100%」和「1」这类同义写法都能判对。
   */
  accept: number[];
  hint?: ReactNode;
  correctFeedback: ReactNode;
  wrongFeedback: ReactNode;
  onCorrect?: () => void;
}

/** 把「100%」「1」「1.0」这类写法统一折算成 0–1 的概率，认不出来时返回 null。 */
function toProbability(value: string) {
  const text = value.trim().replace(/％/g, '%').replace(/\s+/g, '');
  if (!text) return null;
  const isPercent = text.endsWith('%');
  const numeric = Number(text.replace(/%/g, ''));
  if (!Number.isFinite(numeric)) return null;
  return isPercent ? numeric / 100 : numeric;
}

export function InlineAnswer({
  className,
  typeLabel,
  stem,
  placeholder,
  accept,
  hint,
  correctFeedback,
  wrongFeedback,
  onCorrect,
}: InlineAnswerProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('hint');
  const [message, setMessage] = useState<ReactNode>(hint);
  const [solved, setSolved] = useState(false);

  const check = () => {
    const probability = toProbability(value);
    if (probability !== null && accept.some((target) => Math.abs(target - probability) < 1e-6)) {
      setSolved(true);
      setStatus('correct');
      setMessage(correctFeedback);
      onCorrect?.();
      return;
    }
    setStatus('wrong');
    setMessage(wrongFeedback);
  };

  return (
    <section className={className ? `nrnn-inline-answer ${className}` : 'nrnn-inline-answer'}>
      <header className="nrnn-inline-answer__head">
        <Typography as="span" variant="body" tone="accent">{typeLabel}</Typography>
        <div className="nrnn-inline-answer__row">
          <Typography as="strong" variant="body" tone="main" className="nrnn-inline-answer__stem">
            {stem}
            <input
              className="dl-inline-blank"
              type="text"
              value={value}
              placeholder={placeholder}
              aria-label="填写答案"
              autoComplete="off"
              disabled={solved}
              onChange={(event) => {
                setValue(event.currentTarget.value);
                if (!solved) {
                  setStatus('hint');
                  setMessage(hint);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !solved) check();
              }}
            />
          </Typography>
          {!solved && (
            <Button variant="primary" disabled={!value.trim()} onClick={check}>
              <Typography as="span" variant="body" tone="inherit">检查答案</Typography>
            </Button>
          )}
        </div>
      </header>
      <Feedback status={status} message={message} textVariant="body" className="nrnn-inline-answer__feedback" />
    </section>
  );
}
