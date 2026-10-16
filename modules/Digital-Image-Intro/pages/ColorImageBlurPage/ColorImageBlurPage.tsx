import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, RangeControl, Typography, moduleAssetUrl } from '../../../shared/react';
import { blurChannel } from './blurModel';
import './ColorImageBlurPage.css';
const N = 240;
const channels = ['R', 'G', 'B'];
type Pixels = Uint8Array[];
function PixelCanvas({ data, label }: { data: Pixels; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!data.length) return;
    const ctx = ref.current!.getContext('2d')!, pixels = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      for (let c = 0; c < 3; c++) pixels.data[i * 4 + c] = data[data.length === 1 ? 0 : c][i];
      pixels.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
  }, [data]);
  return <canvas ref={ref} width={N} height={N} role="img" aria-label={label} />;
}
export function ColorImageBlurPage() {
  const [source, setSource] = useState<Pixels>([]), [sigma, setSigma] = useState(2.5);
  const [phase, setPhase] = useState(3), [playing, setPlaying] = useState(false), [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas'); canvas.width = N; canvas.height = N;
      const ctx = canvas.getContext('2d')!;
      // A centered square crop is shared by source, channels and merged output.
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, N, N);
      const rgba = ctx.getImageData(0, 0, N, N).data;
      setSource(channels.map((_, c) => Uint8Array.from({ length: N * N }, (_, i) => rgba[i * 4 + c])));
    };
    image.onerror = () => { if (!cancelled) setError(true); };
    image.src = moduleAssetUrl('10da7e16-ff24-449a-9978-b74b99524e47', 'images/color-space-macaw.png');
    return () => { cancelled = true; };
  }, []);
  const filtered = useMemo(() => source.map(channel => blurChannel(channel, N, N, sigma)), [source, sigma]);
  useEffect(() => {
    if (!playing) return;
    const timers = [window.setTimeout(() => setPhase(1), 350), window.setTimeout(() => setPhase(2), 1250), window.setTimeout(() => { setPhase(3); setPlaying(false); }, 2350)];
    return () => timers.forEach(window.clearTimeout);
  }, [playing]);
  const reveal = (step: number) => ({ opacity: phase >= step ? 1 : .12 });
  return <ContentBlock className="di-blur" title="彩色图像的模糊" subtitle="拆开 R、G、B，对每个通道做同样的模糊，再合并成彩色图像。" headingLevel={1}>
    <div className="di-blur__body" data-ready={source.length === 3} data-phase={phase} data-sigma={sigma}>
      <div className="di-blur__pipeline">
        <section className="di-blur__panel di-blur__split">
          <Typography variant="h3" tone="accent">① 拆开通道</Typography>
          <div className="di-blur__split-images"><div className="di-blur__original"><PixelCanvas data={source} label="原图 RGB" /><Typography variant="body" tone="accent">原图 RGB</Typography></div>
            <div className="di-blur__channel-stack" style={reveal(1)}>{channels.map((name, c) => <div key={name} className={'di-blur__channel di-blur__channel--' + name}><span className="di-blur__badge"><Typography variant="body" tone="inherit">{name}</Typography></span><PixelCanvas data={source[c] ? [source[c]] : []} label={name + ' 原始通道'} /></div>)}</div>
          </div>
          <Typography variant="bodySmall" tone="muted">每张灰度图，记录一个通道的强弱。</Typography>
        </section>
        <section className="di-blur__panel di-blur__filter">
          <Typography variant="h3" tone="accent">② 分别做同样的模糊</Typography>
          <div className="di-blur__filter-rows">{channels.map((name, c) => <div className="di-blur__filter-row" key={name}>
            <div className={'di-blur__channel di-blur__channel--' + name} style={reveal(1)}><span className="di-blur__badge"><Typography variant="body" tone="inherit">{name}</Typography></span><PixelCanvas data={source[c] ? [source[c]] : []} label={name + ' 处理前'} /></div>
            <div className="di-blur__operation" style={reveal(2)}><Typography variant="body" tone="accent">→ 模糊 →</Typography></div>
            <div className={'di-blur__channel di-blur__channel--' + name} style={reveal(2)}><PixelCanvas data={filtered[c] ? [filtered[c]] : []} label={name + ' 模糊后'} /></div>
          </div>)}</div>
          <Typography variant="bodySmall" tone="muted">同一方法、同一强度，通道之间不混合。</Typography>
        </section>
        <section className="di-blur__panel di-blur__merge">
          <Typography variant="h3" tone="accent">③ 合并结果</Typography>
          <div className="di-blur__result" style={reveal(3)}><PixelCanvas data={filtered} label="合并后的彩色模糊结果" /><Typography variant="body" tone="accent">三个通道 → RGB</Typography></div>
          <Typography variant="bodySmall" tone="muted">把三个通道放回各自的位置。</Typography>
        </section>
      </div>
      <div className="di-blur__controls"><RangeControl label="模糊强度" aria-label="模糊强度" min={0} max={5} step={0.25} value={sigma} digits={2} onChange={e => { setSigma(Number(e.target.value)); setPlaying(false); setPhase(3); }} /><Button variant="primary" disabled={!source.length || playing} onClick={() => { setPhase(0); setPlaying(true); }}><Typography variant="body" tone="inherit">{playing ? '正在演示' : '演示流程'}</Typography></Button><Button onClick={() => { setPlaying(false); setPhase(3); setSigma(2.5); }}><Typography variant="body" tone="inherit">重置</Typography></Button></div>
      <footer className="di-blur__takeaway"><Typography variant="body" tone="accent">模糊发生在每个通道内部：用周围像素的加权平均，让局部变化更平缓。</Typography><Typography variant="bodySmall" tone="muted">{error ? '图片加载失败，请重新加载页面。' : '三个通道使用相同的高斯模糊；强度为 0 时保留原图。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
