import { useEffect, useState } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import { nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';

const imageUrl = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/3/60018.png');
const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

function readFeatures(image: HTMLImageElement) {
  const ink = readNineGridPixels(image);
  if (!ink) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 28;
  canvas.height = 28;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, 28, 28);
  const data = context.getImageData(0, 0, 28, 28).data;
  const brightness = Array.from({ length: 784 }, (_, index) => (data[index * 4] + data[index * 4 + 1] + data[index * 4 + 2]) / (3 * 255));
  const response = Array.from({ length: 26 * 26 }, (_, index) => {
    const y = Math.floor(index / 26);
    const x = index % 26;
    let value = 0;
    for (let ky = 0; ky < 3; ky += 1) for (let kx = 0; kx < 3; kx += 1) {
      value += brightness[(y + ky) * 28 + x + kx] * edgeKernel[ky * 3 + kx];
    }
    return Math.max(0, value);
  });
  const pooled = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const y0 = Math.floor(row * 26 / 8);
    const y1 = Math.floor((row + 1) * 26 / 8);
    const x0 = Math.floor(col * 26 / 8);
    const x1 = Math.floor((col + 1) * 26 / 8);
    let sum = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) sum += response[y * 26 + x];
    return sum / ((y1 - y0) * (x1 - x0));
  });
  return { counts: nineGridCounts(ink), pooled };
}

function Digit() {
  return <img src={imageUrl} alt="真实 MNIST 数字 3" className="block h-[124px] w-[124px] max-w-full shrink-0 rounded-[10px] bg-black [image-rendering:pixelated]" />;
}

function NetworkDiagram() {
  const inputY = [39, 78, 117, 156, 195];
  const outputY = [39, 78, 117, 156, 195];
  return <svg viewBox="0 0 248 234" className="block h-[225px] w-[248px] max-w-full" role="img" aria-label="特征向量经过分类器映射到数字类别的结构示意，节点仅显示一部分">
    <g stroke="#b5c5da" strokeWidth="1.25" opacity=".8">{inputY.flatMap((from, a) => outputY.map((to, b) => <line key={`${a}-${b}`} x1="28" y1={from} x2="220" y2={to} />))}</g>
    {inputY.map((y, index) => <circle key={`in-${index}`} cx="28" cy={y} r="11" fill="#e8f2ff" stroke="#3975bd" strokeWidth="2" />)}
    {outputY.map((y, index) => <circle key={`out-${index}`} cx="220" cy={y} r="11" fill="#fff0e7" stroke="#ec7840" strokeWidth="2" />)}
    <g fill="#365f90"><circle cx="28" cy="220" r="2" /><circle cx="28" cy="227" r="2" /></g>
    <g fill="#ba693c"><circle cx="220" cy="220" r="2" /><circle cx="220" cy="227" r="2" /></g>
  </svg>;
}

