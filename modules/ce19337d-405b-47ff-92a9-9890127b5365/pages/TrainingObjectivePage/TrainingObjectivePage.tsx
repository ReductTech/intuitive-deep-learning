import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, RangeControl, Typography } from "@shuku/course-style/react";
import './TrainingObjectivePage.css';

const bird = moduleAssetUrl("images/training-objective/bird.webp");
const car = moduleAssetUrl("images/training-objective/car.webp");
const cat = moduleAssetUrl("images/training-objective/cat.webp");
const city = moduleAssetUrl("images/training-objective/city.webp");
const dog = moduleAssetUrl("images/training-objective/dog.webp");
const mountain = moduleAssetUrl("images/training-objective/mountain.webp");
const room = moduleAssetUrl("images/training-objective/room.webp");
const sunset = moduleAssetUrl("images/training-objective/sunset.webp");
const waterfall = moduleAssetUrl("images/training-objective/waterfall.webp");

const realImages = [
  { src: mountain, alt: '山脉图片', x: 18, y: 29 },
  { src: dog, alt: '小狗图片', x: 38, y: 22 },
  { src: room, alt: '室内图片', x: 61, y: 28 },
  { src: waterfall, alt: '瀑布图片', x: 81, y: 35 },
  { src: city, alt: '城市图片', x: 22, y: 62 },
  { src: cat, alt: '小猫图片', x: 45, y: 55 },
  { src: sunset, alt: '日落图片', x: 68, y: 61 },
  { src: bird, alt: '小鸟图片', x: 34, y: 82 },
  { src: car, alt: '汽车图片', x: 73, y: 82 },
] as const;

const trainingIndexes = [0, 1, 2, 5] as const;
const learnedIndexes = [1, 5, 0, 4, 7, 3] as const;
const generatedIndexes = [3, 4, 7] as const;
const FIT_THRESHOLD = 75;

export interface TrainingObjectivePageProps {
  onComplete?: () => void;
}

function StepBadge({ number }: { number: 1 | 2 | 3 | 4 }) {
  return <span shuku-edit-id="e-109b5816-eb38-43ad-bfe6-e78f916973ed" className="vg-training-page__step" aria-label={`第 ${number} 步`}>
    <Typography shuku-edit-id="e-5e645fc8-6213-47af-ac5c-1a151837aeec" as="span" variant="bodySmall" tone="inherit">{number}</Typography>
  </span>;
}

