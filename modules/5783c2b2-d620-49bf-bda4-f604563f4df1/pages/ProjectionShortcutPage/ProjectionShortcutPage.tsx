import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-182d83a5-8a52-4aa7-88d1-62b1c0321082" key={motion?.id ?? 'steady'} className="rtg-projection-shortcut__volume" data-volume-motion={motion?.kind ?? ''} viewBox="0 0 220 190" role="img" aria-label={`${spatial ? '28乘28' : '56乘56'}，${channels ? 128 : 64}通道`}
    onAnimationEnd={event => { if (event.animationName === 'rtg-projection-space' || event.animationName === 'rtg-projection-channel') onMotionEnd?.(); }}>
    <g shuku-edit-id="e-650bc81b-20c0-48c2-be3f-114247882b87" className={active ? 'is-active' : ''}>
      {Array.from({ length: channels ? 6 : 3 }, (_, index) => <rect shuku-edit-id="e-71d0ba76-26d7-47af-9068-b278adea2e26" key={index} className={`rtg-projection-shortcut__plane${resizing ? ' is-resizing' : ''}${motion?.kind === 'channels' && index >= 3 ? ' is-new-plane' : ''}`} x={x + index * 6} y={y - index * 4} width={size} height={size} rx="3" style={{ ...geometry(index * 6, -index * 4), opacity: .12 + index * .06 }} />)}
      <g shuku-edit-id="e-81f61317-14bc-40a9-9c61-8fb2f48ffd24" className="rtg-projection-shortcut__face"><rect shuku-edit-id="e-7921aa7b-8ccf-43b1-bd32-98c8f17fea57" className={resizing ? 'is-resizing' : ''} style={geometry()} x={x} y={y} width={size} height={size} rx="3" />
        <g shuku-edit-id="e-4dd94f5e-53a6-473f-87ca-8416cbe3ab9b" className={resizing ? 'rtg-projection-shortcut__resizing-grid' : ''}>{[1, 2, 3].map(index => <g shuku-edit-id="e-10c1898c-67a8-4449-ba47-71b2943b8d8e" key={index}><line shuku-edit-id="e-87596ec0-27e0-4c9f-9885-f5c90b1cb784" x1={x + size * index / 4} y1={y} x2={x + size * index / 4} y2={y + size} /><line shuku-edit-id="e-209e4e47-2603-458e-8f94-b95368bc3241" x1={x} y1={y + size * index / 4} x2={x + size} y2={y + size * index / 4} /></g>)}</g>
        {active && <rect shuku-edit-id="e-8afeeb40-1c24-42db-9d8e-79762a7d5ea0" className="rtg-projection-shortcut__cell" x={x + size / 4} y={y + size / 4} width={size / 4} height={size / 4} />}
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

  return <ContentBlock shuku-edit-id="e-611cd11e-3760-42ee-a154-39471c083db3" ref={root} headingLevel={1} className="rtg-projection-shortcut" data-mode={mechanism ?? (showQuestion ? 'quiz' : 'overview')} data-motion={appliedMotion?.kind ?? ''} data-conflict={conflictSeen} data-spatial={spatialFixed} data-channels={channelsFixed} data-added={added} data-complete={complete} data-computed={revealed.join(',')} data-selected={selected ?? ''}
    title="形状不一样，怎样对齐后再相加？" subtitle="先对齐空间尺寸和通道数，再把对应位置的数值相加。"
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div shuku-edit-id="e-7d41f9f6-88ea-4c57-93f4-89c48dbd2baf" className="rtg-projection-shortcut__toolbar">
      <Typography shuku-edit-id="e-709008ec-a672-4e05-a0c5-da47526997fb" variant="bodySmall" tone="accent">{mechanism ? mechanism === 'space' ? `空间取样 · 已计算 ${revealed.length} / 4` : `通道组合 · 已计算 ${revealed.length} / 3` : showQuestion ? '理解检查 · 对齐为什么必要' : added ? '03 · 两路已经可以相加' : conflictSeen ? '02 · 分别对齐空间与通道' : '01 · 先发现形状冲突'}</Typography>
      <div shuku-edit-id="e-f8259de7-d5a5-4637-ba5f-07cf21175977">{(mechanism || showQuestion) && <button shuku-edit-id="e-2d964c73-b549-4c40-bf88-ea562b8180fd" type="button" data-return onClick={() => { setMechanism(null); setShowQuestion(false); }}><Typography shuku-edit-id="e-428ca240-46ed-4a2e-9309-d77e6c1d1591" as="span" variant="bodySmall" tone="inherit">← 返回对齐实验</Typography></button>}<button shuku-edit-id="e-1c781cc5-6c5d-4037-a44d-de23fc480a5c" type="button" data-reset onClick={mechanism ? () => { if (mechanism === 'space') setSpaceRevealed([]); else setChannelsRevealed([]); setSelected(null); } : restart}><Typography shuku-edit-id="e-eef5ec28-fa25-445b-af97-c42c8b252ec1" as="span" variant="bodySmall" tone="inherit">↶ {mechanism ? '重算本项' : '重新实验'}</Typography></button></div>
    </div>
    <section shuku-edit-id="e-ba0e8ad3-1cf6-4f66-a74e-d851d830461f" className="rtg-projection-shortcut__lab" aria-label={mechanism ? '点击问号完成对齐数值实验' : '两路特征的形状对齐实验'}>
      {mechanism === 'space' ? <>
        <div shuku-edit-id="e-536c705b-8702-4c7b-a63f-99291c547f17" className="rtg-projection-shortcut__space-board">
          <section shuku-edit-id="e-385c24ed-8fc6-4f2d-aa49-a83c3715ce2e" className="rtg-projection-shortcut__sample-block"><Typography shuku-edit-id="e-d506ade2-e94b-438e-a37f-3088663439d1" as="h2" variant="body" tone="accent">输入 · 4 × 4 个位置</Typography><div shuku-edit-id="e-a3f394b1-29dd-46b3-b7a0-ecec999710b5" className="rtg-projection-shortcut__input-grid">{Array.from({ length: 16 }, (_, index) => {
            const sample = samples.indexOf(index);
            return <div shuku-edit-id="e-da96d7c4-67af-4cb3-9a18-481553a819dd" key={index} data-input-cell={index} className={selected !== null && samples[selected] === index ? 'is-current' : spaceRevealed.includes(sample) ? 'is-computed' : ''}><Typography shuku-edit-id="e-7ddd528d-a63b-45ca-9222-62a70e74c5e0" as="span" variant="body" tone="inherit">{index + 1}</Typography></div>;
          })}</div><Typography shuku-edit-id="e-9696cbd2-6451-4a8a-bac8-cc34a945bec3" variant="bodySmall" tone="muted">窗口每次向右、向下跨 2 格</Typography></section>
          <section shuku-edit-id="e-67e07cbe-fe0f-4d7b-b869-204554ef3e8c" className="rtg-projection-shortcut__sample-block"><Typography shuku-edit-id="e-87815bbf-518c-4a9e-925b-84fcd2b9d321" as="h2" variant="body" tone="accent">输出 · 2 × 2 个位置</Typography><div shuku-edit-id="e-111bb42d-e453-4039-8295-880cb1ae2922" className="rtg-projection-shortcut__output-grid">{samples.map((source, index) => <button shuku-edit-id="e-9e40afe6-30b7-4577-b58e-957cf942eafe" type="button" key={source} data-compute={index} data-source={source} data-value={spaceRevealed.includes(index) ? source + 1 : ''} aria-pressed={selected === index} aria-label={`${spaceRevealed.includes(index) ? '回看' : '计算'}第${Math.floor(index / 2) + 1}行第${index % 2 + 1}列输出`} className={(spaceRevealed.includes(index) ? 'is-computed' : 'is-unknown') + (selected === index ? ' is-current' : '')} onClick={() => compute(index)}><Typography shuku-edit-id="e-caf75057-6559-4872-b8e6-62fab4de737b" as="span" variant="h3" tone="inherit">{spaceRevealed.includes(index) ? source + 1 : '?'}</Typography></button>)}</div><Typography shuku-edit-id="e-2583b018-44a0-4064-983a-78bf92b8f158" variant="bodySmall" tone="warning">点击问号，写入对应位置的数</Typography></section>
          <aside shuku-edit-id="e-d58ccb64-58b4-4592-a1f3-6a3105f0bb2f" className="rtg-projection-shortcut__explanation"><Typography shuku-edit-id="e-f449044d-15a3-4463-a3ca-808c6f1f0c35" as="h2" variant="body" tone="accent">1×1 窗口 · stride 2</Typography><Typography shuku-edit-id="e-27c952e6-c25a-4b30-a6a5-bf3309dc0cdf" as="code" variant="body" tone="warning">{selected === null ? '取一个位置 → 写一个数' : `${samples[selected] + 1} × 1 = ${samples[selected] + 1}`}</Typography><Typography shuku-edit-id="e-379d8cca-d0dc-4c1d-8db7-bdd7fdea68f5" variant="bodySmall">{selected === null ? '点中间任一问号，对照左侧高亮的输入位置。' : `来自输入第${Math.floor(samples[selected] / 4) + 1}行、第${samples[selected] % 4 + 1}列；输出写入第${Math.floor(selected / 2) + 1}行、第${selected % 2 + 1}列。`}</Typography><Typography shuku-edit-id="e-1eedab16-e070-4026-a30c-473d0642c781" variant="bodySmall" tone="muted">仅演示一个通道，权重为 1、偏置为 0。不是把 2×2 区域取平均。</Typography></aside>
        </div>
        <Typography shuku-edit-id="e-afac1f41-c4d2-4c30-9073-4943ee058ecb" variant="bodySmall" tone="muted" className="rtg-projection-shortcut__mechanism-note">4 × 4 → 2 × 2；本页 56 × 56 → 28 × 28 使用同样的空间步长。</Typography>
      </> : mechanism === 'channels' ? <>
        <div shuku-edit-id="e-4dc0421c-a4be-4604-ab21-a994995346a9" className="rtg-projection-shortcut__channel-board">
          <section shuku-edit-id="e-7eaf6362-9a1a-482b-a232-edae88335c2f" className="rtg-projection-shortcut__channel-input"><Typography shuku-edit-id="e-ac4ff2f6-e842-45ec-b486-1662ab2af458" as="h2" variant="body" tone="accent">同一位置的输入</Typography><div shuku-edit-id="e-8131508c-0859-43ea-af41-9d91175b43c0">{[2, 4].map((value, index) => <article shuku-edit-id="e-eb6341e8-f86a-4758-b88d-fbb46ae98742" key={value}><Typography shuku-edit-id="e-20afd8eb-1517-44c3-a0bf-d6707c087250" variant="bodySmall" tone="muted">通道 {index + 1}</Typography><Typography shuku-edit-id="e-cdfe9c81-d784-4ece-be3c-6514cb890dc4" variant="h3" tone="accent">{value}</Typography></article>)}</div><Typography shuku-edit-id="e-0e0760f3-8e8f-42fe-a548-4a90ac4c4aa5" variant="bodySmall" tone="muted">每个卷积核都读取这两个数，输入不会被“用完”。</Typography></section>
          <section shuku-edit-id="e-b5e107ae-da8c-4d08-a5f2-afdf4afc9213" className="rtg-projection-shortcut__recipes" aria-label="三个卷积核分别计算三个输出通道">{recipes.map((recipe, index) => <article shuku-edit-id="e-06ddceb6-b72e-453b-829e-ea866fcfd3fc" key={index} className={selected === index ? 'is-current' : ''}>
            <div shuku-edit-id="e-4f9bba0e-82fb-487e-bf29-52f39330e721"><Typography shuku-edit-id="e-ba0858d4-8a49-42a8-94da-b16c04cd0cf6" variant="bodySmall" tone="warning">卷积核 {index + 1}</Typography><Typography shuku-edit-id="e-156c5aca-9cfa-453b-ad9f-352225aadbae" variant="bodySmall" tone="muted">[{recipe.weights.join(', ')}]</Typography></div>
            <Typography shuku-edit-id="e-695c232f-54a9-4fe1-a10b-1a10da6313ae" as="code" variant="bodySmall" tone="accent">{recipe.formula} =</Typography>
            <button shuku-edit-id="e-1b4a636e-e79e-4493-9ade-12968061828e" type="button" data-compute={index} data-value={channelsRevealed.includes(index) ? channelResult(index) : ''} aria-pressed={selected === index} aria-label={`${channelsRevealed.includes(index) ? '回看' : '计算'}输出通道${index + 1}`} className={channelsRevealed.includes(index) ? 'is-computed' : 'is-unknown'} onClick={() => compute(index)}><Typography shuku-edit-id="e-ba0e6302-8d15-4fb1-b4ae-2d602c3d70b4" as="span" variant="h3" tone="inherit">{channelsRevealed.includes(index) ? channelResult(index) : '?'}</Typography></button>
          </article>)}</section>
          <aside shuku-edit-id="e-80cad013-a704-45b8-ab80-52249be89597" className="rtg-projection-shortcut__explanation"><Typography shuku-edit-id="e-c4f5e1b7-158f-44a9-8ba5-30c06879495b" as="h2" variant="body" tone="accent">一个核 → 一个输出通道</Typography><Typography shuku-edit-id="e-e76382e4-58ca-424b-bdd7-928312c1897e" variant="bodySmall">不同的权重配方，对同一位置的全部输入通道加权求和。</Typography><Typography shuku-edit-id="e-e2a63a1b-897b-4b72-9432-205151b67b3c" as="code" variant="body" tone="success">2 个输入 → 3 个输出</Typography><Typography shuku-edit-id="e-3c915123-1f86-4dbf-bc85-8a3e67df7390" variant="bodySmall" tone="muted">1×1 只限制空间窗口，不是只看一个通道。本例省略偏置。</Typography></aside>
        </div>
        <Typography shuku-edit-id="e-adfd1fc1-3b30-4f07-b133-1be6b2acfe98" variant="bodySmall" tone="muted" className="rtg-projection-shortcut__mechanism-note">回到 64 → 128：每个核有 64 个权重，128 个核产生 128 个输出通道；同一组核在各空间位置复用。</Typography>
      </> : showQuestion ? <div shuku-edit-id="e-d36c4604-0229-4db1-9fb8-e74406eccccf" className="rtg-projection-shortcut__quiz"><RtgQuestion key={attempt} pageId="ad198f4a-7cb6-4dee-b49c-7c0096a8f152" questionId={`projection-purpose-${attempt}`} type="choice" typeLabel="理解检查" title="这里的 1×1 卷积与 stride 2 主要解决什么问题？" answer="shape" options={[
        { value: 'shape', label: '把空间尺寸与通道数对齐' }, { value: 'label', label: '直接预测新的类别标签', wrongFeedback: '投影捷径不负责最终分类。' }, { value: 'image', label: '把特征图还原成原始图片', wrongFeedback: '它仍在特征空间工作，不会还原原图。' },
      ]} feedback={{ correct: '正确。两路形状对齐后，才能对同一位置、同一通道逐元素相加。' }} onCheck={setQuestionResult} /></div> : <>
        <Typography shuku-edit-id="e-a037d45b-5fec-4acf-84d0-7fc384dcbbe2" variant="bodySmall" tone="muted" className="rtg-projection-shortcut__common-input">共同输入 x · 56 × 56 × 64（高 × 宽 × 通道）</Typography>
        <div shuku-edit-id="e-93853944-f0ee-4413-b6e9-2c61cc5bc868" className="rtg-projection-shortcut__comparison">
          <article shuku-edit-id="e-40efae95-6d7c-40bb-b562-d39dcadb0e58" className="rtg-projection-shortcut__tensor"><Typography shuku-edit-id="e-d454771a-27fc-421b-b5a6-62ee9ad32b86" as="h2" variant="body" tone="accent">残差分支 · 目标形状</Typography><FeatureVolume spatial channels active={added} /><Typography shuku-edit-id="e-4ef8e251-0910-4123-94f9-07968fe2c74c" as="code" variant="body" tone="accent">28 × 28 × 128</Typography></article>
          <div shuku-edit-id="e-a12d8185-58a4-48b4-98b5-7bbbe1970336" className="rtg-projection-shortcut__join"><button shuku-edit-id="e-4c576f62-439b-4448-9fc4-d66db06de7ce" type="button" data-join disabled={conflictSeen && !aligned} className={added ? 'is-added' : aligned ? 'is-ready' : conflictSeen ? 'is-conflict' : ''} onClick={join} aria-label={added ? '查看理解检查' : conflictSeen ? '验证两路逐元素相加' : '尝试直接相加'}><Typography shuku-edit-id="e-0b008713-fb37-4b16-b332-a391d8def8de" as="span" variant="h2" tone="inherit">{added ? '✓' : '+'}</Typography></button><Typography shuku-edit-id="e-436844d6-2a76-4f6f-a3ba-a40501729dbd" variant="bodySmall" tone={added || aligned ? 'success' : conflictSeen ? 'warning' : 'accent'}>{added ? '已相加 · 点此检查理解' : aligned ? '点击加号 · 验证相加' : conflictSeen ? '先对齐空间与通道' : '点击加号 · 尝试相加'}</Typography>{added && <Typography shuku-edit-id="e-ac8bfeb8-9e22-404f-8e11-97193d105700" as="code" variant="bodySmall" tone="success">2 + (−1) = 1</Typography>}</div>
          <article shuku-edit-id="e-1b0f4ca1-f4da-41b3-833e-4ebae5c21fdc" className={`rtg-projection-shortcut__tensor${aligned ? ' is-aligned' : ''}`} data-shortcut-volume><Typography shuku-edit-id="e-3dbe5557-3aeb-41d3-a727-435d72ae3d1c" as="h2" variant="body" tone="accent">快捷路径 · 当前形状</Typography><FeatureVolume spatial={spatialFixed} channels={channelsFixed} active={added} motion={appliedMotion} onMotionEnd={() => setAppliedMotion(current => current?.id === appliedMotion?.id ? null : current)} /><Typography shuku-edit-id="e-3fa2d8cd-fe25-4451-bf69-9e5be8e9fda6" as="code" variant="body" tone={appliedMotion || aligned ? 'success' : 'accent'}>{appliedMotion ? appliedMotion.kind === 'space' ? '56×56 → 28×28' : '64 → 128 通道' : `${spatialFixed ? '28 × 28' : '56 × 56'} × ${channelsFixed ? 128 : 64}`}</Typography></article>
        </div>
        <div shuku-edit-id="e-67f25d1d-af0c-451b-a20c-e39ac88e6c1e" className="rtg-projection-shortcut__dimension-checks" aria-label="逐项比较两路形状">{[{ name: '高 H', value: spatialFixed ? 28 : 56, target: 28 }, { name: '宽 W', value: spatialFixed ? 28 : 56, target: 28 }, { name: '通道 C', value: channelsFixed ? 128 : 64, target: 128 }].map(dimension => <Typography shuku-edit-id="e-d80c1e4b-1bc7-4417-8a6e-a307912c58c9" key={dimension.name} as="code" variant="bodySmall" tone={dimension.value === dimension.target ? 'success' : conflictSeen ? 'warning' : 'muted'}>{dimension.name}：{dimension.target} {dimension.value === dimension.target ? '=' : '≠'} {dimension.value}</Typography>)}</div>
        <div shuku-edit-id="e-7fa9892b-4e6c-40be-beae-58b962f4e70c" className="rtg-projection-shortcut__tools">{(['space', 'channels'] as const).map(kind => { const fixed = kind === 'space' ? spatialFixed : channelsFixed; return <div shuku-edit-id="e-869f218c-96a3-4775-aab0-85a0235e96a1" key={kind} className={fixed ? 'is-fixed' : ''}><button shuku-edit-id="e-66701400-3d50-4294-baed-3b4d0cef8583" type="button" data-open-mechanism={kind} disabled={!conflictSeen} onClick={() => openMechanism(kind)}><Typography shuku-edit-id="e-a63544d2-412f-4c94-bea0-edf3183a5709" as="span" variant="bodySmall" tone="inherit">{kind === 'space' ? '空间对齐 · 56×56 → 28×28' : '通道对齐 · 64 → 128'}</Typography><Typography shuku-edit-id="e-36c20ec6-ed57-4c28-bb84-e62eec08992e" as="span" variant="bodySmall" tone="inherit">{fixed ? '✓ 已对齐 · 点击重看' : '点击问号实验，观察怎样改变 →'}</Typography></button>{fixed && <button shuku-edit-id="e-74713d2a-dc69-4b0c-8c6d-dd0f27f9e6df" type="button" data-undo={kind} aria-label={`撤回${kind === 'space' ? '空间' : '通道'}对齐`} onClick={() => undo(kind)}><Typography shuku-edit-id="e-42c76119-01b1-4563-b321-b7302da35cb9" as="span" variant="bodySmall" tone="inherit">撤回</Typography></button>}</div>; })}</div>
      </>}
      {mechanism && <div shuku-edit-id="e-2484d4b8-5f97-4ab2-8cf6-c8ded86a3c23" className="rtg-projection-shortcut__apply-zone">{allComputed ? <button shuku-edit-id="e-b8f5fc5c-f58c-4154-af9a-d2c6e9b1d116" type="button" data-apply onClick={apply}><Typography shuku-edit-id="e-b51fcdc7-24be-4445-951e-f7411a7a59ff" as="span" variant="body" tone="inherit">✓ 将{mechanism === 'space' ? '空间取样' : '通道组合'}应用到快捷路径</Typography><Typography shuku-edit-id="e-d185d719-34b4-4702-b8b2-ee8c5433dc75" as="span" variant="bodySmall" tone="inherit">{mechanism === 'space' ? '56 × 56 → 28 × 28' : '64 个通道 → 128 个通道'}</Typography></button> : <Typography shuku-edit-id="e-80be85f0-8f62-4259-b002-92e945ff927f" variant="bodySmall" tone="muted">已计算 {revealed.length} / {demoCount} · 点击问号逐项计算，不自动推进</Typography>}</div>}
    </section>
    <NoticeStrip tone={complete || added || mechanism && allComputed ? 'green' : conflictSeen && !aligned && !mechanism ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-83dd22f9-e6dd-4b7a-bc85-d44a6c13f519" variant="bodySmall" tone="inherit">{guidance}</Typography></NoticeStrip>
  </ContentBlock>;
}
