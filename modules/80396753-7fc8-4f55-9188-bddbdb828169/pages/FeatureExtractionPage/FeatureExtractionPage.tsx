import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { measureMnistImage, type MnistFeatures } from '../../services/mnistFeatures';
import './FeatureExtractionPage.css';

const IMAGE_URL = moduleAssetUrl('mnist/3/60018.jpg');
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
  return <svg shuku-edit-id="e-6f0e9906-6d4a-4075-b60e-a31e4eec4dfe" className="vfl-feature__mark absolute inset-0 h-full w-full" viewBox="0 0 28 28" aria-hidden="true">
    {selected === 'width' && <>
      <path shuku-edit-id="e-8a8eedb7-dc8f-4727-be15-187baaa3a7cf" d={`M${left} ${top - 1} H${right} M${left} ${top - 1.7} V${top - .3} M${right} ${top - 1.7} V${top - .3}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
      <rect shuku-edit-id="e-d7fb9e89-47b3-4e8c-b6eb-9feb6baa9d9e" x={left} y={top} width={feature.width} height={feature.height} fill="none" stroke="#eb6b2d" strokeWidth=".12" strokeDasharray=".4 .35" />
    </>}
    {selected === 'height' && <>
      <path shuku-edit-id="e-38c86269-b7c8-4239-8c44-63a995db4fe2" d={`M${right + 1} ${top} V${bottom} M${right + .3} ${top} H${right + 1.7} M${right + .3} ${bottom} H${right + 1.7}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
      <rect shuku-edit-id="e-587b054c-4f85-417c-8b7d-e3d4b0989697" x={left} y={top} width={feature.width} height={feature.height} fill="none" stroke="#eb6b2d" strokeWidth=".12" strokeDasharray=".4 .35" />
    </>}
    {selected === 'ink' && feature.pixels.map(([x, y]) => <rect shuku-edit-id="e-23328301-452a-45fb-a1de-f18baa9cdb60" key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="rgba(239, 105, 43, .68)" />)}
    {selected === 'centroid' && <>
      <circle shuku-edit-id="e-fd095207-eee4-4d04-af77-ebe02fb13b97" cx={feature.centerX + .5} cy={feature.centerY + .5} r="1.1" fill="#fff" stroke="#eb6b2d" strokeWidth=".24" />
      <path shuku-edit-id="e-d86b8600-213c-40c4-a636-d1be027388ff" d={`M${feature.centerX + .5} ${feature.centerY - 1.3} V${feature.centerY + 2.3} M${feature.centerX - 1.3} ${feature.centerY + .5} H${feature.centerX + 2.3}`} fill="none" stroke="#eb6b2d" strokeWidth=".24" strokeLinecap="round" />
    </>}
  </svg>;
}

