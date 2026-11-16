import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { measureMnistImage, type MnistFeatures } from '../../services/mnistFeatures';
import './SimpleFeatureLimitsPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const examples = [
  { digit: '3', file: 'mnist/3/60018.jpg' },
  { digit: '5', file: 'mnist/5/60162.jpg' },
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
      image.src = moduleAssetUrl(example.file);
      return image;
    });
    return () => {
      active = false;
      images.forEach((image) => { image.onload = null; });
    };
  }, []);

  return <ContentBlock shuku-edit-id="e-ba438538-44cf-44ef-b78d-60c19704df66"
    className="vfl-simple-limit"
    headingLevel={1}
    title="简单统计特征的局限"
    subtitle="不同类别的数字，其简单统计特征也可能相近。"
  >
    <div shuku-edit-id="e-8452939c-6763-4220-820e-2326e4038069" className="vfl-simple-limit__hero" aria-label="真实的 MNIST 数字 3 与数字 5">
      <figure shuku-edit-id="e-3707fb84-60ec-47d3-99cd-403109fd4330" className="vfl-simple-limit__digit">
        <img shuku-edit-id="e-896db314-f313-4da1-9dde-9d60fac64b50" src={moduleAssetUrl(examples[0].file)} alt="MNIST 数据集中的手写数字 3" />
        <figcaption shuku-edit-id="e-e85c9bd0-9c13-4fd5-9ba1-14d9ef8b419b"><Typography shuku-edit-id="e-4365e22d-78dc-46fc-993b-c74ac5747a1c" as="span" variant="h3" tone="accent">数字 3</Typography></figcaption>
      </figure>
      <Typography shuku-edit-id="e-ea2f10e1-6ae7-4f24-99df-becaa0b0ec2e" as="span" variant="display" tone="warning" className="vfl-simple-limit__symbol" aria-label="不等于">≠</Typography>
      <figure shuku-edit-id="e-4506bb1a-5816-44ec-b943-00d4fef6d5c4" className="vfl-simple-limit__digit">
        <img shuku-edit-id="e-fb01770a-cde6-476d-9bf4-bac77c37879d" src={moduleAssetUrl(examples[1].file)} alt="MNIST 数据集中的手写数字 5" />
        <figcaption shuku-edit-id="e-381f6050-bea4-495d-9c53-a8ea7fac043b"><Typography shuku-edit-id="e-b97494b5-f014-43e2-adc7-cf9a9b72a3d8" as="span" variant="h3" tone="accent">数字 5</Typography></figcaption>
      </figure>
    </div>

    <section shuku-edit-id="e-e5a2b523-f984-463e-bd48-3210b6ffb159" className="vfl-simple-limit__panel" aria-label="简单特征的实测对比">
      <Typography shuku-edit-id="e-9c76663f-d22d-4adc-bf13-ace1f097753c" as="h2" variant="h2" tone="accent">类别不同，部分统计结果仍然相近</Typography>
      <div shuku-edit-id="e-0754f0c6-187c-4301-85f8-9d6583f31db5" className="vfl-simple-limit__table" role="table" aria-label="数字 3 与数字 5 的简单特征">
        <div shuku-edit-id="e-a14c8d22-d30d-4230-8e8f-5c40c2e95b37" className="vfl-simple-limit__table-head" role="row">
          <Typography shuku-edit-id="e-e2908a52-cd13-456c-92db-8a8e5b566c41" as="span" variant="h3" tone="accent" role="columnheader">数字 3</Typography>
          <Typography shuku-edit-id="e-21023758-7d59-44d9-b854-8be762b986bb" as="span" variant="h3" tone="muted" role="columnheader">提取的特征</Typography>
          <Typography shuku-edit-id="e-dd1b957c-fbf3-4396-ac11-eb94973f03bf" as="span" variant="h3" tone="accent" role="columnheader">数字 5</Typography>
        </div>
        {descriptions.map(({ key, label }) => <div shuku-edit-id="e-ceef9d02-d44e-46c6-99d0-750d92d57eaa" className="vfl-simple-limit__table-row" role="row" key={key}>
          <Typography shuku-edit-id="e-e9472544-5831-4908-bd86-1ccf7b48cd53" as="span" variant="h3" tone="warning" role="cell">{featureValue(measured['3'], key)}</Typography>
          <div shuku-edit-id="e-fd6d02c0-c2d9-412f-9547-7d0e32078bb8" className="vfl-simple-limit__descriptor" role="cell">
            <Typography shuku-edit-id="e-169f2cdd-7af7-49fe-8c7b-12162d74bdea" as="span" variant="body" tone="inherit">{label}</Typography>
            <Typography shuku-edit-id="e-04b039ca-8863-4c56-8a10-f184c709755b" as="span" variant="body" tone="warning">{comparison(measured['3'], measured['5'], key)}</Typography>
          </div>
          <Typography shuku-edit-id="e-19e6f809-51a0-4745-9c12-40964d227f06" as="span" variant="h3" tone="warning" role="cell">{featureValue(measured['5'], key)}</Typography>
        </div>)}
      </div>
    </section>

    <div shuku-edit-id="e-5f40f37b-0f3d-448f-86b3-2f4e5e381140" className="vfl-simple-limit__takeaway">
      <svg shuku-edit-id="e-82f09973-6b29-461c-a234-7adc4ac68d1b" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-edf69ab5-dcbf-4ac0-b4d5-a1546547f9dc" d="M12 3 22 20H2L12 3Z" /><path shuku-edit-id="e-977d8eec-a75e-4b77-a970-dd2a45bbca33" d="M12 9v5" /><circle shuku-edit-id="e-c6d1249b-84fd-4d46-8aff-4d10853dc44a" cx="12" cy="17" r=".8" fill="currentColor" stroke="none" /></svg>
      <div shuku-edit-id="e-43f3c1e4-e5b2-4e21-a0d9-23a8046c09f4">
        <Typography shuku-edit-id="e-69a1b540-a3be-46a0-bbc1-a307a7bc4b9a" as="p" variant="h3" tone="accent">少量统计量无法充分表征笔画结构。</Typography>
        <Typography shuku-edit-id="e-fdc009e5-a18b-42e6-9b4c-515cb87c3865" as="p" variant="bodySmall" tone="muted" className="vfl-simple-limit__basis">百分比以数字 3 的数值为基准；重心差以图像对角线长度为基准。</Typography>
      </div>
    </div>
  </ContentBlock>;
}
