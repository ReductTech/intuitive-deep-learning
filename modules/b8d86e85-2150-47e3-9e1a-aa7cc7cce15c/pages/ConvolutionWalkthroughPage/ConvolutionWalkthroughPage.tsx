import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit } from '../../components/WormholeLessonFrame';
import { IMAGE_EXAMPLES } from '../ConvolutionObservationPage/convolutionModel';
import { correlate, frameAt, INPUT_SIZE, KERNELS, LOCAL_COUNT, type KernelDirection, SLOW_DURATIONS, SLOW_MS, ZOOM_MS, FAST_MS } from './walkthroughModel';
import { ZoomScene, type ZoomSample } from './ZoomScene';
import outline from '../../outlines.json';
import './ConvolutionWalkthroughPage.css';

type Sample = ZoomSample;
const nextHintKey = 'ai-practice-education:walkthrough-next-hint-dismissed:v2';
// Three local results pause individually; the fourth click pulls back and scans continuously.
const lectureStops = SLOW_DURATIONS.map((duration, index) =>
  SLOW_DURATIONS.slice(0, index).reduce((sum, value) => sum + value, 0) + duration * .82,
).concat(SLOW_MS + ZOOM_MS + FAST_MS);
async function loadSample(file: string): Promise<Sample> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = moduleAssetUrl(`images/edge-examples/${file}`);
  await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = INPUT_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('图像读取失败');
  context.drawImage(image, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const rgba = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const gray = Array.from({ length: INPUT_SIZE ** 2 }, (_, k) => Math.round(.299 * rgba[4*k] + .587 * rgba[4*k+1] + .114 * rgba[4*k+2]));
  const responses = correlate(gray);
  return { gray, responses, seed: 0 };
}
function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function ConvolutionWalkthroughPage() {
  const root = useRef<HTMLElement>(null);
  const [samples, setSamples] = useState<Sample[]>();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const clock = useRef(0);
  const [target, setTarget] = useState(0);
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<KernelDirection>('vertical');
  const [patternStart, setPatternStart] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {return localStorage.getItem(nextHintKey) === '1';} catch {return false;}
  });
  function dismissNextHint() {
    setHintDismissed(true);
    try {localStorage.setItem(nextHintKey, '1');} catch { /* Keep dismissal in memory when storage is unavailable. */ }
  }
  useEffect(() => {
    try {setHintDismissed(localStorage.getItem(nextHintKey) === '1');} catch { /* Keep the current state when storage is unavailable. */ }
  }, []);
  useEffect(() => {
    let cancelled = false; setFailed(false);
    Promise.all(IMAGE_EXAMPLES.map(item => loadSample(item.file))).then(items => { if (!cancelled) setSamples(items); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [retry]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const motion = () => setReduced(media.matches);
    motion();
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateVisibility(); }, { threshold: .1 });
    if (root.current) observer.observe(root.current);
    media.addEventListener('change', motion); document.addEventListener('visibilitychange', updateVisibility);
    return () => { observer.disconnect(); media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);
  useEffect(() => {
    if (!samples || !visible || clock.current >= target) return;
    if (reduced) {clock.current = target; setElapsed(target); return;}
    const start = clock.current;
    const started = performance.now();
    let raf = 0;
    function tick(now: number) {
      const next = Math.min(target, start + Math.max(0, now - started));
      clock.current = next; setElapsed(next);
      if (next < target) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [samples, visible, reduced, target]);
  const frame = frameAt(elapsed);
  const pattern = patternStart % IMAGE_EXAMPLES.length;
  const playing = elapsed < target;
  const original = samples?.[pattern];
  const sample = useMemo(() => original && (direction === 'vertical' ? original : { ...original, responses: correlate(original.gray, KERNELS[direction]) }), [original, direction]);
  function reset() {clock.current = 0; setElapsed(0); setTarget(0);}
  function nextStep() {
    if (!samples || playing) return;
    const next = lectureStops.find(stop => stop > clock.current);
    if (next !== undefined) setTarget(next);
    else {setPatternStart(value => (value + 1) % IMAGE_EXAMPLES.length); reset();}
  }
  function changeDirection(next: KernelDirection) {
    if (next === direction) return;
    reset(); setDirection(next);
  }
  const localIndex = sample ? sample.seed + Math.min(LOCAL_COUNT - 1, frame.index) : 0;

  const result = sample?.responses[localIndex] ?? 0;
  const detailed = frame.phase === 'slow';
  return <ContentBlock shuku-edit-id="e-c15b6945-c3c4-4b74-8382-0c8dc5f9d8eb" ref={root} className="llmpe-walk-page" headingLevel={1} title={outline.pages.find(page => page.id === 'a33e7663-d8d9-4139-bfc8-1c85ebaca9fe')!.title}
    subtitle="以边缘检测为例：从局部计算走向完整结果" bodyClassName="llmpe-walk-body"
    data-kernel={direction} data-pattern={pattern} data-phase={frame.phase} data-index={frame.index} data-completed={frame.completed} data-cycle={frame.cycle} data-ready={Boolean(samples)} data-playing={playing} data-elapsed={elapsed} data-capture-ready={Boolean(samples) && !playing}>
    <div shuku-edit-id="e-b47d199c-6562-4997-9cda-371cfc4d9df0" className="llmpe-walk-content"><section shuku-edit-id="e-f39326c9-7baa-4469-b502-75966c7ab3df" className="llmpe-walk-demo">
      <div shuku-edit-id="e-2000fe25-44c0-42bd-8873-87cc952ac070" className="llmpe-walk-heading"><Typography shuku-edit-id="e-5f1a8231-dbd8-4e13-bfd5-4539affa1c23" as="h2" variant="h2" tone="accent">左边算一次，右边得到一个值</Typography><div shuku-edit-id="e-f04ac932-1f56-4232-a558-66ca54d72ae7" className="llmpe-walk-controls" onKeyDown={event => event.stopPropagation()}>
        <Button className="llmpe-walk-next-control" variant="warn" hint={!hintDismissed} onPointerEnter={dismissNextHint} onFocus={dismissNextHint} aria-label="下一步" title={elapsed === lectureStops.at(-1) ? '下一张示例' : '下一步'} disabled={!samples || playing} onClick={event => {event.stopPropagation(); dismissNextHint(); nextStep();}}><StepForward aria-hidden="true"/><Typography shuku-edit-id="e-09adc2a0-4b0a-4168-b591-8de6a6039882" as="span" variant="bodySmall" tone="inherit">下一步</Typography></Button>
        <Button className="llmpe-walk-icon-control" aria-label="重播" title="重播" onClick={event => {event.stopPropagation(); setPatternStart(0); reset();}}><RotateCcw aria-hidden="true"/></Button>
      </div></div>
      {!sample ? <div shuku-edit-id="e-020888ed-ffd3-4d2e-8805-28f823d27b4a" className="llmpe-walk-loading" role="status"><Typography shuku-edit-id="e-8fd92272-c56c-4079-92be-9e5a614b0668" variant="body" tone="muted">{failed ? '图像加载失败，请重试。' : '正在加载图像…'}</Typography>{failed && <Button onClick={() => setRetry(v => v + 1)}>重试</Button>}</div> : <ZoomScene sample={sample} frame={frame} direction={direction} onDirectionChange={changeDirection} />}
      <div shuku-edit-id="e-1c76455e-6a10-4b23-9a41-4bb8945a1c99" className="llmpe-walk-formula"><Formula label={detailed && frame.summed ? `局部图像与卷积核的乘积之和等于 ${result}` : '局部图像和卷积核对应相乘后求和，采用互相关约定'} latex={detailed && frame.summed ? String.raw`\sum(I_{\mathrm{local}}\odot K)=\color{#ed7d31}{${result}}` : String.raw`R(r,c)=\sum_{i=0}^{2}\sum_{j=0}^{2}I(r+i,c+j)K(i,j)`} /><Typography shuku-edit-id="e-ee420387-cc9b-40f3-9102-8d6f9ab2d871" variant="bodySmall" tone="muted">{detailed ? (frame.summed ? '相加，写入一个响应' : '覆盖、相乘、相加') : '互相关约定；显示时取 |R|'}</Typography></div>
    </section><aside shuku-edit-id="e-4788d3c4-ac9b-478f-ad14-b1dfbe7d9159" className="llmpe-walk-sidebar"><Typography shuku-edit-id="e-9d7fea60-b1f4-4a72-912f-624a86085fe4" as="h2" variant="h2" tone="accent">直觉式学习</Typography><WormholeBenefit kind="light" title="先看过程">看清一个数怎样产生</WormholeBenefit><WormholeBenefit kind="book" title="再连公式">让符号对应具体操作</WormholeBenefit><WormholeBenefit kind="eye" title="逐步加速">从局部计算到整体结果</WormholeBenefit><div shuku-edit-id="e-004df71d-1750-46e3-ad93-562ff4fc4af9" className="llmpe-walk-note"><Typography shuku-edit-id="e-2b392013-70dd-42ab-aa80-0a48186a2377" variant="bodySmall" tone="muted">左边算完一个位置，右边就出现一个结果，再同步拉远。</Typography></div></aside></div>
    <footer shuku-edit-id="e-2dc87906-a22d-402c-b2ee-2f4737b4152c" className="llmpe-walk-footer"><Typography shuku-edit-id="e-a0fbc03b-389d-4c3e-bc34-1012c669cc9c" variant="body" tone="accent" align="center">先建立直觉，再把每一步与专业定义对应起来</Typography></footer>
  </ContentBlock>;
}
