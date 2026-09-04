import { useState, type FormEvent } from 'react';
import { Button, ContentBlock, NoticeStrip, TextInput, Typography } from '../../shared/react';
import { DecisionMarquee } from '../components/DecisionMarquee';
import { useNeuronLesson } from '../model/NeuronLessonContext';
import { analyzeDecision } from '../services/decisionAnalysis';

export interface SignalDiscoveryBlockProps {
  onComplete: () => void;
}

function editableDecision(value: string) {
  return value.replace(/^是否要/, '').replace(/？$/, '');
}

export function SignalDiscoveryBlock({ onComplete }: SignalDiscoveryBlockProps) {
  const { state, hydrated, applyAnalysis } = useNeuronLesson();
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
      className="ng-opening-stage edu-stage--featured ng-decision-discovery"
      title="让神经元帮你做一次判断"
      subtitle="输入一个正在权衡的问题，看看哪些因素正在共同推动你的决定。"
    >
      <form className="ng-decision-composer" onSubmit={submit}>
        <div className="ng-decision-composer__main">
          <Typography variant="bodySmall" tone="warning">给出一个需要权衡的决定</Typography>
          <div className="ng-decision-composer__action">
            <div className={`ng-input-row${decision ? ' is-confirmed' : ''}`}>
              <Typography className="ng-input-prefix" variant="bodySmall" tone="light">是否要</Typography>
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
          <NoticeStrip className="ng-opening-status" tone="red" lead={<Typography as="span" variant="bodySmall" tone="inherit">分析暂时无法完成：</Typography>}>
            <Typography as="span" variant="bodySmall" tone="inherit">{error}</Typography>
          </NoticeStrip>
        )}
      </form>

      <section className="ng-decision-result" aria-live="polite">
          <div className="ng-decision-result__head">
            <div>
              <Typography variant="bodySmall" tone="warning">{loading ? '正在分析' : '分析结果'}</Typography>
              <Typography as="h3" variant="h2" tone="accent">
                {resultVisible && state.analysis ? '这个决定主要受三类因素影响' : '三个主要影响因素'}
              </Typography>
            </div>
            {resultVisible && state.analysis && (
              <Typography variant="bodySmall" tone="muted">{state.analysis.decision}</Typography>
            )}
          </div>

          <div className="ng-decision-result__branches" aria-hidden="true"><i /><i /><i /></div>
          <div className={`ng-decision-result__factors${resultVisible && state.analysis && !loading ? '' : ' is-empty'}`}>
            {(!resultVisible || !state.analysis || loading) && [0, 1, 2].map((index) => (
              <article
                className={`ng-decision-result__placeholder${loading ? ' is-loading' : ''}`}
                key={index}
                aria-hidden={!loading}
              >
                <Typography as="code" variant="bodySmall" tone="muted" className="ng-decision-result__placeholder-index">0{index + 1}</Typography>
                {(!loading || index !== 1) && (
                  <div className="ng-decision-result__unknown">
                    <Typography className="ng-decision-result__question" variant="h2" tone="muted">?</Typography>
                  </div>
                )}
                {loading && index === 1 && (
                  <div className="ng-decision-result__loading">
                    <i aria-hidden="true" />
                    <Typography variant="bodySmall" tone="muted">分析中…</Typography>
                  </div>
                )}
                <div className="ng-decision-result__skeleton" aria-hidden="true"><i /><i /><i /></div>
              </article>
            ))}
            {resultVisible && state.analysis && !loading && state.analysis.factors.map((factor, index) => (
              <article key={`${factor.name}-${index}`}>
                <div className="ng-decision-result__factor-head">
                  <Typography as="code" variant="bodySmall" tone="warning">0{index + 1}</Typography>
                  <Typography as="h4" variant="h3" tone="accent">{factor.name}</Typography>
                </div>
                <Typography variant="bodySmall" tone="muted">{factor.explanation}</Typography>
              </article>
            ))}
          </div>
        </section>
    </ContentBlock>
  );
}
