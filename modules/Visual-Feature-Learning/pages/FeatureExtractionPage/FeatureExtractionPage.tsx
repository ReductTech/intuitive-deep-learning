import { useEffect, useState } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { measureMnistImage, type MnistFeatures } from '../../services/mnistFeatures';
import './FeatureExtractionPage.css';

const IMAGE_URL = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/3/60018.png');
type FeatureKey = 'width' | 'height' | 'ink' | 'centroid';
type DigitFeatures = MnistFeatures;

const rows: readonly { key: FeatureKey; title: string; detail: string }[] = [
  { key: 'width', title: '宽度', detail: '墨迹外接框的横向跨度' },
  { key: 'height', title: '高度', detail: '墨迹外接框的纵向跨度' },
  { key: 'ink', title: '墨迹像素数', detail: '达到阈值的像素个数' },
  { key: 'centroid', title: '墨迹重心', detail: '墨迹像素的平均位置' },
];

function FeatureMark({ feature, selected }: { feature: DigitFeatures; selected: FeatureKey }) {
  const left = feature.minX;
  const top = feature.minY;
  const right = feature.maxX + 1;
  const bottom = feature.maxY + 1;
  return <svg className="vfl-feature__mark absolute inset-0 h-full w-full" viewBox="0 0 28 28" aria-hidden="true">
    {selected === 'width' && <>
      <path d={`M${left} ${top - 1} H${right} M${left} ${top - 1.7} V${top - .3} M${right} ${top - 1.7} V${top - .3}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
      <rect x={left} y={top} width={feature.width} height={feature.height} fill="none" stroke="#eb6b2d" strokeWidth=".12" strokeDasharray=".4 .35" />
    </>}
    {selected === 'height' && <>
      <path d={`M${right + 1} ${top} V${bottom} M${right + .3} ${top} H${right + 1.7} M${right + .3} ${bottom} H${right + 1.7}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
      <rect x={left} y={top} width={feature.width} height={feature.height} fill="none" stroke="#eb6b2d" strokeWidth=".12" strokeDasharray=".4 .35" />
    </>}
    {selected === 'ink' && feature.pixels.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="rgba(239, 105, 43, .68)" />)}
    {selected === 'centroid' && <>
      <circle cx={feature.centerX + .5} cy={feature.centerY + .5} r="1.1" fill="#fff" stroke="#eb6b2d" strokeWidth=".24" />
      <path d={`M${feature.centerX + .5} ${feature.centerY - 1.3} V${feature.centerY + 2.3} M${feature.centerX - 1.3} ${feature.centerY + .5} H${feature.centerX + 2.3}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
    </>}
  </svg>;
}

function FeatureIcon({ feature }: { feature: FeatureKey }) {
  return <svg className="h-[36px] w-[36px] max-w-full" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {feature === 'width' && <><path d="M5 18h26M5 18l6-6M5 18l6 6M31 18l-6-6M31 18l-6 6" /></>}
    {feature === 'height' && <><path d="M18 5v26M18 5l-6 6M18 5l6 6M18 31l-6-6M18 31l6-6" /></>}
    {feature === 'ink' && <><rect x="5" y="5" width="11" height="11" fill="currentColor" stroke="none" /><rect x="20" y="5" width="11" height="11" fill="currentColor" stroke="none" /><rect x="5" y="20" width="11" height="11" fill="currentColor" stroke="none" /><rect x="20" y="20" width="11" height="11" fill="currentColor" stroke="none" /></>}
    {feature === 'centroid' && <><circle cx="18" cy="18" r="12" /><circle cx="18" cy="18" r="4" /><path d="M18 2v8M18 26v8M2 18h8M26 18h8" /></>}
  </svg>;
}

function valueFor(key: FeatureKey, feature: DigitFeatures | null): string {
  if (!feature) return '—';
  if (key === 'width') return `${feature.width} px`;
  if (key === 'height') return `${feature.height} px`;
  if (key === 'ink') return `${feature.ink}`;
  return `(${feature.centerX.toFixed(1)}, ${feature.centerY.toFixed(1)})`;
}

export function FeatureExtractionPage() {
  const [features, setFeatures] = useState<DigitFeatures | null>(null);
  const [selected, setSelected] = useState<FeatureKey>('width');

  useEffect(() => {
    const image = new Image();
    image.onload = () => setFeatures(measureMnistImage(image));
    image.src = IMAGE_URL;
    return () => { image.onload = null; };
  }, []);

  return <ContentBlock
    className="vfl-feature h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="从图像中提取特征"
    subtitle="从 28 × 28 像素的图像中计算描述墨迹形状的统计量。"
  >
    <div className="vfl-feature__stage relative mx-auto mt-[32px] h-[530px] w-[1230px]">
      <div className="vfl-feature__heading vfl-feature__heading--image absolute left-[80px] top-0 grid w-[420px] place-items-center">
        <Typography as="h2" variant="h3" tone="accent">手写图像</Typography>
      </div>
      <div className="vfl-feature__heading vfl-feature__heading--features absolute left-[715px] top-0 grid w-[500px] place-items-center">
        <Typography as="h2" variant="h3" tone="accent">四项形状统计量</Typography>
      </div>

      <svg className="vfl-feature__connectors pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1230 530" aria-hidden="true">
        <defs><marker id="vfl-feature-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#ec7b42" /></marker></defs>
        {rows.map((row, index) => <path
          key={row.key}
          d={`M500 ${166 + index * 82} C612 ${166 + index * 82} 590 ${107 + index * 110} 704 ${107 + index * 110}`}
          fill="none"
          stroke="#ec7b42"
          strokeWidth="2.5"
          opacity={selected === row.key ? 1 : .32}
          markerEnd="url(#vfl-feature-arrow)"
        />)}
      </svg>

      <div className="vfl-feature__image-card absolute left-[80px] top-[62px] box-border grid h-[420px] w-[420px] place-items-center rounded-[24px] border border-lesson-border bg-white shadow-[0_16px_36px_rgba(32,55,84,0.09)]">
        <div className="vfl-feature__image-wrap relative h-[336px] w-[336px]">
          <img className="block h-full w-full max-w-full invert [image-rendering:pixelated]" src={IMAGE_URL} alt="MNIST 数据集中的手写数字 3，28×28 像素" />
          {features && <FeatureMark feature={features} selected={selected} />}
        </div>
        <Typography as="p" variant="bodySmall" tone="muted" className="vfl-feature__sample-label absolute bottom-[12px]">MNIST 样本 · 28 × 28 像素</Typography>
      </div>

      <div className="vfl-feature__rows absolute left-[715px] top-[60px] grid w-[500px] gap-[16px]">
        {rows.map((row) => <button
          key={row.key}
          type="button"
          className={`vfl-feature__row box-border grid h-[94px] w-full grid-cols-[64px_1fr_168px] items-center gap-[18px] rounded-[18px] border bg-white px-[12px] text-left shadow-[0_8px_20px_rgba(32,55,84,0.06)] cursor-pointer hover:border-[#ec9a6e] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ui-focus)] ${selected === row.key ? 'border-[#ec9a6e] shadow-[0_8px_22px_rgba(215,100,41,0.13)]' : 'border-lesson-border'}`}
          aria-pressed={selected === row.key}
          onMouseEnter={() => setSelected(row.key)}
          onFocus={() => setSelected(row.key)}
          onClick={() => setSelected(row.key)}
        >
          <span className="vfl-feature__icon grid h-[64px] w-[64px] place-items-center rounded-[14px] bg-[#edf3fd] text-[#315c96]"><FeatureIcon feature={row.key} /></span>
          <span className="vfl-feature__row-text min-w-0">
            <Typography as="span" variant="h3" tone="accent" className="vfl-feature__row-title">{row.title}</Typography>
            <Typography as="span" variant="bodySmall" tone="muted" className="vfl-feature__row-detail block">{row.detail}</Typography>
          </span>
          <Typography as="span" variant="h3" tone="warning" className="vfl-feature__value grid h-[68px] place-items-center rounded-[14px] bg-[#fff2e9]">{valueFor(row.key, features)}</Typography>
        </button>)}
      </div>
    </div>

    <div className="vfl-feature__takeaway mx-auto mt-[26px] box-border grid h-[92px] w-[1200px] place-items-center rounded-[20px] border border-lesson-border bg-lesson-soft text-[var(--ui-navy)]">
      <Typography as="p" variant="h3" tone="accent">少量统计量可描述图像的部分形状属性。</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">墨迹指灰度值 ≥ 128 的像素；坐标原点为图像左上角。</Typography>
    </div>
  </ContentBlock>;
}