function FeatureIcon({ feature }: { feature: FeatureKey }) {
  return <svg shuku-edit-id="e-42edf589-8e3b-4fd1-8531-a884db92f2e8" className="h-[36px] w-[36px] max-w-full" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {feature === 'width' && <><path shuku-edit-id="e-06100e5e-7e94-497b-8281-e1d38ebd1ac4" d="M5 18h26M5 18l6-6M5 18l6 6M31 18l-6-6M31 18l-6 6" /></>}
    {feature === 'height' && <><path shuku-edit-id="e-879265b5-ecf6-4167-8525-15c8bc53ab25" d="M18 5v26M18 5l-6 6M18 5l6 6M18 31l-6-6M18 31l6-6" /></>}
    {feature === 'ink' && <><rect shuku-edit-id="e-7675ec37-decd-4d73-9e3c-d8ea96dd8cb3" x="5" y="5" width="11" height="11" fill="currentColor" stroke="none" /><rect shuku-edit-id="e-e91250a2-33ae-45b7-884d-3eec49474b2c" x="20" y="5" width="11" height="11" fill="currentColor" stroke="none" /><rect shuku-edit-id="e-f5b8cfe1-d9b8-4b62-a83a-8bca7ad72fa3" x="5" y="20" width="11" height="11" fill="currentColor" stroke="none" /><rect shuku-edit-id="e-6c936a49-0842-4983-bd57-cc9bcc7c6835" x="20" y="20" width="11" height="11" fill="currentColor" stroke="none" /></>}
    {feature === 'centroid' && <><circle shuku-edit-id="e-4d6b052e-abdf-4644-93db-3a205ce39223" cx="18" cy="18" r="12" /><circle shuku-edit-id="e-d59c12d4-9fa0-441b-a73a-6a42438b1af6" cx="18" cy="18" r="4" /><path shuku-edit-id="e-0fb10359-22e0-4514-9a2c-a959f8d423ea" d="M18 2v8M18 26v8M2 18h8M26 18h8" /></>}
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

  return <ContentBlock shuku-edit-id="e-8d2b479b-ead0-4746-9aeb-710d1eee3f35"
    className="vfl-feature h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="从图像中提取特征"
    subtitle="从 28 × 28 像素的图像中计算描述墨迹形状的统计量。"
  >
    <div shuku-edit-id="e-1a24ad1e-e9fa-4bee-9e81-be465e089a46" className="vfl-feature__stage relative mx-auto mt-[32px] h-[530px] w-[1230px]">
      <div shuku-edit-id="e-7d45dcb8-449b-44db-a28c-b97ab636d6e8" className="vfl-feature__heading vfl-feature__heading--image absolute left-[80px] top-0 grid w-[420px] place-items-center">
        <Typography shuku-edit-id="e-2588c9c8-2c5f-4a71-9659-0c431962b132" as="h2" variant="h3" tone="accent">手写图像</Typography>
      </div>
      <div shuku-edit-id="e-b72434e5-90c2-4513-9b82-82e92e42e76d" className="vfl-feature__heading vfl-feature__heading--features absolute left-[715px] top-0 grid w-[500px] place-items-center">
        <Typography shuku-edit-id="e-e179760b-8202-4bb5-9db7-e6314f7253c3" as="h2" variant="h3" tone="accent">四项形状统计量</Typography>
      </div>

      <svg shuku-edit-id="e-accc0a2c-3b2c-47d4-9708-5fad39916f96" className="vfl-feature__connectors pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1230 530" aria-hidden="true">
        <defs shuku-edit-id="e-ba72ee40-0b26-448d-be12-24e2c39a3a30"><marker shuku-edit-id="e-fc540c84-3794-40e4-b637-2e50eeca0e98" id="vfl-feature-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path shuku-edit-id="e-b14a5d2b-00a4-4572-9ea7-d78bd3880ab8" d="M0 0 L8 4 L0 8" fill="#ec7b42" /></marker></defs>
        {rows.map((row, index) => <path shuku-edit-id="e-337c6fcd-017c-489b-abca-ee28c6bc0566"
          key={row.key}
          d={`M500 ${166 + index * 82} C612 ${166 + index * 82} 590 ${107 + index * 110} 704 ${107 + index * 110}`}
          fill="none"
          stroke="#ec7b42"
          strokeWidth="2.5"
          opacity={selected === row.key ? 1 : .32}
          markerEnd="url(#vfl-feature-arrow)"
        />)}
      </svg>

      <div shuku-edit-id="e-9b57c971-6f76-452a-80b0-a1c1f0139e0e" className="vfl-feature__image-card absolute left-[80px] top-[62px] box-border grid h-[420px] w-[420px] place-items-center rounded-[24px] border border-lesson-border bg-white shadow-[0_16px_36px_rgba(32,55,84,0.09)]">
        <div shuku-edit-id="e-161ea6dd-3bb0-449e-8d36-b98d1bdfdd0e" className="vfl-feature__image-wrap relative h-[336px] w-[336px]">
          <img shuku-edit-id="e-038f5952-aeb3-4be4-8757-f877ec4fc447" className="block h-full w-full max-w-full invert [image-rendering:pixelated]" src={IMAGE_URL} alt="MNIST 数据集中的手写数字 3，28×28 像素" />
          {features && <FeatureMark feature={features} selected={selected} />}
        </div>
        <Typography shuku-edit-id="e-52869c64-0160-4d05-9e88-141d68fa608c" as="p" variant="bodySmall" tone="muted" className="vfl-feature__sample-label absolute bottom-[12px]">MNIST 样本 · 28 × 28 像素</Typography>
      </div>

      <div shuku-edit-id="e-333e79d8-3226-49a7-a015-243d6119a0fd" className="vfl-feature__rows absolute left-[715px] top-[60px] grid w-[500px] gap-[16px]">
        {rows.map((row) => <button shuku-edit-id="e-a55fc0a3-2b41-4f06-b45f-290a760761d5"
          key={row.key}
          type="button"
          className={`vfl-feature__row box-border grid h-[94px] w-full grid-cols-[64px_1fr_168px] items-center gap-[18px] rounded-[18px] border bg-white px-[12px] text-left shadow-[0_8px_20px_rgba(32,55,84,0.06)] cursor-pointer hover:border-[#ec9a6e] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ui-focus)] ${selected === row.key ? 'border-[#ec9a6e] shadow-[0_8px_22px_rgba(215,100,41,0.13)]' : 'border-lesson-border'}`}
          aria-pressed={selected === row.key}
          onMouseEnter={() => setSelected(row.key)}
          onFocus={() => setSelected(row.key)}
          onClick={() => setSelected(row.key)}
        >
          <span shuku-edit-id="e-f098229e-1e27-4d18-80e6-fbd9b740feb3" className="vfl-feature__icon grid h-[64px] w-[64px] place-items-center rounded-[14px] bg-[#edf3fd] text-[#315c96]"><FeatureIcon feature={row.key} /></span>
          <span shuku-edit-id="e-5015a862-5920-4448-90eb-848729058671" className="vfl-feature__row-text min-w-0">
            <Typography shuku-edit-id="e-815fd900-0b4f-42ca-ad70-a8c76e1d96c2" as="span" variant="h3" tone="accent" className="vfl-feature__row-title">{row.title}</Typography>
            <Typography shuku-edit-id="e-c43e567c-150f-48fd-ac9f-5803014adb47" as="span" variant="bodySmall" tone="muted" className="vfl-feature__row-detail block">{row.detail}</Typography>
          </span>
          <Typography shuku-edit-id="e-15256bcd-d643-48ee-b5c8-781c46d44636" as="span" variant="h3" tone="warning" className="vfl-feature__value grid h-[68px] place-items-center rounded-[14px] bg-[#fff2e9]">{valueFor(row.key, features)}</Typography>
        </button>)}
      </div>
    </div>

    <div shuku-edit-id="e-4e1df655-6237-4c6d-9e76-51206919fcef" className="vfl-feature__takeaway mx-auto mt-[26px] box-border grid h-[92px] w-[1200px] place-items-center rounded-[20px] border border-lesson-border bg-lesson-soft text-[var(--ui-navy)]">
      <Typography shuku-edit-id="e-5c5d6587-22ca-450a-93dd-a14d6bc28d33" as="p" variant="h3" tone="accent">少量统计量可描述图像的部分形状属性。</Typography>
      <Typography shuku-edit-id="e-ec8f5097-8ba3-46cb-81b2-92184dc3c9c9" as="p" variant="bodySmall" tone="muted">墨迹指灰度值 ≥ 128 的像素；坐标原点为图像左上角。</Typography>
    </div>
  </ContentBlock>;
}
