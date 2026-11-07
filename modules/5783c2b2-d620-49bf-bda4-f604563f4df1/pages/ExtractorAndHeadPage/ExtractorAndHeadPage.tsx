import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  ContentBlock,
  NoticeStrip,
  Question,
  Typography,
  type QuestionCheckResult,
} from '../../../shared/react';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
const canUpright = moduleAssetUrl(moduleIdentity.id, "recycling/can-upright.png");
const cartonUpright = moduleAssetUrl(moduleIdentity.id, "recycling/carton-upright.png");
import './ExtractorAndHeadPage.css';

type PipelineStage = 0 | 1 | 2;

const QUESTION_LOAD_ID = typeof performance !== 'undefined' ? String(performance.timeOrigin) : String(Date.now());

const samples = [
  {
    id: 'bottle',
    label: '塑料瓶',
    image: bottleFront,
    alt: '统一背景下的透明塑料瓶照片',
    feature: [0.8, -0.2, 1.1, 0.4],
    scores: [
      { label: '塑料瓶', value: 2.4, bar: 92 },
      { label: '易拉罐', value: 0.8, bar: 45 },
      { label: '纸盒', value: -0.2, bar: 20 },
    ],
  },
  {
    id: 'can',
    label: '易拉罐',
    image: canUpright,
    alt: '银色易拉罐照片',
    feature: [-0.1, 1.2, 0.5, 0.9],
    scores: [
      { label: '塑料瓶', value: 0.3, bar: 32 },
      { label: '易拉罐', value: 2.2, bar: 90 },
      { label: '纸盒', value: 0.1, bar: 26 },
    ],
  },
  {
    id: 'carton',
    label: '纸盒',
    image: cartonUpright,
    alt: '棕色纸盒照片',
    feature: [0.4, 0.1, -0.3, 1.3],
    scores: [
      { label: '塑料瓶', value: -0.1, bar: 22 },
      { label: '易拉罐', value: 0.4, bar: 34 },
      { label: '纸盒', value: 2.3, bar: 94 },
    ],
  },
] as const;

export interface ExtractorAndHeadPageProps {
  onComplete?: () => void;
}

