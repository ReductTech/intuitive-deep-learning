import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ProjectionShortcutPage.css';

type Mechanism = 'space' | 'channels';
interface AppliedMotion { kind: Mechanism; id: number; }
const samples = [0, 2, 8, 10];
const recipes = [
  { weights: [1, 1], formula: '2 × 1 + 4 × 1' },
  { weights: [.5, .5], formula: '2 × 0.5 + 4 × 0.5' },
  { weights: [-1, 1], formula: '2 × (−1) + 4 × 1' },
];
const channelResult = (index: number) => 2 * recipes[index].weights[0] + 4 * recipes[index].weights[1];

function FeatureVolume({ spatial, channels, active = false, motion, onMotionEnd }: { spatial: boolean; channels: boolean; active?: boolean; motion?: AppliedMotion | null; onMotionEnd?: () => void }) {
  const size = spatial ? 72 : 144, x = (200 - size) / 2, y = (180 - size) / 2 + 5;
  const resizing = motion?.kind === 'space';
  const geometry = (offsetX = 0, offsetY = 0): CSSProperties => resizing ? { '--from-x': `${28 + offsetX}px`, '--from-y': `${23 + offsetY}px`, '--to-x': `${x + offsetX}px`, '--to-y': `${y + offsetY}px` } as CSSProperties : {};
  return <svg key={motion?.id ?? 'steady'} className="rtg-projection-shortcut__volume" data-volume-motion={motion?.kind ?? ''} viewBox="0 0 220 190" role="img" aria-label={`${spatial ? '28乘28' : '56乘56'}，${channels ? 128 : 64}通道`}
    onAnimationEnd={event => { if (event.animationName === 'rtg-projection-space' || event.animationName === 'rtg-projection-channel') onMotionEnd?.(); }}>
    <g className={active ? 'is-active' : ''}>
      {Array.from({ length: channels ? 6 : 3 }, (_, index) => <rect key={index} className={`rtg-projection-shortcut__plane${resizing ? ' is-resizing' : ''}${motion?.kind === 'channels' && index >= 3 ? ' is-new-plane' : ''}`} x={x + index * 6} y={y - index * 4} width={size} height={size} rx="3" style={{ ...geometry(index * 6, -index * 4), opacity: .12 + index * .06 }} />)}
      <g className="rtg-projection-shortcut__face"><rect className={resizing ? 'is-resizing' : ''} style={geometry()} x={x} y={y} width={size} height={size} rx="3" />
        <g className={resizing ? 'rtg-projection-shortcut__resizing-grid' : ''}>{[1, 2, 3].map(index => <g key={index}><line x1={x + size * index / 4} y1={y} x2={x + size * index / 4} y2={y + size} /><line x1={x} y1={y + size * index / 4} x2={x + size} y2={y + size * index / 4} /></g>)}</g>
        {active && <rect className="rtg-projection-shortcut__cell" x={x + size / 4} y={y + size / 4} width={size / 4} height={size / 4} />}
      </g>
    </g>
  </svg>;
}

