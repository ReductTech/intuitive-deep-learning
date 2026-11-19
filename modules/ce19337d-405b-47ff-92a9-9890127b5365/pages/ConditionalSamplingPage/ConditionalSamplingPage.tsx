import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import './ConditionalSamplingPage.css';

const sampleOne = moduleAssetUrl("images/conditional-sampling/sample-1.webp");
const sampleTwo = moduleAssetUrl("images/conditional-sampling/sample-2.webp");
const sampleThree = moduleAssetUrl("images/conditional-sampling/sample-3.webp");
const sampleFour = moduleAssetUrl("images/conditional-sampling/sample-4.webp");
const sampleFive = moduleAssetUrl("images/conditional-sampling/sample-5.webp");
const sampleSix = moduleAssetUrl("images/conditional-sampling/sample-6.webp");

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

interface SampleDefinition {
  src: string;
  alt: string;
  conditions: readonly ConditionId[];
}

const samples: readonly SampleDefinition[] = [
  { src: sampleOne, alt: '草地上奔跑的小型长毛犬', conditions: ['grass', 'small', 'fluffy'] },
  { src: sampleTwo, alt: '尘土中奔跑的长毛犬', conditions: ['fluffy'] },
  { src: sampleThree, alt: '城市中奔跑的小型犬', conditions: ['small'] },
  { src: sampleFour, alt: '旷野中奔跑的长毛犬', conditions: ['fluffy'] },
  { src: sampleFive, alt: '草地上奔跑的白色小型长毛犬', conditions: ['grass', 'small', 'fluffy'] },
  { src: sampleSix, alt: '草地上奔跑的灰色犬', conditions: ['grass'] },
];

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
  // A combined condition is an intersection: every displayed image must match all tags.
  const samplePool = useMemo(
    () => samples.flatMap((sample, index) => selected.every((condition) => sample.conditions.includes(condition)) ? [index] : []),
    [selected],
  );
  const visibleSampleIndexes = useMemo(
    () => Array.from({ length: Math.min(3, samplePool.length) }, (_, index) => samplePool[(sampleOffset + index) % samplePool.length]),
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
    <ContentBlock shuku-edit-id="e-79f31c72-267a-4cdf-80e4-227c003a1403"
      headingLevel={1}
      className="vg-shared-page vg-conditional-page"
      bodyClassName="vg-conditional-page__body"
      title="条件如何改变生成结果的概率分布？"
      subtitle="切换条件，直接观察像素分布的形状如何改变；图像只是从这个分布中取出的样本。"
    >
      <div shuku-edit-id="e-43b53db7-e7a1-4930-b520-eb85407fdeda" className="vg-conditional-page__controls" aria-label="选择生成条件">
        <div shuku-edit-id="e-3af8e78f-9487-4165-b548-92ebe774ceb6" className="vg-conditional-page__control-copy">
          <Typography shuku-edit-id="e-817df9c7-9798-46f3-b4a8-79bc7d2fdfa4" as="strong" variant="body" tone="main">给“奔跑的狗”增加条件</Typography>
          <Typography shuku-edit-id="e-42b31536-a36e-4944-a6de-72b6131db3e0" as="span" variant="bodySmall" tone="muted">最多选择两个；每种条件对应不同的分布形状。</Typography>
        </div>
        <div shuku-edit-id="e-d03a4aa8-9669-40c8-9042-b5efd405a907" className="vg-conditional-page__condition-buttons">
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
        <div shuku-edit-id="e-5ebd4d98-c630-42b9-aac9-8361fb76c97e" className="vg-conditional-page__formula" aria-live="polite">
          <Typography shuku-edit-id="e-0b42f330-5b1e-4dfa-bc3e-41d8b3425c7b" as="span" variant="bodySmall" tone="muted">当前条件分布</Typography>
          <Typography shuku-edit-id="e-cb02ad94-2f25-4e0c-88f5-24a8dc2ad971" as="strong" variant="h3" tone="accent">{formula}</Typography>
        </div>
      </div>

      <section shuku-edit-id="e-793a4ab3-be48-4a40-ae39-14d4449ccf43" className={`vg-conditional-page__distribution${selected.length === 2 ? ' is-combined' : ''}`} aria-label="条件像素分布示意图">
        <div shuku-edit-id="e-48d2997b-6991-4bab-b338-8d56e658e6bb" className="vg-conditional-page__distribution-head">
          <div shuku-edit-id="e-1f2ba833-b19c-4e96-aaf4-453aa0b258a0">
            <Typography shuku-edit-id="e-edf3340e-bcf0-47e8-a231-4318ad782956" as="strong" variant="body" tone="main">像素空间中的高概率区域</Typography>
            <Typography shuku-edit-id="e-30a8ac23-f5bb-4d12-9e2b-46807d782a39" variant="bodySmall" tone="muted">{activeShape.label}</Typography>
          </div>
          <Button className="vg-conditional-page__resample" onClick={() => setSampleOffset((offset) => offset + 1)}>
            再次采样
          </Button>
        </div>

        <svg shuku-edit-id="e-e54e421a-7149-49c5-b36d-2531c0c56ad4"
          className="vg-conditional-page__distribution-svg"
          viewBox="0 0 1000 520"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${activeShape.label}。轮廓内颜色越深表示概率越高。`}
        >
          <defs shuku-edit-id="e-cc6f8aa6-451c-4811-ae84-54d13a88a234">
            <linearGradient shuku-edit-id="e-9eb2c9c0-9957-4e26-8d4f-9832b9758905" id="vg-conditional-fill" x1="0" y1="0" x2="1" y2="1">
              <stop shuku-edit-id="e-be832530-2cfd-42f7-bca4-cc118325cddd" offset="0" stopColor="#d9efcf" />
              <stop shuku-edit-id="e-f828560e-81a4-4072-8125-ef10214e2a6a" offset="0.52" stopColor="#aad69f" />
              <stop shuku-edit-id="e-ee8acfec-980c-46ef-8471-b8342483655c" offset="1" stopColor="#75b58c" />
            </linearGradient>
            <clipPath shuku-edit-id="e-7050026a-49a1-4a93-8af9-54e69c54d2fa" id="vg-conditional-clip">
              <path shuku-edit-id="e-a91ce9ac-6acc-48ab-b60c-984fbdc26b4e" d={activeShape.path} />
            </clipPath>
          </defs>

          {selected.length === 2 && activeDefinitions.map((condition) => (
            <path shuku-edit-id="e-ab1e77be-b164-476e-a9ee-ad75d156b871"
              key={condition.id}
              className={`vg-conditional-page__source-shape is-${condition.id}`}
              d={distributionShapes[condition.id].path}
            />
          ))}

          <g shuku-edit-id="e-8ff27576-7702-42d8-9574-53a7ad6e83ff" className="vg-conditional-page__shape-layer" key={activeKey}>
            <path shuku-edit-id="e-d272ab98-21b8-4afb-b8f3-91307f41e005" className="vg-conditional-page__shape" d={activeShape.path} />
            <path shuku-edit-id="e-c50017f2-40e8-4891-8eb1-63a8f6fdaf3e" className="vg-conditional-page__contour vg-conditional-page__contour--outer" d={activeShape.path} transform="translate(85 44) scale(.83)" />
            <path shuku-edit-id="e-15302990-9106-4fcb-b251-81745b45be36" className="vg-conditional-page__contour vg-conditional-page__contour--inner" d={activeShape.path} transform="translate(185 96) scale(.63)" />
            <g shuku-edit-id="e-7f7f70ea-77c4-4973-abf2-7225b262dddd" clipPath="url(#vg-conditional-clip)" className="vg-conditional-page__density-dots">
              {densityDots.map(([cx, cy, radius], index) => <circle shuku-edit-id="e-25295904-4911-4bcc-8232-a8f407ff3a48" key={index} cx={cx} cy={cy} r={radius} />)}
            </g>
          </g>
        </svg>

        <div shuku-edit-id="e-5ddbb251-ddb0-4579-860e-5f9b1985b59e" className="vg-conditional-page__distribution-label" aria-live="polite">
          <Typography shuku-edit-id="e-d40617ed-bb70-4e81-9113-d73979cb3d12" as="strong" variant="h2" tone="inherit">x</Typography>
          <Typography shuku-edit-id="e-31d8e99a-1e84-4b56-99b1-519b3fb9f039" as="span" variant="bodySmall" tone="inherit">{formula} 中的高概率图像</Typography>
        </div>

        <div shuku-edit-id="e-e1653cc8-c0b3-4419-89bd-733355fceab8" className="vg-conditional-page__sample-orbit" key={`${activeKey}-${sampleOffset}`}>
          {visibleSampleIndexes.map((sampleIndex, index) => (
            <figure shuku-edit-id="e-e8ebc7a8-10e8-41b5-8f30-0439d5d3f3d8" className={`vg-conditional-page__sample vg-conditional-page__sample--${index + 1}`} key={`${sampleIndex}-${index}`}>
              <img shuku-edit-id="e-26146323-2825-4443-9b43-f21ed9ec3b70" src={samples[sampleIndex].src} alt={samples[sampleIndex].alt} draggable={false} />
              <figcaption shuku-edit-id="e-f79c855b-2b90-4aa9-8ffe-243c4e0a8120">
                <Typography shuku-edit-id="e-4fbeeffb-2259-4e60-9fcd-54fe1568f866" as="span" variant="bodySmall" tone="inherit">样本 {index + 1}</Typography>
              </figcaption>
            </figure>
          ))}
        </div>

        {selected.length === 2 && (
          <div shuku-edit-id="e-66e7b618-01cb-4689-a883-b856a782954d" className="vg-conditional-page__overlap-note">
            <span shuku-edit-id="e-4a062034-36fc-42fd-bebd-27b307c8f8cc" className="vg-conditional-page__overlap-line" aria-hidden="true" />
            <Typography shuku-edit-id="e-9bcc3f44-298a-4c4a-8fcd-031bd0905d66" as="span" variant="bodySmall" tone="success">实线区域：同时满足两个条件</Typography>
          </div>
        )}
      </section>

      <footer shuku-edit-id="e-c9b79945-8f87-4c36-8093-8d3f37e44756" className={`vg-conditional-page__insight${complete ? ' is-complete' : ''}`} aria-live="polite">
        <div shuku-edit-id="e-1e41bc14-e8dd-4b93-a862-c1c29efe8073">
          <Typography shuku-edit-id="e-31c89c88-1ea8-440b-b17a-b0552d704b34" as="strong" variant="h3" tone={complete ? 'success' : 'accent'}>
            {complete
              ? '条件改变的是像素分布，而不是指定某一张图片。'
              : selected.length === 0
                ? '先选择一个条件，观察绿色分布怎样改变形状。'
                : '再叠加一个条件，观察可接受的分布如何收窄。'}
          </Typography>
          <Typography shuku-edit-id="e-64ac266d-b091-491b-9b98-15b6b04308a0" variant="bodySmall" tone="muted">
            {complete
              ? '分布的形状决定哪些像素组合更可能；从同一分布采样，仍会得到多个不同但合理的结果。'
              : '绿色区域表示当前条件下更可能出现的像素组合，旁边的图片是从中取出的样本。'}
          </Typography>
        </div>
        <div shuku-edit-id="e-cfffc570-da6d-4017-8ca4-dbdd3cafc1d4" className="vg-conditional-page__progress" aria-label="探索进度">
          <Typography shuku-edit-id="e-73b6f4c2-d82e-42c1-b775-bbc6ce353584" as="span" variant="bodySmall" tone={hasSeenSingle ? 'success' : 'muted'}>{hasSeenSingle ? '✓' : '○'} 分布变形</Typography>
          <Typography shuku-edit-id="e-7c49dab9-0e4e-4863-99b0-82564e282a59" as="span" variant="bodySmall" tone={hasCombined ? 'success' : 'muted'}>{hasCombined ? '✓' : '○'} 条件叠加</Typography>
        </div>
      </footer>
    </ContentBlock>
  );
}
