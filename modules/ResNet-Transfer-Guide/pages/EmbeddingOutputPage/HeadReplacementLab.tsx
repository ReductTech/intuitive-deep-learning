import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useState, type AnimationEvent } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl(moduleIdentity.id, "head-replacement/bottle-normal.jpg");
const bottleCrushed = moduleAssetUrl(moduleIdentity.id, "head-replacement/bottle-deformed.jpg");
const can = moduleAssetUrl(moduleIdentity.id, "head-replacement/can-normal.jpg");
const canCrushed = moduleAssetUrl(moduleIdentity.id, "head-replacement/can-deformed.jpg");
const carton = moduleAssetUrl(moduleIdentity.id, "head-replacement/carton-normal.jpg");
const cartonCrushed = moduleAssetUrl(moduleIdentity.id, "head-replacement/carton-deformed.jpg");
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
  return <svg className="rtg-head-swap__arrow" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12h27m-8-8 8 8-8 8" /></svg>;
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
    return <article key={`${swap.revision}-${outgoing ? 'out' : 'in'}`} aria-hidden={outgoing || undefined}
      className={`rtg-head-swap__head-card${outgoing ? ' is-outgoing' : swap.from ? ' is-incoming' : ''}`}
      data-head-card={task} data-task-label={outgoing ? undefined : sample[task]}
      onAnimationEnd={outgoing ? undefined : event => finishSwap(event, swap.revision)}>
      <Typography as="h2" variant="h3" tone={task === 'appearance' ? 'warning' : 'accent'}>{definition.title}</Typography>
      <Typography variant="bodySmall" tone="muted">{definition.question}</Typography>
      <div className="rtg-head-swap__labels" aria-label={outgoing ? undefined : `任务类别；当前图片的已知标签是${sample[task]}`}>
        {definition.labels.map(label => <Typography as="span" key={label} variant="bodySmall" tone="inherit" className={label === sample[task] ? 'is-matched' : ''}>
          {label === sample[task] && <span aria-hidden="true">✓ </span>}{label}
        </Typography>)}
      </div>
    </article>;
  }

  const notice = !hasReplaced ? '点击右侧按钮，保留提取器，为同一张图换一个分类问题。'
    : !hasCompared ? '同图换头，特征表示不变。现在点击下方图片，比较新任务的标签。'
    : `当前图片：${sample.label}。换图后重新计算表示，分类头仍回答“${tasks[swap.task].question}”。`;

  return <section className="rtg-head-swap" data-head-task={swap.task} data-sample={sample.id} data-complete={hasReplaced && hasCompared} aria-label="直接替换分类头并更换输入图片">
    <div className="rtg-head-swap__canvas">
      <figure className="rtg-head-swap__input">
        <Typography variant="bodySmall" tone="muted">输入图片</Typography>
        <div className="rtg-head-swap__photo"><img key={sample.id} src={sample.image} alt={sample.label} /></div>
        <Typography as="figcaption" variant="bodySmall" tone="accent">{sample.label}</Typography>
      </figure>
      <Arrow />
      <article className="rtg-head-swap__extractor">
        <Typography variant="bodySmall" tone="success">保留参数</Typography>
        <Typography as="h2" variant="h3" tone="accent">特征提取器</Typography>
        <div className="rtg-head-swap__network" aria-hidden="true"><i /><i /><i /><i /></div>
        <MathFormulaBlock appearance="plain" ariaLabel="特征提取器把输入图片转换为表示z"><MathFormulaTerm latex={'f_\\theta'} tooltip="特征提取器；换分类头时保留参数。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="x" tooltip="当前输入图片，可在下方更换。" /><MathFormulaStatic latex=")=" /><MathFormulaTerm latex="z" tooltip="当前图片的特征表示；只换分类头时不变。" /></MathFormulaBlock>
        <div className="rtg-head-swap__features" role="img" aria-label={`${sample.label}的特征表示示意；换分类头时不变，换图片时重新计算`} data-feature-sample={sample.id}>
          {sample.features.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      </article>
      <Arrow />
      <div className="rtg-head-swap__head-slot">
        <div className="rtg-head-swap__head-deck">
          {swap.from && headCard(swap.from, true)}
          {headCard(swap.task)}
        </div>
        <Button key={resetVersion} variant="primary" hint={!hasReplaced} className="rtg-head-swap__replace" data-action="replace-head" onClick={replaceHead} aria-label={swap.task === 'category' ? '将物品分类头替换为外观分类头' : '换回物品分类头'}>
          <Typography as="span" variant="bodySmall" tone="inherit">{swap.task === 'category' ? '换成外观分类头' : '换回物品分类头'}</Typography><Arrow />
        </Button>
      </div>
    </div>

    <div className="rtg-head-swap__samples" role="group" aria-label={hasReplaced ? '选择另一张输入图片' : '替换分类头后可更换输入图片'}>
      <div className="rtg-head-swap__sample-heading">
        <Typography variant="bodySmall" tone="accent">{hasReplaced ? '换图比较' : '替换后换图'}</Typography>
        <Button data-action="reset" onClick={reset}>重新观察</Button>
      </div>
      {samples.map(item => <Button key={item.id} className="rtg-head-swap__sample" data-input-sample={item.id} disabled={!hasReplaced} active={item.id === sample.id} aria-pressed={item.id === sample.id} aria-label={`更换输入：${item.label}`} onClick={() => chooseSample(item.id)}>
        <img src={item.image} alt="" /><Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography>
      </Button>)}
    </div>
    <NoticeStrip tone={hasCompared ? 'green' : 'blue'} role="status" aria-live="polite">{notice}</NoticeStrip>
  </section>;
}
