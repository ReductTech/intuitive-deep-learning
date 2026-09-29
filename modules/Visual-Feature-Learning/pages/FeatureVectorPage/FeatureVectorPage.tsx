import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { NINE_GRID_IMAGE_URL, nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';

const orders = [
  { id: 'rows', label: '逐行读取', description: '从左到右，逐行向下', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'columns', label: '逐列读取', description: '从上到下，逐列向右', indices: [0, 3, 6, 1, 4, 7, 2, 5, 8] },
  { id: 'snake', label: '蛇形读取', description: '每行交替改变方向', indices: [0, 1, 2, 5, 4, 3, 6, 7, 8] },
  { id: 'custom', label: '自定义顺序', description: '点击图像区域，亲自规定顺序', indices: [] },
] as const;
type OrderId = (typeof orders)[number]['id'];
const roman = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ'];
const centers = [
  [16.1, 16.1], [48.2, 16.1], [82.1, 16.1],
  [16.1, 48.2], [48.2, 48.2], [82.1, 48.2],
  [16.1, 82.1], [48.2, 82.1], [82.1, 82.1],
];

export function FeatureVectorPage() {
  const [counts, setCounts] = useState<number[] | null>(null);
  const [selectedId, setSelectedId] = useState<OrderId>('rows');
  const [hoveredId, setHoveredId] = useState<OrderId | null>(null);
  const [customOrder, setCustomOrder] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const pixels = readNineGridPixels(image);
      if (pixels) setCounts(nineGridCounts(pixels));
    };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; };
  }, []);

  const displayId = hoveredId ?? selectedId;
  const displayOrder = orders.find((order) => order.id === displayId)!;
  const indices: readonly number[] = displayId === 'custom' ? customOrder : displayOrder.indices;
  const points = indices.map((region) => centers[region].join(',')).join(' ');
  const values = indices.map((region) => counts?.[region] ?? '—');

  function addCustomRegion(region: number) {
    if (selectedId !== 'custom' || hoveredId !== null) return;
    setCustomOrder((current) => current.includes(region) ? current : [...current, region]);
  }

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="特征的向量表示"
    subtitle="先规定九个区域的读取顺序，再按顺序排列统计值。"
  >
    <div className="mx-auto mt-[26px] grid h-[570px] w-[1430px] grid-cols-[310px_490px_590px] gap-[20px]">
      <section className="box-border h-full rounded-[22px] border border-[#d8e6f7] bg-[#f4f9ff] p-[22px]" aria-label="选择读取顺序">
        <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">① 读取顺序</Typography>
        <div className="mt-[19px] grid gap-[15px]">
          {orders.map((order, index) => <Button
            key={order.id}
            variant={selectedId === order.id ? 'primary' : 'default'}
            active={selectedId === order.id}
            onPointerEnter={() => setHoveredId(order.id)}
            onPointerLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(order.id)}
            onBlur={() => setHoveredId(null)}
            onClick={() => { setSelectedId(order.id); setHoveredId(null); }}
            aria-pressed={selectedId === order.id}
            className="!h-[94px] !w-full !rounded-[15px] !px-[18px] !text-left"
          >
            <span className="flex items-center gap-[13px]">
              <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-[#d7e8fa] text-[#1d4b84]">{index + 1}</span>
              <Typography as="span" variant="body" tone="inherit" className="font-bold">{order.label}</Typography>
            </span>
          </Button>)}
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[19px]">悬浮预览路径，点击固定读取方式。</Typography>
      </section>

      <section className="box-border h-full rounded-[22px] border border-[#d8e6f7] bg-[#f4f9ff] p-[22px]" aria-label="输入图像及读取路径">
        <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">② 输入：手写数字图像</Typography>
        <div className="relative mx-auto mt-[15px] h-[418px] w-[418px] overflow-hidden rounded-[12px] border-[5px] border-white bg-black shadow-[0_12px_28px_rgba(28,56,91,.14)]">
          <img className="absolute inset-0 block h-full w-full [image-rendering:pixelated]" src={NINE_GRID_IMAGE_URL} alt="与上一页完全相同的 MNIST 手写数字 2" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <defs><marker id="vfl-vector-arrow" markerWidth="4" markerHeight="4" refX="3.2" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4 Z" fill="#ff702f" /></marker></defs>
            {indices.length > 1 && <polyline points={points} fill="none" stroke="#ff702f" strokeWidth="1.2" strokeDasharray="2 1" markerEnd="url(#vfl-vector-arrow)" opacity=".95" />}
          </svg>
          <div className="absolute inset-0 grid grid-cols-[9fr_9fr_10fr] grid-rows-[9fr_9fr_10fr]" role="group" aria-label={`${displayOrder.label}的九宫格路径`}>
            {Array.from({ length: 9 }, (_, region) => {
              const position = indices.indexOf(region);
              const label = position >= 0 ? roman[position] : '';
              const common = 'relative grid place-items-center border border-dashed border-[#ffad72]';
              return displayId === 'custom' && selectedId === 'custom' && hoveredId === null
                ? <Button key={region} type="button" variant="default" onClick={() => addCustomRegion(region)} disabled={position >= 0} aria-label={`选择图像区域 ${region + 1} 作为第 ${customOrder.length + 1} 个位置`} className={`${common} !h-full !w-full !cursor-pointer !rounded-none !border-dashed !bg-transparent !p-0 [&>span]:!grid [&>span]:!place-items-center`}><Typography as="span" variant="body" tone="inherit" className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#fff6ed] font-bold text-[#bf4b1d]">{label || '＋'}</Typography></Button>
                : <div key={region} className={common} aria-label={label ? `区域 ${region + 1}：读取顺序 ${label}` : `区域 ${region + 1}：尚未选择`}><Typography as="span" variant="body" tone="inherit" className={`grid h-[48px] w-[48px] place-items-center rounded-full font-bold ${label ? 'bg-[#fff6ed] text-[#bf4b1d]' : 'bg-transparent'}`}>{label}</Typography></div>;
            })}
          </div>
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[12px] text-center">{displayId === 'custom' ? '依次点击九个区域，指定各维的来源。' : displayOrder.description}</Typography>
      </section>

      <section className="box-border h-full rounded-[22px] border border-[#d8e6f7] bg-[#f4f9ff] p-[22px]" aria-label="输出特征向量">
        <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">③ 输出：九维特征向量</Typography>
        <div className="mt-[35px] flex h-[215px] flex-col justify-center rounded-[18px] border-[3px] border-[#ff8c52] bg-[#fff8f2] px-[20px] shadow-[0_10px_25px_rgba(238,115,54,.13)]" aria-live="polite">
          <Typography as="p" variant="body" tone="muted" className="m-0">{displayOrder.label}{hoveredId ? ' · 预览' : ''}</Typography>
          <Typography as="output" variant="body" tone="warning" className="mt-[20px] block whitespace-nowrap font-bold tabular-nums">v = [{values.join(', ')}{indices.length < 9 ? `${indices.length ? ', ' : ''}…` : ''}]</Typography>
        </div>
        <div className="mt-[24px] rounded-[16px] border border-[#d7e5f7] bg-white p-[20px]">
          <Typography as="p" variant="body" tone="accent" className="m-0 font-bold">位置由顺序决定</Typography>
          <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[9px]">相同图像与计数规则下，改变读取顺序，只会改变向量分量的位置。</Typography>
        </div>
        {selectedId === 'custom' && <Button variant="default" onClick={() => setCustomOrder([])} className="!mt-[18px]"><Typography as="span" variant="body" tone="inherit">重新指定顺序</Typography></Button>}
      </section>
    </div>
    <div className="mx-auto mt-[14px] flex h-[76px] w-[1430px] items-center justify-center rounded-[18px] border border-[#d9e7f8] bg-[#ebf4ff] px-[28px] text-center">
      <Typography as="p" variant="body" tone="accent" className="m-0 font-bold">同一分类任务中，所有图像必须采用相同的读取顺序，向量的相同位置才具有相同含义。</Typography>
    </div>
  </ContentBlock>;
}
