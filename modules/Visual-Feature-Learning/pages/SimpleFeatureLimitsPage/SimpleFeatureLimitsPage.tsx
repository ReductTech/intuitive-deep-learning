import { useEffect, useState } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { measureMnistImage, type MnistFeatures } from '../../services/mnistFeatures';
import './SimpleFeatureLimitsPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const examples = [
  { digit: '3', file: 'mnist/3/60018.png' },
  { digit: '5', file: 'mnist/5/60162.png' },
] as const;

type Digit = typeof examples[number]['digit'];
type FeatureKey = 'width' | 'height' | 'ink' | 'centroid';

const descriptions: readonly { key: FeatureKey; label: string }[] = [
  { key: 'width', label: '墨迹宽度' },
  { key: 'height', label: '墨迹高度' },
  { key: 'ink', label: '墨迹像素数' },
  { key: 'centroid', label: '墨迹重心' },
];

function featureValue(feature: MnistFeatures | null, key: FeatureKey): string {
  if (!feature) return '—';
  if (key === 'width') return `${feature.width} px`;
  if (key === 'height') return `${feature.height} px`;
  if (key === 'ink') return `${feature.ink}`;
  return `(${feature.centerX.toFixed(1)}, ${feature.centerY.toFixed(1)})`;
}

function comparison(left: MnistFeatures | null, right: MnistFeatures | null, key: FeatureKey): string {
  if (!left || !right) return '计算中';
  const difference = key === 'centroid'
    ? Math.hypot(left.centerX - right.centerX, left.centerY - right.centerY) / Math.hypot(28, 28) * 100
    : Math.abs(left[key] - right[key]) / left[key] * 100;
  return `相差 ${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(difference)}%`;
}

export function SimpleFeatureLimitsPage() {
  const [measured, setMeasured] = useState<Record<Digit, MnistFeatures | null>>({ '3': null, '5': null });

  useEffect(() => {
    let active = true;
    const images = examples.map((example) => {
      const image = new Image();
      image.onload = () => {
        if (!active) return;
        const features = measureMnistImage(image);
        setMeasured((current) => ({ ...current, [example.digit]: features }));
      };
      image.src = moduleAssetUrl(ASSET_ID, example.file);
      return image;
    });
    return () => {
      active = false;
      images.forEach((image) => { image.onload = null; });
    };
  }, []);

  return <ContentBlock
    className="vfl-simple-limit"
    headingLevel={1}
    title="简单统计特征的局限"
    subtitle="不同类别的数字，其简单统计特征也可能相近。"
  >
    <div className="vfl-simple-limit__hero" aria-label="真实的 MNIST 数字 3 与数字 5">
      <figure className="vfl-simple-limit__digit">
        <img src={moduleAssetUrl(ASSET_ID, examples[0].file)} alt="MNIST 数据集中的手写数字 3" />
        <figcaption><Typography as="span" variant="h3" tone="accent">数字 3</Typography></figcaption>
      </figure>
      <Typography as="span" variant="display" tone="warning" className="vfl-simple-limit__symbol" aria-label="不等于">≠</Typography>
      <figure className="vfl-simple-limit__digit">
        <img src={moduleAssetUrl(ASSET_ID, examples[1].file)} alt="MNIST 数据集中的手写数字 5" />
        <figcaption><Typography as="span" variant="h3" tone="accent">数字 5</Typography></figcaption>
      </figure>
    </div>

    <section className="vfl-simple-limit__panel" aria-label="简单特征的实测对比">
      <Typography as="h2" variant="h2" tone="accent">类别不同，部分统计结果仍然相近</Typography>
      <div className="vfl-simple-limit__table" role="table" aria-label="数字 3 与数字 5 的简单特征">
        <div className="vfl-simple-limit__table-head" role="row">
          <Typography as="span" variant="h3" tone="accent" role="columnheader">数字 3</Typography>
          <Typography as="span" variant="h3" tone="muted" role="columnheader">提取的特征</Typography>
          <Typography as="span" variant="h3" tone="accent" role="columnheader">数字 5</Typography>
        </div>
        {descriptions.map(({ key, label }) => <div className="vfl-simple-limit__table-row" role="row" key={key}>
          <Typography as="span" variant="h3" tone="warning" role="cell">{featureValue(measured['3'], key)}</Typography>
          <div className="vfl-simple-limit__descriptor" role="cell">
            <Typography as="span" variant="body" tone="inherit">{label}</Typography>
            <Typography as="span" variant="body" tone="warning">{comparison(measured['3'], measured['5'], key)}</Typography>
          </div>
          <Typography as="span" variant="h3" tone="warning" role="cell">{featureValue(measured['5'], key)}</Typography>
        </div>)}
      </div>
    </section>

    <div className="vfl-simple-limit__takeaway">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v5" /><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" /></svg>
      <div>
        <Typography as="p" variant="h3" tone="accent">少量统计量无法充分表征笔画结构。</Typography>
        <Typography as="p" variant="bodySmall" tone="muted" className="vfl-simple-limit__basis">百分比以数字 3 的数值为基准；重心差以图像对角线长度为基准。</Typography>
      </div>
    </div>
  </ContentBlock>;
}
