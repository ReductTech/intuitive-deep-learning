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
  return <ContentBlock shuku-edit-id="e-37685256-ad68-4971-aa73-087aaf2c0c76" ref={root} className="aipe-service-page" headingLevel={1} title={outline.pages.find(page => page.id === '5ebd7132-4f46-483a-a1d6-90d22f87bb1e')!.title} subtitle="提供潜在影响力与质量估计参考，辅助安排阅读优先级" bodyClassName="aipe-service-body">
    <section shuku-edit-id="e-ced99e58-ce2a-4aa4-949c-af367008482f" className="aipe-service-demo" aria-label="Gradio 风格论文评价服务" onKeyDown={e => e.stopPropagation()}>
      <header shuku-edit-id="e-dd76ace4-3cc9-4bf9-93ee-05ad9729405a" className="aipe-service-demo-head"><ChartNoAxesColumnIncreasing aria-hidden="true" /><div shuku-edit-id="e-0b13fe39-85cb-44ea-8ef8-000929c0d82a"><Typography shuku-edit-id="e-5e6e86b0-520c-48db-942a-60eb86e6e72a" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-32cc2747-d91e-4283-b130-dbdb620d96b0">Predict Impact &amp; Quality of Newborn Papers</strong></Typography><Typography shuku-edit-id="e-cfade024-9e96-4b7e-a0d6-722e9f5fb8b9" variant="bodySmall" tone="muted">固定论文示例 · 本地演示回放</Typography></div></header>
      <div shuku-edit-id="e-c040e10c-cbcd-41ff-b629-3b026ef3bfbc" className="aipe-service-form-layout">
        <div shuku-edit-id="e-cb5232a3-6812-492e-b512-e4bb5045aa17" className="aipe-service-inputs">
          <Select label="评价模式" options={modes.map(option => ({...option, label: <Typography shuku-edit-id="e-ef1c258b-9a89-4e2d-ac94-5faed739866e" as="span" variant="bodySmall" tone="inherit">{option.label}</Typography>}))} value={mode} onChange={changeMode} />
          <TextInput multiline readOnly label="论文题目" aria-label="论文题目" value={example.title} rows={2} className="aipe-service-title-input aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文论文题目" />
          <TextInput multiline readOnly label="论文摘要" aria-label="论文摘要" value={example.abstract} rows={6} className="aipe-service-abstract aipe-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读、可滚动阅读的英文摘要示例" />
          <Button className="aipe-service-predict" loading={running} onClick={predict}>{running ? '大模型预测中…' : '大模型预测'}</Button>
        </div>
        <div shuku-edit-id="e-0f4c9c46-df56-4921-98a5-742c6fd1c36d" className="aipe-service-results" aria-label="模型预测参考" aria-live="polite" aria-busy={running}>
          <Typography shuku-edit-id="e-165a1ad7-3c3a-488f-8aed-0d0e0b84c1e2" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-142da534-b36d-4dca-89b0-9d7ea2608da3">模型预测参考</strong></Typography>
          <div shuku-edit-id="e-7ef25d85-5431-4e74-beb7-8783f831c478" className="aipe-service-dual-ring" role="img" aria-label={metrics.map(item => item.label + ' ' + (scores[item.key]?.toFixed(2) ?? '待预测')).join('，')}>
            <svg shuku-edit-id="e-a353a217-6b2b-40ed-a8ca-4b95dbabe18a" viewBox="0 0 300 300" aria-hidden="true">{metrics.map(item => <g shuku-edit-id="e-6f554a4f-fa81-441e-a017-1d3c6f5904c2" key={item.key}><circle shuku-edit-id="e-6e6db33b-95de-4f51-b8ac-750d4df3cad3" cx="150" cy="150" r={item.radius} fill="none" stroke="#e5ebf3" strokeWidth="19" /><circle shuku-edit-id="e-d9c00052-502b-48cf-ac69-da9ea63e6393" data-ring={item.key} cx="150" cy="150" r={item.radius} fill="none" stroke={item.color} strokeOpacity={scores[item.key] === null ? 0 : 1} strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={(scores[item.key] ?? 0) + ' 1'} transform="rotate(-90 150 150)" /></g>)}</svg>
            <div shuku-edit-id="e-aafd867e-d8df-41bc-80ce-3f4cbd4a1a47" className="aipe-service-ring-center"><span shuku-edit-id="e-acc4dad8-254f-492a-ad1d-e1e0b1aaf16f"><FileText aria-hidden="true" /><CircleCheck aria-hidden="true" /></span></div>
          </div>
          <div shuku-edit-id="e-aaec018a-f28d-44b7-b40e-5f6b6d6b12c4" className="aipe-service-result-legend">{metrics.map(item => <div shuku-edit-id="e-3e1429e5-6e79-48e7-9d7b-c6fab9bea3fc" key={item.key}><span shuku-edit-id="e-394827e1-e9e9-494f-85d8-a181555eae99" className="aipe-service-result-dot" style={{ background: item.color }} /><Typography shuku-edit-id="e-aa5d8f79-3f35-4c21-bee7-5a00c9cb7005" variant="bodySmall" tone="accent">{item.model} · {item.label}</Typography><Typography shuku-edit-id="e-71242ff5-a214-4145-ba73-86240b324bfa" variant="bodySmall" tone="accent" data-score={item.key}><strong shuku-edit-id="e-e43ec7d0-4f7b-40bf-8960-ef7f9347b0ba">{scores[item.key]?.toFixed(2) ?? '—'}</strong></Typography></div>)}</div>
        </div>
      </div>
      <div shuku-edit-id="e-8139b312-e918-4c69-bac3-2e07fe995dde" className="aipe-service-examples"><Typography shuku-edit-id="e-f151f3ed-283e-4186-91d4-33fd707c799e" variant="bodySmall" tone="accent"><FileText aria-hidden="true" /> 示例论文</Typography><div shuku-edit-id="e-a1baeb39-a060-4b69-9a48-2e936413180a">{examples.map((example, index) => <Button key={example.label} active={index === exampleIndex} onClick={() => loadExample(index)}>{example.label}</Button>)}</div></div>
    </section>
    <aside shuku-edit-id="e-a5e68834-0ef5-4d08-80d9-878e4329116b" className="aipe-service-promotion" aria-label="服务使用规模与体验入口">
      <div shuku-edit-id="e-f0840db1-2ab5-4a4b-abb1-508981a5b499" className="aipe-service-usage"><Typography shuku-edit-id="e-b2e21cd9-b433-44e8-810c-e0be3ce81f65" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-20b93d68-111f-4417-9d23-9767552e114f">在线服务累计运行</strong></Typography><div shuku-edit-id="e-ee48a9c8-dfc0-4086-845d-732c6a7b4987" className="aipe-service-run-count" role="img" aria-label="在线服务累计运行 14,000 次以上"><Typography shuku-edit-id="e-121f78b9-d92e-415a-bbbb-2ad6a70ec560" as="span" variant="display" tone="accent" aria-hidden="true"><span shuku-edit-id="e-3cea5e0c-7612-42d2-ae22-28049591da6b" data-run-count={runCount}>{runCount.toLocaleString('en-US')}</span><span shuku-edit-id="e-ef21d687-1d74-40ab-8cfb-948c3c32e3e7" className="aipe-service-run-plus">+</span></Typography><Typography shuku-edit-id="e-4a8fff6c-931e-46f6-b71c-0ea6b498aafa" as="span" variant="bodySmall" tone="accent" aria-hidden="true">次</Typography></div><Typography shuku-edit-id="e-03d872b4-770c-4146-8c72-d50e6b460e4e" variant="bodySmall" tone="muted">项目方统计</Typography></div>
      <div shuku-edit-id="e-6d8c7975-4a26-4b43-bce1-7311809ef1e1" className="aipe-service-hugging-face"><img shuku-edit-id="e-469d8ca3-c510-4045-addc-bf1abdfd1d00" src={moduleAssetUrl('images/hugging-face-logo.svg')} width="95" height="88" alt="Hugging Face" /></div>
      <div shuku-edit-id="e-d07f8ffa-185c-4c67-b495-9727cf744032" className="aipe-service-qr-area"><Typography shuku-edit-id="e-02e7b5cf-ec5f-45bf-81b1-66a060dae965" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-6a5d9a2b-14dd-44bb-932a-0264ce8a1a0a">扫码体验在线服务</strong></Typography><div shuku-edit-id="e-f98dd6c0-c29a-4a37-bf22-8d43ef39041c" className="aipe-service-qr-mask" role="img" aria-label="二维码已隐藏"><img shuku-edit-id="e-35a637ef-9d6a-4214-a58b-ff5b17a137c4" src={moduleAssetUrl('images/naip-service-qr.svg')} width="246" height="246" alt="Hugging Face 论文评价服务二维码" /><span shuku-edit-id="e-7ea412c3-bca8-417d-a445-3f998ff5c89e" aria-hidden="true" /></div><Button href={SERVICE_URL} target="_blank" rel="noreferrer">打开 Hugging Face Demo <ArrowUpRight aria-hidden="true" /></Button></div>
    </aside>
  </ContentBlock>;
}
