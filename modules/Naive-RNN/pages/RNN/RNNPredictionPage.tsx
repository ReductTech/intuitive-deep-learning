import { useRef, useState } from 'react';
import { ContentBlock, Question, Typography, type QuestionCheckResult } from '../../../shared/react';
import './RNNPredictionPage.css';

export interface RNNPredictionPageProps {
  onComplete: () => void;
}

const sentenceCharacters = Array.from('我打开书开始学');

const candidates = [
  { value: '习', label: '学习的“习”', score: .82 },
  { value: '生', label: '生命的“生”', score: .58 },
  { value: '校', label: '学校的“校”', score: .31 },
  { value: '术', label: '技术的“术”', score: .14 },
] as const;

export function RNNPredictionPage({ onComplete }: RNNPredictionPageProps) {
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const completedRef = useRef(false);
  const chosen = result?.answer[0];
  const correct = result?.ok === true;

  const handleCheck = (next: QuestionCheckResult) => {
    setResult(next);
    if (next.ok && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-prediction"
      title="预测：读到这里，下一个字符最可能是什么？"
      subtitle="RNN 利用已经读过的内容，为每个候选字符打分。"
    >
      <div className="nrnn-prediction__layout">
        <section className={`nrnn-prediction__prompt${correct ? ' is-complete' : ''}`} aria-label="读取前文">
          <Typography as="span" variant="bodySmall" tone="warning">读取前文</Typography>

          <Typography
            as="div"
            variant="h1"
            tone="main"
            className="nrnn-prediction__sentence"
            aria-label={correct ? '我打开书开始学习' : '我打开书开始学，等待下一个字符'}
          >
            <span className="nrnn-prediction__typed-text" aria-hidden="true">
              {sentenceCharacters.map((character, index) => (
                <span
                  className="nrnn-prediction__typed-character"
                  key={`${character}-${index}`}
                  style={{ animationDelay: `${.2 + index * .17}s` }}
                >
                  {character}
                </span>
              ))}
            </span>
            {correct ? (
              <span className="nrnn-prediction__completion" aria-hidden="true">习</span>
            ) : (
              <span className="nrnn-prediction__cursor" aria-hidden="true">＿</span>
            )}
          </Typography>
        </section>

        <div className="nrnn-prediction__lower-row">
          <Question
            className="nrnn-prediction__question"
            type="choice"
            typeLabel="预测题 · 单选"
            title="下一个字符最可能是："
            answer="习"
            persistenceKey="naive-rnn-next-character-v2"
            onCheck={handleCheck}
            feedback={{
              correct: '正确：“学”之后最可能是“习”。',
              wrong: '再看“开始学”的语境。',
            }}
            options={candidates.map((candidate) => ({
              value: candidate.value,
              label: (
                <span className="nrnn-prediction__option">
                  <Typography as="strong" variant="body" tone="inherit">{candidate.value}</Typography>
                  <Typography as="span" variant="bodySmall" tone="muted">{candidate.label}</Typography>
                </span>
              ),
            }))}
          />

          <section className="nrnn-prediction__answer" aria-label="候选字符下一步的可能性">
            <div className="nrnn-prediction__answer-head">
              <Typography as="span" variant="bodySmall" tone="warning">模型输出</Typography>
              <Typography as="h2" variant="h3" tone="accent">每个候选字符下一步的可能性</Typography>
            </div>

            <div className="nrnn-prediction__bars">
              {candidates.map((candidate) => {
                const score = correct && candidate.value === '习' ? .92 : candidate.score;
                const isChosen = chosen === candidate.value;
                return (
                  <div className={`nrnn-prediction__bar-row${candidate.value === '习' ? ' is-best' : ''}${isChosen ? ' is-chosen' : ''}`} key={candidate.value}>
                    <Typography as="strong" variant="h3" tone="main" className="nrnn-prediction__bar-label">{candidate.value}</Typography>
                    <div className="nrnn-prediction__bar-track" aria-hidden="true"><span style={{ width: `${score * 100}%` }} /></div>
                    <Typography as="code" variant="bodySmall" tone="accent">{Math.round(score * 100)}%</Typography>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </ContentBlock>
  );
}
