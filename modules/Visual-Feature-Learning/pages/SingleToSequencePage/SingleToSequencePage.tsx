import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ContentBlock, Question, Typography, moduleAssetUrl } from '../../../shared/react';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const DIGITS = [
  { label: '3', file: 'mnist/3/60018.png' },
  { label: '7', file: 'mnist/7/60000.png' },
  { label: '6', file: 'mnist/6/60011.png' },
  { label: '2', file: 'mnist/2/60035.png' },
  { label: '9', file: 'mnist/9/60007.png' },
] as const;

const QUESTION = '面对一张包含多个数字的长图，单数字分类器还缺少什么能力？';
const REFERENCE_ANSWER = '还需要确定每次从长图的哪个位置截取局部图像。用与分类器输入同样大小的窗口沿图像移动，才能逐次读取不同位置的数字。';

function clamp(value: number) { return Math.max(0, Math.min(DIGITS.length - 1, value)); }

export function SingleToSequencePage() {
  const stripRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [windowPosition, setWindowPosition] = useState(2.5);

  function moveWindow(event: PointerEvent<HTMLDivElement>) {
    const strip = stripRef.current;
    if (!strip) return;
    const bounds = strip.getBoundingClientRect();
    setWindowPosition(clamp((event.clientX - bounds.left) / bounds.width * DIGITS.length - 0.5));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveWindow(event);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) moveWindow(event);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setWindowPosition((current) => clamp(current + (event.key === 'ArrowRight' ? 0.2 : -0.2)));
    }
  }

  return <ContentBlock
    className="box-border h-[900px] w-[1600px] overflow-hidden bg-[#fcfdff]"
    headingLevel={1}
    title="一张图里有多个数字怎么办？"
    subtitle="单数字分类器一次只读取一个固定大小的局部图像。面对多数字长图，首先要确定读取位置。"
  >
    <div className="mx-auto mt-[22px] grid h-[519px] w-[1430px] max-w-full min-w-0 gap-[18px]" style={{ gridTemplateColumns: 'minmax(0, 1.26fr) minmax(0, .84fr)' }}>
      <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-[20px] border border-[#d3e4f7] bg-[#f8fbff] p-[24px]" aria-label="多数字长图与局部读取窗口">
        <div className="flex items-center justify-between gap-[12px]"><Typography as="h2" variant="h3" tone="accent" className="m-0">多数字长图</Typography><Typography as="span" variant="body" tone="muted">真实 MNIST 样本拼接</Typography></div>
        <div className="my-auto min-w-0">
          <div className="relative mb-[12px] h-[57px] w-full max-w-full">
            <div className="absolute bottom-0 flex w-[20%] max-w-full flex-col items-center" style={{ left: `${windowPosition * 20}%` }}>
              <Typography as="span" variant="body" tone="warning" className="whitespace-nowrap">28 × 28 输入窗口</Typography>
              <span className="mt-[7px] h-[12px] w-full border-x-[2px] border-t-[2px] border-[#ed7839]" aria-hidden="true" />
            </div>
          </div>
          <div ref={stripRef} className="relative mx-auto grid aspect-[5/1] w-full max-w-full grid-cols-5 overflow-hidden rounded-[9px] bg-black" role="group" aria-label="由真实 MNIST 数字 3、7、6、2、9 拼成的长图；橙色窗口一次只覆盖单个数字宽度">
            {DIGITS.map((digit) => <img key={digit.file} src={moduleAssetUrl(ASSET_ID, digit.file)} alt="" draggable={false} className="block aspect-square h-full w-full max-w-full select-none object-contain [image-rendering:pixelated]" />)}
            <div
              className="absolute bottom-0 top-0 z-10 w-[20%] touch-none cursor-grab border-[4px] border-dashed border-[#ff8138] bg-[#ff8a3d]/[0.10] outline-none active:cursor-grabbing focus-visible:ring-[3px] focus-visible:ring-[#286ac7]"
              style={{ left: `${windowPosition * 20}%` }}
              role="slider"
              aria-label="局部读取窗口的位置"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={Number(windowPosition.toFixed(1))}
              aria-valuetext={`从左起约第 ${(windowPosition + 1).toFixed(1)} 个数字处`}
              tabIndex={0}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => { draggingRef.current = false; }}
              onPointerCancel={() => { draggingRef.current = false; }}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="mx-auto mt-[20px] flex items-center justify-center gap-[10px] rounded-[12px] bg-[#fff0e5] px-[15px] py-[9px] text-center"><Typography as="p" variant="body" tone="warning" className="m-0">拖动窗口，比较它在不同位置看到的局部图像。</Typography></div>
        </div>
        <Typography as="p" variant="body" tone="muted" className="m-0 text-center">窗口一次只能覆盖长图中的一部分；此处尚未进行分类。</Typography>
      </section>
      <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-[20px] border border-[#d3e4f7] bg-white p-[24px]" aria-label="思考题：还缺少什么能力">
        <Typography as="p" variant="body" tone="warning" className="m-0">简答题</Typography>
        <Typography as="h2" variant="h3" tone="accent" className="mb-0 mt-[16px]">{QUESTION}</Typography>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-[11px]">从分类器能够读取的范围出发，想一想处理长图还需要哪一步。</Typography>
        <div className="mt-[24px] min-w-0 rounded-[15px] border border-[#dce7f4] bg-[#f8fbff] p-[18px]">
          <Question type="short" title={QUESTION} referenceAnswer={REFERENCE_ANSWER} rows={4} textVariant="body" className="vfl-sequence-question !border-0 !bg-transparent !p-0 [&_.dl-question-stem]:sr-only" />
        </div>
        <Typography as="p" variant="body" tone="muted" className="mb-0 mt-auto pt-[15px]">先明确“看哪里”，下一页再让窗口沿长图移动。</Typography>
      </section>
    </div>
    <div className="mx-auto mt-[16px] flex h-[70px] w-[1430px] max-w-full items-center justify-center rounded-[15px] border border-[#d6e7f9] bg-[#edf5ff] px-[26px] text-center"><Typography as="p" variant="body" tone="accent" className="m-0">单数字分类解决“窗口里是什么”；处理长图还要解决“窗口应当放在哪里”。</Typography></div>
  </ContentBlock>;
}
