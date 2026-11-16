import { useRef, useState } from 'react';
import { ContentBlock, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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
    <ContentBlock shuku-edit-id="e-e2b8a390-0cd4-4f0f-88fa-fd332f88b458"
      headingLevel={1}
      className="nrnn-prediction"
      title="预测：读到这里，下一个字符最可能是什么？"
      subtitle="RNN 利用已经读过的内容，为每个候选字符打分。"
    >
      <div shuku-edit-id="e-74dbd546-879d-4eba-80bd-99c6a2b06472" className="nrnn-prediction__layout">
        <section shuku-edit-id="e-a1899803-4d6b-4ae5-ac72-0117a2af493e" className={`nrnn-prediction__prompt${correct ? ' is-complete' : ''}`} aria-label="读取前文">
          <Typography shuku-edit-id="e-38966abf-d976-4530-950a-27ccd3ff9181" as="span" variant="bodySmall" tone="warning">读取前文</Typography>

          <Typography shuku-edit-id="e-b2c26037-d647-47e5-9a0d-d90dd5d6a873"
            as="div"
            variant="h1"
            tone="main"
            className="nrnn-prediction__sentence"
            aria-label={correct ? '我打开书开始学习' : '我打开书开始学，等待下一个字符'}
          >
            <span shuku-edit-id="e-c1a3a17a-e82e-4868-8fcd-d293b3e60651" className="nrnn-prediction__typed-text" aria-hidden="true">
              {sentenceCharacters.map((character, index) => (
                <span shuku-edit-id="e-9d4988ac-0445-4a96-a6f7-c0e079b127ea"
                  className="nrnn-prediction__typed-character"
                  key={`${character}-${index}`}
                  style={{ animationDelay: `${.2 + index * .17}s` }}
                >
                  {character}
                </span>
              ))}
            </span>
            {correct ? (
              <span shuku-edit-id="e-b47c7c46-8756-4023-a87c-068e87d48ead" className="nrnn-prediction__completion" aria-hidden="true">习</span>
            ) : (
              <span shuku-edit-id="e-464cf096-2656-48e6-a11e-4a2bf1995b69" className="nrnn-prediction__cursor" aria-hidden="true">＿</span>
            )}
          </Typography>
        </section>

        <div shuku-edit-id="e-7ae70ff4-9d3a-42fe-ab56-327b05098b6b" className="nrnn-prediction__lower-row">
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
                <span shuku-edit-id="e-0950c1d8-af36-4d2e-a132-5e903c5e9353" className="nrnn-prediction__option">
                  <Typography shuku-edit-id="e-0df2d26c-f200-448e-9576-66c888215f98" as="strong" variant="body" tone="inherit">{candidate.value}</Typography>
                  <Typography shuku-edit-id="e-0b46931e-4adc-46ab-b78e-31b20826f9b4" as="span" variant="bodySmall" tone="muted">{candidate.label}</Typography>
                </span>
              ),
            }))}
          />

          <section shuku-edit-id="e-606c61cb-c89f-45d9-b888-c41d291f320d" className="nrnn-prediction__answer" aria-label="候选字符下一步的可能性">
            <div shuku-edit-id="e-72039dab-715c-4631-92c3-285e2c58b0c0" className="nrnn-prediction__answer-head">
              <Typography shuku-edit-id="e-24b4f5bf-2107-44ff-b461-9b3ba21963d0" as="span" variant="bodySmall" tone="warning">模型输出</Typography>
              <Typography shuku-edit-id="e-df346e90-53cb-49a1-832d-cc50b108afca" as="h2" variant="h3" tone="accent">每个候选字符下一步的可能性</Typography>
            </div>

            <div shuku-edit-id="e-aea646c3-5f73-4f2e-beff-f6ee09135a60" className="nrnn-prediction__bars">
              {candidates.map((candidate) => {
                const score = correct && candidate.value === '习' ? .92 : candidate.score;
                const isChosen = chosen === candidate.value;
                return (
                  <div shuku-edit-id="e-7aeaf132-c45a-48c8-ba54-cc37bfe7cc54" className={`nrnn-prediction__bar-row${candidate.value === '习' ? ' is-best' : ''}${isChosen ? ' is-chosen' : ''}`} key={candidate.value}>
                    <Typography shuku-edit-id="e-fad07232-6bf8-4726-b78a-47abdc63867a" as="strong" variant="h3" tone="main" className="nrnn-prediction__bar-label">{candidate.value}</Typography>
                    <div shuku-edit-id="e-1ef5bfd6-f5e8-4a24-ac77-96322ff5e311" className="nrnn-prediction__bar-track" aria-hidden="true"><span shuku-edit-id="e-97a93bd2-8563-4551-958a-2cc6e78e99b9" style={{ width: `${score * 100}%` }} /></div>
                    <Typography shuku-edit-id="e-e50a6941-d701-436e-bf4c-5d4f2c0e42ab" as="code" variant="bodySmall" tone="accent">{Math.round(score * 100)}%</Typography>
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
