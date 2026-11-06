import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
import './LearningFeaturesPage.css';

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const phases = ['前向计算', '计算损失', '求梯度', '更新参数'] as const;
// An explicitly illustrative example, not a model running on the photograph.
// This example becomes correct after the update to make the teaching contrast clear,
// not to imply that a real single update guarantees correct classification.
const examples = [
  { label: '塑料瓶', before: .26, after: .68 },
  { label: '易拉罐', before: .12, after: .12 },
  { label: '纸盒', before: .62, after: .20 },
];
const oldFeatures = [.28, .46, .23, .58, .36];
const newFeatures = [.34, .56, .27, .64, .39];
const initialLoss = -Math.log(examples[0].before);
const revisedLoss = -Math.log(examples[0].after);

function ActionIcon({ replay = false }: { replay?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {replay ? <path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /> : <path d="m9 5 9 7-9 7Z" />}
  </svg>;
}

export interface LearningFeaturesPageProps { onComplete?: () => void; }

export function LearningFeaturesPage({ onComplete }: LearningFeaturesPageProps) {
  const [phase, setPhase] = useState<Phase>(0);
  const [furthest, setFurthest] = useState<Phase>(0);
  const actions = useRef<Partial<Record<Phase, HTMLButtonElement | null>>>({});
  const resultRef = useRef<HTMLHeadingElement>(null);
  const focusAfterChange = useRef(false);
  const currentPhase = useRef<Phase>(0), reachedPhase = useRef<Phase>(0);
  currentPhase.current = phase; reachedPhase.current = furthest;
  const updated = phase >= 4;
  const overview = phase >= 5;
  const verified = phase === 6;
  const forwardReady = phase >= 1;
  const lossReady = phase >= 2;
  const gradientReady = phase >= 3;
  useCompleteOnce(verified, onComplete);

  useEffect(() => {
    if (!focusAfterChange.current) return;
    focusAfterChange.current = false;
    if (phase === 6) resultRef.current?.focus({ preventScroll: true });
    else actions.current[(phase + 1) as Phase]?.focus({ preventScroll: true });
  }, [phase]);

  function run(target: Phase) {
    if (target !== currentPhase.current + 1) return;
    focusAfterChange.current = true;
    currentPhase.current = target;
    reachedPhase.current = Math.max(reachedPhase.current, target) as Phase;
    // Match the original page: change stage immediately; CSS handles the short visual transition.
    setPhase(target);
    setFurthest(value => Math.max(value, target) as Phase);
  }

  function replay() {
    currentPhase.current = 0; reachedPhase.current = 0;
    setPhase(0); setFurthest(0);
    focusAfterChange.current = true;
  }

  function inspect(target: Phase) {
    if (target > reachedPhase.current) return;
    currentPhase.current = target;
    focusAfterChange.current = true;
    setPhase(target);
  }

  function action(target: Phase, label: string, tone = 'forward') {
    if (phase + 1 !== target) return null;
    return <button ref={element => { actions.current[target] = element; }} type="button"
      className={`rtg-learning__action rtg-learning__action--${tone}`} data-action={`phase-${target}`}
      aria-label={target === 6 ? '用新参数再算一次' : label} aria-describedby="rtg-learning-current-instruction" onClick={() => run(target)}>
      <ActionIcon /><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography>
    </button>;
  }

  const status = phase === 0 ? '点照片上的“开始前向”，观察当前参数怎样产生特征与预测。'
    : phase === 1 ? '前向只产生临时结果，θ、φ 没有改变。点预测结果，与真实标签比较。'
    : phase === 2 ? '损失说明预测与标签的差距，本身不改参数。点损失节点，反向求梯度。'
    : phase === 3 ? '梯度已算出，但 θ、φ 仍未改变。点优化器，执行参数更新。'
    : phase === 4 ? '绿色表示参数已改写。先点“查看总览”，保留旧结果做对照。'
    : phase === 5 ? '参数已更新，特征、预测和损失仍是旧值。点照片上的“用新参数复算”，观察原位变化。'
    : '用新参数复算后，预测由纸盒变为塑料瓶，损失下降。本例用于演示训练闭环，不代表一次更新就学会。';

  return <ContentBlock headingLevel={1} className="rtg-learning"
    data-phase={phase} data-verified={verified}
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation();
        if (event.repeat) event.preventDefault();
      }
    }}
    title="这些特征是怎样学出来的？" subtitle="亲手推进一轮训练：先产生预测，再比较损失、求梯度，最后更新参数。">
    <nav className="rtg-learning__phase-bar" aria-label="一轮训练的四个阶段">
      <ol className="rtg-learning__phase-steps">
        {phases.map((label, index) => <li key={label}><button type="button" data-stage={index + 1}
          className={!overview && Math.max(1, phase) === index + 1 ? 'is-current' : furthest >= index + 1 ? 'is-visited' : ''}
          disabled={furthest < index + 1} aria-current={!overview && Math.max(1, phase) === index + 1 ? 'step' : undefined}
          aria-label={`第 ${index + 1} 步，${label}`} onClick={() => inspect((index + 1) as Phase)}>
          <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-learning__phase-number">0{index + 1}</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography>
        </button></li>)}
      </ol>
      {furthest >= 5 ? <Button data-overview active={overview} onClick={() => inspect(furthest >= 6 ? 6 : 5)}>查看总览</Button> : <Typography variant="bodySmall" tone="muted">每一步，由你推进</Typography>}
    </nav>

    <section className={`rtg-learning__scene rtg-learning__scene--active-${phase}`}
      aria-label="可点击的一轮训练闭环">
      <header className="rtg-learning__scene-head">
        <Typography as="span" variant="bodySmall" tone="accent">{verified ? '完整闭环 · 已用新参数复算' : overview ? '完整结构 · 参数已更新，结果待复算' : phase === 4 ? '参数已更新 · 等待重新计算' : phase === 0 ? '从同一张照片出发' : `当前：${phases[phase - 1]}`}</Typography>
        <div className="rtg-learning__tools">
          <button type="button" data-action="replay" onClick={() => replay()}><ActionIcon replay /><Typography as="span" variant="bodySmall" tone="inherit">重看本轮</Typography></button>
        </div>
      </header>

      {phase !== 3 && <div className="rtg-learning__pipeline">
        {(phase <= 1 || overview) && <article className="rtg-learning__node rtg-learning__node--input" data-learning-module="input">
          <Typography as="h2" variant="bodySmall" tone="muted">输入 x · 同一张照片</Typography>
          <div className="rtg-learning__photo"><img src={bottleFront} alt="统一背景下的透明塑料瓶正面照片" /></div>
          <div className="rtg-learning__node-foot">{action(1, '开始前向') ?? action(6, '用新参数复算', 'update') ?? <Typography variant="bodySmall" tone="muted">照片始终不变</Typography>}</div>
        </article>}

        {(phase <= 1 || phase === 4 || overview) && <article className="rtg-learning__node rtg-learning__node--extractor" data-learning-module="extractor">
          <div><Typography variant="bodySmall" tone="muted">特征提取器</Typography><Typography as="h2" variant="h3" tone="accent">提取图像特征</Typography></div>
          <div className="rtg-learning__filters" aria-hidden="true"><span /><span /><span /></div>
          <div className={`rtg-learning__parameter${updated ? ' is-updated' : ''}`} data-parameter="theta" data-updated={updated}>
            <Typography as="span" variant="body" tone="inherit">{updated ? 'θ′' : 'θ'}</Typography>
            <span className="rtg-learning__parameter-track" aria-hidden="true"><span /></span>
            <Typography as="span" variant="bodySmall" tone="inherit">{updated ? '参数已更新' : '参数未改写'}</Typography>
          </div>
        </article>}

        {(phase <= 1 || overview) && <article className="rtg-learning__node rtg-learning__node--feature" data-learning-module="feature" data-feature-version={verified ? 'new' : forwardReady ? 'old' : 'waiting'}>
          <div><Typography variant="bodySmall" tone="muted">中间结果</Typography><Typography as="h2" variant="h3" tone="accent">特征 z</Typography></div>
          <div className={'rtg-learning__features' + (forwardReady ? ' is-visible' : '')} role="img" aria-label={verified ? '更新前后特征的叠加对照，浅色是更新前，绿色是复算后，教学示意' : '旧参数产生的临时特征，教学示意'}>
            {oldFeatures.map((value, index) => <span key={index}><i style={{ height: `${value * 100}%` }} /><b style={{ height: `${(verified ? newFeatures[index] : value) * 100}%` }} /></span>)}
          </div>
          <Typography variant="bodySmall" tone={verified ? 'success' : 'muted'}>{verified ? '浅：旧 · 绿：新' : phase === 5 ? '旧值 · 待复算' : forwardReady ? '前向临时结果' : '等待前向计算'}</Typography>
        </article>}

        {(phase <= 1 || phase === 4 || overview) && <article className="rtg-learning__node rtg-learning__node--head" data-learning-module="head">
          <div><Typography variant="bodySmall" tone="muted">分类头</Typography><Typography as="h2" variant="h3" tone="accent">生成类别分数</Typography></div>
          <div className="rtg-learning__score-symbol" aria-hidden="true"><span /><span /><span /></div>
          <Typography variant="bodySmall" tone="muted">分数转为预测概率</Typography>
          <div className={`rtg-learning__parameter${updated ? ' is-updated' : ''}`} data-parameter="phi" data-updated={updated}>
            <Typography as="span" variant="body" tone="inherit">{updated ? 'φ′' : 'φ'}</Typography>
            <span className="rtg-learning__parameter-track" aria-hidden="true"><span /></span>
            <Typography as="span" variant="bodySmall" tone="inherit">{updated ? '参数已更新' : '参数未改写'}</Typography>
          </div>
        </article>}

        {(phase <= 2 || overview) && <article className="rtg-learning__node rtg-learning__node--prediction" data-learning-module="prediction" data-prediction-version={verified ? 'new' : 'old'}>
          <Typography as="h2" ref={resultRef} tabIndex={-1} variant="body" tone={verified ? 'success' : 'accent'}>{verified ? '复算预测：塑料瓶' : forwardReady ? '预测结果：纸盒' : '预测概率 · 示意'}</Typography>
          <div className="rtg-learning__probabilities">
            {examples.map((example, index) => <div key={example.label} className={index === 0 ? 'is-true-class' : ''} aria-label={`${example.label}，${forwardReady ? verified ? `从 ${example.before * 100}% 变为 ${example.after * 100}%` : `${example.before * 100}%` : '等待计算'}`}>
              <Typography as="span" variant="bodySmall" tone="inherit">{example.label}</Typography>
              <span className="rtg-learning__probability-track" aria-hidden="true"><i style={{ width: `${forwardReady ? example.before * 100 : 0}%` }} /><b style={{ width: `${forwardReady ? (verified ? example.after : example.before) * 100 : 0}%` }} /></span>
              <Typography as="span" variant="bodySmall" tone="inherit">{forwardReady ? `${Math.round((verified ? example.after : example.before) * 100)}%` : '—'}</Typography>
            </div>)}
          </div>
          <div className="rtg-learning__node-foot">{action(2, '与标签比较', 'compare') ?? (lossReady ? <Typography variant="bodySmall" tone="accent">真实标签：塑料瓶</Typography> : <Typography variant="bodySmall" tone="muted">先预测，再与标签比较</Typography>)}</div>
        </article>}
      </div>}

      {phase >= 2 && <div className="rtg-learning__feedback-lane">
        {phase >= 3 && <article className={`rtg-learning__optimizer${updated ? ' is-updated' : ''}`} data-learning-module="optimizer">
          <div><Typography as="h2" variant="body" tone="accent">优化器</Typography><Typography variant="bodySmall" tone="muted">参数 − 学习率 × 梯度</Typography></div>
          {action(4, '更新参数', 'update') ?? action(5, '查看总览', 'update') ?? <Typography variant="bodySmall" tone={updated ? 'success' : 'muted'}>{updated ? 'θ、φ 已改写' : '等待梯度就绪'}</Typography>}
        </article>}
        {(phase === 3 || overview) && <article className={`rtg-learning__gradient${gradientReady ? ' is-ready' : ''}`} data-learning-module="gradient">
          <Typography as="h2" variant="body" tone="inherit">反向传播 · 计算梯度</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">gθ = ∂L/∂θ · gφ = ∂L/∂φ</Typography>
          <Typography variant="bodySmall" tone="muted">{gradientReady ? '梯度已就绪；求梯度本身不改参数' : '计算损失对各参数的变化率'}</Typography>
        </article>}
        {(phase === 2 || phase === 3 || overview) && <article className={`rtg-learning__loss${lossReady ? ' is-ready' : ''}`} data-learning-module="loss">
          <Typography as="h2" variant="bodySmall" tone="muted">损失 L · 标签：塑料瓶</Typography>
          <Typography as="span" variant={phase === 2 ? 'display' : 'h3'} tone={verified ? 'success' : 'warning'} data-loss={lossReady ? (verified ? revisedLoss : initialLoss).toFixed(2) : ''}>
            {lossReady ? verified ? `${initialLoss.toFixed(2)} → ${revisedLoss.toFixed(2)}` : initialLoss.toFixed(2) : '—'}
          </Typography>
          {action(3, '反向求梯度', 'gradient') ?? <Typography variant="bodySmall" tone="muted">{phase === 5 ? '旧损失 · 待复算' : lossReady ? 'L = −ln(塑料瓶概率)' : '等待预测与标签比较'}</Typography>}
        </article>}
      </div>}
      {updated && <div className="rtg-learning__update-routes" role="img" aria-label="优化器分别更新特征提取器的参数 θ 和分类头的参数 φ">
        <span className="rtg-learning__update-bridge" aria-hidden="true" />
        <span className="rtg-learning__update-branch rtg-learning__update-branch--theta" data-update-target="theta" aria-hidden="true" />
        <span className="rtg-learning__update-branch rtg-learning__update-branch--phi" data-update-target="phi" aria-hidden="true" />
      </div>}
    </section>

    <div className="rtg-learning__conclusion">
      <NoticeStrip id="rtg-learning-current-instruction" tone={verified ? 'green' : 'blue'} role="status" aria-live="polite"><Typography variant="bodySmall" tone="inherit">{status}</Typography></NoticeStrip>
    </div>
  </ContentBlock>;
}
