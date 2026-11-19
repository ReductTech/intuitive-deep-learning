import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.webp");
const canUpright = moduleAssetUrl("recycling/can-upright.webp");
const cartonUpright = moduleAssetUrl("recycling/carton-upright.webp");
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
    <ContentBlock shuku-edit-id="e-0273829b-7bfe-4bea-901d-8e4af7c07a41"
      headingLevel={1}
      className="rtg-extractor-head"
      title="特征提取器与分类头，各自做什么？"
      subtitle="沿着同一张图片走一遍：先把像素整理成表示，再用表示回答当前分类问题。"
    >
      <div shuku-edit-id="e-d7762f57-55c8-4077-b0d3-1797164af22e" className="rtg-extractor-head__toolbar">
        <div shuku-edit-id="e-90329c91-3c61-426e-9b91-af7af05730a9" className="rtg-extractor-head__samples" role="group" aria-label="切换输入图片">
          <Typography shuku-edit-id="e-c2d7e8b3-3e15-4deb-9c39-7e0af6364bc6" as="strong" variant="bodySmall" tone="warning">更换输入 x</Typography>
          {samples.map((item, index) => (
            <Button
              key={item.id}
              className="rtg-extractor-head__sample"
              variant={sampleIndex === index ? 'primary' : 'default'}
              active={sampleIndex === index}
              aria-pressed={sampleIndex === index}
              onClick={() => chooseSample(index)}
            >
              <img shuku-edit-id="e-ebf5b1f7-99b8-466b-b676-b49e7f1dbd22" src={item.image} alt="" aria-hidden="true" />
              <Typography shuku-edit-id="e-a953315b-e6b3-42b9-a293-d97405a28950" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography>
            </Button>
          ))}
        </div>
        <Typography shuku-edit-id="e-f9c8d7a0-0984-44c2-9232-834de58e8900" as="code" variant="body" tone="accent" className="rtg-extractor-head__formula">
          x → fθ(x) = z → gφ(z) = s
        </Typography>
      </div>

      <section shuku-edit-id="e-f2c69449-1924-468a-a50f-da27fa96d814" className={`rtg-extractor-head__pipeline is-stage-${stage}`} aria-label="特征提取与分类流程">
        <article shuku-edit-id="e-7ebc43f2-ec1d-4342-929f-e66fee7784c8" className="rtg-extractor-head__input">
          <div shuku-edit-id="e-2e277898-82a2-45a7-9f20-d229cef54c9c" className="rtg-extractor-head__eyebrow">
            <Typography shuku-edit-id="e-8faaacf8-d5e8-47e0-927f-8bf9c1ceec7a" as="span" variant="bodySmall" tone="warning">输入 x</Typography>
            <Typography shuku-edit-id="e-893b752b-7a24-4ca6-bd6c-dcb5eac8faeb" as="strong" variant="bodySmall" tone="accent">当前图片</Typography>
          </div>
          <div shuku-edit-id="e-722356ba-ea43-40fe-8109-0aa9fbe987e3" className="rtg-extractor-head__photo">
            <img shuku-edit-id="e-e60ee867-a98c-4572-a6d5-7d3b9bf77d56" src={sample.image} alt={sample.alt} />
          </div>
          <Typography shuku-edit-id="e-178adced-e7ad-4d1b-9aaf-8b2fd19819a7" as="strong" variant="body" tone="accent">{sample.label}</Typography>
        </article>

        <span shuku-edit-id="e-cdda0c2f-1919-4277-8275-9f13f3bbae92" className="rtg-extractor-head__arrow" aria-hidden="true" />

        <Button
          className="rtg-extractor-head__machine rtg-extractor-head__machine--extractor"
          variant={stage >= 1 ? 'primary' : 'default'}
          active={stage >= 1}
          hint={stage === 0}
          onClick={inspectExtractor}
        >
          <Typography shuku-edit-id="e-6ffa73b1-4109-4996-8b79-52e58398f0a7" as="span" variant="bodySmall" tone="warning">特征提取器</Typography>
          <Typography shuku-edit-id="e-90a35da9-b898-4270-814e-d06306d7ad03" as="strong" variant="h3" tone="inherit">fθ</Typography>
          <div shuku-edit-id="e-2a2abc49-3656-44db-9059-169ed740af7f" className="rtg-extractor-head__filters" aria-hidden="true"><span shuku-edit-id="e-dd4479aa-331e-4058-a901-4d1d71102694" /><span shuku-edit-id="e-425d7087-90f2-4922-957d-169d7e67de98" /><span shuku-edit-id="e-2530a95e-57ce-41d3-865f-ab0001193a1e" /></div>
          <Typography shuku-edit-id="e-d15ce46b-d822-4244-8367-b15848d5f7e0" as="span" variant="bodySmall" tone="inherit">点击提取中间表示</Typography>
          <Typography shuku-edit-id="e-781e9e17-f5bf-455c-8dcb-b50f4e80004d" as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__parameter">参数 θ · 决定怎样提取</Typography>
        </Button>

        <span shuku-edit-id="e-2deb2f69-abfe-4446-a35c-20454f6a91c3" className="rtg-extractor-head__arrow" aria-hidden="true" />

        <article shuku-edit-id="e-3ca72d4c-384c-4849-9d8f-2a192b65451a" className={`rtg-extractor-head__representation${stage >= 1 ? ' is-ready' : ''}`} aria-live="polite">
          <div shuku-edit-id="e-4a95801e-db4d-4877-aeba-2a3b40608a44" className="rtg-extractor-head__eyebrow">
            <Typography shuku-edit-id="e-26b4ebe6-46e3-4dec-a531-fea0f2cef917" as="span" variant="bodySmall" tone="warning">中间表示</Typography>
            <Typography shuku-edit-id="e-4dc358fe-f02a-43a5-bc6f-ed9ee6b7df0e" as="strong" variant="h3" tone="accent">特征 z</Typography>
          </div>
          <div shuku-edit-id="e-99e98406-cc8e-4a8c-861e-75d1ad90b8a2" className="rtg-extractor-head__vector" aria-label={stage >= 1 ? `示意特征向量 ${sample.feature.join('，')}` : '等待生成特征向量'}>
            {(stage >= 1 ? sample.feature : ['?', '?', '?', '?']).map((value, index) => (
              <Typography shuku-edit-id="e-55fd4818-fd91-4f78-a01d-d688c679addf" as="span" variant="body" tone={stage >= 1 ? 'accent' : 'light'} key={index}>{value}</Typography>
            ))}
          </div>
          <Typography shuku-edit-id="e-0a32f89c-e4da-479c-9d5e-510160b548c5" variant="bodySmall" tone={stage >= 1 ? 'success' : 'muted'}>
            {stage >= 1 ? '随图片变化 · 示意值' : '等待特征提取器'}
          </Typography>
        </article>

        <span shuku-edit-id="e-4a7ebfe3-77ad-417e-bf35-82453f408564" className="rtg-extractor-head__arrow" aria-hidden="true" />

        <Button
          key={stage < 1 ? 'head-locked' : 'head-ready'}
          className="rtg-extractor-head__machine rtg-extractor-head__machine--head"
          variant={stage >= 2 ? 'primary' : 'default'}
          active={stage >= 2}
          disabled={stage < 1}
          hint={stage === 1}
          onClick={inspectHead}
        >
          <Typography shuku-edit-id="e-4f0fdbe4-601b-43a5-beb5-4792ff818781" as="span" variant="bodySmall" tone="warning">分类头</Typography>
          <Typography shuku-edit-id="e-ff7764de-afaa-4837-9ddc-d668f0924934" as="strong" variant="h3" tone="inherit">gφ</Typography>
          <div shuku-edit-id="e-2ae46bfd-c0f7-406a-8005-3610818ed21e" className="rtg-extractor-head__head-lines" aria-hidden="true"><span shuku-edit-id="e-40510ef4-2c90-4105-b0c0-c4506f76f18d" /><span shuku-edit-id="e-c514877b-e59e-42de-a8c2-d3a709a3a2c0" /><span shuku-edit-id="e-1c032582-5c1a-4dce-8510-3c54a4d0f9a0" /></div>
          <Typography shuku-edit-id="e-970bf861-257e-4588-9fce-304412d51597" as="span" variant="bodySmall" tone="inherit">点击生成类别分数</Typography>
          <Typography shuku-edit-id="e-54a470de-c743-4d4c-8f8f-ba5013869c74" as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__parameter">参数 φ · 决定怎样分类</Typography>
        </Button>

        <span shuku-edit-id="e-b8beb2a9-4474-478c-be91-592bfb3b4173" className="rtg-extractor-head__arrow" aria-hidden="true" />

        <article shuku-edit-id="e-5a7ba332-9c9a-4faa-9d90-7bc206892ae7" className={`rtg-extractor-head__scores${stage >= 2 ? ' is-ready' : ''}`} aria-live="polite">
          <div shuku-edit-id="e-4ce8e047-7ac0-413b-bb3c-7fad249a2f09" className="rtg-extractor-head__eyebrow">
            <Typography shuku-edit-id="e-a40c7be0-aeb9-4fa1-a8ae-6c7aa6362a74" as="span" variant="bodySmall" tone="warning">输出 s</Typography>
            <Typography shuku-edit-id="e-efa1a8ea-be26-45b5-a6da-5b95a29ed6f7" as="strong" variant="body" tone="accent">三类分数（logits）</Typography>
          </div>
          <div shuku-edit-id="e-7433d37c-accc-42f0-8557-a0c5ee44674b" className="rtg-extractor-head__score-list">
            {sample.scores.map((score) => (
              <div shuku-edit-id="e-16bfdd24-f0e1-4e2c-8729-1ab10b464977" className={stage >= 2 && score.label === prediction.label ? 'is-winner' : ''} key={score.label}>
                <Typography shuku-edit-id="e-0960b032-8472-466d-934b-0a8c77b998e6" as="span" variant="bodySmall" tone="inherit">{score.label}</Typography>
                <span shuku-edit-id="e-39177f32-4ec7-4ed8-b611-a1ca2a5374a7" className="rtg-extractor-head__score-track" aria-hidden="true"><span shuku-edit-id="e-5808ad0b-4e45-4486-af15-e641ce5cc702" style={{ width: stage >= 2 ? `${score.bar}%` : '0%' }} /></span>
                <Typography shuku-edit-id="e-6ee2a5df-0c21-4061-b633-e57608c39744"
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
          <Typography shuku-edit-id="e-d730c407-4118-4ae4-96b8-bf21dc028fe2" variant="bodySmall" tone={stage >= 2 ? 'success' : 'muted'}>
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
          { key: <Typography shuku-edit-id="e-0b7ebeb4-96fa-40f6-8eac-8e9319fa4149" as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__option-letter">A</Typography>, value: 'yes', label: '是，表示维数决定类别数', wrongFeedback: '表示维数和类别数不是同一个量。分类头可以把同一表示映射到不同数量的类别。' },
          { key: <Typography shuku-edit-id="e-70c83c97-3bbe-45d6-9489-a3d91a54a1dc" as="span" variant="bodySmall" tone="inherit" className="rtg-extractor-head__option-letter">B</Typography>, value: 'no', label: '不是，分类头决定输出多少个类别分数' },
        ]}
        feedback={{ correct: '正确。z 是中间表示，gφ 才负责把它映射到当前类别集合。' }}
        persistenceKey={`resnet-transfer-guide:07-extractor-and-head:dimension-question:${QUESTION_LOAD_ID}`}
        showFeedback={false}
        onCheck={setQuestionResult}
      />

      <NoticeStrip tone={completed ? 'green' : questionResult && !questionResult.ok ? 'orange' : 'blue'} role="status" aria-live="polite">
        <Typography shuku-edit-id="e-bb19f4a1-f5fc-41c3-819f-f4b9b1fdac4e" variant="body" tone="inherit">{notice}</Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}