export function TrainingObjectivePage({ onComplete }: TrainingObjectivePageProps) {
  const completedRef = useRef(false);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const realSampleRefs = useRef<Array<HTMLElement | null>>([]);
  const datasetSlotRefs = useRef<Array<HTMLElement | null>>([]);
  const [sampled, setSampled] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasAdjustedFit, setHasAdjustedFit] = useState(false);
  const [fit, setFit] = useState(18);
  const [generated, setGenerated] = useState(false);

  const readyToGenerate = sampled && fit >= FIT_THRESHOLD;
  const fitLabel = !sampled
    ? '等待训练数据'
    : fit < 45
      ? '只覆盖了少量模式'
      : fit < FIT_THRESHOLD
        ? '正在覆盖更多真实模式'
        : '已经能够近似真实分布';

  const extractTrainingSet = () => {
    setSampled(true);
    setIsExtracting(true);
    setHasAdjustedFit(false);
    setGenerated(false);
    setFit(25);
  };

  useLayoutEffect(() => {
    if (!sampled || !isExtracting) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsExtracting(false);
      return;
    }

    const flow = flowRef.current;
    if (!flow) {
      setIsExtracting(false);
      return;
    }

    const flowRect = flow.getBoundingClientRect();
    const scaleX = flow.offsetWidth ? flowRect.width / flow.offsetWidth : 1;
    const scaleY = flow.offsetHeight ? flowRect.height / flow.offsetHeight : scaleX;
    const animations = trainingIndexes.flatMap((sourceIndex, slotIndex) => {
      const source = realSampleRefs.current[sourceIndex];
      const target = datasetSlotRefs.current[slotIndex];
      if (!source || !target) return [];

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const dx = (sourceRect.left + sourceRect.width / 2 - targetRect.left - targetRect.width / 2) / scaleX;
      const dy = (sourceRect.top + sourceRect.height / 2 - targetRect.top - targetRect.height / 2) / scaleY;
      const startScale = sourceRect.width / targetRect.width;

      return [target.animate(
        [
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${startScale})`,
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(31, 50, 79, .18)',
          },
          {
            transform: `translate3d(${dx * .46}px, ${dy * .46 - 34}px, 0) scale(${Math.min(.86, startScale + .3)})`,
            borderRadius: '38%',
            boxShadow: '0 18px 30px rgba(31, 50, 79, .24)',
            offset: .55,
          },
          {
            transform: 'translate3d(0, 0, 0) scale(1)',
            borderRadius: 'var(--ui-radius-md)',
            boxShadow: '0 5px 14px rgba(31, 50, 79, .12)',
          },
        ],
        {
          duration: 980,
          delay: slotIndex * 155,
          easing: 'cubic-bezier(.2, .78, .2, 1)',
          fill: 'both',
        },
      )];
    });

    let cancelled = false;
    void Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (cancelled) return;
      animations.forEach((animation) => animation.cancel());
      setIsExtracting(false);
    });

    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
    };
  }, [isExtracting, sampled]);

  const sampleFromModel = () => {
    if (!readyToGenerate) return;
    setGenerated(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  return (
    <ContentBlock shuku-edit-id="e-c4630fed-ebc7-4b1f-b185-2a45efc2d2b8"
      headingLevel={1}
      className="vg-shared-page vg-training-page"
      bodyClassName="vg-training-page__body"
      title="生成模型到底在训练什么？"
      subtitle="用有限训练图片，估计近乎无限的真实世界图像分布。"
    >
      <div shuku-edit-id="e-f4755bf7-7724-4343-aee6-58fe3bf532ce"
        ref={flowRef}
        className={`vg-training-page__flow vg-training-page__flow--${hasAdjustedFit ? 'distribution' : isExtracting ? 'sampling' : sampled ? 'training' : 'source'}`}
        aria-live="polite"
      >
        <section shuku-edit-id="e-31b338ae-f3e9-4c30-9279-c94ca0d15d14" className="vg-training-page__panel vg-training-page__panel--real" aria-label="真实世界图像分布">
          <header shuku-edit-id="e-dfabc519-10cd-494a-ab60-12e28f31db5b" className="vg-training-page__panel-head">
            <StepBadge number={1} />
            <div shuku-edit-id="e-d614c523-a435-4af9-be77-0f75de6597da">
              <Typography shuku-edit-id="e-6b66e714-b904-484e-befe-3918249fdb76" as="strong" variant="body" tone="success">真实世界的图片分布</Typography>
              <Typography shuku-edit-id="e-d720b936-da82-432d-b6c4-9a5060016468" as="span" variant="bodySmall" tone="muted">近乎无限的真实图像 · p_data(x)</Typography>
            </div>
          </header>
          <div shuku-edit-id="e-737c57ab-7cf0-481a-9738-3969ce1d4702" className="vg-training-page__real-field">
            <div shuku-edit-id="e-0f60ea1e-334f-47dc-aa32-506401be6ace" className="vg-training-page__real-blob" aria-hidden="true"><span shuku-edit-id="e-1de7f3ca-0aeb-4cd7-9f12-9c1b2bfe567e" /><span shuku-edit-id="e-56405ca8-8441-47f8-a4b6-546597dce30c" /></div>
            {realImages.map((image, index) => (
              <figure shuku-edit-id="e-a1514b5f-55cb-4a30-a05d-e38ec9a7f067"
                key={image.src}
                ref={(element) => { realSampleRefs.current[index] = element; }}
                className={`vg-training-page__real-sample${sampled && trainingIndexes.includes(index as (typeof trainingIndexes)[number]) ? ' is-selected' : ''}`}
                style={{ '--sample-x': `${image.x}%`, '--sample-y': `${image.y}%` } as CSSProperties}
              >
                <img shuku-edit-id="e-6b3e376c-87c5-408d-be4b-ac0420b8d569" src={image.src} alt={image.alt} draggable={false} />
              </figure>
            ))}
            <Typography shuku-edit-id="e-e57c6479-66ac-4c0b-91fe-f9904ea254f4" as="span" variant="bodySmall" tone="success" className="vg-training-page__infinite">… ∞</Typography>
          </div>
          <Typography shuku-edit-id="e-6d82b50c-48b1-4a6e-87fb-a4fab591ac6f" variant="bodySmall" tone="muted" className="vg-training-page__panel-caption">
            真实世界中存在大量可能的图像。
          </Typography>
          {!sampled && (
            <Button variant="primary" hint onClick={extractTrainingSet}>
              从真实分布抽取有限训练集
            </Button>
          )}
        </section>

        {sampled && <section shuku-edit-id="e-3535b631-09f3-40da-bd0a-a7b569c19eed" className={`vg-training-page__panel vg-training-page__panel--dataset${isExtracting ? ' is-extracting' : ' vg-training-page__stage-entry'}`} aria-label="有限训练集">
          <header shuku-edit-id="e-c16c9dec-8b30-497f-8547-67f759bc8d0b" className="vg-training-page__panel-head">
            <StepBadge number={2} />
            <div shuku-edit-id="e-d2ac0d4d-e63b-45e8-a514-4fe98f42070e">
              <Typography shuku-edit-id="e-dc4e73db-b9f6-4a46-9dc6-66847ba14651" as="strong" variant="body" tone="accent">有限的训练图片</Typography>
              <Typography shuku-edit-id="e-4a0a6c39-a02f-405f-8b81-93d5e9c522cd" as="span" variant="bodySmall" tone="muted">D = {'{x₁, x₂, …, xₙ}'}</Typography>
            </div>
          </header>
          <div shuku-edit-id="e-e77c378c-c505-4946-b5d0-543620b4a60a" className="vg-training-page__dataset-grid" aria-live="polite">
            {trainingIndexes.map((imageIndex, slotIndex) => (
              <figure shuku-edit-id="e-d6a08317-2c1b-4782-9a12-3e5e584cb360"
                ref={(element) => { datasetSlotRefs.current[slotIndex] = element; }}
                className={`vg-training-page__dataset-slot ${isExtracting ? 'is-travelling' : 'is-filled'}`}
                key={imageIndex}
              >
                <img shuku-edit-id="e-9cf67983-a22e-4f31-a9d9-2d76bca1b92b" src={realImages[imageIndex].src} alt={`训练图片 ${slotIndex + 1}`} draggable={false} />
              </figure>
            ))}
          </div>
          {!isExtracting && <Button variant="default" onClick={extractTrainingSet}>重新抽取</Button>}
          <Typography shuku-edit-id="e-856b978f-f42e-42b7-8f81-2e78b8a48d74" variant="bodySmall" tone="accent" className="vg-training-page__panel-caption">
            {isExtracting ? '正在从真实分布中采样…' : '训练集只是完整分布的有限子集。'}
          </Typography>
        </section>}

        {sampled && !isExtracting && <section shuku-edit-id="e-55133f5c-8790-40d1-b02b-16a62c8f23dd" className="vg-training-page__panel vg-training-page__panel--model vg-training-page__stage-entry" aria-label="生成模型学习过程">
          <header shuku-edit-id="e-f8f4487c-78ec-47eb-b687-adf1027c0b2d" className="vg-training-page__panel-head">
            <StepBadge number={3} />
            <div shuku-edit-id="e-f14c5b7e-0c71-451e-acfd-5fdc0c148404">
              <Typography shuku-edit-id="e-67b404d1-d679-4e08-b791-6bc759238a23" as="strong" variant="body" tone="main">生成模型</Typography>
              <Typography shuku-edit-id="e-fd7f23f7-252e-425f-b639-45353f20a80b" as="span" variant="bodySmall" tone="muted">利用有限样本学习</Typography>
            </div>
          </header>
          <div shuku-edit-id="e-5192b0bc-c0c5-4e84-a79e-a51b07197508" className="vg-training-page__network" aria-hidden="true">
            <div shuku-edit-id="e-e28b5e90-8d38-468c-bda3-c7a273d9f008">{[0, 1, 2].map((item) => <span shuku-edit-id="e-a472a85f-2b9e-43a9-b725-3c9010e41228" key={item} />)}</div>
            <div shuku-edit-id="e-b7bf0e46-58e7-4371-8ed4-1573bfbada58">{[0, 1, 2, 3].map((item) => <span shuku-edit-id="e-3eb9124a-89cc-4b4a-9212-0d4d8da8d399" key={item} />)}</div>
            <div shuku-edit-id="e-b0a4fde9-ec59-4baf-84a9-a3d3167c3a9f">{[0, 1, 2].map((item) => <span shuku-edit-id="e-05dfe653-ccd4-46b2-8536-896842bddcf1" key={item} />)}</div>
            <i shuku-edit-id="e-09ab95b5-e4b5-4cb0-9650-9f53f624f845" /><i shuku-edit-id="e-6d61ca96-6c90-43b0-8c9f-a5412739399c" /><i shuku-edit-id="e-de204761-76f0-48fd-ac09-df0d530a5d61" /><i shuku-edit-id="e-01537d3e-5dbf-45c5-a388-e7ea1562748f" /><i shuku-edit-id="e-a2f23f5d-d4f4-44d0-bd22-3d1d0dcf6152" /><i shuku-edit-id="e-2e1f3484-fc30-4fdb-91bc-3f65f2dbfc02" />
          </div>
          <Typography shuku-edit-id="e-605707d6-63e6-4ae6-ae65-35464c3e6ee5" as="strong" variant="h3" tone={readyToGenerate ? 'success' : 'accent'} className="vg-training-page__objective">
            pθ(x) ≈ p_data(x)
          </Typography>
          <RangeControl
            label="训练 / 拟合程度"
            min={0}
            max={100}
            step={1}
            value={fit}
            suffix="%"
            disabled={!sampled}
            hint={sampled && fit < FIT_THRESHOLD}
            scale={['欠拟合', '接近真实分布']}
            onChange={(event) => {
              setHasAdjustedFit(true);
              setFit(Number(event.currentTarget.value));
              setGenerated(false);
            }}
          />
          <Typography shuku-edit-id="e-708f146c-135a-4f9c-b9d0-09df83f66584" variant="bodySmall" tone={readyToGenerate ? 'success' : 'muted'} className="vg-training-page__fit-status">
            {fitLabel}
          </Typography>
        </section>}

        {hasAdjustedFit && !isExtracting && <section shuku-edit-id="e-34aaff5e-be24-49c7-b101-50819dfe0812" className={`vg-training-page__panel vg-training-page__panel--learned vg-training-page__stage-entry${readyToGenerate ? ' is-ready' : ''}`} aria-label="模型估计的图像分布">
          <header shuku-edit-id="e-f74d1e1c-1929-4d35-9890-89caa6ff9ce1" className="vg-training-page__panel-head">
            <StepBadge number={4} />
            <div shuku-edit-id="e-580771ee-5cad-4f5e-abab-bb9ea1e79a06">
              <Typography shuku-edit-id="e-5c455611-cd85-4198-a9c1-f9622fb60a6a" as="strong" variant="body" tone="accent">模型估计的图像分布</Typography>
              <Typography shuku-edit-id="e-59fce9cd-4beb-4875-9c48-4d508eacdc10" as="span" variant="bodySmall" tone="muted">pθ(x) 尽可能逼近 p_data(x)</Typography>
            </div>
          </header>
          <div shuku-edit-id="e-8e0c68be-fa94-4d5e-b472-fe0a3f027a65" className="vg-training-page__learned-field">
            <div shuku-edit-id="e-b43837bb-5e31-4118-bb7e-8d264d3d14d1" className="vg-training-page__target-outline" aria-hidden="true" />
            <div shuku-edit-id="e-77ce60a5-8525-4c3d-bf5e-ecf6600d9332"
              className="vg-training-page__learned-blob"
              style={{
                '--fit-scale': String(.42 + fit * .0058),
                '--fit-opacity': String(.22 + fit * .0072),
              } as CSSProperties}
              aria-hidden="true"
            ><span shuku-edit-id="e-bbb2e4ff-5c69-4421-adf1-7d59bce450f1" /><span shuku-edit-id="e-1cad83e5-d0d0-4fa6-b1c7-387092f42408" /></div>
            {learnedIndexes.map((imageIndex, index) => {
              const threshold = 18 + index * 11;
              const visible = sampled && fit >= threshold;
              return visible ? (
                <figure shuku-edit-id="e-62210573-3f9a-40d3-9ba1-d9538bde7be6"
                  className="vg-training-page__learned-sample"
                  style={{ '--learned-index': index } as CSSProperties}
                  key={imageIndex}
                >
                  <img shuku-edit-id="e-dbd4366d-6ded-422b-adde-0099a8224939" src={realImages[imageIndex].src} alt={`模型分布中的图像模式 ${index + 1}`} draggable={false} />
                </figure>
              ) : null;
            })}
            <div shuku-edit-id="e-77dc349b-8cd6-4f90-bb26-2b4f58344bbd" className="vg-training-page__overlap-meter">
              <Typography shuku-edit-id="e-78ce1cbe-81e0-4151-acce-361149962aed" as="span" variant="bodySmall" tone="muted">与真实分布重叠</Typography>
              <Typography shuku-edit-id="e-9038d644-c2bf-4fbc-8e1f-dc5e95ca5b7f" as="strong" variant="body" tone={readyToGenerate ? 'success' : 'accent'}>{Math.round(fit * .94)}%</Typography>
            </div>
          </div>
          {readyToGenerate && (
            <Button variant="primary" hint={!generated} onClick={sampleFromModel}>
              从 pθ(x) 中采样新图片
            </Button>
          )}
          {generated && (
            <div shuku-edit-id="e-8c772fa1-5833-4c3c-baea-7eb01b79b395" className="vg-training-page__generated" aria-live="polite">
              {generatedIndexes.map((imageIndex, index) => (
                <figure shuku-edit-id="e-52e6a147-47da-4dbf-9f5d-4e3384a971da" key={imageIndex}>
                  <img shuku-edit-id="e-cee64e4a-a67a-4a01-9357-7e17bec0b5f2" src={realImages[imageIndex].src} alt={`模型生成的新图片 ${index + 1}`} draggable={false} />
                  <Typography shuku-edit-id="e-868df9fd-940c-434f-8ea0-cffd0125f4ae" as="figcaption" variant="bodySmall" tone="success">新样本</Typography>
                </figure>
              ))}
            </div>
          )}
        </section>}
      </div>

      <footer shuku-edit-id="e-26d02fee-28cf-41b0-ace3-cbcf90ad32a7" className={`vg-training-page__insight${generated ? ' is-complete' : ''}`} aria-live="polite">
        <div shuku-edit-id="e-1c256247-2d89-4466-ad59-6520190f3050">
          <Typography shuku-edit-id="e-c5728ee5-4d32-41f5-91e5-9b78975e0733" as="strong" variant="h3" tone={generated ? 'success' : 'accent'}>
            {generated
              ? '模型没有记住训练图片，而是学会了一个可以继续采样的分布。'
              : isExtracting
                ? '正在从真实分布中，抽取模型能够看到的有限训练图片。'
              : sampled
                ? '拖动拟合程度，让模型分布逐渐覆盖真实图像的不同模式。'
                : '第一步：从近乎无限的真实分布中，只能收集有限训练图片。'}
          </Typography>
          <Typography shuku-edit-id="e-f9331fbd-ca92-4252-8741-1498ee9a16d7" variant="bodySmall" tone="muted">
            {generated
              ? '学到分布之后，模型可以持续生成训练集中没有出现过的合理图片。'
              : isExtracting
                ? '被抽中的图片依次进入训练集，但它们仍只是完整分布中的少量样本。'
              : hasAdjustedFit
                ? '模型分布会随着训练逐渐覆盖更多真实图像模式。'
                : sampled
                  ? '现在让模型利用这些有限样本，逐步逼近真实分布。'
                  : '先从真实世界图像中，抽取模型实际能够看到的有限样本。'}
          </Typography>
        </div>
        <div shuku-edit-id="e-90f5066b-8a32-4b9e-b6c2-78614b450212" className="vg-training-page__progress" aria-label="学习进度">
          <Typography shuku-edit-id="e-671c81fb-7882-45b9-af0a-1a507e09009b" as="span" variant="bodySmall" tone={sampled ? 'success' : 'accent'}>{sampled ? '✓' : '→'} 真实分布</Typography>
          {sampled && <Typography shuku-edit-id="e-a6cf722c-3441-4828-9934-2f6447d592b1" as="span" variant="bodySmall" tone={isExtracting ? 'accent' : 'success'}>{isExtracting ? '→' : '✓'} 有限训练集</Typography>}
          {hasAdjustedFit && <Typography shuku-edit-id="e-56e63559-45c2-4ed8-ba32-61082d6afa9e" as="span" variant="bodySmall" tone={readyToGenerate ? 'success' : 'accent'}>{readyToGenerate ? '✓' : '→'} 分布逼近</Typography>}
          {generated && <Typography shuku-edit-id="e-4614da3f-e7b7-4c87-99a6-d0fb2515bd8f" as="span" variant="bodySmall" tone="success">✓ 生成新样本</Typography>}
        </div>
      </footer>
    </ContentBlock>
  );
}