export function ExtractorAndHeadPage({ onComplete }: ExtractorAndHeadPageProps) {
  const completedRef = useRef(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [stage, setStage] = useState<PipelineStage>(0);
  const [inspectedExtractor, setInspectedExtractor] = useState(false);
  const [inspectedHead, setInspectedHead] = useState(false);
  const [switchedInput, setSwitchedInput] = useState(false);
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);

  const sample = samples[sampleIndex];
  const prediction = sample.scores.reduce((best, item) => item.value > best.value ? item : best);
  const completed = inspectedExtractor && inspectedHead && switchedInput && Boolean(questionResult?.ok);

  useEffect(() => {
    if (!completed || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [completed, onComplete]);

  const chooseSample = (index: number) => {
    if (index !== sampleIndex) setSwitchedInput(true);
    setSampleIndex(index);
  };

  const inspectExtractor = () => {
    setStage((current) => Math.max(current, 1) as PipelineStage);
    setInspectedExtractor(true);
  };

  const inspectHead = () => {
    if (stage < 1) return;
    setStage(2);
    setInspectedHead(true);
  };

  const notice = questionResult && !questionResult.ok
    ? '表示维数和类别数不是同一个量。分类头可以把同一份表示映射到不同数量的类别分数。'
    : stage === 0
    ? '先点击特征提取器：它不直接给出类别名，而是把图片转换成中间表示。'
    : stage === 1
      ? 'fθ 已生成 z；θ 控制“怎样提取”。接着点击分类头，让它根据 z 计算当前三类的分数。'
      : !switchedInput
        ? 'gφ 已生成类别分数；φ 控制“怎样分类”。现在换一张图片，比较新的 z 和分数。'
        : questionResult?.ok
          ? '表示维数和类别数是两件事：同一份表示可以交给不同分类头，回答不同类别集合的问题。'
          : '同一提取器会为不同图片生成不同表示；分类头再把表示映射到当前任务的三个类别分数。';

  return (
    <ContentBlock
      headingLevel={1}
      className="rtg-extractor-head"
      title="特征提取器与分类头，各自做什么？"
      subtitle="沿着同一张图片走一遍：先把像素整理成表示，再用表示回答当前分类问题。"
    >
      <div className="rtg-extractor-head__toolbar">
        <div className="rtg-extractor-head__samples" role="group" aria-label="切换输入图片">
          <Typography as="strong" variant="bodySmall" tone="warning">更换输入 x</Typography>
          {samples.map((item, index) => (
            <Button
              key={item.id}
              className="rtg-extractor-head__sample"
              variant={sampleIndex === index ? 'primary' : 'default'}
              active={sampleIndex === index}
              aria-pressed={sampleIndex === index}
              onClick={() => chooseSample(index)}
            >
              <img src={item.image} alt="" aria-hidden="true" />
              <Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography>
            </Button>
          ))}
        </div>
        <Typography as="code" variant="body" tone="accent" className="rtg-extractor-head__formula">
          x → fθ(x) = z → gφ(z) = s
        </Typography>
      </div>

      <section className={`rtg-extractor-head__pipeline is-stage-${stage}`} aria-label="特征提取与分类流程">
        <article className="rtg-extractor-head__input">
          <div className="rtg-extractor-head__eyebrow">
            <Typography as="span" variant="bodySmall" tone="warning">输入 x</Typography>
            <Typography as="strong" variant="bodySmall" tone="accent">当前图片</Typography>
          </div>
          <div className="rtg-extractor-head__photo">
            <img src={sample.image} alt={sample.alt} />
          </div>
          <Typography as="strong" variant="body" tone="accent">{sample.label}</Typography>
        </article>

        <span className="rtg-extractor-head__arrow" aria-hidden="true" />

        <Button
          className="rtg-extractor-head__machine rtg-extractor-head__machine--extractor"
          variant={stage >= 1 ? 'primary' : 'default'}
          active={stage >= 1}
          hint={stage === 0}
          onClick={inspectExtractor}
        >
          <Typography as="span" variant="bodySmall" tone="warning">特征提取器</Typography>
          <Typography as="strong" variant="h3" tone="inherit">fθ</Typography>
          <div className="rtg-extractor-head__filters" aria-hidden="true"><span /><span /><span /></div>
          <Typography as="span" variant="bodySmall" tone="inherit">点击提取中间表示</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__parameter">参数 θ · 决定怎样提取</Typography>
        </Button>

        <span className="rtg-extractor-head__arrow" aria-hidden="true" />

        <article className={`rtg-extractor-head__representation${stage >= 1 ? ' is-ready' : ''}`} aria-live="polite">
          <div className="rtg-extractor-head__eyebrow">
            <Typography as="span" variant="bodySmall" tone="warning">中间表示</Typography>
            <Typography as="strong" variant="h3" tone="accent">特征 z</Typography>
          </div>
          <div className="rtg-extractor-head__vector" aria-label={stage >= 1 ? `示意特征向量 ${sample.feature.join('，')}` : '等待生成特征向量'}>
            {(stage >= 1 ? sample.feature : ['?', '?', '?', '?']).map((value, index) => (
              <Typography as="span" variant="body" tone={stage >= 1 ? 'accent' : 'light'} key={index}>{value}</Typography>
            ))}
          </div>
          <Typography variant="bodySmall" tone={stage >= 1 ? 'success' : 'muted'}>
            {stage >= 1 ? '随图片变化 · 示意值' : '等待特征提取器'}
          </Typography>
        </article>

        <span className="rtg-extractor-head__arrow" aria-hidden="true" />

        <Button
          key={stage < 1 ? 'head-locked' : 'head-ready'}
          className="rtg-extractor-head__machine rtg-extractor-head__machine--head"
          variant={stage >= 2 ? 'primary' : 'default'}
          active={stage >= 2}
          disabled={stage < 1}
          hint={stage === 1}
          onClick={inspectHead}
        >
          <Typography as="span" variant="bodySmall" tone="warning">分类头</Typography>
          <Typography as="strong" variant="h3" tone="inherit">gφ</Typography>
          <div className="rtg-extractor-head__head-lines" aria-hidden="true"><span /><span /><span /></div>
          <Typography as="span" variant="bodySmall" tone="inherit">点击生成类别分数</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__parameter">参数 φ · 决定怎样分类</Typography>
        </Button>

        <span className="rtg-extractor-head__arrow" aria-hidden="true" />

        <article className={`rtg-extractor-head__scores${stage >= 2 ? ' is-ready' : ''}`} aria-live="polite">
          <div className="rtg-extractor-head__eyebrow">
            <Typography as="span" variant="bodySmall" tone="warning">输出 s</Typography>
            <Typography as="strong" variant="body" tone="accent">三类分数（logits）</Typography>
          </div>
          <div className="rtg-extractor-head__score-list">
            {sample.scores.map((score) => (
              <div className={stage >= 2 && score.label === prediction.label ? 'is-winner' : ''} key={score.label}>
                <Typography as="span" variant="bodySmall" tone="inherit">{score.label}</Typography>
                <span className="rtg-extractor-head__score-track" aria-hidden="true"><span style={{ width: stage >= 2 ? `${score.bar}%` : '0%' }} /></span>
                <Typography
                  as="strong"
                  variant="bodySmall"
                  tone="inherit"
                  align="end"
                  wrap="nowrap"
                  className="rtg-extractor-head__score-value"
                >
                  {stage >= 2 ? score.value.toFixed(1) : '—'}
                </Typography>
              </div>
            ))}
          </div>
          <Typography variant="bodySmall" tone={stage >= 2 ? 'success' : 'muted'}>
            {stage >= 2 ? `最高分：${prediction.label}` : '等待分类头'}
          </Typography>
        </article>
      </section>

      <Question
        className="rtg-extractor-head__question"
        type="choice"
        typeLabel="理解检查"
        title="示意特征 z 只有四个数，所以最多只能分四类吗？"
        answer="no"
        options={[
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__option-letter">A</Typography>, value: 'yes', label: '是，表示维数决定类别数', wrongFeedback: '表示维数和类别数不是同一个量。分类头可以把同一表示映射到不同数量的类别。' },
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__option-letter">B</Typography>, value: 'no', label: '不是，分类头决定输出多少个类别分数' },
        ]}
        feedback={{ correct: '正确。z 是中间表示，gφ 才负责把它映射到当前类别集合。' }}
        persistenceKey={`resnet-transfer-guide:07-extractor-and-head:dimension-question:${QUESTION_LOAD_ID}`}
        showFeedback={false}
        onCheck={setQuestionResult}
      />

      <NoticeStrip tone={completed ? 'green' : questionResult && !questionResult.ok ? 'orange' : 'blue'} role="status" aria-live="polite">
        <Typography variant="body" tone="inherit">{notice}</Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}
