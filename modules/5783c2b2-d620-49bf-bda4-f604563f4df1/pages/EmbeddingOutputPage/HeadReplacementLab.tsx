import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useState, type AnimationEvent } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl("head-replacement/bottle-normal.webp");
const bottleCrushed = moduleAssetUrl("head-replacement/bottle-deformed.webp");
const can = moduleAssetUrl("head-replacement/can-normal.webp");
const canCrushed = moduleAssetUrl("head-replacement/can-deformed.webp");
const carton = moduleAssetUrl("head-replacement/carton-normal.webp");
const cartonCrushed = moduleAssetUrl("head-replacement/carton-deformed.webp");
import './HeadReplacementLab.css';

type Task = 'category' | 'appearance';
const tasks = {
  category: { title: '物品分类头', question: '这是什么物品？', labels: ['塑料瓶', '易拉罐', '纸盒'] },
  appearance: { title: '外观分类头', question: '物品的外观怎样？', labels: ['正常外观', '变形外观'] },
};
// These known labels and illustrative bars explain the task change; they are not model predictions or measured activations.
const samples = [
  { id: 'bottle', label: '正常塑料瓶', category: '塑料瓶', appearance: '正常外观', image: bottle, features: [35, 68, 89, 45, 62, 30] },
  { id: 'bottle-crushed', label: '变形塑料瓶', category: '塑料瓶', appearance: '变形外观', image: bottleCrushed, features: [72, 38, 65, 80, 29, 54] },
  { id: 'can', label: '正常易拉罐', category: '易拉罐', appearance: '正常外观', image: can, features: [48, 82, 55, 31, 74, 42] },
  { id: 'can-crushed', label: '变形易拉罐', category: '易拉罐', appearance: '变形外观', image: canCrushed, features: [85, 42, 38, 76, 45, 69] },
  { id: 'carton', label: '正常纸盒', category: '纸盒', appearance: '正常外观', image: carton, features: [42, 32, 77, 59, 84, 48] },
  { id: 'carton-crushed', label: '变形纸盒', category: '纸盒', appearance: '变形外观', image: cartonCrushed, features: [64, 74, 43, 87, 52, 35] },
];

function Arrow() {
  return <svg shuku-edit-id="e-8f2a0f33-84c8-45c2-9ebd-264f1a543420" className="rtg-head-swap__arrow" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-dac1941e-1dcc-4a5d-9e71-751b75ce456c" d="M2 12h27m-8-8 8 8-8 8" /></svg>;
}

