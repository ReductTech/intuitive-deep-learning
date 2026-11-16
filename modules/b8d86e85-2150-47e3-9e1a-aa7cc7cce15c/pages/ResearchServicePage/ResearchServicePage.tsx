import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, FileText, CircleCheck, ArrowUpRight } from 'lucide-react';
import { Button, ContentBlock, Select, TextInput, Typography } from "@shuku/course-style/react";
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
const metrics = [{ key: 'impact' as const, label: '潜在影响力预测', model: 'NAIP V1', color: '#3789f7', radius: 124 }, { key: 'quality' as const, label: '质量估计', model: 'NAIP V2', color: '#19b7b6', radius: 91 }];

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
  return <ContentBlock shuku-edit-id="e-a15c5132-8f31-4f79-99ee-08ae27ac48a8" ref={root} className="aipe-service-page" headingLevel={1} title={outline.pages.find(page => page.id === '3b2b1ca6-6e33-4ef8-965a-0c6077b374e4')!.title} subtitle="提供潜在影响力与质量估计参考，辅助安排阅读优先级" bodyClassName="aipe-service-body">
    <section shuku-edit-id="e-5cede661-d5cb-46ea-95ac-a07cd755eecb" className="aipe-service-demo" aria-label="Gradio 风格论文评价服务" onKeyDown={e => e.stopPropagation()}>
      <header shuku-edit-id="e-7674f100-94eb-4ae5-9e25-cbcc07e5f460" className="aipe-service-demo-head"><ChartNoAxesColumnIncreasing aria-hidden="true" /><div shuku-edit-id="e-37eb77b0-116f-43d2-8b84-1f38d2c80507"><Typography shuku-edit-id="e-358b2d17-a051-4608-99d9-3234cc3265d2" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-3f6e5dfa-2964-4bac-a5f8-3649143326f2">Predict Impact &amp; Quality of Newborn Papers</strong></Typography><Typography shuku-edit-id="e-99096af6-93e0-43d8-9a9a-1a5f6dbe749d" variant="bodySmall" tone="muted">固定论文示例 · 本地演示回放</Typography></div></header>
      <div shuku-edit-id="e-21bfc67f-f657-4ac4-8610-4b2e5714a48f" className="aipe-service-form-layout">
        <div shuku-edit-id="e-d13a7993-ebb1-496a-9a2c-17d47861347e" className="aipe-service-inputs">
          <Select label="评价模式" options={modes.map(option => ({...option, label: <Typography shuku-edit-id="e-ed9a8f63-b78f-4c01-a90a-16f155c3ff3d" as="span" variant="bodySmall" tone="inherit">{option.label}</Typography>}))} value={mode} onChange={changeMode} />
          <TextInput multiline readOnly label="论文题目" aria-label="论文题目" value={example.title} rows={2} className="aipe-service-title-input aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文论文题目" />
          <TextInput multiline readOnly label="论文摘要" aria-label="论文摘要" value={example.abstract} rows={6} className="aipe-service-abstract aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文摘要示例" />
          <Button className="aipe-service-predict" loading={running} onClick={predict}>{running ? '大模型预测中…' : '大模型预测'}</Button>
        </div>
        <div shuku-edit-id="e-a7a40e71-06fb-4abc-9655-3fbcb538fefc" className="aipe-service-results" aria-label="模型预测参考" aria-live="polite" aria-busy={running}>
          <Typography shuku-edit-id="e-9a37bc4c-c069-4dd4-9e9f-1e87c2403ed8" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-cbcef8f0-b0c7-4aa3-aa6d-b3d4eb66f9ad">模型预测参考</strong></Typography>
          <div shuku-edit-id="e-47bd0d71-cc73-44d2-bd96-6418e68a3df6" className="aipe-service-dual-ring" role="img" aria-label={metrics.map(item => item.label + ' ' + (scores[item.key]?.toFixed(2) ?? '待预测')).join('，')}>
            <svg shuku-edit-id="e-bbc038e9-adeb-488f-9b1d-c6624158676e" viewBox="0 0 300 300" aria-hidden="true">{metrics.map(item => <g shuku-edit-id="e-f16ce1af-86af-4f26-833a-3354c8fa9334" key={item.key}><circle shuku-edit-id="e-fbd7f9a3-fdc9-4cd1-bdeb-6a89dd48f8c9" cx="150" cy="150" r={item.radius} fill="none" stroke="#e5ebf3" strokeWidth="19" /><circle shuku-edit-id="e-fdce57c9-2795-4e0d-b1b5-b857d6fd3e54" data-ring={item.key} cx="150" cy="150" r={item.radius} fill="none" stroke={item.color} strokeOpacity={scores[item.key] === null ? 0 : 1} strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={(scores[item.key] ?? 0) + ' 1'} transform="rotate(-90 150 150)" /></g>)}</svg>
            <div shuku-edit-id="e-81d18375-9e65-409f-99ae-9f757c5d0aab" className="aipe-service-ring-center"><span shuku-edit-id="e-e438905c-e0ab-4c69-8b29-752dfd68bb47"><FileText aria-hidden="true" /><CircleCheck aria-hidden="true" /></span></div>
          </div>
          <div shuku-edit-id="e-ea9cd3ac-d766-44e0-affd-8152567c672d" className="aipe-service-result-legend">{metrics.map(item => <div shuku-edit-id="e-9d984602-9209-4c29-9375-f4a9ec3ab7af" key={item.key}><span shuku-edit-id="e-f47aaed5-b5f8-4aa4-a638-275c0a195427" className="aipe-service-result-dot" style={{ background: item.color }} /><Typography shuku-edit-id="e-9298dfa8-e7dc-446f-8c4c-0242d161729f" variant="bodySmall" tone="accent">{item.model} · {item.label}</Typography><Typography shuku-edit-id="e-429958e9-c613-4dfc-95fc-d2a8184c4bd1" variant="bodySmall" tone="accent" data-score={item.key}><strong shuku-edit-id="e-a53bba3f-89ce-464b-938b-2acd98864e11">{scores[item.key]?.toFixed(2) ?? '—'}</strong></Typography></div>)}</div>
        </div>
      </div>
      <div shuku-edit-id="e-948dec20-86f9-4e04-8b21-3841308a6c5e" className="aipe-service-examples"><Typography shuku-edit-id="e-e4502192-2ccb-482c-80a6-966340209379" variant="bodySmall" tone="accent"><FileText aria-hidden="true" /> 示例论文</Typography><div shuku-edit-id="e-ecbd2cd8-5818-4b36-83fd-a78faf0a539e">{examples.map((example, index) => <Button key={example.label} active={index === exampleIndex} onClick={() => loadExample(index)}>{example.label}</Button>)}</div></div>
    </section>
    <aside shuku-edit-id="e-8861de67-347c-4de9-8166-e19b9650a249" className="aipe-service-promotion" aria-label="服务使用规模与体验入口">
      <div shuku-edit-id="e-1b442afe-e4c4-437c-b792-eeff63093a59" className="aipe-service-usage"><Typography shuku-edit-id="e-fe1ec7f7-9177-4835-836f-4a3844a2698c" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-d633e881-9cea-47d5-be40-29bddb247285">在线服务累计运行</strong></Typography><div shuku-edit-id="e-0f1b9e20-2070-4ef9-bc3c-250ff321ceec" className="aipe-service-run-count" role="img" aria-label="在线服务累计运行 14,000 次以上"><Typography shuku-edit-id="e-04fb52e3-61de-40a2-aa06-b303ddabd9e5" as="span" variant="display" tone="accent" aria-hidden="true"><span shuku-edit-id="e-71c832a3-085b-41ef-98b6-1064997d6450" data-run-count={runCount}>{runCount.toLocaleString('en-US')}</span><span shuku-edit-id="e-d1a622b4-2d61-46c1-b854-8d76f7db89ca" className="aipe-service-run-plus">+</span></Typography><Typography shuku-edit-id="e-8a38d851-06a1-4811-b0cb-348402d2dfd2" as="span" variant="bodySmall" tone="accent" aria-hidden="true">次</Typography></div><Typography shuku-edit-id="e-5827955b-aab9-40dc-b1a2-25e7c064ec53" variant="bodySmall" tone="muted">项目方统计</Typography></div>
      <div shuku-edit-id="e-fa195062-1573-44bb-976a-9e339ad4a48e" className="aipe-service-hugging-face"><img shuku-edit-id="e-78d9515a-695d-4a60-b9ec-003e22dd7a1e" src={moduleAssetUrl('images/hugging-face-logo.svg')} width="95" height="88" alt="Hugging Face" /></div>
      <div shuku-edit-id="e-3a9d412b-daf7-4151-a67e-a12cd36c4e45" className="aipe-service-qr-area"><Typography shuku-edit-id="e-e14e4783-c4f5-44ec-ae95-1ae51c7c0c1a" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-26f15e1e-c330-4fda-b9ae-532980870016">扫码体验在线服务</strong></Typography><img shuku-edit-id="e-7ea1cb58-6c39-4120-9865-5acfddf1cbb9" src={moduleAssetUrl('images/naip-service-qr.svg')} width="246" height="246" alt="Hugging Face 论文评价服务二维码" /><Button href={SERVICE_URL} target="_blank" rel="noreferrer">打开 Hugging Face Demo <ArrowUpRight aria-hidden="true" /></Button></div>
    </aside>
  </ContentBlock>;
}
