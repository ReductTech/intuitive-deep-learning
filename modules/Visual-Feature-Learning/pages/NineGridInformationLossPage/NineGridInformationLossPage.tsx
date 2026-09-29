import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { NINE_GRID_EDGES, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_URL, nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';
import { MNIST_INK_THRESHOLD } from '../../services/mnistFeatures';

type Comparison = { original: number[]; rearranged: number[]; rearrangedUrl: string };

function rearrangeWithinRegions(image: HTMLImageElement, seed: number): Comparison | null {
  const canvas = document.createElement('canvas');
  canvas.width = NINE_GRID_IMAGE_SIZE;
  canvas.height = NINE_GRID_IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = readNineGridPixels(image);
  if (!context || !pixels) return null;
  context.drawImage(image, 0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  const source = context.getImageData(0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  const result = context.createImageData(NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  result.data.set(source.data);
  let randomState = (seed * 2654435761) >>> 0;
  const random = () => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 4294967296;
  };

  for (let region = 0; region < 9; region += 1) {
    const row = Math.floor(region / 3);
    const col = region % 3;
    const positions: number[] = [];
    for (let y = NINE_GRID_EDGES[row]; y < NINE_GRID_EDGES[row + 1]; y += 1) {
      for (let x = NINE_GRID_EDGES[col]; x < NINE_GRID_EDGES[col + 1]; x += 1) {
        positions.push(y * NINE_GRID_IMAGE_SIZE + x);
      }
    }
    const shuffled = [...positions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const partner = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[partner]] = [shuffled[partner], shuffled[index]];
    }
    positions.forEach((destination, index) => {
      const origin = shuffled[index];
      for (let channel = 0; channel < 4; channel += 1) {
        result.data[destination * 4 + channel] = source.data[origin * 4 + channel];
      }
    });
  }
  context.putImageData(result, 0, 0);
  const rearrangedPixels = Array.from({ length: NINE_GRID_IMAGE_SIZE * NINE_GRID_IMAGE_SIZE }, (_, index) => {
    const offset = index * 4;
    return (result.data[offset] + result.data[offset + 1] + result.data[offset + 2]) / 3 >= MNIST_INK_THRESHOLD;
  });
  return {
    original: nineGridCounts(pixels),
    rearranged: nineGridCounts(rearrangedPixels),
    rearrangedUrl: canvas.toDataURL('image/png'),
  };
}

function DigitPanel({ title, imageUrl, counts, caption }: { title: string; imageUrl: string; counts: number[] | null; caption: string }) {
  return <section className="min-w-0 max-w-full rounded-[20px] border border-[#d4e5f8] bg-[#f7fbff] p-[20px] text-center" aria-label={title}>
    <Typography as="h2" variant="body" tone="accent" className="m-0 font-bold">{title}</Typography>
    <div className="relative mx-auto mt-[12px] h-[318px] w-[318px] max-w-full overflow-hidden rounded-[11px] border-[4px] border-white bg-black shadow-[0_0_0_1px_#b9cee9]">
      <img src={imageUrl} alt={title} className="absolute inset-0 block h-full w-full max-w-full [image-rendering:pixelated]" />
      <div className="pointer-events-none absolute inset-0 grid grid-cols-[9fr_9fr_10fr] grid-rows-[9fr_9fr_10fr]" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <span key={index} className="relative border border-dashed border-[#ff9e52]">
          <Typography as="span" variant="body" tone="inherit" className="absolute bottom-[4px] right-[4px] grid h-[37px] min-w-[37px] place-items-center rounded-[7px] bg-[#173c70] px-[4px] text-white">{counts?.[index] ?? '—'}</Typography>
        </span>)}
      </div>
    </div>
    <div className="mx-auto mt-[14px] flex h-[58px] w-[510px] max-w-full items-center justify-center rounded-[12px] border border-[#c9def8] bg-[#eaf3ff] px-[10px]">
      <Typography as="output" variant="body" tone="accent" className="whitespace-nowrap font-bold">[{counts?.join(', ') ?? '—'}]</Typography>
    </div>
    <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[9px]">{caption}</Typography>
  </section>;
}

export function NineGridInformationLossPage() {
  const [seed, setSeed] = useState(1);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) setComparison(rearrangeWithinRegions(image, seed));
    };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; };
  }, [seed]);

  const countsEqual = comparison !== null && comparison.original.every((count, index) => count === comparison.rearranged[index]);

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="九宫格特征遗漏了什么？"
    subtitle="区域内的墨迹数量不变，像素重新排列后，九项统计值仍然相同。"
  >
    <div className="mx-auto mt-[20px] grid h-[536px] w-[1430px] max-w-full gap-[16px]" style={{ gridTemplateColumns: 'minmax(0, 1fr) 160px minmax(0, 1fr)' }}>
      <DigitPanel title="原始图像" imageUrl={NINE_GRID_IMAGE_URL} counts={comparison?.original ?? null} caption="真实 MNIST 手写数字 2" />
      <div className="flex min-w-0 flex-col items-center justify-center gap-[18px]">
        <span aria-hidden="true" className="text-[#ee7131]"><svg viewBox="0 0 120 70" className="h-[70px] w-[120px] max-w-full"><path d="M4 26h68V6l44 29-44 29V44H4z" fill="currentColor" /></svg></span>
        <Typography as="p" variant="body" tone="warning" className="m-0 text-center font-bold">仅在各区域内重排</Typography>
        <Button variant="default" onClick={() => setSeed((current) => current + 1)} className="!rounded-[11px]"><Typography as="span" variant="body" tone="inherit">再排一次</Typography></Button>
      </div>
      <DigitPanel title="区域内重排后" imageUrl={comparison?.rearrangedUrl ?? NINE_GRID_IMAGE_URL} counts={comparison?.rearranged ?? null} caption="像素位置改变，九项计数不变" />
    </div>
    <div className="mx-auto mt-[15px] flex h-[93px] w-[1430px] max-w-full flex-col items-center justify-center rounded-[17px] border border-[#ffd1b7] bg-[#fff7f1] px-[22px] text-center">
      <Typography as="p" variant="body" tone="warning" className="m-0 font-bold">{countsEqual ? '图像不同，九维向量却完全相同。' : '正在计算两张图像的九项统计值。'}</Typography>
      <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[3px]">区域计数保留了墨迹分布，却没有记录区域内部的笔画排列。</Typography>
    </div>
  </ContentBlock>;
}
