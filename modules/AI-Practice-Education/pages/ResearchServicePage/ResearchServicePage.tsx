import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, FileText, CircleCheck, ArrowUpRight } from 'lucide-react';
import { Button, ContentBlock, Select, TextInput, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import predictionSnapshots from './predictionSnapshots.json';
import './ResearchServicePage.css';

const SERVICE_URL = 'https://huggingface.co/spaces/ssocean/Newborn_Article_Impact_Predict';
// These snapshots preserve the original illustrative scores. The one-time online
// capture failed, so they must not be described as recorded model predictions.
const examples = predictionSnapshots.examples;
type Mode = 'both' | 'v1' | 'v2';
type Scores = { impact: number | null; quality: number | null };
const empty: Scores = { impact: null, quality: null };
const modes = [{ value: 'both', label: '影响力与质量 · 双模型评价' }, { value: 'v1', label: 'NAIP V1 · 影响力预测' }, { value: 'v2', label: 'NAIP V2 · 质量估计' }];
const metrics = [{ key: 'impact' as const, label: '影响力评分', model: 'NAIP V1', color: '#3789f7', radius: 124 }, { key: 'quality' as const, label: '质量评分', model: 'NAIP V2', color: '#19b7b6', radius: 91 }];

function useUsageCount(visible: boolean, reducedMotion: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) { setCount(14000); return; }
    setCount(0);
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1800);
      setCount(Math.floor(14000 * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, reducedMotion]);
  return count;
}

export function ResearchServicePage() {
  const root = useRef<HTMLElement>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('both'), [scores, setScores] = useState<Scores>(examples[0]);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const replayTimer = useRef<number | null>(null), revision = useRef(0);
  const example = examples[exampleIndex];
  const runCount = useUsageCount(visible, reducedMotion);
  function cancel() {
    revision.current++;
    if (replayTimer.current !== null) window.clearTimeout(replayTimer.current);
    replayTimer.current = null;
    setRunning(false);
  }
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
      observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); preference.removeEventListener('change', updateMotion);
      revision.current++; if (replayTimer.current !== null) window.clearTimeout(replayTimer.current);
    };
  }, []);
  useEffect(() => { if (!visible) { cancel(); fixtures(exampleIndex, mode); } }, [visible, exampleIndex, mode]);
  function fixtures(index: number, value: Mode) {
    setScores({ impact: value === 'v2' ? null : examples[index].impact, quality: value === 'v1' ? null : examples[index].quality });
  }
  function loadExample(index: number) { cancel(); setExampleIndex(index); fixtures(index, mode); }
  function changeMode(value: string) {
    cancel(); setMode(value as Mode); fixtures(exampleIndex, value as Mode);
  }
  function predict() {
    if (running) return;
    cancel(); const token = revision.current;
    setScores(empty); setRunning(true);
    replayTimer.current = window.setTimeout(() => {
      if (token !== revision.current) return;
      fixtures(exampleIndex, mode); setRunning(false); replayTimer.current = null;
    }, reducedMotion ? 0 : 1000);
  }
  return <ContentBlock ref={root} className="aipe-service-page" headingLevel={1} title={outline.pages[7].title} subtitle="基于论文题目与摘要，展示大模型的论文影响力预测与质量估计" bodyClassName="aipe-service-body">
    <section className="aipe-service-demo" aria-label="Gradio 风格论文评价服务" onKeyDown={e => e.stopPropagation()}>
      <header className="aipe-service-demo-head"><ChartNoAxesColumnIncreasing aria-hidden="true" /><div><Typography as="h2" variant="body" tone="accent"><strong>Predict Impact &amp; Quality of Newborn Papers</strong></Typography><Typography variant="bodySmall" tone="muted">固定论文示例 · 本地演示回放</Typography></div></header>
      <div className="aipe-service-form-layout">
        <div className="aipe-service-inputs">
          <Select label="评价模式" options={modes.map(option => ({...option, label: <Typography as="span" variant="bodySmall" tone="inherit">{option.label}</Typography>}))} value={mode} onChange={changeMode} />
          <TextInput multiline readOnly label="论文题目" aria-label="论文题目" value={example.title} rows={2} className="aipe-service-title-input aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文论文题目" />
          <TextInput multiline readOnly label="论文摘要" aria-label="论文摘要" value={example.abstract} rows={6} className="aipe-service-abstract aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文摘要示例" />
          <Button className="aipe-service-predict" loading={running} onClick={predict}>{running ? '大模型预测中…' : '大模型预测'}</Button>
        </div>
        <div className="aipe-service-results" aria-label="论文评价结果" aria-live="polite" aria-busy={running}>
          <Typography as="h3" variant="body" tone="accent"><strong>论文评价结果</strong></Typography>
          <div className="aipe-service-dual-ring" role="img" aria-label={metrics.map(item => item.label + ' ' + (scores[item.key]?.toFixed(2) ?? '待预测')).join('，')}>
            <svg viewBox="0 0 300 300" aria-hidden="true">{metrics.map(item => <g key={item.key}><circle cx="150" cy="150" r={item.radius} fill="none" stroke="#e5ebf3" strokeWidth="19" /><circle data-ring={item.key} cx="150" cy="150" r={item.radius} fill="none" stroke={item.color} strokeOpacity={scores[item.key] === null ? 0 : 1} strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={(scores[item.key] ?? 0) + ' 1'} transform="rotate(-90 150 150)" /></g>)}</svg>
            <div className="aipe-service-ring-center"><span><FileText aria-hidden="true" /><CircleCheck aria-hidden="true" /></span></div>
          </div>
          <div className="aipe-service-result-legend">{metrics.map(item => <div key={item.key}><span className="aipe-service-result-dot" style={{ background: item.color }} /><Typography variant="bodySmall" tone="accent">{item.model} · {item.label}</Typography><Typography variant="bodySmall" tone="accent" data-score={item.key}><strong>{scores[item.key]?.toFixed(2) ?? '—'}</strong></Typography></div>)}</div>
        </div>
      </div>
      <div className="aipe-service-examples"><Typography variant="bodySmall" tone="accent"><FileText aria-hidden="true" /> 示例论文</Typography><div>{examples.map((example, index) => <Button key={example.label} active={index === exampleIndex} onClick={() => loadExample(index)}>{example.label}</Button>)}</div></div>
    </section>
    <aside className="aipe-service-promotion" aria-label="服务使用规模与体验入口">
      <div className="aipe-service-usage"><Typography as="h2" variant="body" tone="accent"><strong>在线服务累计运行</strong></Typography><div className="aipe-service-run-count" role="img" aria-label="在线服务累计运行 14,000 次以上"><Typography as="span" variant="display" tone="accent" aria-hidden="true"><span data-run-count={runCount}>{runCount.toLocaleString('en-US')}</span><span className="aipe-service-run-plus">+</span></Typography><Typography as="span" variant="bodySmall" tone="accent" aria-hidden="true">次</Typography></div><Typography variant="bodySmall" tone="muted">项目方统计</Typography></div>
      <div className="aipe-service-qr-area"><Typography as="h3" variant="body" tone="accent"><strong>扫码体验在线服务</strong></Typography><img src={moduleAssetUrl(outline.moduleIdentity.id, 'images/naip-service-qr.svg')} width="246" height="246" alt="Hugging Face 论文评价服务二维码" /><Button href={SERVICE_URL} target="_blank" rel="noreferrer">打开 Hugging Face Demo <ArrowUpRight aria-hidden="true" /></Button></div>
    </aside>
  </ContentBlock>;
}
