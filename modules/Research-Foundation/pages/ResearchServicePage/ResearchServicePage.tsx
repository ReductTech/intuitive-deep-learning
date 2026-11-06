import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, FileText, CircleCheck, LoaderCircle } from 'lucide-react';
import { ContentBlock, TextInput, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import predictionSnapshots from './predictionSnapshots.json';
import './ResearchServicePage.css';

// Illustrative local scores, not recorded online model predictions.
const examples = predictionSnapshots.examples;
const SLOT = 3000, END = 10000;
const metrics = [{ key: 'impact' as const, label: '影响力评分', model: 'NAIP V1', color: '#3789f7', radius: 124 }, { key: 'quality' as const, label: '质量评分', model: 'NAIP V2', color: '#19b7b6', radius: 91 }];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return 1 - (1 - t) ** 3; };

export function ResearchServicePage() {
  const root = useRef<HTMLElement>(null), elapsed = useRef(0);
  const [time, setTime] = useState(0), [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const exampleIndex = Math.min(examples.length - 1, Math.floor(time / SLOT));
  const example = examples[exampleIndex], local = time - exampleIndex * SLOT;
  const phase = time >= END ? 'complete' : local < 350 ? 'input' : local < 1100 ? 'predicting' : 'result';
  const running = phase === 'predicting', hasResult = phase === 'result' || phase === 'complete';
  const progress = reducedMotion ? 1 : ease((local - 1100) / 700);
  const scores = { impact: hasResult ? example.impact * progress : null, quality: hasResult ? example.quality * progress : null };
  const runCount = reducedMotion ? 14000 : Math.floor(14000 * ease(time / 1800));

  useEffect(() => {
    const element = root.current; if (!element) return;
    let intersecting = false;
    const updateVisibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; updateVisibility(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', updateVisibility);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(preference.matches); updateMotion();
    preference.addEventListener('change', updateMotion);
    return () => {
      observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility);
      preference.removeEventListener('change', updateMotion);
    };
  }, []);
  useEffect(() => {
    if (!visible || elapsed.current >= END) return;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      elapsed.current = Math.min(END, elapsed.current + Math.max(0, Math.min(now - last, 100)));
      setTime(elapsed.current); last = now;
      if (elapsed.current < END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  useEffect(() => {
    const abstract = root.current?.querySelector<HTMLTextAreaElement>('.rf-service-abstract');
    if (abstract) abstract.scrollTop = Math.max(0, abstract.scrollHeight - abstract.clientHeight) * (reducedMotion ? 0 : ease((local - 1300) / 1400));
  }, [local, exampleIndex, reducedMotion]);

  return <ContentBlock ref={root} className="rf-service-page" headingLevel={1} title={outline.pages[6].title} subtitle="基于论文题目与摘要，展示大模型的论文影响力预测与质量估计" bodyClassName="rf-service-body" data-example-index={exampleIndex} data-phase={phase} data-elapsed={Math.round(time)} data-playing={visible && time < END}>
    <section className="rf-service-demo" aria-label="论文评价服务自动演示">
      <header className="rf-service-demo-head"><ChartNoAxesColumnIncreasing aria-hidden="true" /><div><Typography as="h2" variant="body" tone="accent"><strong>Predict Impact &amp; Quality of Newborn Papers</strong></Typography><Typography variant="bodySmall" tone="muted">自动演示 · 评分为示意值</Typography></div></header>
      <div className="rf-service-form-layout">
        <div className="rf-service-inputs">
          <div className="rf-service-mode"><Typography variant="bodySmall" tone="muted">评价模式</Typography><Typography variant="bodySmall" tone="accent">影响力与质量 · 双模型评价</Typography></div>
          <TextInput multiline readOnly tabIndex={-1} label="论文题目" aria-label="论文题目" value={example.title} rows={2} className="rf-service-title-input rf-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读英文论文题目" />
          <TextInput multiline readOnly tabIndex={-1} label="论文摘要" aria-label="论文摘要" value={example.abstract} rows={6} className="rf-service-abstract rf-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读英文摘要示例" />
          <div className={'rf-service-auto-status' + (hasResult ? ' is-complete' : '')} data-prediction-status={phase}>
            {running ? <LoaderCircle aria-hidden="true" /> : hasResult ? <CircleCheck aria-hidden="true" /> : <FileText aria-hidden="true" />}
            <Typography variant="bodySmall" tone="inherit">{running ? '大模型预测中…' : hasResult ? '双模型评价完成' : '自动载入论文题目与摘要'}</Typography>
          </div>
        </div>
        <div className="rf-service-results" aria-label="论文评价结果" aria-live="off">
          <Typography as="h3" variant="body" tone="accent"><strong>论文评价结果</strong></Typography>
          <div className="rf-service-dual-ring" role="img" aria-label={metrics.map(item => item.label + ' ' + (scores[item.key]?.toFixed(2) ?? '待预测')).join('，')}>
            <svg viewBox="0 0 300 300" aria-hidden="true">{metrics.map(item => <g key={item.key}><circle cx="150" cy="150" r={item.radius} fill="none" stroke="#e5ebf3" strokeWidth="19" /><circle data-ring={item.key} cx="150" cy="150" r={item.radius} fill="none" stroke={item.color} strokeOpacity={scores[item.key] === null ? 0 : 1} strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={(scores[item.key] ?? 0) + ' 1'} transform="rotate(-90 150 150)" /></g>)}</svg>
            <div className="rf-service-ring-center"><span><FileText aria-hidden="true" /><CircleCheck aria-hidden="true" /></span></div>
          </div>
          <div className="rf-service-result-legend">{metrics.map(item => <div key={item.key}><span className="rf-service-result-dot" style={{ background: item.color }} /><Typography variant="bodySmall" tone="accent">{item.model} · {item.label}</Typography><Typography variant="bodySmall" tone="accent" data-score={item.key}><strong>{scores[item.key]?.toFixed(2) ?? '—'}</strong></Typography></div>)}</div>
        </div>
      </div>
      <div className="rf-service-examples"><Typography variant="bodySmall" tone="accent"><FileText aria-hidden="true" /> 示例论文</Typography><div>{examples.map((item, index) => <div key={item.label} className={'rf-service-example' + (index === exampleIndex ? ' is-active' : '')} aria-current={index === exampleIndex ? 'step' : undefined}><Typography variant="bodySmall" tone="inherit">{item.label}</Typography></div>)}</div></div>
    </section>
    <aside className="rf-service-promotion" aria-label="服务使用规模与体验入口">
      <div className="rf-service-usage"><Typography as="h2" variant="body" tone="accent"><strong>在线服务累计运行</strong></Typography><div className="rf-service-run-count" role="img" aria-label="在线服务累计运行 14,000 次以上"><Typography as="span" variant="display" tone="accent" aria-hidden="true"><span data-run-count={runCount}>{runCount.toLocaleString('en-US')}</span><span className="rf-service-run-plus">+</span></Typography><Typography as="span" variant="bodySmall" tone="accent" aria-hidden="true">次</Typography></div><Typography variant="bodySmall" tone="muted">项目方统计</Typography></div>
      <div className="rf-service-hugging-face"><img src={moduleAssetUrl(outline.moduleIdentity.id, 'images/hugging-face-logo.svg')} width="95" height="88" alt="Hugging Face" /></div>
      <div className="rf-service-qr-area"><Typography as="h3" variant="body" tone="accent"><strong>扫码体验在线服务</strong></Typography><img src={moduleAssetUrl(outline.moduleIdentity.id, 'images/naip-service-qr.svg')} width="246" height="246" alt="Hugging Face 论文评价服务二维码" /><Typography variant="bodySmall" tone="muted">Hugging Face 在线服务</Typography></div>
    </aside>
  </ContentBlock>;
}
