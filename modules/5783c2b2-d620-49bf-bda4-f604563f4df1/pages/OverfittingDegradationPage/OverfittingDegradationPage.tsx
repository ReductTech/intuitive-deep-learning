import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, EChartsChart, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { buildComparisonChart } from './comparisonChart';
import './OverfittingDegradationPage.css';

type Step = 0 | 1;
const steps = ['01 · 看过拟合', '02 · 看退化'];
const c = (part: string) => 'rtg-error-compare__' + part;

export function OverfittingDegradationPage({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<Step>(0);
  const [testVisible, setTestVisible] = useState(false);
  const [deepVisible, setDeepVisible] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const comparisonVisible = step === 0 ? testVisible : deepVisible;
  const complete = testVisible && deepVisible;
  const chart = useMemo(() => buildComparisonChart(step === 0 ? 'overfitting' : 'degradation', comparisonVisible), [step, comparisonVisible]);
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  function goTo(next: Step) {
    if (next !== 0 && next !== 1 || next === 1 && !testVisible) return;
    moveFocus.current = true; setStep(next);
  }
  function reset() {
    moveFocus.current = step !== 0;
    setStep(0); setTestVisible(false); setDeepVisible(false);
  }
  function advance() {
    if (step === 0) testVisible ? goTo(1) : setTestVisible(true);
    else if (!deepVisible) setDeepVisible(true);
  }
  const title = step === 0 ? '同一个模型，换一组数据' : '同一任务，比较深浅普通网络';
  const action = step === 0 ? testVisible ? '再看深浅网络对照 →' : '加入测试误差，看看新数据 →'
    : '加入更深普通网络的训练误差 →';
  return <ContentBlock shuku-edit-id="e-4b8c51ba-19ca-48db-8a70-7050d696848a" headingLevel={1} className="rtg-error-compare" data-step={step}
    data-test-visible={testVisible} data-deep-visible={deepVisible} data-complete={complete}
    title="过拟合与退化，到底差在哪里？" subtitle="关键区别：训练数据本身，有没有学好？"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <nav shuku-edit-id="e-abfbc3e4-a018-40d0-9d0a-d90d3fe1e0ea" className={c('steps')} aria-label="逐步比较过拟合与退化">
      {steps.map((label, index) => <Button key={label} active={step === index}
        aria-current={step === index ? 'step' : undefined} disabled={index === 1 && !testVisible}
        onClick={() => goTo(index as Step)}>{label}</Button>)}
      <Button className={c('reset')} onClick={reset}>重新观察</Button>
    </nav>
    <section shuku-edit-id="e-aad1e78a-8ae1-4cf3-967d-2ecca401e78a" className={c('scene')} aria-labelledby="rtg-error-compare-title">
      <Typography shuku-edit-id="e-a04e07cb-71bf-4444-b5c1-e35895c6185b" as="h2" variant="h3" tone="accent" id="rtg-error-compare-title" ref={heading} tabIndex={-1}>{title}</Typography>
      <div shuku-edit-id="e-8c6df4e8-a459-4add-af59-9c2dfc63c7c4" className={c('stage')}>
        <div shuku-edit-id="e-57e0c66d-e869-485f-a6bf-c14b027dae34" className={c('visual')}>
          <div shuku-edit-id="e-a1fd0dec-051a-4ef4-abe0-50bd2ec0de21" className={c('legend')} aria-label="曲线含义">
            <Typography shuku-edit-id="e-1e86c874-1f6b-4e95-af06-879569e1a613" as="span" variant="bodySmall" tone="inherit" className={c('training-label')}><i shuku-edit-id="e-466c312b-cbc6-4b27-ae7b-afb08980eb9d" aria-hidden="true" />{step === 0 ? '训练误差' : '浅网络 · 训练误差'}</Typography>
            {comparisonVisible && <Typography shuku-edit-id="e-f6b274a1-d663-4386-8342-51655fdc6ce5" as="span" variant="bodySmall" tone="inherit" className={c(step === 0 ? 'test-label' : 'deep-label')}><i shuku-edit-id="e-06ae1871-cd08-4068-a9c9-7826f6744c88" aria-hidden="true" />{step === 0 ? '测试误差' : '深网络 · 训练误差'}</Typography>}
          </div>
          <div shuku-edit-id="e-f2e0632e-25b5-415d-82b9-b2820bf28137" className={c('plot')}>
            <Typography shuku-edit-id="e-31f4cab3-81ed-467c-bf75-556d5377f1d4" variant="bodySmall" tone="muted">误差（示意）↑</Typography>
            <div shuku-edit-id="e-e2773ec7-9d96-4147-a9af-b5f0720a6a28" className={c('plot-area')}>
              <EChartsChart className={c('chart')} option={chart} minHeight={0}
                role="img" aria-label={step === 0
                  ? testVisible ? '教学示意：蓝色训练误差降低，橙色测试误差先下降后升高。' : '教学示意：暂时只显示蓝色训练误差，随训练过程降低。'
                  : deepVisible ? '教学示意：两条蓝色训练曲线中，实线浅网络误差更低，虚线深网络误差更高。' : '教学示意：暂时只显示浅网络的蓝色训练误差实线。'} />
              <Typography shuku-edit-id="e-4ebf7b42-1801-4f18-a0ef-42fdcf8dd744" variant="bodySmall" tone="muted" className={c('chart-fallback')}>图表加载失败，请刷新重试。</Typography>
            </div>
            <Typography shuku-edit-id="e-50ab23cc-91c3-4267-8314-d3f3d3f59066" variant="bodySmall" tone="muted" align="end">训练过程 →</Typography>
          </div>
        </div>
        <aside shuku-edit-id="e-880232c3-bac5-4add-baa2-92a3dbdc3c5f" className={c('finding')} aria-live="polite" aria-atomic="true">
          <Typography shuku-edit-id="e-c368aec8-e1f6-43d7-b436-d9d2f4f90ac9" variant="bodySmall" tone="muted">观察重点</Typography>
          <Typography shuku-edit-id="e-6846baf0-61c6-4f1a-bbb0-bf1c14950cfa" as="h3" variant="h3" tone="accent">{step === 0
            ? testVisible ? '过拟合' : '先看训练数据' : deepVisible ? '退化问题' : '先看浅网络'}</Typography>
          <Typography shuku-edit-id="e-202d875e-c24f-4353-baf9-a7944686843d" variant="body" tone={comparisonVisible ? 'danger' : 'accent'}>{step === 0
            ? testVisible ? '训练误差低，新数据表现却较差。' : '训练误差降低，还不能说明新数据表现好。'
            : deepVisible ? '更深网络连训练误差都更高。' : '先保留浅网络的训练误差作基准。'}</Typography>
          <Typography shuku-edit-id="e-75c69217-3254-4ed2-8c8a-b3ef20957d3a" variant="bodySmall" tone="muted">{step === 0
            ? testVisible ? '典型的泛化差距：训练数据学得好，不代表未见数据也学得好。' : '加入未见测试集的误差，比较训练与新数据表现。'
            : deepVisible ? '在可比训练条件下，两条曲线都来自训练集，不能只用过拟合解释。' : '这里只比较训练误差，不切换到测试集。'}</Typography>
        </aside>
      </div>
      {!(step === 1 && deepVisible) && <div shuku-edit-id="e-40d95a90-956e-43a0-bc60-000359f0ec76" className={c('actions')}><Button key={step + '-' + comparisonVisible} variant="primary" hint onClick={advance}>{action}</Button></div>}
    </section>
    {complete && <NoticeStrip tone="green" role="status">过拟合：训练与新数据的表现有差距。退化：更深网络的训练误差反而更高。两种现象可以同时存在。</NoticeStrip>}
  </ContentBlock>;
}
