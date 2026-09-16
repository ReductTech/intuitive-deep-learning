import { useState, type FormEvent } from 'react';
import "./SignalDiscoveryPage.css";
import { Button, ContentBlock, NoticeStrip, TextInput, Typography } from '../../../shared/react';
import { useLesson } from '../../LessonContext';
import { analyzeDecision } from '../../services/decisionAnalysis';
import candidateData from '../../data/decisionCandidates.json';

export interface SignalDiscoveryPageProps {
  onComplete: () => void;
}

function editableDecision(value: string) {
  return value.replace(/^是否要/, '').replace(/？$/, '');
}

export function SignalDiscoveryPage({ onComplete }: SignalDiscoveryPageProps) {
  const { state, hydrated, applyAnalysis } = useLesson();
  const [decision, setDecision] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectDecision = (value: string) => {
    setDecision(value);
    setSubmitted(false);
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = decision.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    try {
      const analysis = await analyzeDecision(value);
      applyAnalysis(analysis);
      setSubmitted(true);
      onComplete();
    } catch (reason) {
      setSubmitted(false);
      setError(reason instanceof Error ? reason.message : '决策分析服务暂时不可用。');
    } finally {
      setLoading(false);
    }
  };

  const resultVisible = Boolean(state.analysis && (submitted || editableDecision(state.analysis.decision) === decision.trim()));

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-opening-stage edu-stage--featured ng-decision-discovery"
      title="让神经元帮你做一次判断"
      subtitle="输入一个正在权衡的问题，看看哪些因素正在共同推动你的决定。"
    >
      <form className="ng-decision-composer" onSubmit={submit}>
        <div className="ng-decision-composer__main">
          <Typography variant="body" tone="warning">给出一个需要权衡的决定</Typography>
          <div className="ng-decision-composer__action">
            <div className={`ng-input-row${decision ? ' is-confirmed' : ''}`}>
              <Typography className="ng-input-prefix" variant="body" tone="light">是否要</Typography>
              <TextInput
                controlClassName="ng-decision-input-control"
                value={decision}
                autoComplete="off"
                placeholder="例如：换工作、开始存钱、搬去新的城市"
                aria-label="写下你正在考虑的事情"
                onChange={(event) => selectDecision(event.currentTarget.value)}
              />
            </div>
            <Button type="submit" variant="primary" loading={loading} disabled={!hydrated || !decision.trim()}>
              {loading ? '正在分析影响因素' : '分解复杂决策'}
            </Button>
          </div>
        </div>

        <div className="ng-decision-composer__presets">
          <DecisionMarquee selected={decision} onSelect={selectDecision} />
        </div>

        {error && (
          <NoticeStrip className="ng-opening-status" tone="red" lead={<Typography as="span" variant="body" tone="inherit">分析暂时无法完成：</Typography>}>
            <Typography as="span" variant="body" tone="inherit">{error}</Typography>
          </NoticeStrip>
        )}
      </form>

      <section className="ng-decision-result" aria-live="polite">
          <div className={`ng-decision-result__factors${resultVisible && state.analysis && !loading ? '' : ' is-empty'}`}>
            {(!resultVisible || !state.analysis || loading) && [0, 1, 2].map((index) => (
              <article
                className={`ng-decision-result__placeholder${loading ? ' is-loading' : ''}`}
                key={index}
                aria-hidden={!loading}
              >
                <Typography as="code" variant="body" tone="muted" className="ng-decision-result__placeholder-index">0{index + 1}</Typography>
                {(!loading || index !== 1) && (
                  <div className="ng-decision-result__unknown">
                    <Typography className="ng-decision-result__question" variant="h1" tone="muted">?</Typography>
                  </div>
                )}
                {loading && index === 1 && (
                  <div className="ng-decision-result__loading">
                    <i aria-hidden="true" />
                    <Typography variant="body" tone="muted">分析中…</Typography>
                  </div>
                )}
                <div className="ng-decision-result__skeleton" aria-hidden="true"><i /><i /><i /></div>
              </article>
            ))}
            {resultVisible && state.analysis && !loading && state.analysis.factors.map((factor, index) => (
              <article key={`${factor.name}-${index}`}>
                <div className="ng-decision-result__factor-head">
                  <Typography as="code" variant="body" tone="warning">0{index + 1}</Typography>
                  <Typography as="h4" variant="h3" tone="accent">{factor.name}</Typography>
                </div>
                <Typography variant="body" tone="muted">{factor.explanation}</Typography>
              </article>
            ))}
          </div>
        </section>
    </ContentBlock>
  );
}

const choiceRows = candidateData.rows;

export function DecisionMarquee({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  const renderGroup = (choices: string[], rowIndex: number, duplicate: boolean) => (
    <div className="ng-choice-group" aria-hidden={duplicate || undefined}>
      {choices.map((choice, index) => (
        <button
          className={`ng-choice-chip${selected === choice ? ' is-selected' : ''}`}
          data-tone={(rowIndex + index) % 4}
          key={`${choice}-${duplicate ? 'duplicate' : 'main'}`}
          type="button"
          tabIndex={duplicate ? -1 : undefined}
          aria-pressed={!duplicate && selected === choice}
          onClick={() => onSelect(choice)}
        >
          <Typography as="span" variant="bodySmall" tone="inherit">{choice}</Typography>
        </button>
      ))}
    </div>
  );

  return (
    <div className="ng-decision-stream" aria-label="常见决定示例">
      {choiceRows.map((choices, rowIndex) => (
        <div className={`ng-marquee-row ${rowIndex % 2 === 0 ? 'ng-marquee-row--right' : 'ng-marquee-row--left'}`} key={rowIndex}>
          <div className="ng-marquee-track" style={{ animationDuration: `${92 + rowIndex * 7}s` }}>
            {renderGroup(choices, rowIndex, false)}
            {renderGroup(choices, rowIndex, true)}
          </div>
        </div>
      ))}
    </div>
  );
}
