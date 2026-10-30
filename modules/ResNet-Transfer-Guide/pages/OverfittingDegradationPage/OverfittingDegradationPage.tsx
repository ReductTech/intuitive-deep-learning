import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, EChartsChart, NoticeStrip, Typography } from '../../../shared/react';
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
  return <ContentBlock headingLevel={1} className="rtg-error-compare" data-step={step}
    data-test-visible={testVisible} data-deep-visible={deepVisible} data-complete={complete}
    title="过拟合与退化，到底差在哪里？" subtitle="关键区别：训练数据本身，有没有学好？"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <nav className={c('steps')} aria-label="逐步比较过拟合与退化">
      {steps.map((label, index) => <Button key={label} active={step === index}
        aria-current={step === index ? 'step' : undefined} disabled={index === 1 && !testVisible}
        onClick={() => goTo(index as Step)}>{label}</Button>)}
      <Button className={c('reset')} onClick={reset}>重新观察</Button>
    </nav>
    <section className={c('scene')} aria-labelledby="rtg-error-compare-title">
      <Typography as="h2" variant="h3" tone="accent" id="rtg-error-compare-title" ref={heading} tabIndex={-1}>{title}</Typography>
      <div className={c('stage')}>
        <div className={c('visual')}>
          <div className={c('legend')} aria-label="曲线含义">
            <Typography as="span" variant="bodySmall" tone="inherit" className={c('training-label')}><i aria-hidden="true" />{step === 0 ? '训练误差' : '浅网络 · 训练误差'}</Typography>
            {comparisonVisible && <Typography as="span" variant="bodySmall" tone="inherit" className={c(step === 0 ? 'test-label' : 'deep-label')}><i aria-hidden="true" />{step === 0 ? '测试误差' : '深网络 · 训练误差'}</Typography>}
          </div>
          <div className={c('plot')}>
            <Typography variant="bodySmall" tone="muted">误差（示意）↑</Typography>
            <div className={c('plot-area')}>
              <EChartsChart className={c('chart')} option={chart} minHeight={0}
                role="img" aria-label={step === 0
                  ? testVisible ? '教学示意：蓝色训练误差降低，橙色测试误差先下降后升高。' : '教学示意：暂时只显示蓝色训练误差，随训练过程降低。'
                  : deepVisible ? '教学示意：两条蓝色训练曲线中，实线浅网络误差更低，虚线深网络误差更高。' : '教学示意：暂时只显示浅网络的蓝色训练误差实线。'} />
              <Typography variant="bodySmall" tone="muted" className={c('chart-fallback')}>图表加载失败，请刷新重试。</Typography>
            </div>
            <Typography variant="bodySmall" tone="muted" align="end">训练过程 →</Typography>
          </div>
        </div>
        <aside className={c('finding')} aria-live="polite" aria-atomic="true">
          <Typography variant="bodySmall" tone="muted">观察重点</Typography>
          <Typography as="h3" variant="h3" tone="accent">{step === 0
            ? testVisible ? '过拟合' : '先看训练数据' : deepVisible ? '退化问题' : '先看浅网络'}</Typography>
          <Typography variant="body" tone={comparisonVisible ? 'danger' : 'accent'}>{step === 0
            ? testVisible ? '训练误差低，新数据表现却较差。' : '训练误差降低，还不能说明新数据表现好。'
            : deepVisible ? '更深网络连训练误差都更高。' : '先保留浅网络的训练误差作基准。'}</Typography>
          <Typography variant="bodySmall" tone="muted">{step === 0
            ? testVisible ? '典型的泛化差距：训练数据学得好，不代表未见数据也学得好。' : '加入未见测试集的误差，比较训练与新数据表现。'
            : deepVisible ? '在可比训练条件下，两条曲线都来自训练集，不能只用过拟合解释。' : '这里只比较训练误差，不切换到测试集。'}</Typography>
        </aside>
      </div>
      {!(step === 1 && deepVisible) && <div className={c('actions')}><Button key={step + '-' + comparisonVisible} variant="primary" hint onClick={advance}>{action}</Button></div>}
    </section>
    {complete && <NoticeStrip tone="green" role="status">过拟合：训练与新数据的表现有差距。退化：更深网络的训练误差反而更高。两种现象可以同时存在。</NoticeStrip>}
  </ContentBlock>;
}
