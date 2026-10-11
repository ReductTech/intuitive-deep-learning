import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, RangeControl, Typography } from '../../../shared/react';
import bird from '../../assets/training-objective/bird.png';
import car from '../../assets/training-objective/car.png';
import cat from '../../assets/training-objective/cat.png';
import city from '../../assets/training-objective/city.png';
import dog from '../../assets/training-objective/dog.png';
import mountain from '../../assets/training-objective/mountain.png';
import room from '../../assets/training-objective/room.png';
import sunset from '../../assets/training-objective/sunset.png';
import waterfall from '../../assets/training-objective/waterfall.png';
import './TrainingObjectivePage.css';

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
  return <span className="vg-training-page__step" aria-label={`第 ${number} 步`}>
    <Typography as="span" variant="bodySmall" tone="inherit">{number}</Typography>
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
    <ContentBlock
      headingLevel={1}
      className="vg-training-page"
      bodyClassName="vg-training-page__body"
      title="生成模型到底在训练什么？"
      subtitle="用有限训练图片，估计近乎无限的真实世界图像分布。"
    >
      <div
        ref={flowRef}
        className={`vg-training-page__flow vg-training-page__flow--${hasAdjustedFit ? 'distribution' : isExtracting ? 'sampling' : sampled ? 'training' : 'source'}`}
        aria-live="polite"
      >
        <section className="vg-training-page__panel vg-training-page__panel--real" aria-label="真实世界图像分布">
          <header className="vg-training-page__panel-head">
            <StepBadge number={1} />
            <div>
              <Typography as="strong" variant="body" tone="success">真实世界的图片分布</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">近乎无限的真实图像 · p_data(x)</Typography>
            </div>
          </header>
          <div className="vg-training-page__real-field">
            <div className="vg-training-page__real-blob" aria-hidden="true"><span /><span /></div>
            {realImages.map((image, index) => (
              <figure
                key={image.src}
                ref={(element) => { realSampleRefs.current[index] = element; }}
                className={`vg-training-page__real-sample${sampled && trainingIndexes.includes(index as (typeof trainingIndexes)[number]) ? ' is-selected' : ''}`}
                style={{ '--sample-x': `${image.x}%`, '--sample-y': `${image.y}%` } as CSSProperties}
              >
                <img src={image.src} alt={image.alt} draggable={false} />
              </figure>
            ))}
            <Typography as="span" variant="bodySmall" tone="success" className="vg-training-page__infinite">… ∞</Typography>
          </div>
          <Typography variant="bodySmall" tone="muted" className="vg-training-page__panel-caption">
            真实世界中存在大量可能的图像。
          </Typography>
          {!sampled && (
            <Button variant="primary" hint onClick={extractTrainingSet}>
              从真实分布抽取有限训练集
            </Button>
          )}
        </section>

        {sampled && <section className={`vg-training-page__panel vg-training-page__panel--dataset${isExtracting ? ' is-extracting' : ' vg-training-page__stage-entry'}`} aria-label="有限训练集">
          <header className="vg-training-page__panel-head">
            <StepBadge number={2} />
            <div>
              <Typography as="strong" variant="body" tone="accent">有限的训练图片</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">D = {'{x₁, x₂, …, xₙ}'}</Typography>
            </div>
          </header>
          <div className="vg-training-page__dataset-grid" aria-live="polite">
            {trainingIndexes.map((imageIndex, slotIndex) => (
              <figure
                ref={(element) => { datasetSlotRefs.current[slotIndex] = element; }}
                className={`vg-training-page__dataset-slot ${isExtracting ? 'is-travelling' : 'is-filled'}`}
                key={imageIndex}
              >
                <img src={realImages[imageIndex].src} alt={`训练图片 ${slotIndex + 1}`} draggable={false} />
              </figure>
            ))}
          </div>
          {!isExtracting && <Button variant="default" onClick={extractTrainingSet}>重新抽取</Button>}
          <Typography variant="bodySmall" tone="accent" className="vg-training-page__panel-caption">
            {isExtracting ? '正在从真实分布中采样…' : '训练集只是完整分布的有限子集。'}
          </Typography>
        </section>}

        {sampled && !isExtracting && <section className="vg-training-page__panel vg-training-page__panel--model vg-training-page__stage-entry" aria-label="生成模型学习过程">
          <header className="vg-training-page__panel-head">
            <StepBadge number={3} />
            <div>
              <Typography as="strong" variant="body" tone="main">生成模型</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">利用有限样本学习</Typography>
            </div>
          </header>
          <div className="vg-training-page__network" aria-hidden="true">
            <div>{[0, 1, 2].map((item) => <span key={item} />)}</div>
            <div>{[0, 1, 2, 3].map((item) => <span key={item} />)}</div>
            <div>{[0, 1, 2].map((item) => <span key={item} />)}</div>
            <i /><i /><i /><i /><i /><i />
          </div>
          <Typography as="strong" variant="h3" tone={readyToGenerate ? 'success' : 'accent'} className="vg-training-page__objective">
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
          <Typography variant="bodySmall" tone={readyToGenerate ? 'success' : 'muted'} className="vg-training-page__fit-status">
            {fitLabel}
          </Typography>
        </section>}

        {hasAdjustedFit && !isExtracting && <section className={`vg-training-page__panel vg-training-page__panel--learned vg-training-page__stage-entry${readyToGenerate ? ' is-ready' : ''}`} aria-label="模型估计的图像分布">
          <header className="vg-training-page__panel-head">
            <StepBadge number={4} />
            <div>
              <Typography as="strong" variant="body" tone="accent">模型估计的图像分布</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">pθ(x) 尽可能逼近 p_data(x)</Typography>
            </div>
          </header>
          <div className="vg-training-page__learned-field">
            <div className="vg-training-page__target-outline" aria-hidden="true" />
            <div
              className="vg-training-page__learned-blob"
              style={{
                '--fit-scale': String(.42 + fit * .0058),
                '--fit-opacity': String(.22 + fit * .0072),
              } as CSSProperties}
              aria-hidden="true"
            ><span /><span /></div>
            {learnedIndexes.map((imageIndex, index) => {
              const threshold = 18 + index * 11;
              const visible = sampled && fit >= threshold;
              return visible ? (
                <figure
                  className="vg-training-page__learned-sample"
                  style={{ '--learned-index': index } as CSSProperties}
                  key={imageIndex}
                >
                  <img src={realImages[imageIndex].src} alt={`模型分布中的图像模式 ${index + 1}`} draggable={false} />
                </figure>
              ) : null;
            })}
            <div className="vg-training-page__overlap-meter">
              <Typography as="span" variant="bodySmall" tone="muted">与真实分布重叠</Typography>
              <Typography as="strong" variant="body" tone={readyToGenerate ? 'success' : 'accent'}>{Math.round(fit * .94)}%</Typography>
            </div>
          </div>
          {readyToGenerate && (
            <Button variant="primary" hint={!generated} onClick={sampleFromModel}>
              从 pθ(x) 中采样新图片
            </Button>
          )}
          {generated && (
            <div className="vg-training-page__generated" aria-live="polite">
              {generatedIndexes.map((imageIndex, index) => (
                <figure key={imageIndex}>
                  <img src={realImages[imageIndex].src} alt={`模型生成的新图片 ${index + 1}`} draggable={false} />
                  <Typography as="figcaption" variant="bodySmall" tone="success">新样本</Typography>
                </figure>
              ))}
            </div>
          )}
        </section>}
      </div>

      <footer className={`vg-training-page__insight${generated ? ' is-complete' : ''}`} aria-live="polite">
        <div>
          <Typography as="strong" variant="h3" tone={generated ? 'success' : 'accent'}>
            {generated
              ? '模型没有记住训练图片，而是学会了一个可以继续采样的分布。'
              : isExtracting
                ? '正在从真实分布中，抽取模型能够看到的有限训练图片。'
              : sampled
                ? '拖动拟合程度，让模型分布逐渐覆盖真实图像的不同模式。'
                : '第一步：从近乎无限的真实分布中，只能收集有限训练图片。'}
          </Typography>
          <Typography variant="bodySmall" tone="muted">
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
        <div className="vg-training-page__progress" aria-label="学习进度">
          <Typography as="span" variant="bodySmall" tone={sampled ? 'success' : 'accent'}>{sampled ? '✓' : '→'} 真实分布</Typography>
          {sampled && <Typography as="span" variant="bodySmall" tone={isExtracting ? 'accent' : 'success'}>{isExtracting ? '→' : '✓'} 有限训练集</Typography>}
          {hasAdjustedFit && <Typography as="span" variant="bodySmall" tone={readyToGenerate ? 'success' : 'accent'}>{readyToGenerate ? '✓' : '→'} 分布逼近</Typography>}
          {generated && <Typography as="span" variant="bodySmall" tone="success">✓ 生成新样本</Typography>}
        </div>
      </footer>
    </ContentBlock>
  );
}
