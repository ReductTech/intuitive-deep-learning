import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import { nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';

const samples = [
  { label: 6, file: 'mnist/6/60011.png' },
  { label: 2, file: 'mnist/2/60035.png' },
  { label: 3, file: 'mnist/3/60018.png' },
] as const;
const assetId = '80396753-7fc8-4f55-9188-bddbdb828169';
const inputY = Array.from({ length: 9 }, (_, index) => 36 + index * 43);
const hiddenY = [52, 98, 144, 210, 276, 322, 368];
const outputY = Array.from({ length: 10 }, (_, index) => 27 + index * 39);

function NetworkDiagram() {
  return <svg viewBox="0 0 400 414" className="mx-auto block h-[310px] w-full max-w-full" role="img" aria-label="九个输入、三十二个隐藏神经元与十个输出组成的全连接网络结构示意">
    <g stroke="#a9bfdf" strokeWidth="1" opacity=".72">
      {inputY.flatMap((from, input) => hiddenY.map((to, hidden) => <line key={`i-${input}-${hidden}`} x1="46" y1={from} x2="200" y2={to} />))}
      {hiddenY.flatMap((from, hidden) => outputY.map((to, output) => <line key={`o-${hidden}-${output}`} x1="200" y1={from} x2="354" y2={to} />))}
    </g>
    {inputY.map((y, index) => <circle key={`input-${index}`} cx="46" cy={y} r="13" fill="#eaf3ff" stroke="#2769c4" strokeWidth="2.4" />)}
    {hiddenY.map((y, index) => <circle key={`hidden-${index}`} cx="200" cy={y} r="13" fill="#fff4e6" stroke="#e79026" strokeWidth="2.4" />)}
    {outputY.map((y, index) => <circle key={`output-${index}`} cx="354" cy={y} r="12" fill="#fff0f1" stroke="#df5661" strokeWidth="2.4" />)}
    <circle cx="200" cy="185" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="196" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="207" r="2.3" fill="#173a6a" />
  </svg>;
}

export function ManualFeatureClassifierPage() {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [counts, setCounts] = useState<number[] | null>(null);
  const sample = samples[sampleIndex];
  const imageUrl = moduleAssetUrl(assetId, sample.file);

  useEffect(() => {
    let active = true;
    const image = new Image();
    setCounts(null);
    image.onload = () => {
      if (!active) return;
      const pixels = readNineGridPixels(image);
      if (pixels) setCounts(nineGridCounts(pixels));
    };
    image.src = imageUrl;
    return () => { active = false; image.onload = null; };
  }, [imageUrl]);

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="基于人工特征的数字分类"
    subtitle="将九宫格统计值作为输入，由分类器学习特征与数字类别之间的关系。"
  >
    <div className="mx-auto mt-[20px] flex h-[82px] w-[1430px] max-w-full items-center justify-between gap-[18px] rounded-[18px] border border-[#cfe0f6] bg-[#f7fbff] px-[20px]">
      <Button variant="primary" disabled title="训练功能将在后续接入" className="!h-[55px] !rounded-[12px] !px-[22px]"><Typography as="span" variant="body" tone="inherit">▶ 开始训练</Typography></Button>
      <div className="flex min-w-0 items-center gap-[14px]"><span className="h-[14px] w-[14px] rounded-full bg-[#a9b8cc]" aria-hidden="true" /><Typography as="span" variant="body" tone="muted">尚未训练</Typography></div>
      <Typography as="span" variant="body" tone="muted">准确率 —</Typography>
      <Typography as="span" variant="body" tone="muted">Epoch 0 / 20</Typography>
      <Button variant="default" disabled title="训练功能将在后续接入" className="!h-[55px] !rounded-[12px] !px-[22px]"><Typography as="span" variant="body" tone="inherit">推理 →</Typography></Button>
    </div>

    <div className="mx-auto mt-[18px] grid h-[600px] w-[1430px] max-w-full gap-[16px]" style={{ gridTemplateColumns: 'minmax(0, 1.28fr) minmax(0, 1.04fr) minmax(0, .95fr)' }}>
      <section className="min-w-0 max-w-full rounded-[20px] border border-[#d5e5f8] bg-white p-[20px]" aria-label="输入图像和人工特征">
        <div className="flex items-center gap-[13px]">
          <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#2869d7] text-white"><Typography as="span" variant="body" tone="inherit">1</Typography></span>
          <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">输入与人工特征</Typography>
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[6px]">按 3 × 3 区域统计墨迹像素。</Typography>
        <div className="mt-[20px] flex min-w-0 items-center gap-[18px]">
          <div className="relative h-[270px] w-[270px] shrink-0 overflow-hidden rounded-[11px] border-[5px] border-white bg-black shadow-[0_0_0_1px_#d9e6f6]" aria-label={`真实 MNIST 数字 ${sample.label}，带九宫格划分`}>
            <img src={imageUrl} alt={`MNIST 手写数字 ${sample.label}`} className="absolute inset-0 block h-full w-full max-w-full [image-rendering:pixelated]" />
            <div className="pointer-events-none absolute inset-0 grid grid-cols-[9fr_9fr_10fr] grid-rows-[9fr_9fr_10fr]" aria-hidden="true">
              {Array.from({ length: 9 }, (_, index) => <span key={index} className="border border-dashed border-[#ff9a49]" />)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Typography as="p" variant="body" tone="accent" className="m-0 font-bold">九维特征向量</Typography>
            <div className="mt-[10px] flex items-stretch gap-[8px]">
              <span className="w-[8px] shrink-0 rounded-l-full border-y-[3px] border-l-[3px] border-[#245ba5]" aria-hidden="true" />
              <div className="grid flex-1 gap-[3px]">
                {Array.from({ length: 9 }, (_, index) => <div key={index} className="grid h-[29px] place-items-center rounded-[6px] bg-[#eaf3ff]"><Typography as="span" variant="body" tone="accent" className="font-bold">{counts?.[index] ?? '—'}</Typography></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-[16px] flex flex-nowrap items-center gap-[7px]">
          <Button variant="primary" active className="!whitespace-nowrap !rounded-[10px] !px-[10px]"><Typography as="span" variant="body" tone="inherit">示例数字</Typography></Button>
          <Button variant="default" disabled title="手写输入将在后续接入" className="!whitespace-nowrap !rounded-[10px] !px-[10px]"><Typography as="span" variant="body" tone="inherit">手写输入</Typography></Button>
          <Button variant="default" onClick={() => setSampleIndex((current) => (current + 1) % samples.length)} className="!whitespace-nowrap !rounded-[10px] !px-[10px]"><Typography as="span" variant="body" tone="inherit">换样本</Typography></Button>
        </div>
      </section>

      <section className="min-w-0 max-w-full rounded-[20px] border border-[#d5e5f8] bg-white p-[20px]" aria-label="全连接分类器结构">
        <div className="flex items-center gap-[13px]">
          <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#2869d7] text-white"><Typography as="span" variant="body" tone="inherit">2</Typography></span>
          <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">全连接分类器</Typography>
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[6px]">输入 9 项，输出 10 类。</Typography>
        <div className="mt-[9px]"><NetworkDiagram /></div>
        <div className="grid grid-cols-3 text-center">
          <Typography as="span" variant="body" tone="accent">输入 9</Typography>
          <Typography as="span" variant="body" tone="accent">隐藏 32</Typography>
          <Typography as="span" variant="body" tone="accent">输出 10</Typography>
        </div>
      </section>

      <section className="min-w-0 max-w-full rounded-[20px] border border-[#d5e5f8] bg-white p-[20px]" aria-label="分类结果占位">
        <div className="flex items-center gap-[13px]">
          <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#2869d7] text-white"><Typography as="span" variant="body" tone="inherit">3</Typography></span>
          <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">分类结果</Typography>
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[6px]">训练后显示预测概率。</Typography>
        <div className="mt-[12px] grid gap-[4px]">
          {Array.from({ length: 10 }, (_, digit) => <div key={digit} className="grid h-[27px] min-w-0 items-center gap-[10px]" style={{ gridTemplateColumns: '22px minmax(0, 1fr) 24px' }}>
            <Typography as="span" variant="body" tone="accent">{digit}</Typography>
            <span className="h-[16px] rounded-[5px] bg-[#edf2f8]" aria-hidden="true" />
            <Typography as="span" variant="body" tone="muted">—</Typography>
          </div>)}
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[8px]">分类概率待接入。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
