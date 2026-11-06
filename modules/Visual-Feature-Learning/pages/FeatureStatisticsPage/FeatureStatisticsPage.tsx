import { useState, type CSSProperties } from 'react';
import { ContentBlock, ExplainPanelButton, moduleAssetUrl, Typography } from '../../../shared/react';
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
  return <div className={'vfl-stats__plot' + (compact ? ' vfl-stats__plot--compact' : '')} aria-label={feature + '：各类最小值、最大值与中位数'}>
    {ticks.map((tick) => <div key={tick} className="vfl-stats__tick" style={{ left: position(tick) + '%' }}><Typography as="span" variant="bodySmall" tone="muted">{tick}</Typography></div>)}
    {statistics.classes.map((row) => {
      const values = row.features[feature];
      const focused = active === null || active === row.digit;
      const label = labelPositions.get(row.digit)!;
      const median = position(values.median);
      const y = 54 + (row.digit % 3) * 5;
      return <div className="vfl-stats__distribution" key={row.digit} data-muted={!focused} data-selected={active === row.digit} style={{ '--vfl-stat-color': COLORS[row.digit] } as CSSProperties}>
        <div className="vfl-stats__range" style={{ left: position(values.min) + '%', width: position(values.max) - position(values.min) + '%', top: y }} />
        <svg className="vfl-stats__leader" viewBox="0 0 1000 86" preserveAspectRatio="none" aria-hidden="true"><path d={'M' + label * 10 + ' 40 L' + median * 10 + ' ' + y} /></svg>
        <div className="vfl-stats__median" style={{ left: median + '%', top: y }} />
        <span className="vfl-stats__marker" style={{ left: label + '%' }} tabIndex={0} onMouseEnter={() => select(row.digit)} onMouseLeave={() => select(null)} onFocus={() => select(row.digit)} onBlur={() => select(null)} title={'数字 ' + row.digit + '：中位数 ' + values.median.toFixed(1) + '，范围 ' + values.min.toFixed(1) + '–' + values.max.toFixed(1)}>
          <Typography as="span" variant="bodySmall" tone="inherit">{row.digit}</Typography>
        </span>
      </div>;
    })}
  </div>;
}

function FeatureIllustration({ feature }: { feature: 'width' | 'height' | 'ink' | 'centroid' }) {
  return <div className="vfl-stats__illustration">
    <img src={moduleAssetUrl(ASSET_ID, statistics.classes[8].samples[0].file)} alt="示意统计位置的 MNIST 数字 8" />
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {feature === 'width' && <><path d="M10 8H70M10 8l6-4M10 8l6 4M70 8l-6-4M70 8l-6 4" /></>}
      {feature === 'height' && <path d="M72 14V70M72 14l-4 6M72 14l4 6M72 70l-4-6M72 70l4-6" />}
      {feature === 'ink' && <><rect x="31" y="34" width="9" height="9" /><rect x="40" y="43" width="9" height="9" /></>}
      {feature === 'centroid' && <><path d="M20 43H60M40 23V63" /><circle cx="40" cy="43" r="4" /></>}
    </svg>
  </div>;
}

export function FeatureStatisticsPage() {
  const [active, setActive] = useState<number | null>(null);
  return <ContentBlock className="vfl-stats"  headingLevel={1} title="简单统计特征的分布" subtitle="当前素材集中，不同类别的数字在简单统计特征上存在明显重叠。">
    <div className="vfl-stats__conclusion">
      <Typography as="p" variant="h2" tone="accent">仅凭单项简单统计特征，难以完全区分数字类别。</Typography>
      <ExplainPanelButton label="查看结论的适用范围"><Typography variant="bodySmall">图中展示当前样本集在单项统计特征上的取值范围重叠。范围重叠不能直接判定多个特征联合使用时的分类能力，分类效果仍需要在验证集上评估。</Typography></ExplainPanelButton>
    </div>
    <div className="vfl-stats__toolbar">
      <Typography as="p" variant="bodySmall" tone="muted">色带：最小值—最大值；小点：中位数。</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">数字表示类别；引线对应中位数，标签位置不表示数值。</Typography>
    </div>
    <div className="vfl-stats__rows">
      {([{ key: 'width', label: '墨迹宽度', unit: '像素', ticks: [0, 6, 12, 18, 24] }, { key: 'height', label: '墨迹高度', unit: '像素', ticks: [12, 14, 16, 18, 20, 22] }, { key: 'ink', label: '前景像素数', unit: '个', ticks: [0, 60, 120, 180, 240] }] as const).map((row) => <section className="vfl-stats__row" key={row.key}>
        <div className="vfl-stats__label"><FeatureIllustration feature={row.key} /><div><Typography as="h2" variant="h3" tone="accent">{row.label}</Typography><Typography as="p" variant="bodySmall" tone="muted">{row.unit}</Typography></div></div>
        <DistributionPlot feature={row.key} domain={domains[row.key]} ticks={[...row.ticks]} active={active} select={setActive} />
      </section>)}
      <section className="vfl-stats__row vfl-stats__row--centroid">
        <div className="vfl-stats__label"><FeatureIllustration feature="centroid" /><div><Typography as="h2" variant="h3" tone="accent">墨迹重心</Typography><Typography as="p" variant="bodySmall" tone="muted">原图坐标</Typography></div></div>
        <div className="vfl-stats__centroid">
          {(['centerX', 'centerY'] as const).map((feature) => <div className="vfl-stats__coordinate" key={feature}><Typography as="span" variant="bodySmall" tone="accent">{feature === 'centerX' ? 'x' : 'y'}</Typography><DistributionPlot feature={feature} domain={domains[feature]} ticks={[12, 13, 14, 15, 16]} active={active} select={setActive} compact /></div>)}
        </div>
      </section>
    </div>
  </ContentBlock>;
}

