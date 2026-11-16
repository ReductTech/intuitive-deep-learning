import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.jpg");
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
  return <svg shuku-edit-id="e-fdef510b-b1d2-4333-8327-2316cfd9c963" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {replay ? <path shuku-edit-id="e-f08d288f-125e-436f-8bf7-a4f2177b4846" d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /> : <path shuku-edit-id="e-1279640c-5530-40a8-84a7-6374f962eb96" d="m9 5 9 7-9 7Z" />}
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
    return <button shuku-edit-id="e-ad2e5388-c1dc-4a90-a15f-7d30ee2107df" ref={element => { actions.current[target] = element; }} type="button"
      className={`rtg-learning__action rtg-learning__action--${tone}`} data-action={`phase-${target}`}
      aria-label={target === 6 ? '用新参数再算一次' : label} aria-describedby="rtg-learning-current-instruction" onClick={() => run(target)}>
      <ActionIcon /><Typography shuku-edit-id="e-b93a22ef-11c6-4db9-ac1f-a39177a54624" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
    </button>;
  }

  const status = phase === 0 ? '点照片上的“开始前向”，观察当前参数怎样产生特征与预测。'
    : phase === 1 ? '前向只产生临时结果，θ、φ 没有改变。点预测结果，与真实标签比较。'
    : phase === 2 ? '损失说明预测与标签的差距，本身不改参数。点损失节点，反向求梯度。'
    : phase === 3 ? '梯度已算出，但 θ、φ 仍未改变。点优化器，执行参数更新。'
    : phase === 4 ? '绿色表示参数已改写。先点“查看总览”，保留旧结果做对照。'
    : phase === 5 ? '参数已更新，特征、预测和损失仍是旧值。点照片上的“用新参数复算”，观察原位变化。'
    : '用新参数复算后，预测由纸盒变为塑料瓶，损失下降。本例用于演示训练闭环，不代表一次更新就学会。';

  return <ContentBlock shuku-edit-id="e-abcfbdf4-2d2a-4867-8734-d8d2c2914d4f" headingLevel={1} className="rtg-learning"
    data-phase={phase} data-verified={verified}
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation();
        if (event.repeat) event.preventDefault();
      }
    }}
    title="这些特征是怎样学出来的？" subtitle="亲手推进一轮训练：先产生预测，再比较损失、求梯度，最后更新参数。">
    <nav shuku-edit-id="e-b37521c7-385c-4e63-816d-fba0edc6e40b" className="rtg-learning__phase-bar" aria-label="一轮训练的四个阶段">
      <ol shuku-edit-id="e-6460d660-d55a-47eb-ad17-00c883a91a1c" className="rtg-learning__phase-steps">
        {phases.map((label, index) => <li shuku-edit-id="e-3377b71f-0d17-49f2-a2c8-06b3d8ca8a90" key={label}><button shuku-edit-id="e-378fa3e6-5960-4455-b0a0-2eb98aba6380" type="button" data-stage={index + 1}
          className={!overview && Math.max(1, phase) === index + 1 ? 'is-current' : furthest >= index + 1 ? 'is-visited' : ''}
          disabled={furthest < index + 1} aria-current={!overview && Math.max(1, phase) === index + 1 ? 'step' : undefined}
          aria-label={`第 ${index + 1} 步，${label}`} onClick={() => inspect((index + 1) as Phase)}>
          <Typography shuku-edit-id="e-2956e883-0b01-4054-8e91-f84c8a1606c4" as="span" variant="bodySmall" tone="inherit" className="rtg-learning__phase-number">0{index + 1}</Typography>
          <Typography shuku-edit-id="e-4e18f147-f12e-4420-880d-36fc0561422d" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
        </button></li>)}
      </ol>
      {furthest >= 5 ? <Button data-overview active={overview} onClick={() => inspect(furthest >= 6 ? 6 : 5)}>查看总览</Button> : <Typography shuku-edit-id="e-03af0a58-e266-47f6-8b3f-3e853475da45" variant="bodySmall" tone="muted">每一步，由你推进</Typography>}
    </nav>

    <section shuku-edit-id="e-c9e7a3bf-5fe5-46df-9241-25b263a6d920" className={`rtg-learning__scene rtg-learning__scene--active-${phase}`}
      aria-label="可点击的一轮训练闭环">
      <header shuku-edit-id="e-4d902d12-41e9-4d49-8c81-5ef4360c12c5" className="rtg-learning__scene-head">
        <Typography shuku-edit-id="e-382b9632-8bfa-4ac8-9b19-639078d0160d" as="span" variant="bodySmall" tone="accent">{verified ? '完整闭环 · 已用新参数复算' : overview ? '完整结构 · 参数已更新，结果待复算' : phase === 4 ? '参数已更新 · 等待重新计算' : phase === 0 ? '从同一张照片出发' : `当前：${phases[phase - 1]}`}</Typography>
        <div shuku-edit-id="e-90774a2d-5518-465b-b2b9-da96387434b5" className="rtg-learning__tools">
          <button shuku-edit-id="e-0eb37fc0-a8f8-42ee-9421-49c52f3eac88" type="button" data-action="replay" onClick={() => replay()}><ActionIcon replay /><Typography shuku-edit-id="e-c69e92ba-de1d-4223-bcfc-0a310b5b16ca" as="span" variant="bodySmall" tone="inherit">重看本轮</Typography></button>
        </div>
      </header>

      {phase !== 3 && <div shuku-edit-id="e-e3d8cc8c-4566-4144-8b37-d7f3194a23e4" className="rtg-learning__pipeline">
        {(phase <= 1 || overview) && <article shuku-edit-id="e-fb41c128-0bf8-4a4e-a60f-608d7f7281b6" className="rtg-learning__node rtg-learning__node--input" data-learning-module="input">
          <Typography shuku-edit-id="e-592e4166-be86-4af8-9d48-1f62e8c8c955" as="h2" variant="bodySmall" tone="muted">输入 x · 同一张照片</Typography>
          <div shuku-edit-id="e-e43bec5f-9ba3-4925-8004-02fd79d721df" className="rtg-learning__photo"><img shuku-edit-id="e-81d8c16b-a10c-4577-a86d-666c81796d9d" src={bottleFront} alt="统一背景下的透明塑料瓶正面照片" /></div>
          <div shuku-edit-id="e-507ecbeb-b052-4510-9dea-c8f9acbecdb6" className="rtg-learning__node-foot">{action(1, '开始前向') ?? action(6, '用新参数复算', 'update') ?? <Typography shuku-edit-id="e-93290122-c26f-47c2-a677-f8c7a2c0b418" variant="bodySmall" tone="muted">照片始终不变</Typography>}</div>
        </article>}

        {(phase <= 1 || phase === 4 || overview) && <article shuku-edit-id="e-0d657a5e-8256-43ac-a9e1-69eb2fc44bb2" className="rtg-learning__node rtg-learning__node--extractor" data-learning-module="extractor">
          <div shuku-edit-id="e-d6f7924d-acad-4b4f-92c3-55cef5b9a38b"><Typography shuku-edit-id="e-8b5d7452-d2ed-47e6-957e-6f7396b15f0b" variant="bodySmall" tone="muted">特征提取器</Typography><Typography shuku-edit-id="e-32f9ea37-a8e4-4219-90c1-9485a2b861f3" as="h2" variant="h3" tone="accent">提取图像特征</Typography></div>
          <div shuku-edit-id="e-282035e7-8a2a-462d-8e3f-e7cc42d5bb9f" className="rtg-learning__filters" aria-hidden="true"><span shuku-edit-id="e-387a35ec-6682-45a8-969a-47c8f8d9d186" /><span shuku-edit-id="e-387a372f-04da-4438-8765-546a66af1856" /><span shuku-edit-id="e-f999500b-7013-45be-9f35-38aa9ee1b8e8" /></div>
          <div shuku-edit-id="e-8d3b0b3e-ee46-419f-8254-8651418ecc1a" className={`rtg-learning__parameter${updated ? ' is-updated' : ''}`} data-parameter="theta" data-updated={updated}>
            <Typography shuku-edit-id="e-93cb7e9f-e610-4860-96f4-a11bc2fbb1c1" as="span" variant="body" tone="inherit">{updated ? 'θ′' : 'θ'}</Typography>
            <span shuku-edit-id="e-536b5c3f-3bc1-47b8-b56a-a8e7fe0539d6" className="rtg-learning__parameter-track" aria-hidden="true"><span shuku-edit-id="e-34931c51-f21a-4f01-a9e0-c79bb77be558" /></span>
            <Typography shuku-edit-id="e-9896dd05-6791-45bb-bf67-826ef8a42925" as="span" variant="bodySmall" tone="inherit">{updated ? '参数已更新' : '参数未改写'}</Typography>
          </div>
        </article>}

        {(phase <= 1 || overview) && <article shuku-edit-id="e-3c8219e6-1c00-4064-8eba-63efafda9dc5" className="rtg-learning__node rtg-learning__node--feature" data-learning-module="feature" data-feature-version={verified ? 'new' : forwardReady ? 'old' : 'waiting'}>
          <div shuku-edit-id="e-9d996506-7f8f-4fcf-a70e-6fc8ab09c65b"><Typography shuku-edit-id="e-e58590b2-713a-4ded-b0a5-9496962b5bcb" variant="bodySmall" tone="muted">中间结果</Typography><Typography shuku-edit-id="e-cd00838d-20be-4219-89ca-384e1eba7789" as="h2" variant="h3" tone="accent">特征 z</Typography></div>
          <div shuku-edit-id="e-66b1974b-e7b3-4e7f-8358-7bc30c62f7f2" className={'rtg-learning__features' + (forwardReady ? ' is-visible' : '')} role="img" aria-label={verified ? '更新前后特征的叠加对照，浅色是更新前，绿色是复算后，教学示意' : '旧参数产生的临时特征，教学示意'}>
            {oldFeatures.map((value, index) => <span shuku-edit-id="e-c75bf24b-0aed-4f67-8476-94767831c445" key={index}><i shuku-edit-id="e-012cc671-79f7-4535-8ffc-a8eb71452713" style={{ height: `${value * 100}%` }} /><b shuku-edit-id="e-61378bee-86a4-4f6c-b6c3-4deab63a2e1d" style={{ height: `${(verified ? newFeatures[index] : value) * 100}%` }} /></span>)}
          </div>
          <Typography shuku-edit-id="e-59b37b77-2575-405d-9946-e42d2c673c80" variant="bodySmall" tone={verified ? 'success' : 'muted'}>{verified ? '浅：旧 · 绿：新' : phase === 5 ? '旧值 · 待复算' : forwardReady ? '前向临时结果' : '等待前向计算'}</Typography>
        </article>}

        {(phase <= 1 || phase === 4 || overview) && <article shuku-edit-id="e-92c4cd30-536e-43d5-91a9-6675762fcd34" className="rtg-learning__node rtg-learning__node--head" data-learning-module="head">
          <div shuku-edit-id="e-389ab33f-379c-44e9-92b6-b188f80fe9f3"><Typography shuku-edit-id="e-44483d46-adbf-45c0-a462-e57395275058" variant="bodySmall" tone="muted">分类头</Typography><Typography shuku-edit-id="e-586886e3-e8e9-4f0d-bb87-bfa8edd1d07c" as="h2" variant="h3" tone="accent">生成类别分数</Typography></div>
          <div shuku-edit-id="e-ebce0d61-b4a3-45f9-9823-550bee974a27" className="rtg-learning__score-symbol" aria-hidden="true"><span shuku-edit-id="e-24ea00ed-3945-42de-a790-465987832938" /><span shuku-edit-id="e-e86cd9da-1c81-4192-812c-d58075a7eb92" /><span shuku-edit-id="e-a5ff3737-307c-4ea3-b840-a2dd59c0c03c" /></div>
          <Typography shuku-edit-id="e-50e4b694-de24-44f1-8f8a-e65fa3476ce8" variant="bodySmall" tone="muted">分数转为预测概率</Typography>
          <div shuku-edit-id="e-c934ff07-9069-429c-ad18-6ac30f949750" className={`rtg-learning__parameter${updated ? ' is-updated' : ''}`} data-parameter="phi" data-updated={updated}>
            <Typography shuku-edit-id="e-f7f67c45-baa5-4742-b4e1-f6307afccfb0" as="span" variant="body" tone="inherit">{updated ? 'φ′' : 'φ'}</Typography>
            <span shuku-edit-id="e-73abac1a-b95f-44ae-b4cd-7f5d6f101f40" className="rtg-learning__parameter-track" aria-hidden="true"><span shuku-edit-id="e-095ea0ab-f07f-4f21-859c-8f5c2b53a72a" /></span>
            <Typography shuku-edit-id="e-4862cb1c-c206-4908-87f3-6d449be2bfcc" as="span" variant="bodySmall" tone="inherit">{updated ? '参数已更新' : '参数未改写'}</Typography>
          </div>
        </article>}

        {(phase <= 2 || overview) && <article shuku-edit-id="e-a545aa7c-939e-4dc7-8f31-e9d29dfdee4e" className="rtg-learning__node rtg-learning__node--prediction" data-learning-module="prediction" data-prediction-version={verified ? 'new' : 'old'}>
          <Typography shuku-edit-id="e-f0b9a489-c3d1-40d0-998e-734a1d110bae" as="h2" ref={resultRef} tabIndex={-1} variant="body" tone={verified ? 'success' : 'accent'}>{verified ? '复算预测：塑料瓶' : forwardReady ? '预测结果：纸盒' : '预测概率 · 示意'}</Typography>
          <div shuku-edit-id="e-3a79e130-59ac-47ac-ba54-cf291cd0f11a" className="rtg-learning__probabilities">
            {examples.map((example, index) => <div shuku-edit-id="e-0d602260-8416-475f-8ec0-c4ab91014436" key={example.label} className={index === 0 ? 'is-true-class' : ''} aria-label={`${example.label}，${forwardReady ? verified ? `从 ${example.before * 100}% 变为 ${example.after * 100}%` : `${example.before * 100}%` : '等待计算'}`}>
              <Typography shuku-edit-id="e-922a276f-e4ac-4689-9e1e-4c3c9ea18ffd" as="span" variant="bodySmall" tone="inherit">{example.label}</Typography>
              <span shuku-edit-id="e-806bcf80-c1c3-4298-82ca-6225d70a4480" className="rtg-learning__probability-track" aria-hidden="true"><i shuku-edit-id="e-f2d2d010-985e-4755-ac59-af5c57415d82" style={{ width: `${forwardReady ? example.before * 100 : 0}%` }} /><b shuku-edit-id="e-21614698-0c71-4258-9c0b-9b9763656543" style={{ width: `${forwardReady ? (verified ? example.after : example.before) * 100 : 0}%` }} /></span>
              <Typography shuku-edit-id="e-4b416b23-2030-48e1-9ee2-2e8e98b182a8" as="span" variant="bodySmall" tone="inherit">{forwardReady ? `${Math.round((verified ? example.after : example.before) * 100)}%` : '—'}</Typography>
            </div>)}
          </div>
          <div shuku-edit-id="e-edc84740-2c89-408c-ac7f-0c7247df27e9" className="rtg-learning__node-foot">{action(2, '与标签比较', 'compare') ?? (lossReady ? <Typography shuku-edit-id="e-a357f3a1-2914-4e4c-bd14-020fb5e34cb3" variant="bodySmall" tone="accent">真实标签：塑料瓶</Typography> : <Typography shuku-edit-id="e-7e1b59d4-f1d2-4fcf-9dc9-e906e24277f9" variant="bodySmall" tone="muted">先预测，再与标签比较</Typography>)}</div>
        </article>}
      </div>}

      {phase >= 2 && <div shuku-edit-id="e-7067abed-a0cb-42dc-ad00-9428727e7f25" className="rtg-learning__feedback-lane">
        {phase >= 3 && <article shuku-edit-id="e-15f551fc-41d1-495f-b883-985427583159" className={`rtg-learning__optimizer${updated ? ' is-updated' : ''}`} data-learning-module="optimizer">
          <div shuku-edit-id="e-cfbe86ae-0940-4c43-ae16-2c9b6bad85c0"><Typography shuku-edit-id="e-822a8e2e-e2b6-43e1-93c4-0f0d2befc45a" as="h2" variant="body" tone="accent">优化器</Typography><Typography shuku-edit-id="e-b8e033ec-8df4-47fe-9acf-43ba609d7bfc" variant="bodySmall" tone="muted">参数 − 学习率 × 梯度</Typography></div>
          {action(4, '更新参数', 'update') ?? action(5, '查看总览', 'update') ?? <Typography shuku-edit-id="e-8a8322ef-04c0-4540-b171-a0b7f3c8957d" variant="bodySmall" tone={updated ? 'success' : 'muted'}>{updated ? 'θ、φ 已改写' : '等待梯度就绪'}</Typography>}
        </article>}
        {(phase === 3 || overview) && <article shuku-edit-id="e-11b2ba85-9b78-4142-bd30-8ea6ddf8cb25" className={`rtg-learning__gradient${gradientReady ? ' is-ready' : ''}`} data-learning-module="gradient">
          <Typography shuku-edit-id="e-0fedb73d-d315-45a1-933c-8460faddf2cd" as="h2" variant="body" tone="inherit">反向传播 · 计算梯度</Typography>
          <Typography shuku-edit-id="e-54f36c93-d4f7-4d69-82e5-205e6c0aa7c5" as="span" variant="bodySmall" tone="inherit">gθ = ∂L/∂θ · gφ = ∂L/∂φ</Typography>
          <Typography shuku-edit-id="e-3bdf040b-8b43-488b-85ee-0cf169c0e612" variant="bodySmall" tone="muted">{gradientReady ? '梯度已就绪；求梯度本身不改参数' : '计算损失对各参数的变化率'}</Typography>
        </article>}
        {(phase === 2 || phase === 3 || overview) && <article shuku-edit-id="e-28e1e0ec-7705-465d-a226-1bff0309bdb0" className={`rtg-learning__loss${lossReady ? ' is-ready' : ''}`} data-learning-module="loss">
          <Typography shuku-edit-id="e-688d2bba-7552-4028-97eb-429285b9cfae" as="h2" variant="bodySmall" tone="muted">损失 L · 标签：塑料瓶</Typography>
          <Typography shuku-edit-id="e-0f7f9bfa-50e8-44b5-bf29-5f15877b4189" as="span" variant={phase === 2 ? 'display' : 'h3'} tone={verified ? 'success' : 'warning'} data-loss={lossReady ? (verified ? revisedLoss : initialLoss).toFixed(2) : ''}>
            {lossReady ? verified ? `${initialLoss.toFixed(2)} → ${revisedLoss.toFixed(2)}` : initialLoss.toFixed(2) : '—'}
          </Typography>
          {action(3, '反向求梯度', 'gradient') ?? <Typography shuku-edit-id="e-fa4a8d0d-5eb1-411f-bd6b-2de8d0ab3022" variant="bodySmall" tone="muted">{phase === 5 ? '旧损失 · 待复算' : lossReady ? 'L = −ln(塑料瓶概率)' : '等待预测与标签比较'}</Typography>}
        </article>}
      </div>}
      {updated && <div shuku-edit-id="e-285f7c7f-3170-4bb2-975a-1571d7770930" className="rtg-learning__update-routes" role="img" aria-label="优化器分别更新特征提取器的参数 θ 和分类头的参数 φ">
        <span shuku-edit-id="e-82c41862-2bcc-4241-a293-83637c29d0f1" className="rtg-learning__update-bridge" aria-hidden="true" />
        <span shuku-edit-id="e-79b5d4f1-fa0c-4c84-8eeb-a821e06803ea" className="rtg-learning__update-branch rtg-learning__update-branch--theta" data-update-target="theta" aria-hidden="true" />
        <span shuku-edit-id="e-9bc48448-6ec8-43f5-86e2-f641e7ce8f06" className="rtg-learning__update-branch rtg-learning__update-branch--phi" data-update-target="phi" aria-hidden="true" />
      </div>}
    </section>

    <div shuku-edit-id="e-e0082122-262a-4c6a-8f21-a63180fdc9c6" className="rtg-learning__conclusion">
      <NoticeStrip id="rtg-learning-current-instruction" tone={verified ? 'green' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-84147789-74dc-4734-97cf-c938c6cd980e" variant="bodySmall" tone="inherit">{status}</Typography></NoticeStrip>
    </div>
  </ContentBlock>;
}
