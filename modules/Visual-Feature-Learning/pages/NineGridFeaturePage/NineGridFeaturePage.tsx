import { useEffect, useMemo, useState } from 'react';
import { ContentBlock } from '../../../shared/react';
import { NINE_GRID_EDGES, NINE_GRID_IMAGE_URL, nineGridCounts, nineGridRegionCells, readNineGridPixels } from '../../services/nineGridDigit';

export function NineGridFeaturePage() {
  const [pixels, setPixels] = useState<boolean[] | null>(null);
  const [region, setRegion] = useState(0);
  const [counted, setCounted] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      setPixels(readNineGridPixels(image));
    };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; };
  }, []);

  const counts = useMemo(() => pixels ? nineGridCounts(pixels) : null, [pixels]);
  const shownRegion = Math.min(region, 8);
  const cells = useMemo(() => pixels ? nineGridRegionCells(pixels, shownRegion) : [], [pixels, shownRegion]);
  const cols = NINE_GRID_EDGES[shownRegion % 3 + 1] - NINE_GRID_EDGES[shownRegion % 3];
  const rows = NINE_GRID_EDGES[Math.floor(shownRegion / 3) + 1] - NINE_GRID_EDGES[Math.floor(shownRegion / 3)];
  const quiz = region === 4 && !solved;
  const finished = region === 9;

  useEffect(() => {
    if (!counts || region >= 9 || quiz) return;
    const target = counts[region];
    const timer = window.setTimeout(() => {
      if (counted < target) {
        setCounted((value) => value + 1);
      } else {
        setRegion((value) => value + 1);
        setCounted(0);
      }
    }, counted < target ? 85 : target === 0 ? 850 : 620);
    return () => window.clearTimeout(timer);
  }, [counts, region, counted, quiz]);

  function markCell(index: number) {
    if (!counts || !quiz || marked.has(index)) return;
    const next = new Set(marked);
    next.add(index);
    setMarked(next);
    if (next.size === counts[4]) {
      setSolved(true);
      setCounted(counts[4]);
    }
  }

  function replay() {
    setRegion(0);
    setCounted(0);
    setMarked(new Set());
    setSolved(false);
  }

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="人工设计数字特征"
    subtitle="将 28 × 28 图像划分为 3 × 3 个区域，分别统计各区域的墨迹像素数。"
  >
    <div className="mx-auto mt-[24px] grid h-[548px] w-[1430px] grid-cols-[550px_850px] gap-[30px]">
      <section className="box-border h-full rounded-[24px] border border-[#d9e7f8] bg-[#f4f9ff] px-[26px] py-[19px]" aria-label="完整图像和九个区域">
        <div className="flex h-[50px] items-center gap-[14px] text-[#153964]">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#235ca9] text-[27px] font-bold text-white">1</span>
          <h2 className="m-0 text-[28px] font-bold">数字 2 的九宫格划分</h2>
        </div>
        <div className="relative mx-auto mt-[15px] h-[352px] w-[352px] overflow-hidden rounded-[12px] border-[5px] border-white bg-black shadow-[0_12px_28px_rgba(28,56,91,.14)]">
          <img className="absolute inset-0 block h-full w-full [image-rendering:pixelated]" src={NINE_GRID_IMAGE_URL} alt="真实 MNIST 手写数字 2，划分为九个区域" />
          <div className="absolute inset-0 grid grid-cols-[9fr_9fr_10fr] grid-rows-[9fr_9fr_10fr]" aria-label="按从左到右、从上到下编号的九个区域">
            {Array.from({ length: 9 }, (_, index) => <div
              key={index}
              className={`relative border border-dashed border-[#ffb472] ${index === region ? 'z-10 bg-[#fb923c]/[.12] ring-[5px] ring-inset ring-[#ff6a2a]' : index < region ? 'bg-[#60a5fa]/[.08]' : ''}`}
            >
              <span className={`absolute left-[7px] top-[7px] grid h-[36px] w-[36px] place-items-center rounded-full text-[24px] font-bold shadow-sm ${index === region ? 'bg-[#ff6a2a] text-white' : 'bg-[#e9f3ff] text-[#143b72]'}`}>{index + 1}</span>
              {counts && index < region && <span className="absolute bottom-[6px] right-[7px] rounded-[6px] bg-[#0d2d59]/90 px-[7px] py-[1px] text-[20px] font-bold text-white">{counts[index]}</span>}
            </div>)}
          </div>
        </div>
        <div className="mt-[22px] flex items-center justify-center gap-[5px]" aria-label="九格计数进度">
          {Array.from({ length: 9 }, (_, index) => <div key={index} className={`grid h-[42px] min-w-[43px] place-items-center rounded-full px-[5px] text-[20px] font-bold ${index === region ? 'bg-[#ff6a2a] text-white' : index < region ? 'bg-[#dceaff] text-[#17457b]' : 'bg-white text-[#7e95b1]'}`}>
            {counts && index < region ? counts[index] : index + 1}
          </div>)}
        </div>
      </section>

      <section className="box-border h-full rounded-[24px] border border-[#d9e7f8] bg-[#f4f9ff] px-[24px] py-[19px]" aria-label="放大的当前区域">
        <div className="flex h-[50px] items-center gap-[14px] text-[#153964]">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#235ca9] text-[27px] font-bold text-white">2</span>
          <h2 className="m-0 text-[30px] font-bold">第 {shownRegion + 1} 区域：逐像素计数</h2>
        </div>
        <div className="mt-[16px] flex items-start gap-[20px]">
          <div className="grid h-[420px] w-[420px] shrink-0 gap-[2px] rounded-[15px] border-[6px] border-[#ff6a2a] bg-[#9bb8d9] p-[2px] shadow-[0_12px_28px_rgba(28,56,91,.12)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} role="img" aria-label={`第 ${shownRegion + 1} 格放大后的像素网格`}>
            {cells.map((cell, index) => {
              const lit = cell.ink && (quiz ? marked.has(index) : cell.rank < counted || finished);
              const color = !cell.ink ? 'bg-white' : lit ? 'bg-[#fb6a29]' : 'bg-[#132944]';
              return quiz && cell.ink ? <button
                key={`${cell.x}-${cell.y}`}
                type="button"
                className={`${color} appearance-none border-0 p-0 cursor-pointer hover:brightness-125 focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[#ffb763]`}
                aria-label={`第 ${cell.y - NINE_GRID_EDGES[1] + 1} 行第 ${cell.x - NINE_GRID_EDGES[1] + 1} 列墨迹${marked.has(index) ? '，已标记' : ''}`}
                aria-pressed={marked.has(index)}
                onClick={() => markCell(index)}
              /> : <div key={`${cell.x}-${cell.y}`} className={color} aria-hidden="true" />;
            })}
          </div>
          <div className="flex h-[420px] min-w-0 flex-1 flex-col justify-center rounded-[18px] border border-[#dce7f5] bg-white px-[22px] text-[#173c70]">
            {quiz ? <>
              <div className="mb-[14px] inline-flex self-start rounded-full bg-[#fff0e8] px-[14px] py-[6px] text-[19px] font-bold text-[#cb5728]">交互计数</div>
              <h3 className="m-0 text-[29px] font-bold">请统计第 5 区域</h3>
              <p className="mb-[17px] mt-[12px] text-[21px] leading-[1.5]">依次点击深色墨迹像素；选中的像素标为橙色。全部选中后自动继续。</p>
              <div role="status" className="rounded-[16px] bg-[#eef5ff] px-[14px] py-[17px] text-center">
                <span className="block text-[19px] font-semibold">已计数</span>
                <strong className="block text-[68px] font-extrabold leading-[1.1] text-[#e7672a]">{marked.size}</strong>
                <span className="text-[19px] font-semibold">个墨迹像素</span>
              </div>
            </> : <>
              <h3 className="m-0 text-[28px] font-bold">{finished ? '九个区域统计完成' : `正在统计第 ${shownRegion + 1} 区域`}</h3>
              <div className="my-[14px] text-center text-[54px] font-extrabold leading-none text-[#e7672a]">{finished ? counts?.[8] : counted}<span className="ml-[7px] text-[23px] text-[#567399]">个</span></div>
              <p className="m-0 text-[20px] leading-[1.45]">{finished ? '各区域的墨迹像素数均已记录。' : '橙色表示已计入的墨迹像素。'}</p>
              {finished && <button type="button" onClick={replay} className="mt-[20px] h-[46px] rounded-[10px] border-2 border-[#235ca9] bg-white text-[20px] font-bold text-[#235ca9] hover:bg-[#eaf3ff]">重新播放</button>}
            </>}
          </div>
        </div>
      </section>
    </div>
    <div className="mx-auto mt-[8px] flex h-[87px] w-[1430px] items-center justify-center gap-[18px] rounded-[18px] border border-[#d9e7f8] bg-[#ebf4ff] px-[25px] text-center text-[27px] font-bold text-[#173c70]">
      <span className="text-[34px] text-[#eb6a2d]">✦</span>
      <span>{finished && counts ? `区域 1–9 的统计结果：${counts.join('、')}；数值顺序对应图像中的空间位置。` : '逐区域统计得到九项特征，保留墨迹在图像中的粗略分布。'}</span>
    </div>
  </ContentBlock>;
}