export function TwoStageRecognitionPage() {
  const [features, setFeatures] = useState<ReturnType<typeof readFeatures>>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => { if (active) setFeatures(readFeatures(image)); };
    image.src = imageUrl;
    return () => { active = false; image.onload = null; };
  }, []);
  const maximum = Math.max(0.001, ...(features?.pooled ?? []));

  return <ContentBlock className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]" headingLevel={1} title="数字识别的两个阶段" subtitle="先从图像提取特征，再由分类器学习特征与数字类别之间的关系。">
    <div className="mx-auto mt-[21px] grid h-[548px] w-[1430px] max-w-full min-w-0 gap-[54px]" style={{ gridTemplateColumns: 'minmax(0, 1.18fr) minmax(0, .82fr)' }}>
      <section className="relative flex min-w-0 max-w-full flex-col rounded-[21px] border border-[#d2e3f7] bg-[#f8fbff] p-[22px]" aria-label="特征提取阶段">
        <div className="flex items-center gap-[14px]"><span className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-full bg-[#2d6ec6] text-white"><Typography as="span" variant="body" tone="inherit">1</Typography></span><Typography as="h2" variant="h3" tone="accent" className="m-0">特征提取</Typography></div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[5px]">规则由人设定；同一张图像可得到不同的特征。</Typography>
        <div className="mt-[17px] flex min-h-0 flex-1 flex-col gap-[14px]">
          <div className="grid min-h-0 min-w-0 flex-1 items-center gap-[16px] rounded-[15px] border border-[#e0eaf5] bg-white px-[18px]" style={{ gridTemplateColumns: 'minmax(0, 1fr) 124px 26px 160px' }}>
            <div className="min-w-0"><Typography as="p" variant="body" tone="accent" className="m-0">人工统计特征</Typography><Typography as="p" variant="body" tone="muted" className="mb-0 mt-[4px]">九宫格：记录每个区域的墨迹数量</Typography><Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[8px]">固定规则 · 9 个统计值</Typography></div>
            <Digit />
            <Typography as="span" variant="h3" tone="muted" aria-hidden="true">→</Typography>
            <div className="min-w-0"><div className="grid grid-cols-3 gap-[3px] rounded-[8px] bg-[#d8e5f4] p-[3px]">{Array.from({ length: 9 }, (_, index) => <span key={index} className="grid h-[36px] place-items-center bg-[#fff0e6]"><Typography as="span" variant="bodySmall" tone="warning">{features?.counts[index] ?? '—'}</Typography></span>)}</div><Typography as="p" variant="bodySmall" tone="accent" className="mb-0 mt-[4px] text-center">九维特征向量</Typography></div>
          </div>
          <div className="grid min-h-0 min-w-0 flex-1 items-center gap-[16px] rounded-[15px] border border-[#e0eaf5] bg-white px-[18px]" style={{ gridTemplateColumns: 'minmax(0, 1fr) 124px 26px 160px' }}>
            <div className="min-w-0"><Typography as="p" variant="body" tone="accent" className="m-0">固定卷积特征</Typography><Typography as="p" variant="body" tone="muted" className="mb-0 mt-[4px]">固定卷积核：寻找局部笔画结构</Typography><Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[8px]">固定权重 · 64 个响应值</Typography></div>
            <Digit />
            <Typography as="span" variant="h3" tone="muted" aria-hidden="true">→</Typography>
            <div className="min-w-0"><div className="grid h-[124px] w-[124px] max-w-full grid-cols-8 grid-rows-8 gap-[1px] rounded-[8px] bg-[#ffe2cc] p-[3px]">{Array.from({ length: 64 }, (_, index) => <span key={index} className="bg-white" style={{ backgroundColor: `rgba(233, 103, 35, ${((features?.pooled[index] ?? 0) / maximum).toFixed(3)})` }} />)}</div><Typography as="p" variant="bodySmall" tone="accent" className="mb-0 mt-[4px]">8×8 特征图</Typography></div>
          </div>
        </div>
        <Typography as="span" variant="h2" tone="accent" aria-hidden="true" className="absolute right-[-43px] top-[265px]">→</Typography>
      </section>
      <section className="flex min-w-0 max-w-full flex-col rounded-[21px] border border-[#d2e3f7] bg-white p-[22px]" aria-label="特征分类阶段">
        <div className="flex items-center gap-[14px]"><span className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-full bg-[#2d6ec6] text-white"><Typography as="span" variant="body" tone="inherit">2</Typography></span><Typography as="h2" variant="h3" tone="accent" className="m-0">特征分类</Typography></div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[5px]">针对提取出的特征，训练后端分类器的参数。</Typography>
        <div className="mt-[36px] flex min-w-0 items-center justify-center gap-[24px]"><NetworkDiagram /><Typography as="span" variant="h3" tone="muted" aria-hidden="true">→</Typography><div className="min-w-0 rounded-[15px] border border-[#dce8f5] bg-[#f7fbff] px-[19px] py-[22px] text-center"><Typography as="p" variant="body" tone="accent" className="m-0">类别输出</Typography><Typography as="p" variant="body" tone="accent" className="mb-0 mt-[13px]">0–9</Typography><Typography as="p" variant="bodySmall" tone="muted" className="mb-0 mt-[7px]">可另设拒识类</Typography></div></div>
        <div className="mt-auto rounded-[13px] border border-[#d7e7f8] bg-[#eaf3ff] px-[18px] py-[15px] text-center"><Typography as="p" variant="body" tone="accent" className="m-0">特征不同，输入维度也不同；分类器需分别训练。</Typography></div>
      </section>
    </div>
    <div className="mx-auto mt-[15px] flex h-[67px] w-[1430px] max-w-full items-center justify-center rounded-[15px] border border-[#d6e7f9] bg-[#edf5ff] px-[20px] text-center"><Typography as="p" variant="body" tone="accent" className="m-0">两种方案都遵循同一流程：<strong>固定规则提取特征，训练分类器完成判断。</strong></Typography></div>
  </ContentBlock>;
}
