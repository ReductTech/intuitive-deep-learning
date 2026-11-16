import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, FileText, CircleCheck, LoaderCircle } from 'lucide-react';
import { ContentBlock, TextInput, Typography } from "@shuku/course-style/react";
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

  return <ContentBlock shuku-edit-id="e-78225d6c-e73a-4b36-85cf-9cdac7d44609" ref={root} className="rf-service-page" headingLevel={1} title={outline.pages.find(page => page.id === 'dcad9b1e-06a9-4535-95b8-a7837e4afe5f')!.title} subtitle="基于论文题目与摘要，展示大模型的论文影响力预测与质量估计" bodyClassName="rf-service-body" data-example-index={exampleIndex} data-phase={phase} data-elapsed={Math.round(time)} data-playing={visible && time < END}>
    <section shuku-edit-id="e-5059b732-d55e-485e-af64-9c39b5b2cf86" className="rf-service-demo" aria-label="论文评价服务自动演示">
      <header shuku-edit-id="e-72f8f391-ad2f-4c3a-b50a-5d499777271d" className="rf-service-demo-head"><ChartNoAxesColumnIncreasing aria-hidden="true" /><div shuku-edit-id="e-9220a7d2-a2fc-41b9-9c27-c8a67965866c"><Typography shuku-edit-id="e-5905550f-2c5e-4770-9f95-a94d7b3a071a" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-d814c2b4-b166-45e3-aa25-1e13d175f470">Predict Impact &amp; Quality of Newborn Papers</strong></Typography><Typography shuku-edit-id="e-c711b3f6-1196-41fd-b8f9-48d53c98681d" variant="bodySmall" tone="muted">自动演示 · 评分为示意值</Typography></div></header>
      <div shuku-edit-id="e-21dd6105-7b6d-455c-81b0-2f5fe6ead979" className="rf-service-form-layout">
        <div shuku-edit-id="e-0ee1d9e6-866c-4f27-b710-28e61e3d529f" className="rf-service-inputs">
          <div shuku-edit-id="e-86f39f4c-97b1-42a6-8992-1e8966e8c9ad" className="rf-service-mode"><Typography shuku-edit-id="e-3299167d-47a3-4f5d-aa53-027af5deab56" variant="bodySmall" tone="muted">评价模式</Typography><Typography shuku-edit-id="e-c5bcd25b-6daf-43bc-8970-95f8f95da913" variant="bodySmall" tone="accent">影响力与质量 · 双模型评价</Typography></div>
          <TextInput multiline readOnly tabIndex={-1} label="论文题目" aria-label="论文题目" value={example.title} rows={2} className="rf-service-title-input rf-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读英文论文题目" />
          <TextInput multiline readOnly tabIndex={-1} label="论文摘要" aria-label="论文摘要" value={example.abstract} rows={6} className="rf-service-abstract rf-service-readonly ui-typography ui-typography--bodySmall" data-ppt-viewport="只读英文摘要示例" />
          <div shuku-edit-id="e-474e5f67-201f-42af-9ab0-e0b37f8cbd24" className={'rf-service-auto-status' + (hasResult ? ' is-complete' : '')} data-prediction-status={phase}>
            {running ? <LoaderCircle aria-hidden="true" /> : hasResult ? <CircleCheck aria-hidden="true" /> : <FileText aria-hidden="true" />}
            <Typography shuku-edit-id="e-84077c7d-1c7f-4b4d-800e-23183dec6dba" variant="bodySmall" tone="inherit">{running ? '大模型预测中…' : hasResult ? '双模型评价完成' : '自动载入论文题目与摘要'}</Typography>
          </div>
        </div>
        <div shuku-edit-id="e-98178636-eaa0-48d9-8212-affd232793a0" className="rf-service-results" aria-label="论文评价结果" aria-live="off">
          <Typography shuku-edit-id="e-a96c3e02-bb2d-491d-8b99-bdd29893ce69" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-fc41e687-c8e8-4e48-85a8-6b2824ee673c">论文评价结果</strong></Typography>
          <div shuku-edit-id="e-7134b833-1cbb-4a97-adc5-a50a1994c96b" className="rf-service-dual-ring" role="img" aria-label={metrics.map(item => item.label + ' ' + (scores[item.key]?.toFixed(2) ?? '待预测')).join('，')}>
            <svg shuku-edit-id="e-2ee36c75-8002-4c47-9901-95792d351c1f" viewBox="0 0 300 300" aria-hidden="true">{metrics.map(item => <g shuku-edit-id="e-532858e8-e773-40fa-a300-88c13b058433" key={item.key}><circle shuku-edit-id="e-b7f0aa6e-27cb-4e0c-ba36-c6179c88d844" cx="150" cy="150" r={item.radius} fill="none" stroke="#e5ebf3" strokeWidth="19" /><circle shuku-edit-id="e-11f8d25c-75ab-464f-a44b-edd6ffea18c5" data-ring={item.key} cx="150" cy="150" r={item.radius} fill="none" stroke={item.color} strokeOpacity={scores[item.key] === null ? 0 : 1} strokeWidth="19" strokeLinecap="round" pathLength="1" strokeDasharray={(scores[item.key] ?? 0) + ' 1'} transform="rotate(-90 150 150)" /></g>)}</svg>
            <div shuku-edit-id="e-2cb9ef1a-ad02-4c0a-8f94-332b74ae5670" className="rf-service-ring-center"><span shuku-edit-id="e-6cf5e120-81dd-49d3-8df6-152df6335dd5"><FileText aria-hidden="true" /><CircleCheck aria-hidden="true" /></span></div>
          </div>
          <div shuku-edit-id="e-74111b2d-3fcf-4d30-abdf-0b0be36a8a31" className="rf-service-result-legend">{metrics.map(item => <div shuku-edit-id="e-c2af7592-662a-466a-8435-40e6ddfe5675" key={item.key}><span shuku-edit-id="e-057dcacb-dc68-43bc-a761-a3b4a8c313cc" className="rf-service-result-dot" style={{ background: item.color }} /><Typography shuku-edit-id="e-589cca43-292c-441b-bcc9-1224b15e0ca3" variant="bodySmall" tone="accent">{item.model} · {item.label}</Typography><Typography shuku-edit-id="e-576e8bb5-3018-4cbc-af39-317976367073" variant="bodySmall" tone="accent" data-score={item.key}><strong shuku-edit-id="e-4aa3fc3b-bcf6-4b9d-b423-32d76ba8923d">{scores[item.key]?.toFixed(2) ?? '—'}</strong></Typography></div>)}</div>
        </div>
      </div>
      <div shuku-edit-id="e-14e811b0-379d-4529-812d-2780b5d36f40" className="rf-service-examples"><Typography shuku-edit-id="e-31a6b7af-589e-4c4c-961f-c8e97e11accd" variant="bodySmall" tone="accent"><FileText aria-hidden="true" /> 示例论文</Typography><div shuku-edit-id="e-7a4aed3e-48f7-4db6-98c3-976568f59ec0">{examples.map((item, index) => <div shuku-edit-id="e-d416e2c9-d087-41df-8368-b54742e35cee" key={item.label} className={'rf-service-example' + (index === exampleIndex ? ' is-active' : '')} aria-current={index === exampleIndex ? 'step' : undefined}><Typography shuku-edit-id="e-69edefa5-dccc-475a-a247-ca1ee112416d" variant="bodySmall" tone="inherit">{item.label}</Typography></div>)}</div></div>
    </section>
    <aside shuku-edit-id="e-39226cce-ee44-4f0d-80c1-b9ab85e490ed" className="rf-service-promotion" aria-label="服务使用规模与体验入口">
      <div shuku-edit-id="e-d48ad898-0b34-4da5-9c93-7025eeb3249e" className="rf-service-usage"><Typography shuku-edit-id="e-0f829dba-ad17-4540-a062-d07f21d49fb5" as="h2" variant="body" tone="accent"><strong shuku-edit-id="e-caf418e6-176b-4112-9518-4b42ccd94868">在线服务累计运行</strong></Typography><div shuku-edit-id="e-f90b0218-800a-4361-bc4a-6e2a0d3193d7" className="rf-service-run-count" role="img" aria-label="在线服务累计运行 14,000 次以上"><Typography shuku-edit-id="e-e6f7e2fb-ad4a-4499-a534-3a466413c486" as="span" variant="display" tone="accent" aria-hidden="true"><span shuku-edit-id="e-a8859b4d-84f6-4fa3-911c-e04daffb41af" data-run-count={runCount}>{runCount.toLocaleString('en-US')}</span><span shuku-edit-id="e-a0299bc2-4202-4d53-9ccd-e5edafd70c64" className="rf-service-run-plus">+</span></Typography><Typography shuku-edit-id="e-4c904ef9-2ca4-4208-9569-db51876e2162" as="span" variant="bodySmall" tone="accent" aria-hidden="true">次</Typography></div><Typography shuku-edit-id="e-2139557d-f4d3-4b73-9fae-23abac951260" variant="bodySmall" tone="muted">项目方统计</Typography></div>
      <div shuku-edit-id="e-f7922cb3-49be-43c6-87c4-9b88d5889e8c" className="rf-service-hugging-face"><img shuku-edit-id="e-edd2c0c6-207f-4fc7-a79d-2e0cf92695b3" src={moduleAssetUrl('images/hugging-face-logo.svg')} width="95" height="88" alt="Hugging Face" /></div>
      <div shuku-edit-id="e-f25a573b-1dcc-4fa8-a26c-033ad24efff5" className="rf-service-qr-area"><Typography shuku-edit-id="e-73fa8701-f7d6-468f-9302-58135aad2140" as="h3" variant="body" tone="accent"><strong shuku-edit-id="e-ee26f5e2-f522-4cb9-8a80-62957b1fefef">扫码体验在线服务</strong></Typography><img shuku-edit-id="e-fbbd64ed-107b-4a38-9349-29d0b5848ca7" src={moduleAssetUrl('images/naip-service-qr.svg')} width="246" height="246" alt="Hugging Face 论文评价服务二维码" /><Typography shuku-edit-id="e-e91a0992-8739-4f88-a447-28d4147625a7" variant="bodySmall" tone="muted">Hugging Face 在线服务</Typography></div>
    </aside>
  </ContentBlock>;
}