export interface ProjectionShortcutPageProps { onComplete?: () => void; }
export function ProjectionShortcutPage({ onComplete }: ProjectionShortcutPageProps) {
  const [conflictSeen, setConflictSeen] = useState(false);
  const [spatialFixed, setSpatialFixed] = useState(false);
  const [channelsFixed, setChannelsFixed] = useState(false);
  const [added, setAdded] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [mechanism, setMechanism] = useState<Mechanism | null>(null);
  const [spaceRevealed, setSpaceRevealed] = useState<number[]>([]);
  const [channelsRevealed, setChannelsRevealed] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [appliedMotion, setAppliedMotion] = useState<AppliedMotion | null>(null);
  const motionId = useRef(0);
  const root = useRef<HTMLElement>(null);
  const previousMode = useRef<Mechanism | 'quiz' | null>(null);
  const aligned = spatialFixed && channelsFixed;
  const revealed = mechanism === 'space' ? spaceRevealed : channelsRevealed;
  const demoCount = mechanism === 'space' ? 4 : 3;
  const allComputed = revealed.length === demoCount;
  const complete = added && Boolean(questionResult?.ok);
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    if (mechanism) root.current?.querySelector<HTMLButtonElement>('[data-compute]')?.focus({ preventScroll: true });
    else if (showQuestion) root.current?.querySelector<HTMLButtonElement>('.dl-question-option')?.focus({ preventScroll: true });
    else if (previousMode.current) root.current?.querySelector<HTMLButtonElement>(!conflictSeen || aligned ? '[data-join]' : `[data-open-mechanism="${spatialFixed ? 'channels' : 'space'}"]`)?.focus({ preventScroll: true });
    previousMode.current = mechanism ?? (showQuestion ? 'quiz' : null);
  }, [mechanism, showQuestion, aligned, conflictSeen, spatialFixed]);

  function resetQuestion() { setShowQuestion(false); setQuestionResult(null); setAttempt(value => value + 1); }
  function restart() { setAppliedMotion(null); setConflictSeen(false); setSpatialFixed(false); setChannelsFixed(false); setAdded(false); setMechanism(null); setSpaceRevealed([]); setChannelsRevealed([]); setSelected(null); resetQuestion(); }
  function openMechanism(kind: Mechanism) { setAppliedMotion(null); setMechanism(kind); setSelected(null); resetQuestion(); }
  function compute(index: number) {
    setSelected(index);
    const update = (current: number[]) => current.includes(index) ? current : [...current, index];
    if (mechanism === 'space') setSpaceRevealed(update); else setChannelsRevealed(update);
  }
  function apply() {
    if (!allComputed || !mechanism) return;
    setAppliedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : { kind: mechanism, id: ++motionId.current });
    if (mechanism === 'space') setSpatialFixed(true); else setChannelsFixed(true);
    setConflictSeen(true); setAdded(false); setMechanism(null); resetQuestion();
  }
  function undo(kind: Mechanism) { setAppliedMotion(null); if (kind === 'space') setSpatialFixed(false); else setChannelsFixed(false); setAdded(false); resetQuestion(); }
  function join() { if (!conflictSeen) setConflictSeen(true); else if (aligned && !added) setAdded(true); else if (added) setShowQuestion(true); }
  const guidance = mechanism
    ? allComputed ? '每个问号都已算出。点击中央确认区，将这项改变应用到快捷路径。' : '直接点击中间的问号，算出对应的输出；已算出的数字仍可点击回看。'
    : showQuestion ? questionResult?.ok ? '两项形状已对齐，理解检查完成。可返回实验或重新开始。' : '投影捷径在特征空间工作：想想相加前必须一一对应的是什么。'
    : added ? '同一位置、同一通道：2 + (−1) = 1；逐元素相加不再改变 28×28×128 的形状。'
    : !conflictSeen ? '先点画面正中的加号，验证两路特征能否直接相加。'
    : aligned ? '高、宽、通道已全部匹配。再点中央加号，验证逐元素相加。'
    : spatialFixed ? '空间已对齐；还需要把 64 个通道变为 128 个通道。'
    : channelsFixed ? '通道已对齐；还需要把 56×56 个位置变为 28×28。'
    : '空间尺寸与通道数都不匹配。点下方两个对齐模块，分别计算它们如何改变。';

  return <ContentBlock ref={root} headingLevel={1} className="rtg-projection-shortcut" data-mode={mechanism ?? (showQuestion ? 'quiz' : 'overview')} data-motion={appliedMotion?.kind ?? ''} data-conflict={conflictSeen} data-spatial={spatialFixed} data-channels={channelsFixed} data-added={added} data-complete={complete} data-computed={revealed.join(',')} data-selected={selected ?? ''}
    title="形状不一样，怎样对齐后再相加？" subtitle="先对齐空间尺寸和通道数，再把对应位置的数值相加。"
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div className="rtg-projection-shortcut__toolbar">
      <Typography variant="bodySmall" tone="accent">{mechanism ? mechanism === 'space' ? `空间取样 · 已计算 ${revealed.length} / 4` : `通道组合 · 已计算 ${revealed.length} / 3` : showQuestion ? '理解检查 · 对齐为什么必要' : added ? '03 · 两路已经可以相加' : conflictSeen ? '02 · 分别对齐空间与通道' : '01 · 先发现形状冲突'}</Typography>
      <div>{(mechanism || showQuestion) && <button type="button" data-return onClick={() => { setMechanism(null); setShowQuestion(false); }}><Typography as="span" variant="bodySmall" tone="inherit">← 返回对齐实验</Typography></button>}<button type="button" data-reset onClick={mechanism ? () => { if (mechanism === 'space') setSpaceRevealed([]); else setChannelsRevealed([]); setSelected(null); } : restart}><Typography as="span" variant="bodySmall" tone="inherit">↶ {mechanism ? '重算本项' : '重新实验'}</Typography></button></div>
    </div>
    <section className="rtg-projection-shortcut__lab" aria-label={mechanism ? '点击问号完成对齐数值实验' : '两路特征的形状对齐实验'}>
      {mechanism === 'space' ? <>
        <div className="rtg-projection-shortcut__space-board">
          <section className="rtg-projection-shortcut__sample-block"><Typography as="h2" variant="body" tone="accent">输入 · 4 × 4 个位置</Typography><div className="rtg-projection-shortcut__input-grid">{Array.from({ length: 16 }, (_, index) => {
            const sample = samples.indexOf(index);
            return <div key={index} data-input-cell={index} className={selected !== null && samples[selected] === index ? 'is-current' : spaceRevealed.includes(sample) ? 'is-computed' : ''}><Typography as="span" variant="body" tone="inherit">{index + 1}</Typography></div>;
          })}</div><Typography variant="bodySmall" tone="muted">窗口每次向右、向下跨 2 格</Typography></section>
          <section className="rtg-projection-shortcut__sample-block"><Typography as="h2" variant="body" tone="accent">输出 · 2 × 2 个位置</Typography><div className="rtg-projection-shortcut__output-grid">{samples.map((source, index) => <button type="button" key={source} data-compute={index} data-source={source} data-value={spaceRevealed.includes(index) ? source + 1 : ''} aria-pressed={selected === index} aria-label={`${spaceRevealed.includes(index) ? '回看' : '计算'}第${Math.floor(index / 2) + 1}行第${index % 2 + 1}列输出`} className={(spaceRevealed.includes(index) ? 'is-computed' : 'is-unknown') + (selected === index ? ' is-current' : '')} onClick={() => compute(index)}><Typography as="span" variant="h3" tone="inherit">{spaceRevealed.includes(index) ? source + 1 : '?'}</Typography></button>)}</div><Typography variant="bodySmall" tone="warning">点击问号，写入对应位置的数</Typography></section>
          <aside className="rtg-projection-shortcut__explanation"><Typography as="h2" variant="body" tone="accent">1×1 窗口 · stride 2</Typography><Typography as="code" variant="body" tone="warning">{selected === null ? '取一个位置 → 写一个数' : `${samples[selected] + 1} × 1 = ${samples[selected] + 1}`}</Typography><Typography variant="bodySmall">{selected === null ? '点中间任一问号，对照左侧高亮的输入位置。' : `来自输入第${Math.floor(samples[selected] / 4) + 1}行、第${samples[selected] % 4 + 1}列；输出写入第${Math.floor(selected / 2) + 1}行、第${selected % 2 + 1}列。`}</Typography><Typography variant="bodySmall" tone="muted">仅演示一个通道，权重为 1、偏置为 0。不是把 2×2 区域取平均。</Typography></aside>
        </div>
        <Typography variant="bodySmall" tone="muted" className="rtg-projection-shortcut__mechanism-note">4 × 4 → 2 × 2；本页 56 × 56 → 28 × 28 使用同样的空间步长。</Typography>
      </> : mechanism === 'channels' ? <>
        <div className="rtg-projection-shortcut__channel-board">
          <section className="rtg-projection-shortcut__channel-input"><Typography as="h2" variant="body" tone="accent">同一位置的输入</Typography><div>{[2, 4].map((value, index) => <article key={value}><Typography variant="bodySmall" tone="muted">通道 {index + 1}</Typography><Typography variant="h3" tone="accent">{value}</Typography></article>)}</div><Typography variant="bodySmall" tone="muted">每个卷积核都读取这两个数，输入不会被“用完”。</Typography></section>
          <section className="rtg-projection-shortcut__recipes" aria-label="三个卷积核分别计算三个输出通道">{recipes.map((recipe, index) => <article key={index} className={selected === index ? 'is-current' : ''}>
            <div><Typography variant="bodySmall" tone="warning">卷积核 {index + 1}</Typography><Typography variant="bodySmall" tone="muted">[{recipe.weights.join(', ')}]</Typography></div>
            <Typography as="code" variant="bodySmall" tone="accent">{recipe.formula} =</Typography>
            <button type="button" data-compute={index} data-value={channelsRevealed.includes(index) ? channelResult(index) : ''} aria-pressed={selected === index} aria-label={`${channelsRevealed.includes(index) ? '回看' : '计算'}输出通道${index + 1}`} className={channelsRevealed.includes(index) ? 'is-computed' : 'is-unknown'} onClick={() => compute(index)}><Typography as="span" variant="h3" tone="inherit">{channelsRevealed.includes(index) ? channelResult(index) : '?'}</Typography></button>
          </article>)}</section>
          <aside className="rtg-projection-shortcut__explanation"><Typography as="h2" variant="body" tone="accent">一个核 → 一个输出通道</Typography><Typography variant="bodySmall">不同的权重配方，对同一位置的全部输入通道加权求和。</Typography><Typography as="code" variant="body" tone="success">2 个输入 → 3 个输出</Typography><Typography variant="bodySmall" tone="muted">1×1 只限制空间窗口，不是只看一个通道。本例省略偏置。</Typography></aside>
        </div>
        <Typography variant="bodySmall" tone="muted" className="rtg-projection-shortcut__mechanism-note">回到 64 → 128：每个核有 64 个权重，128 个核产生 128 个输出通道；同一组核在各空间位置复用。</Typography>
      </> : showQuestion ? <div className="rtg-projection-shortcut__quiz"><RtgQuestion key={attempt} pageId="18-projection-shortcut" questionId={`projection-purpose-${attempt}`} type="choice" typeLabel="理解检查" title="这里的 1×1 卷积与 stride 2 主要解决什么问题？" answer="shape" options={[
        { value: 'shape', label: '把空间尺寸与通道数对齐' }, { value: 'label', label: '直接预测新的类别标签', wrongFeedback: '投影捷径不负责最终分类。' }, { value: 'image', label: '把特征图还原成原始图片', wrongFeedback: '它仍在特征空间工作，不会还原原图。' },
      ]} feedback={{ correct: '正确。两路形状对齐后，才能对同一位置、同一通道逐元素相加。' }} onCheck={setQuestionResult} /></div> : <>
        <Typography variant="bodySmall" tone="muted" className="rtg-projection-shortcut__common-input">共同输入 x · 56 × 56 × 64（高 × 宽 × 通道）</Typography>
        <div className="rtg-projection-shortcut__comparison">
          <article className="rtg-projection-shortcut__tensor"><Typography as="h2" variant="body" tone="accent">残差分支 · 目标形状</Typography><FeatureVolume spatial channels active={added} /><Typography as="code" variant="body" tone="accent">28 × 28 × 128</Typography></article>
          <div className="rtg-projection-shortcut__join"><button type="button" data-join disabled={conflictSeen && !aligned} className={added ? 'is-added' : aligned ? 'is-ready' : conflictSeen ? 'is-conflict' : ''} onClick={join} aria-label={added ? '查看理解检查' : conflictSeen ? '验证两路逐元素相加' : '尝试直接相加'}><Typography as="span" variant="h2" tone="inherit">{added ? '✓' : '+'}</Typography></button><Typography variant="bodySmall" tone={added || aligned ? 'success' : conflictSeen ? 'warning' : 'accent'}>{added ? '已相加 · 点此检查理解' : aligned ? '点击加号 · 验证相加' : conflictSeen ? '先对齐空间与通道' : '点击加号 · 尝试相加'}</Typography>{added && <Typography as="code" variant="bodySmall" tone="success">2 + (−1) = 1</Typography>}</div>
          <article className={`rtg-projection-shortcut__tensor${aligned ? ' is-aligned' : ''}`} data-shortcut-volume><Typography as="h2" variant="body" tone="accent">快捷路径 · 当前形状</Typography><FeatureVolume spatial={spatialFixed} channels={channelsFixed} active={added} motion={appliedMotion} onMotionEnd={() => setAppliedMotion(current => current?.id === appliedMotion?.id ? null : current)} /><Typography as="code" variant="body" tone={appliedMotion || aligned ? 'success' : 'accent'}>{appliedMotion ? appliedMotion.kind === 'space' ? '56×56 → 28×28' : '64 → 128 通道' : `${spatialFixed ? '28 × 28' : '56 × 56'} × ${channelsFixed ? 128 : 64}`}</Typography></article>
        </div>
        <div className="rtg-projection-shortcut__dimension-checks" aria-label="逐项比较两路形状">{[{ name: '高 H', value: spatialFixed ? 28 : 56, target: 28 }, { name: '宽 W', value: spatialFixed ? 28 : 56, target: 28 }, { name: '通道 C', value: channelsFixed ? 128 : 64, target: 128 }].map(dimension => <Typography key={dimension.name} as="code" variant="bodySmall" tone={dimension.value === dimension.target ? 'success' : conflictSeen ? 'warning' : 'muted'}>{dimension.name}：{dimension.target} {dimension.value === dimension.target ? '=' : '≠'} {dimension.value}</Typography>)}</div>
        <div className="rtg-projection-shortcut__tools">{(['space', 'channels'] as const).map(kind => { const fixed = kind === 'space' ? spatialFixed : channelsFixed; return <div key={kind} className={fixed ? 'is-fixed' : ''}><button type="button" data-open-mechanism={kind} disabled={!conflictSeen} onClick={() => openMechanism(kind)}><Typography as="span" variant="bodySmall" tone="inherit">{kind === 'space' ? '空间对齐 · 56×56 → 28×28' : '通道对齐 · 64 → 128'}</Typography><Typography as="span" variant="bodySmall" tone="inherit">{fixed ? '✓ 已对齐 · 点击重看' : '点击问号实验，观察怎样改变 →'}</Typography></button>{fixed && <button type="button" data-undo={kind} aria-label={`撤回${kind === 'space' ? '空间' : '通道'}对齐`} onClick={() => undo(kind)}><Typography as="span" variant="bodySmall" tone="inherit">撤回</Typography></button>}</div>; })}</div>
      </>}
      {mechanism && <div className="rtg-projection-shortcut__apply-zone">{allComputed ? <button type="button" data-apply onClick={apply}><Typography as="span" variant="body" tone="inherit">✓ 将{mechanism === 'space' ? '空间取样' : '通道组合'}应用到快捷路径</Typography><Typography as="span" variant="bodySmall" tone="inherit">{mechanism === 'space' ? '56 × 56 → 28 × 28' : '64 个通道 → 128 个通道'}</Typography></button> : <Typography variant="bodySmall" tone="muted">已计算 {revealed.length} / {demoCount} · 点击问号逐项计算，不自动推进</Typography>}</div>}
    </section>
    <NoticeStrip tone={complete || added || mechanism && allComputed ? 'green' : conflictSeen && !aligned && !mechanism ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography variant="bodySmall" tone="inherit">{guidance}</Typography></NoticeStrip>
  </ContentBlock>;
}
