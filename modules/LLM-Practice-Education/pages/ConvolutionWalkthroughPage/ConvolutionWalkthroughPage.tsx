import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl, Typography } from '../../../shared/react';
import { WormholeBenefit } from '../../components/WormholeLessonFrame';
import { IMAGE_EXAMPLES } from '../ConvolutionObservationPage/convolutionModel';
import { correlate, frameAt, INPUT_SIZE, KERNEL, OUTPUT_SIZE, patchAt, SLOW_MS, ZOOM_MS, FAST_MS } from './walkthroughModel';
import { ZoomScene, type ZoomSample } from './ZoomScene';
import outline from '../../outlines.json';
import './ConvolutionWalkthroughPage.css';

type Sample = ZoomSample;
async function loadSample(file: string): Promise<Sample> {
  const image = new Image();
  image.src = moduleAssetUrl(outline.moduleIdentity.id, `images/edge-examples/${file}`);
  await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = INPUT_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('图像读取失败');
  context.drawImage(image, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const rgba = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const gray = Array.from({ length: INPUT_SIZE ** 2 }, (_, k) => Math.round(.299 * rgba[4*k] + .587 * rgba[4*k+1] + .114 * rgba[4*k+2]));
  const responses = correlate(gray);
  let seed = 32 * OUTPUT_SIZE + 32;
  for (let y = 24; y < 80; y++) for (let x = 24; x < 88; x++) {
    const k = y * OUTPUT_SIZE + x;
    if (Math.abs(responses[k]) > Math.abs(responses[seed])) seed = k;
  }
  return { gray, responses, seed };
}
function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function ConvolutionWalkthroughPage() {
  const root = useRef<HTMLElement>(null);
  const [samples, setSamples] = useState<Sample[]>();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0), [replay, setReplay] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let cancelled = false; setFailed(false);
    Promise.all(IMAGE_EXAMPLES.map(item => loadSample(item.file))).then(items => { if (!cancelled) setSamples(items); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [retry]);
  useEffect(() => {
    if (!samples) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, last: number | undefined, time = 0, raf = 0;
    function resetClock() { last = undefined; }
    function motion() { setReduced(media.matches); resetClock(); }
    motion(); setElapsed(0);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .25; resetClock(); }, { threshold: .25 });
    if (root.current) observer.observe(root.current);
    media.addEventListener('change', motion); document.addEventListener('visibilitychange', resetClock);
    function tick(now: number) {
      if (visible && !document.hidden && !media.matches) { if (last !== undefined) time += now - last; setElapsed(time); }
      last = now; raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', resetClock); };
  }, [samples, replay]);
  const frame = frameAt(reduced ? SLOW_MS + ZOOM_MS + FAST_MS : elapsed);
  const sample = samples?.[frame.cycle % IMAGE_EXAMPLES.length];
  const localIndex = sample ? sample.seed + Math.min(4, frame.index) : 0;
  const patch = useMemo(() => sample ? patchAt(sample.gray, localIndex) : Array(9).fill(0) as number[], [sample, localIndex]);
  const result = sample?.responses[localIndex] ?? 0;
  const detailed = frame.phase === 'slow';
  return <ContentBlock ref={root} className="llmpe-walk-page" headingLevel={1} title={outline.pages[7].title}
    subtitle="逐项相乘、求和，再把同样的计算移向下一个位置" bodyClassName="llmpe-walk-body"
    data-phase={frame.phase} data-index={frame.index} data-completed={frame.completed} data-cycle={frame.cycle} data-ready={Boolean(samples)}>
    <div className="llmpe-walk-content"><section className="llmpe-walk-demo">
      <div className="llmpe-walk-heading"><Typography as="h2" variant="h2" tone="accent">从一个像素区域，到整幅图像</Typography><Button onClick={() => setReplay(v => v + 1)}>重播</Button></div>
      {!sample ? <div className="llmpe-walk-loading" role="status"><Typography variant="body" tone="muted">{failed ? '图像加载失败，请重试。' : '正在加载图像…'}</Typography>{failed && <Button onClick={() => setRetry(v => v + 1)}>重试</Button>}</div> : <ZoomScene sample={sample} frame={frame} />}
      <div className="llmpe-walk-formula"><Formula label={detailed ? (frame.summed ? `九项乘积之和等于 ${result}` : '当前图像像素与覆盖权重相乘') : '局部像素和卷积核对应相乘后求和，采用互相关约定'} latex={detailed ? (frame.summed ? String.raw`\sum(I_{\mathrm{local}}\odot K)=\color{#ed7d31}{${result}}` : String.raw`${patch[frame.term]}\times(${KERNEL[frame.term]})=${patch[frame.term] * KERNEL[frame.term]}`) : String.raw`R(r,c)=\sum_{i=0}^{2}\sum_{j=0}^{2}I(r+i,c+j)K(i,j)`} /><Typography variant="bodySmall" tone="muted">{detailed ? (frame.summed ? '相加，写入一个响应' : '像素值 × 覆盖的权重') : '互相关约定；显示时取 |R|'}</Typography></div>
    </section><aside className="llmpe-walk-sidebar"><Typography as="h2" variant="h2" tone="accent">直觉式学习</Typography><WormholeBenefit kind="light" title="先看过程">看清一个数怎样产生</WormholeBenefit><WormholeBenefit kind="book" title="再连公式">让符号对应具体操作</WormholeBenefit><WormholeBenefit kind="eye" title="逐步加速">从局部计算到整体结果</WormholeBenefit><div className="llmpe-walk-note"><Typography variant="bodySmall" tone="muted">先贴近看清一次计算，再拉远看它如何形成整幅图。</Typography></div></aside></div>
    <footer className="llmpe-walk-footer"><Typography variant="body" tone="accent" align="center">先建立直觉，再把每一步与专业定义对应起来</Typography></footer>
  </ContentBlock>;
}
