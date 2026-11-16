import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState, type CSSProperties } from 'react';
import { ContentBlock, ExplainPanelButton, Typography } from "@shuku/course-style/react";
import statistics from './statistics.json';
import './FeatureStatisticsPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const COLORS = ['#14a897', '#64ad64', '#359ada', '#d85b52', '#dea13e', '#285d9c', '#1babc2', '#ef9437', '#855fd0', '#b775cd'];
type Feature = 'width' | 'height' | 'ink' | 'centerX' | 'centerY';
type PlotProps = { feature: Feature; domain: [number, number]; ticks: number[]; active: number | null; select: (digit: number | null) => void; compact?: boolean };
const domains: Record<Feature, [number, number]> = { width: [0, 24], height: [12, 22], ink: [0, 240], centerX: [12, 16], centerY: [12, 16] };

function DistributionPlot({ feature, domain, ticks, active, select, compact = false }: PlotProps) {
  const position = (value: number) => (value - domain[0]) / (domain[1] - domain[0]) * 100;
  const ordered = statistics.classes.map((row) => ({ digit: row.digit, actual: position(row.features[feature].median) })).sort((a, b) => a.actual - b.actual);
  // Label packing shifts labels only; leaders retain the exact median coordinates.
  ordered.forEach((item) => { item.actual = Math.max(2, Math.min(98, item.actual)); });
  const labels = ordered.map((item, index) => ({ ...item, label: Math.max(item.actual, index ? 0 : 2) }));
  labels.forEach((item, index) => { if (index) item.label = Math.max(item.label, labels[index - 1].label + (compact ? 9.5 : 4.6)); });
  if (labels[labels.length - 1].label > 98) {
    labels[labels.length - 1].label = 98;
    for (let index = labels.length - 2; index >= 0; index -= 1) labels[index].label = Math.min(labels[index].label, labels[index + 1].label - (compact ? 9.5 : 4.6));
  }
  const labelPositions = new Map(labels.map((item) => [item.digit, item.label]));
  return <div shuku-edit-id="e-b1b9a216-9443-4448-843e-97a0832c7611" className={'vfl-stats__plot' + (compact ? ' vfl-stats__plot--compact' : '')} aria-label={feature + '：各类最小值、最大值与中位数'}>
    {ticks.map((tick) => <div shuku-edit-id="e-95e9b255-6a4b-4f87-99e7-3a00a0a28573" key={tick} className="vfl-stats__tick" style={{ left: position(tick) + '%' }}><Typography shuku-edit-id="e-d97e4d49-e88d-4243-82ac-380fc3320e65" as="span" variant="bodySmall" tone="muted">{tick}</Typography></div>)}
    {statistics.classes.map((row) => {
      const values = row.features[feature];
      const focused = active === null || active === row.digit;
      const label = labelPositions.get(row.digit)!;
      const median = position(values.median);
      const y = 54 + (row.digit % 3) * 5;
      return <div shuku-edit-id="e-e8e7170b-e813-456a-8281-14d5402eec56" className="vfl-stats__distribution" key={row.digit} data-muted={!focused} data-selected={active === row.digit} style={{ '--vfl-stat-color': COLORS[row.digit] } as CSSProperties}>
        <div shuku-edit-id="e-011f8b57-af66-47f3-8b7b-a052bd8f1f6a" className="vfl-stats__range" style={{ left: position(values.min) + '%', width: position(values.max) - position(values.min) + '%', top: y }} />
        <svg shuku-edit-id="e-e510ceec-caaa-4a72-b992-6b0b4759fa0a" className="vfl-stats__leader" viewBox="0 0 1000 86" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-9c495e42-6394-495b-b134-fd1e66d68889" d={'M' + label * 10 + ' 40 L' + median * 10 + ' ' + y} /></svg>
        <div shuku-edit-id="e-30946604-6dc7-4d1c-b783-785ff73e4ecd" className="vfl-stats__median" style={{ left: median + '%', top: y }} />
        <span shuku-edit-id="e-6e271dd2-3b62-4086-91ba-65b4a2ac3b93" className="vfl-stats__marker" style={{ left: label + '%' }} tabIndex={0} onMouseEnter={() => select(row.digit)} onMouseLeave={() => select(null)} onFocus={() => select(row.digit)} onBlur={() => select(null)} title={'数字 ' + row.digit + '：中位数 ' + values.median.toFixed(1) + '，范围 ' + values.min.toFixed(1) + '–' + values.max.toFixed(1)}>
          <Typography shuku-edit-id="e-f331ec52-6767-4326-9ef7-8d0da3946330" as="span" variant="bodySmall" tone="inherit">{row.digit}</Typography>
        </span>
      </div>;
    })}
  </div>;
}

function FeatureIllustration({ feature }: { feature: 'width' | 'height' | 'ink' | 'centroid' }) {
  return <div shuku-edit-id="e-3953e685-b38b-4942-a042-3b85d2ee9d04" className="vfl-stats__illustration">
    <img shuku-edit-id="e-b36959c6-ae31-4d20-ab05-87da4bdb11bd" src={moduleAssetUrl(statistics.classes[8].samples[0].file)} alt="示意统计位置的 MNIST 数字 8" />
    <svg shuku-edit-id="e-2de3a844-210b-44d8-8f0d-439e54755bad" viewBox="0 0 80 80" aria-hidden="true">
      {feature === 'width' && <><path shuku-edit-id="e-77dc2f56-69fd-4eb4-b894-8ca60b2b28c0" d="M10 8H70M10 8l6-4M10 8l6 4M70 8l-6-4M70 8l-6 4" /></>}
      {feature === 'height' && <path shuku-edit-id="e-c5384bea-5974-4c13-838d-cb1b205484d4" d="M72 14V70M72 14l-4 6M72 14l4 6M72 70l-4-6M72 70l4-6" />}
      {feature === 'ink' && <><rect shuku-edit-id="e-83cd166b-3812-437b-ad09-66351b580a63" x="31" y="34" width="9" height="9" /><rect shuku-edit-id="e-a81ea0da-df66-494b-ba6c-4723aabd7c4d" x="40" y="43" width="9" height="9" /></>}
      {feature === 'centroid' && <><path shuku-edit-id="e-d26a489b-4d0a-45ce-944b-425c6c169443" d="M20 43H60M40 23V63" /><circle shuku-edit-id="e-3953f185-5d2b-4949-a44e-176436605aef" cx="40" cy="43" r="4" /></>}
    </svg>
  </div>;
}

