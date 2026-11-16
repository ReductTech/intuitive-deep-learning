import { useState } from 'react';
import "./SignalDiscoveryPage.css";
import { Button, ContentBlock, NoticeStrip, TextInput, Typography } from "@shuku/course-style/react";
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

  const submit = async () => {
    const value = decision.trim();
    if (!hydrated || !value || loading) return;
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
    <ContentBlock shuku-edit-id="e-bbf6400c-1f1e-4cc9-b634-64a7a13f12eb"
      headingLevel={1}
      className="ngtw-opening-stage ngtw-decision-discovery"
      title="让神经元帮你做一次判断"
      subtitle="输入一个正在权衡的问题，看看哪些因素正在共同推动你的决定。"
    >
      <div shuku-edit-id="e-2488b3b0-8b67-4eea-ab06-4e6e85ea1b8e" className="ngtw-decision-composer grid gap-[18px] p-[22px_24px]">
        <div shuku-edit-id="e-2cde649c-b444-42a1-b91c-4b4a6d0e2f70" className="ngtw-decision-composer__main grid gap-[9px]">
          <Typography shuku-edit-id="e-630fbdc2-4ae5-4eb1-8b69-796b122d4c73" variant="body" tone="warning">给出一个需要权衡的决定</Typography>
          <div shuku-edit-id="e-49da7520-64f1-4c63-930a-8884091b7efb" className="ngtw-decision-composer__action grid grid-cols-[minmax(0,_1fr)_auto] items-stretch gap-[12px]">
            <div shuku-edit-id="e-d1d6b290-5aef-4fcb-9e59-e588226692f4" className={`ngtw-input-row grid grid-cols-[auto_minmax(0,_1fr)] items-center rounded-[8px] bg-[#f9fbfd] overflow-hidden${decision ? ' is-confirmed' : ''}`}>
              <Typography shuku-edit-id="e-548bdf4f-a7e9-4049-96c4-48df25dd0edc" className="ngtw-input-prefix" variant="body" tone="light">是否要</Typography>
              <TextInput
                controlClassName="ngtw-decision-input-control contents"
                value={decision}
                autoComplete="off"
                placeholder="例如：换工作、开始存钱、搬去新的城市"
                aria-label="写下你正在考虑的事情"
                onChange={(event) => selectDecision(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
                  event.preventDefault();
                  void submit();
                }}
              />
            </div>
            <Button type="button" onClick={() => void submit()} variant="primary" loading={loading} disabled={!hydrated || !decision.trim()}>
              {loading ? '正在分析影响因素' : '分解复杂决策'}
            </Button>
          </div>
        </div>

        <div shuku-edit-id="e-2e2b28af-8cc9-4227-b709-a697d6f37b7f" className="ngtw-decision-composer__presets grid gap-[10px] pt-[15px]">
          <DecisionMarquee selected={decision} onSelect={selectDecision} />
        </div>

        {error && (
          <NoticeStrip className="ngtw-opening-status m-0" tone="red" lead={<Typography shuku-edit-id="e-877f4d32-2164-4441-83f5-a59300722405" as="span" variant="body" tone="inherit">分析暂时无法完成：</Typography>}>
            <Typography shuku-edit-id="e-9aee0c2a-d684-4fad-b04e-42abb41d0c06" as="span" variant="body" tone="inherit">{error}</Typography>
          </NoticeStrip>
        )}
      </div>

      <section shuku-edit-id="e-22093770-5224-4e25-a4e8-233dd49abc9d" className="ngtw-decision-result relative grid gap-0 bg-[transparent] p-[18px_0_0]" aria-live="polite">
          <div shuku-edit-id="e-7246b390-df9d-4bc8-bbf0-cc979235ea96" className={`ngtw-decision-result__factors grid grid-cols-[repeat(3,_minmax(0,_1fr))] gap-[16px]${resultVisible && state.analysis && !loading ? '' : ' is-empty'}`}>
            {(!resultVisible || !state.analysis || loading) && [0, 1, 2].map((index) => (
              <article shuku-edit-id="e-60648ecd-15a3-433b-ab25-136b1d01a952"
                className={`ngtw-decision-result__placeholder${loading ? ' is-loading' : ''}`}
                key={index}
                aria-hidden={!loading}
              >
                <Typography shuku-edit-id="e-fd38522b-36d8-4eb9-b4dd-75e857cc0a77" as="code" variant="body" tone="muted" className="ngtw-decision-result__placeholder-index">0{index + 1}</Typography>
                {(!loading || index !== 1) && (
                  <div shuku-edit-id="e-67245d7c-673d-4c64-8aa0-2b905ad40c46" className="ngtw-decision-result__unknown grid w-[62px] h-[62px] place-items-center self-center rounded-[50%] bg-[rgba(255,255,255,.82)]">
                    <Typography shuku-edit-id="e-21bb336b-2222-4578-865d-11f04503c18d" className="ngtw-decision-result__question" variant="h1" tone="muted">?</Typography>
                  </div>
                )}
                {loading && index === 1 && (
                  <div shuku-edit-id="e-32aa7ab8-cd3d-45c6-a175-c16f376f8ae1" className="ngtw-decision-result__loading inline-flex items-center gap-[10px]">
                    <i shuku-edit-id="e-9bec0f6b-dd41-4c5e-83da-b628dff4861c" aria-hidden="true" />
                    <Typography shuku-edit-id="e-ae6a8988-0f41-4e66-bda8-1932c48ca8e7" variant="body" tone="muted">分析中…</Typography>
                  </div>
                )}
                <div shuku-edit-id="e-6a8a1d27-9217-4a90-8b9e-e1b4f043c6fe" className="ngtw-decision-result__skeleton grid w-full gap-[7px]" aria-hidden="true"><i shuku-edit-id="e-8e8a298c-542f-4fe1-b3bc-5acd715dee74" /><i shuku-edit-id="e-4295d317-b6ba-4307-9b19-51a21ba4d945" /><i shuku-edit-id="e-6e666d95-8ce1-4c89-8668-02881f772105" /></div>
              </article>
            ))}
            {resultVisible && state.analysis && !loading && state.analysis.factors.map((factor, index) => (
              <article shuku-edit-id="e-5fd74d56-08f6-4738-a187-7f635d468864" key={`${factor.name}-${index}`}>
                <div shuku-edit-id="e-6dae257a-7da0-4fcd-8917-6c0fa3e45f34" className="ngtw-decision-result__factor-head flex items-baseline gap-[10px]">
                  <Typography shuku-edit-id="e-5ea908e9-6958-4d37-9bb4-544ec7c28fa2" as="code" variant="body" tone="warning">0{index + 1}</Typography>
                  <Typography shuku-edit-id="e-8fcd1a2f-3bae-4588-bf8c-e0f98f0c770c" as="h4" variant="h3" tone="accent">{factor.name}</Typography>
                </div>
                <Typography shuku-edit-id="e-fd2fa48c-a5ea-4a0c-afe6-20d0782cea85" variant="body" tone="muted">{factor.explanation}</Typography>
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
    <div shuku-edit-id="e-e3f09ffc-5288-4cf3-a2dd-404a4c32ee72" className="ngtw-choice-group flex gap-[10px] pr-[10px]" aria-hidden={duplicate || undefined}>
      {choices.map((choice, index) => (
        <button shuku-edit-id="e-0fd374bb-e01b-468d-bca1-8a5b58cf56de"
          className={`ngtw-choice-chip min-h-[42px] rounded-[7px] bg-[#fff] p-[8px_17px]${selected === choice ? ' is-selected' : ''}`}
          data-tone={(rowIndex + index) % 4}
          key={`${choice}-${duplicate ? 'duplicate' : 'main'}`}
          type="button"
          tabIndex={duplicate ? -1 : undefined}
          aria-pressed={!duplicate && selected === choice}
          onClick={() => onSelect(choice)}
        >
          <Typography shuku-edit-id="e-2de39719-b985-4cce-a262-bd18711a965b" as="span" variant="bodySmall" tone="inherit">{choice}</Typography>
        </button>
      ))}
    </div>
  );

  return (
    <div shuku-edit-id="e-82f1aaf3-9a60-47cc-9a85-dfd58c5d2914" className="ngtw-decision-stream relative grid content-center gap-[10px] min-h-[220px] p-[18px_0] overflow-hidden rounded-[8px]" aria-label="常见决定示例">
      {choiceRows.map((choices, rowIndex) => (
        <div shuku-edit-id="e-709cd7e7-30d5-4b6e-a124-578452195658" className={`ngtw-marquee-row flex w-full overflow-hidden ${rowIndex % 2 === 0 ? 'ngtw-marquee-row--right' : 'ngtw-marquee-row--left'}`} key={rowIndex}>
          <div shuku-edit-id="e-168ac267-ab7a-4be1-a059-d26710e59315" className="ngtw-marquee-track flex" style={{ animationDuration: `${92 + rowIndex * 7}s` }}>
            {renderGroup(choices, rowIndex, false)}
            {renderGroup(choices, rowIndex, true)}
          </div>
        </div>
      ))}
    </div>
  );
}