export function HeadReplacementLab({ onComplete }: { onComplete?: () => void }) {
  const [sampleId, setSampleId] = useState(samples[0].id);
  const [swap, setSwap] = useState<{ task: Task; from: Task | null; revision: number }>({ task: 'category', from: null, revision: 0 });
  const [hasReplaced, setHasReplaced] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const sample = samples.find(item => item.id === sampleId) ?? samples[0];
  useCompleteOnce(hasReplaced && hasCompared, onComplete);

  function replaceHead() {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setSwap(previous => ({ task: previous.task === 'category' ? 'appearance' : 'category', from: reduce ? null : previous.task, revision: previous.revision + 1 }));
    setHasReplaced(true);
  }

  function chooseSample(id: string) {
    if (!hasReplaced || id === sampleId) return;
    setSampleId(id);
    if (swap.task === 'appearance') setHasCompared(true);
  }

  function reset() {
    setSampleId(samples[0].id);
    setSwap(previous => ({ task: 'category', from: null, revision: previous.revision + 1 }));
    setHasReplaced(false);
    setHasCompared(false);
    setResetVersion(value => value + 1);
  }

  function finishSwap(event: AnimationEvent<HTMLElement>, revision: number) {
    if (event.target !== event.currentTarget || event.animationName !== 'rtg-head-swap-in') return;
    setSwap(previous => previous.revision === revision ? { ...previous, from: null } : previous);
  }

  function headCard(task: Task, outgoing = false) {
    const definition = tasks[task];
    return <article shuku-edit-id="e-4db5919d-83b3-4c70-a4a6-4f16d2be42b0" key={`${swap.revision}-${outgoing ? 'out' : 'in'}`} aria-hidden={outgoing || undefined}
      className={`rtg-head-swap__head-card${outgoing ? ' is-outgoing' : swap.from ? ' is-incoming' : ''}`}
      data-head-card={task} data-task-label={outgoing ? undefined : sample[task]}
      onAnimationEnd={outgoing ? undefined : event => finishSwap(event, swap.revision)}>
      <Typography shuku-edit-id="e-fcf03204-534d-4cc2-9062-31cca5ac779e" as="h2" variant="h3" tone={task === 'appearance' ? 'warning' : 'accent'}>{definition.title}</Typography>
      <Typography shuku-edit-id="e-40dfa1a9-76e7-41f6-b990-792b9bf71ba1" variant="bodySmall" tone="muted">{definition.question}</Typography>
      <div shuku-edit-id="e-4513091e-fbe7-4819-9f39-98bce1b78ef3" className="rtg-head-swap__labels" aria-label={outgoing ? undefined : `任务类别；当前图片的已知标签是${sample[task]}`}>
        {definition.labels.map(label => <Typography shuku-edit-id="e-37665094-2ade-406d-aa86-6f2f0c01b417" as="span" key={label} variant="bodySmall" tone="inherit" className={label === sample[task] ? 'is-matched' : ''}>
          {label === sample[task] && <span shuku-edit-id="e-f0570fcc-b04d-413d-89d2-1452a594b859" aria-hidden="true">✓ </span>}{label}
        </Typography>)}
      </div>
    </article>;
  }

  const notice = !hasReplaced ? '点击右侧按钮，保留提取器，为同一张图换一个分类问题。'
    : !hasCompared ? '同图换头，特征表示不变。现在点击下方图片，比较新任务的标签。'
    : `当前图片：${sample.label}。换图后重新计算表示，分类头仍回答“${tasks[swap.task].question}”。`;

  return <section shuku-edit-id="e-892654b8-7eca-4aa1-b189-2bb09bf8ba7e" className="rtg-head-swap" data-head-task={swap.task} data-sample={sample.id} data-complete={hasReplaced && hasCompared} aria-label="直接替换分类头并更换输入图片">
    <div shuku-edit-id="e-5b8ad7ee-f31c-4562-954f-9ed75d4806fb" className="rtg-head-swap__canvas">
      <figure shuku-edit-id="e-b3aa44e6-2a3d-43ee-b06e-fbcd67bea666" className="rtg-head-swap__input">
        <Typography shuku-edit-id="e-d69cf84e-78ac-4f32-9905-729c9510f62f" variant="bodySmall" tone="muted">输入图片</Typography>
        <div shuku-edit-id="e-c073caca-2b04-4c66-8b91-69fc6a619d59" className="rtg-head-swap__photo"><img shuku-edit-id="e-2fe0726e-bb34-450c-898f-aeb4737a3e0b" key={sample.id} src={sample.image} alt={sample.label} /></div>
        <Typography shuku-edit-id="e-d2903b7f-9050-45da-b55a-3f2da977293b" as="figcaption" variant="bodySmall" tone="accent">{sample.label}</Typography>
      </figure>
      <Arrow />
      <article shuku-edit-id="e-e392e956-a0e0-431f-ab9d-164383e2b44e" className="rtg-head-swap__extractor">
        <Typography shuku-edit-id="e-677fbda4-9307-4bf3-8f93-2cf9b522fd66" variant="bodySmall" tone="success">保留参数</Typography>
        <Typography shuku-edit-id="e-a1eb9168-5608-4e53-9d30-e8fc9f1651d8" as="h2" variant="h3" tone="accent">特征提取器</Typography>
        <div shuku-edit-id="e-7f4c8fc5-189e-465b-9a54-cea5d5492a16" className="rtg-head-swap__network" aria-hidden="true"><i shuku-edit-id="e-81c0c8b3-cf78-4476-b197-caff580116ca" /><i shuku-edit-id="e-76f96d62-7dad-450c-a7c0-a6f4d6d226cb" /><i shuku-edit-id="e-7d7e63ee-137a-435d-9b68-2c0f4b4895c5" /><i shuku-edit-id="e-fe26dabc-06fa-46d0-adf7-a9e8e0ee93d1" /></div>
        <MathFormulaBlock appearance="plain" ariaLabel="特征提取器把输入图片转换为表示z"><MathFormulaTerm latex={'f_\\theta'} tooltip="特征提取器；换分类头时保留参数。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="x" tooltip="当前输入图片，可在下方更换。" /><MathFormulaStatic latex=")=" /><MathFormulaTerm latex="z" tooltip="当前图片的特征表示；只换分类头时不变。" /></MathFormulaBlock>
        <div shuku-edit-id="e-746fa90b-4109-46f4-8dac-357370bb51d7" className="rtg-head-swap__features" role="img" aria-label={`${sample.label}的特征表示示意；换分类头时不变，换图片时重新计算`} data-feature-sample={sample.id}>
          {sample.features.map((height, index) => <i shuku-edit-id="e-f5ff1963-bbac-4bd3-bcd8-e975588ae93b" key={index} style={{ height: `${height}%` }} />)}
        </div>
      </article>
      <Arrow />
      <div shuku-edit-id="e-d5ec0062-3b17-472d-9859-e12d7229d8dd" className="rtg-head-swap__head-slot">
        <div shuku-edit-id="e-1a73f8b3-610b-44a5-814f-3a321caa4a6c" className="rtg-head-swap__head-deck">
          {swap.from && headCard(swap.from, true)}
          {headCard(swap.task)}
        </div>
        <Button key={resetVersion} variant="primary" hint={!hasReplaced} className="rtg-head-swap__replace" data-action="replace-head" onClick={replaceHead} aria-label={swap.task === 'category' ? '将物品分类头替换为外观分类头' : '换回物品分类头'}>
          <Typography shuku-edit-id="e-4a1363fc-fa1d-4514-a216-05ecd4da8981" as="span" variant="bodySmall" tone="inherit">{swap.task === 'category' ? '换成外观分类头' : '换回物品分类头'}</Typography><Arrow />
        </Button>
      </div>
    </div>

    <div shuku-edit-id="e-67b71d27-6410-40e0-ae09-dcc1600edec2" className="rtg-head-swap__samples" role="group" aria-label={hasReplaced ? '选择另一张输入图片' : '替换分类头后可更换输入图片'}>
      <div shuku-edit-id="e-4f978e6c-9296-440e-b6f8-42292e692266" className="rtg-head-swap__sample-heading">
        <Typography shuku-edit-id="e-4c0abbe2-ffd6-403e-a7d5-a20406a78fba" variant="bodySmall" tone="accent">{hasReplaced ? '换图比较' : '替换后换图'}</Typography>
        <Button data-action="reset" onClick={reset}>重新观察</Button>
      </div>
      {samples.map(item => <Button key={item.id} className="rtg-head-swap__sample" data-input-sample={item.id} disabled={!hasReplaced} active={item.id === sample.id} aria-pressed={item.id === sample.id} aria-label={`更换输入：${item.label}`} onClick={() => chooseSample(item.id)}>
        <img shuku-edit-id="e-6f9864e4-1668-41bc-90a1-f96070385cab" src={item.image} alt="" /><Typography shuku-edit-id="e-16bc0d52-2f54-4381-974a-28ba398be4ad" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography>
      </Button>)}
    </div>
    <NoticeStrip tone={hasCompared ? 'green' : 'blue'} role="status" aria-live="polite">{notice}</NoticeStrip>
  </section>;
}
