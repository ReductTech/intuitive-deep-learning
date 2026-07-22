import { useMemo, useState, type ReactNode } from 'react';
import { Feedback } from '../feedback/Feedback';
import { classNames } from '../utils';

export type QuestionType = 'choice' | 'multiple' | 'judgement' | 'fill' | 'short';

export interface QuestionOption {
  key?: string;
  value: string;
  label: ReactNode;
}

export interface QuestionCheckResult {
  ok: boolean;
  empty?: boolean;
  answer: string[];
  message?: ReactNode;
  tone?: 'correct' | 'wrong' | 'hint';
}

export interface QuestionProps {
  type?: QuestionType;
  title: ReactNode;
  options?: QuestionOption[];
  answer?: string | string[];
  multiple?: boolean;
  blanks?: Array<{ label?: ReactNode; placeholder?: string }>;
  rows?: number;
  typeLabel?: ReactNode;
  submitText?: ReactNode;
  feedback?: { empty?: ReactNode; correct?: ReactNode; wrong?: ReactNode; sample?: ReactNode };
  instant?: boolean;
  className?: string;
  onCheck?: (result: QuestionCheckResult) => void;
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function answerList(answer: string | string[] | undefined) {
  return (Array.isArray(answer) ? answer : answer === undefined ? [] : [answer]).map(normalize).filter(Boolean);
}

function FillTitle({ title, blanks, fields, onChange }: { title: ReactNode; blanks: Array<{ label?: ReactNode; placeholder?: string }>; fields: string[]; onChange: (index: number, value: string) => void }) {
  const input = (index: number) => <input className="dl-inline-blank" type="text" value={fields[index] ?? ''} placeholder={blanks[index]?.placeholder ?? '填写答案'} aria-label={String(blanks[index]?.label ?? `第 ${index + 1} 个空`)} autoComplete="off" onChange={(event) => onChange(index, event.target.value)} />;
  if (typeof title !== 'string') return <>{title}{input(0)}</>;
  const parts = title.split('____');
  return <>{parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 && input(index)}</span>)}</>;
}

function typeLabel(type: QuestionType, multiple: boolean) {
  if (type === 'choice') return multiple ? '多选题' : '单选题';
  if (type === 'judgement') return '判断题';
  if (type === 'fill') return '填空题';
  if (type === 'short') return '简答题';
  return '题目';
}

export function Question({
  type = 'choice',
  title,
  options = [],
  answer,
  multiple = type === 'multiple',
  blanks = [],
  rows = 5,
  typeLabel: label,
  submitText = '检查答案',
  feedback = {},
  instant = !multiple && (type === 'choice' || type === 'judgement'),
  className,
  onCheck,
}: QuestionProps) {
  const normalizedType: QuestionType = type === 'multiple' ? 'choice' : type;
  const [selected, setSelected] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>(() => Array.from({ length: Math.max(1, blanks.length) }, () => ''));
  const [result, setResult] = useState<QuestionCheckResult | null>(null);

  const expected = useMemo(() => answerList(answer), [answer]);
  const answerValues = normalizedType === 'choice' || normalizedType === 'judgement' ? selected : fields;

  function check(candidateAnswers: string[] = answerValues) {
    const normalizedAnswers = candidateAnswers.map(normalize);
    const empty = normalizedAnswers.every((value) => !value);
    const ok = normalizedType === 'short'
      ? !empty
      : multiple
        ? normalizedAnswers.filter(Boolean).sort().join('|') === expected.slice().sort().join('|')
        : normalizedAnswers.length === expected.length && normalizedAnswers.every((value, index) => value === expected[index]);
    const tone = empty ? 'hint' : normalizedType === 'short' ? 'hint' : ok ? 'correct' : 'wrong';
    const message = empty
      ? feedback.empty ?? '请先完成作答，再检查答案。'
      : normalizedType === 'short'
        ? feedback.sample ?? feedback.correct ?? '已记录回答，可以对照参考方向继续完善。'
        : ok ? feedback.correct ?? '回答正确。' : feedback.wrong ?? '再检查一下。';
    const next: QuestionCheckResult = {
      ok: !empty && ok,
      empty,
      answer: candidateAnswers,
      tone,
      message,
    };
    setResult(next);
    onCheck?.(next);
    return next;
  }

  function choose(value: string) {
    const nextSelected = multiple
      ? selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
      : [value];
    setSelected(nextSelected);
    setResult(null);
    if (instant) check(nextSelected);
  }

  return (
    <section
      className={classNames('dl-question', `dl-question--${normalizedType}`, multiple && 'dl-question--multiple', className)}
      data-question-type={normalizedType}
      data-submit-mode={instant ? 'instant' : 'manual'}
    >
      <header className="dl-question-head">
        <span className="dl-question-type">{label ?? typeLabel(normalizedType, multiple)}</span>
        <div className="dl-question-title-row">
          <strong className="dl-question-stem">{normalizedType === 'fill' ? <FillTitle title={title} blanks={blanks.length ? blanks : [{ placeholder: '填写答案' }]} fields={fields} onChange={(index, value) => { setFields((current) => { const next = [...current]; next[index] = value; return next; }); setResult(null); }} /> : title}</strong>
          {!instant && <button className="edu-btn edu-btn--primary dl-question-submit" type="button" onClick={() => check()}>{submitText}</button>}
        </div>
      </header>

      {(normalizedType === 'choice' || normalizedType === 'judgement') && (
        <div className="dl-question-options" role={multiple ? 'group' : 'radiogroup'}>
          {options.map((option, index) => {
            const value = option.value;
            const isSelected = selected.includes(value);
            const expectedValue = expected.includes(normalize(value));
            const markedCorrect = Boolean(result && result.ok && expectedValue);
            const markedWrong = Boolean(result && !result.ok && isSelected && !expectedValue);
            return (
              <button
                className={classNames('dl-question-option', isSelected && 'is-selected', markedCorrect && 'is-correct', markedWrong && 'is-wrong')}
                key={`${value}-${index}`}
                type="button"
                data-index={index}
                aria-pressed={isSelected}
                onClick={() => choose(value)}
              >
                <span className="dl-option-key">{option.key ?? String.fromCharCode(65 + index)}</span>
                <span className="dl-option-body">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {normalizedType === 'fill' && blanks.length > 1 && <div className="dl-question-fields">{blanks.slice(1).map((blank, index) => <label className="dl-question-field" key={index}><span>{blank.label}</span><input type="text" value={fields[index + 1] ?? ''} placeholder={blank.placeholder} autoComplete="off" onChange={(event) => { setFields((current) => { const next = [...current]; next[index + 1] = event.target.value; return next; }); setResult(null); }} /></label>)}</div>}

      {normalizedType === 'short' && (
        <div className="dl-question-fields">
          <label className="dl-question-field">
            <textarea
              rows={rows}
              value={fields[0] ?? ''}
              onChange={(event) => {
                setFields([event.target.value]);
                setResult(null);
              }}
            />
          </label>
        </div>
      )}

      <Feedback
        status={result?.tone ?? 'info'}
        message={result?.message}
        streaming={normalizedType === 'short' && Boolean(result && !result.empty)}
        className="dl-question-feedback"
        hidden={!result}
      />
    </section>
  );
}
