import { useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import sampleOne from '../../assets/conditional-sampling/sample-1.png';
import sampleTwo from '../../assets/conditional-sampling/sample-2.png';
import sampleThree from '../../assets/conditional-sampling/sample-3.png';
import sampleFour from '../../assets/conditional-sampling/sample-4.png';
import sampleFive from '../../assets/conditional-sampling/sample-5.png';
import sampleSix from '../../assets/conditional-sampling/sample-6.png';
import './ConditionalSamplingPage.css';

type ConditionId = 'grass' | 'small' | 'fluffy';

interface ConditionDefinition {
  id: ConditionId;
  label: string;
}

interface DistributionShape {
  path: string;
  label: string;
}

const conditions: ConditionDefinition[] = [
  { id: 'grass', label: '草地' },
  { id: 'small', label: '小型犬' },
  { id: 'fluffy', label: '长毛犬' },
] as const;

const distributionShapes: Record<string, DistributionShape> = {
  all: {
    label: '所有“奔跑的狗”构成的宽分布',
    path: 'M122 164 C86 96 192 48 306 78 C402 18 516 68 544 146 C630 116 718 42 838 78 C934 108 908 202 838 250 C900 320 856 430 748 436 C650 490 570 418 510 374 C420 452 302 476 230 406 C122 406 76 310 132 246 C176 200 154 202 122 164 Z',
  },
  grass: {
    label: '“草地”让高概率区域偏向自然场景',
    path: 'M106 250 C70 168 152 92 254 126 C326 66 440 54 504 128 C568 194 628 138 724 106 C832 70 920 118 894 208 C874 278 780 282 748 346 C706 430 600 454 526 392 C444 330 382 454 276 432 C174 412 136 352 160 300 C190 238 128 302 106 250 Z',
  },
  small: {
    label: '“小型犬”形成更集中、偏上的像素分布',
    path: 'M250 92 C326 28 426 72 448 154 C474 216 522 174 580 104 C652 16 770 58 760 160 C750 232 684 248 720 316 C764 400 686 474 590 430 C520 398 494 326 438 372 C350 446 236 406 248 316 C256 254 300 226 244 190 C188 154 192 128 250 92 Z',
  },
  fluffy: {
    label: '“长毛犬”形成多峰、向右延伸的像素分布',
    path: 'M322 122 C374 42 484 62 514 144 C548 218 604 174 648 110 C704 28 824 46 846 126 C874 220 786 244 804 306 C832 408 734 464 660 400 C604 350 566 422 494 446 C398 476 326 414 360 334 C388 266 326 246 280 222 C206 186 254 148 322 122 Z',
  },
  'grass+small': {
    label: '“草地 + 小型犬”的共同区域',
    path: 'M242 178 C300 104 406 104 442 178 C478 240 536 198 590 166 C672 118 746 170 724 248 C706 312 644 314 612 368 C568 438 460 416 432 350 C402 286 348 364 286 334 C216 300 202 228 242 178 Z',
  },
  'fluffy+grass': {
    label: '“草地 + 长毛犬”的共同区域',
    path: 'M298 190 C344 116 444 104 486 174 C526 240 568 202 624 158 C690 104 778 146 766 224 C756 292 696 316 670 374 C636 446 526 432 488 370 C446 306 396 380 330 350 C260 318 256 240 298 190 Z',
  },
  'fluffy+small': {
    label: '“小型犬 + 长毛犬”的共同区域',
    path: 'M356 156 C418 84 510 108 536 184 C558 244 612 200 660 162 C730 110 808 168 782 242 C758 304 702 314 688 374 C668 450 560 444 520 376 C486 318 430 382 376 340 C314 298 312 210 356 156 Z',
  },
};

const samples = [
  { src: sampleOne, alt: '草地上奔跑的小型长毛犬' },
  { src: sampleTwo, alt: '尘土中奔跑的长毛犬' },
  { src: sampleThree, alt: '城市中奔跑的小型犬' },
  { src: sampleFour, alt: '旷野中奔跑的长毛犬' },
  { src: sampleFive, alt: '草地上奔跑的白色小型犬' },
  { src: sampleSix, alt: '草地上奔跑的灰色犬' },
] as const;

const sampleGroups: Record<string, number[]> = {
  all: [0, 1, 2, 3, 4, 5],
  grass: [0, 4, 5, 1],
  small: [0, 2, 4, 5],
  fluffy: [1, 3, 0, 5],
  'grass+small': [0, 4, 5, 2],
  'fluffy+grass': [0, 5, 1, 3],
  'fluffy+small': [0, 3, 4, 1],
};

const densityDots = [
  [248, 204, 5], [312, 164, 4], [374, 234, 6], [438, 158, 4], [492, 268, 5],
  [554, 202, 4], [612, 294, 6], [676, 210, 4], [728, 282, 5], [790, 174, 4],
  [286, 320, 4], [352, 372, 5], [430, 326, 4], [520, 354, 6], [604, 382, 4],
  [684, 352, 5], [756, 336, 4], [836, 236, 5],
] as const;

function selectionKey(selected: ConditionId[]) {
  return selected.length ? [...selected].sort().join('+') : 'all';
}

export interface ConditionalSamplingPageProps {
  onComplete?: () => void;
}

export function ConditionalSamplingPage({ onComplete }: ConditionalSamplingPageProps) {
  const completedRef = useRef(false);
  const [selected, setSelected] = useState<ConditionId[]>([]);
  const [sampleOffset, setSampleOffset] = useState(0);
  const [hasSeenSingle, setHasSeenSingle] = useState(false);
  const [hasCombined, setHasCombined] = useState(false);

  const activeDefinitions = conditions.filter((condition) => selected.includes(condition.id));
  const activeKey = selectionKey(selected);
  const activeShape = distributionShapes[activeKey] ?? distributionShapes.all;
  const samplePool = sampleGroups[activeKey] ?? sampleGroups.all;
  const visibleSampleIndexes = useMemo(
    () => Array.from({ length: 3 }, (_, index) => samplePool[(sampleOffset + index) % samplePool.length]),
    [sampleOffset, samplePool],
  );
  const selectedLabels = activeDefinitions.map((condition) => condition.label);
  const complete = hasSeenSingle && hasCombined;

  const toggleCondition = (id: ConditionId) => {
    setSampleOffset(0);
    setSelected((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 2
          ? [...current, id]
          : current;

      if (next.length === 1) setHasSeenSingle(true);
      if (next.length === 2) {
        setHasCombined(true);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
      return next;
    });
  };

  const formula = selected.length === 0
    ? 'p_data(x)'
    : selected.length === 1
      ? `p(x | ${selectedLabels[0]})`
      : `p(x | ${selectedLabels.join(', ')})`;

  return (
    <ContentBlock
      headingLevel={1}
      className="vg-conditional-page"
      bodyClassName="vg-conditional-page__body"
      title="条件如何改变生成结果的概率分布？"
      subtitle="切换条件，直接观察像素分布的形状如何改变；图像只是从这个分布中取出的样本。"
    >
      <div className="vg-conditional-page__controls" aria-label="选择生成条件">
        <div className="vg-conditional-page__control-copy">
          <Typography as="strong" variant="body" tone="main">给“奔跑的狗”增加条件</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">最多选择两个；每种条件对应不同的分布形状。</Typography>
        </div>
        <div className="vg-conditional-page__condition-buttons">
          {conditions.map((condition) => {
            const active = selected.includes(condition.id);
            return (
              <Button
                key={condition.id}
                className="vg-conditional-page__condition-button"
                active={active}
                variant={active ? 'primary' : 'default'}
                disabled={!active && selected.length === 2}
                aria-pressed={active}
                onClick={() => toggleCondition(condition.id)}
              >
                {active ? '✓ ' : '+ '}{condition.label}
              </Button>
            );
          })}
        </div>
        <div className="vg-conditional-page__formula" aria-live="polite">
          <Typography as="span" variant="bodySmall" tone="muted">当前条件分布</Typography>
          <Typography as="strong" variant="h3" tone="accent">{formula}</Typography>
        </div>
      </div>

      <section className={`vg-conditional-page__distribution${selected.length === 2 ? ' is-combined' : ''}`} aria-label="条件像素分布示意图">
        <div className="vg-conditional-page__distribution-head">
          <div>
            <Typography as="strong" variant="body" tone="main">像素空间中的高概率区域</Typography>
            <Typography variant="bodySmall" tone="muted">{activeShape.label}</Typography>
          </div>
          <Button className="vg-conditional-page__resample" onClick={() => setSampleOffset((offset) => offset + 1)}>
            再次采样
          </Button>
        </div>

        <svg
          className="vg-conditional-page__distribution-svg"
          viewBox="0 0 1000 520"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${activeShape.label}。轮廓内颜色越深表示概率越高。`}
        >
          <defs>
            <linearGradient id="vg-conditional-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d9efcf" />
              <stop offset="0.52" stopColor="#aad69f" />
              <stop offset="1" stopColor="#75b58c" />
            </linearGradient>
            <clipPath id="vg-conditional-clip">
              <path d={activeShape.path} />
            </clipPath>
          </defs>

          {selected.length === 2 && activeDefinitions.map((condition) => (
            <path
              key={condition.id}
              className={`vg-conditional-page__source-shape is-${condition.id}`}
              d={distributionShapes[condition.id].path}
            />
          ))}

          <g className="vg-conditional-page__shape-layer" key={activeKey}>
            <path className="vg-conditional-page__shape" d={activeShape.path} />
            <path className="vg-conditional-page__contour vg-conditional-page__contour--outer" d={activeShape.path} transform="translate(85 44) scale(.83)" />
            <path className="vg-conditional-page__contour vg-conditional-page__contour--inner" d={activeShape.path} transform="translate(185 96) scale(.63)" />
            <g clipPath="url(#vg-conditional-clip)" className="vg-conditional-page__density-dots">
              {densityDots.map(([cx, cy, radius], index) => <circle key={index} cx={cx} cy={cy} r={radius} />)}
            </g>
          </g>
        </svg>

        <div className="vg-conditional-page__distribution-label" aria-live="polite">
          <Typography as="strong" variant="h2" tone="inherit">x</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">{formula} 中的高概率图像</Typography>
        </div>

        <div className="vg-conditional-page__sample-orbit" key={`${activeKey}-${sampleOffset}`}>
          {visibleSampleIndexes.map((sampleIndex, index) => (
            <figure className={`vg-conditional-page__sample vg-conditional-page__sample--${index + 1}`} key={`${sampleIndex}-${index}`}>
              <img src={samples[sampleIndex].src} alt={samples[sampleIndex].alt} draggable={false} />
              <figcaption>
                <Typography as="span" variant="bodySmall" tone="inherit">样本 {index + 1}</Typography>
              </figcaption>
            </figure>
          ))}
        </div>

        {selected.length === 2 && (
          <div className="vg-conditional-page__overlap-note">
            <span className="vg-conditional-page__overlap-line" aria-hidden="true" />
            <Typography as="span" variant="bodySmall" tone="success">实线区域：同时满足两个条件</Typography>
          </div>
        )}
      </section>

      <footer className={`vg-conditional-page__insight${complete ? ' is-complete' : ''}`} aria-live="polite">
        <div>
          <Typography as="strong" variant="h3" tone={complete ? 'success' : 'accent'}>
            {complete
              ? '条件改变的是像素分布，而不是指定某一张图片。'
              : selected.length === 0
                ? '先选择一个条件，观察绿色分布怎样改变形状。'
                : '再叠加一个条件，观察可接受的分布如何收窄。'}
          </Typography>
          <Typography variant="bodySmall" tone="muted">
            {complete
              ? '分布的形状决定哪些像素组合更可能；从同一分布采样，仍会得到多个不同但合理的结果。'
              : '绿色区域表示当前条件下更可能出现的像素组合，旁边的图片是从中取出的样本。'}
          </Typography>
        </div>
        <div className="vg-conditional-page__progress" aria-label="探索进度">
          <Typography as="span" variant="bodySmall" tone={hasSeenSingle ? 'success' : 'muted'}>{hasSeenSingle ? '✓' : '○'} 分布变形</Typography>
          <Typography as="span" variant="bodySmall" tone={hasCombined ? 'success' : 'muted'}>{hasCombined ? '✓' : '○'} 条件叠加</Typography>
        </div>
      </footer>
    </ContentBlock>
  );
}