export function FeatureStatisticsPage() {
  const [active, setActive] = useState<number | null>(null);
  return <ContentBlock shuku-edit-id="e-d582c533-b123-4d8c-a6d3-e3b425e72c72" className="vfl-stats"  headingLevel={1} title="简单统计特征的分布" subtitle="当前素材集中，不同类别的数字在简单统计特征上存在明显重叠。">
    <div shuku-edit-id="e-bd7824a0-bd83-45f5-a79c-ddbe7271460a" className="vfl-stats__conclusion">
      <Typography shuku-edit-id="e-a8472247-89c0-42f2-aed4-c5804615d8a5" as="p" variant="h2" tone="accent">仅凭单项简单统计特征，难以完全区分数字类别。</Typography>
      <ExplainPanelButton label="查看结论的适用范围"><Typography shuku-edit-id="e-f57ba49b-cbdb-4658-99ca-e31c68b26288" variant="bodySmall">图中展示当前样本集在单项统计特征上的取值范围重叠。范围重叠不能直接判定多个特征联合使用时的分类能力，分类效果仍需要在验证集上评估。</Typography></ExplainPanelButton>
    </div>
    <div shuku-edit-id="e-0d2d8a12-0efe-442f-aeda-e1b2fd65bc02" className="vfl-stats__toolbar">
      <Typography shuku-edit-id="e-d83ae611-9423-40a8-b192-889ae7d3b066" as="p" variant="bodySmall" tone="muted">色带：最小值—最大值；小点：中位数。</Typography>
      <Typography shuku-edit-id="e-01986f24-9291-4109-a153-2602d92ab023" as="p" variant="bodySmall" tone="muted">数字表示类别；引线对应中位数，标签位置不表示数值。</Typography>
    </div>
    <div shuku-edit-id="e-bf67d66a-969f-4bde-aed2-a17d1bee8142" className="vfl-stats__rows">
      {([{ key: 'width', label: '墨迹宽度', unit: '像素', ticks: [0, 6, 12, 18, 24] }, { key: 'height', label: '墨迹高度', unit: '像素', ticks: [12, 14, 16, 18, 20, 22] }, { key: 'ink', label: '前景像素数', unit: '个', ticks: [0, 60, 120, 180, 240] }] as const).map((row) => <section shuku-edit-id="e-a7b3e56e-4de4-4aaf-b53c-2a68415cc59b" className="vfl-stats__row" key={row.key}>
        <div shuku-edit-id="e-f7545322-66a4-4eff-ad8f-baf8398651d2" className="vfl-stats__label"><FeatureIllustration feature={row.key} /><div shuku-edit-id="e-4ca60f86-c407-46f7-b27c-1a70b68fac62"><Typography shuku-edit-id="e-816e1136-e04a-4ab7-8706-b4f381b4bc11" as="h2" variant="h3" tone="accent">{row.label}</Typography><Typography shuku-edit-id="e-1219035d-c4a9-4913-887c-426a2f80d817" as="p" variant="bodySmall" tone="muted">{row.unit}</Typography></div></div>
        <DistributionPlot feature={row.key} domain={domains[row.key]} ticks={[...row.ticks]} active={active} select={setActive} />
      </section>)}
      <section shuku-edit-id="e-af46e049-351a-42bd-a3e3-5bacba7f3a89" className="vfl-stats__row vfl-stats__row--centroid">
        <div shuku-edit-id="e-c98ee0f3-4a22-4a46-9577-476034e7d684" className="vfl-stats__label"><FeatureIllustration feature="centroid" /><div shuku-edit-id="e-5d0aa6c6-e50c-4ebc-a8df-fc7055515492"><Typography shuku-edit-id="e-72beb580-91cf-49f7-9018-d306c39ba119" as="h2" variant="h3" tone="accent">墨迹重心</Typography><Typography shuku-edit-id="e-f3cf37ba-e4d2-4ed5-836c-5be552425bd4" as="p" variant="bodySmall" tone="muted">原图坐标</Typography></div></div>
        <div shuku-edit-id="e-006a12aa-5839-4a2c-9749-1e07c11d82cf" className="vfl-stats__centroid">
          {(['centerX', 'centerY'] as const).map((feature) => <div shuku-edit-id="e-faee9ccb-d6e3-40ee-b929-144552917dde" className="vfl-stats__coordinate" key={feature}><Typography shuku-edit-id="e-b659b002-58e9-4724-bc37-025b8f151f2a" as="span" variant="bodySmall" tone="accent">{feature === 'centerX' ? 'x' : 'y'}</Typography><DistributionPlot feature={feature} domain={domains[feature]} ticks={[12, 13, 14, 15, 16]} active={active} select={setActive} compact /></div>)}
        </div>
      </section>
    </div>
  </ContentBlock>;
}

