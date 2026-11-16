import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, RangeControl, Typography } from "@shuku/course-style/react";
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
  return <canvas shuku-edit-id="e-f8c82491-4ad6-4c30-b348-d85c702f8f34" ref={ref} width={N} height={N} role="img" aria-label={label} />;
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
    image.src = moduleAssetUrl('images/color-space-macaw.jpg');
    return () => { cancelled = true; };
  }, []);
  const filtered = useMemo(() => source.map(channel => blurChannel(channel, N, N, sigma)), [source, sigma]);
  useEffect(() => {
    if (!playing) return;
    const timers = [window.setTimeout(() => setPhase(1), 350), window.setTimeout(() => setPhase(2), 1250), window.setTimeout(() => { setPhase(3); setPlaying(false); }, 2350)];
    return () => timers.forEach(window.clearTimeout);
  }, [playing]);
  const reveal = (step: number) => ({ opacity: phase >= step ? 1 : .12 });
  return <ContentBlock shuku-edit-id="e-35a56b4b-0af0-407c-b47b-a6a9721af262" className="di-blur" title="彩色图像的模糊" subtitle="拆开 R、G、B，对每个通道做同样的模糊，再合并成彩色图像。" headingLevel={1}>
    <div shuku-edit-id="e-e03363ca-e9a3-46b2-9a21-d129029e2a79" className="di-blur__body" data-ready={source.length === 3} data-phase={phase} data-sigma={sigma}>
      <div shuku-edit-id="e-0582aa2d-a2d6-4721-a527-78a0c6cd0c50" className="di-blur__pipeline">
        <section shuku-edit-id="e-04aaf99d-b252-4880-80b0-34bd3a0d5d9b" className="di-blur__panel di-blur__split">
          <Typography shuku-edit-id="e-7dc5f42c-411a-41cd-a628-6faa36a886c3" variant="h3" tone="accent">① 拆开通道</Typography>
          <div shuku-edit-id="e-cb1f2703-e94c-4e35-b24a-a1ffe4a6e408" className="di-blur__split-images"><div shuku-edit-id="e-cf6950cf-8be8-435a-899c-fcf598eb4c3d" className="di-blur__original"><PixelCanvas data={source} label="原图 RGB" /><Typography shuku-edit-id="e-49221617-fe05-4102-9bc4-818fd36e1947" variant="body" tone="accent">原图 RGB</Typography></div>
            <div shuku-edit-id="e-bb503c32-be50-4b92-a61a-74c836da3c07" className="di-blur__channel-stack" style={reveal(1)}>{channels.map((name, c) => <div shuku-edit-id="e-1fcc9ea1-d1ac-4f86-8a3a-6e3225869706" key={name} className={'di-blur__channel di-blur__channel--' + name}><span shuku-edit-id="e-08c9a467-9588-4a9d-a8d9-b4977cd4efba" className="di-blur__badge"><Typography shuku-edit-id="e-9054fc2c-fbc1-4d93-89b2-019564474dca" variant="body" tone="inherit">{name}</Typography></span><PixelCanvas data={source[c] ? [source[c]] : []} label={name + ' 原始通道'} /></div>)}</div>
          </div>
          <Typography shuku-edit-id="e-c901fb05-49dd-41f1-99a9-2785510b1362" variant="bodySmall" tone="muted">每张灰度图，记录一个通道的强弱。</Typography>
        </section>
        <section shuku-edit-id="e-f19f8256-79fd-4eb2-877d-aed205586d1a" className="di-blur__panel di-blur__filter">
          <Typography shuku-edit-id="e-bf1131f2-4d70-4705-9af1-cd745c27d738" variant="h3" tone="accent">② 分别做同样的模糊</Typography>
          <div shuku-edit-id="e-132f8a3b-d184-4b56-a1d0-c32cfa8052ec" className="di-blur__filter-rows">{channels.map((name, c) => <div shuku-edit-id="e-4e5e2f5a-c8d9-4e29-b020-81fd2826b553" className="di-blur__filter-row" key={name}>
            <div shuku-edit-id="e-886951ee-396c-4057-bb54-fe3d23b8b1c7" className={'di-blur__channel di-blur__channel--' + name} style={reveal(1)}><span shuku-edit-id="e-98f681f0-00df-433a-8474-175346f7a7c5" className="di-blur__badge"><Typography shuku-edit-id="e-078dfb68-776d-4f53-9286-fee3ca31a891" variant="body" tone="inherit">{name}</Typography></span><PixelCanvas data={source[c] ? [source[c]] : []} label={name + ' 处理前'} /></div>
            <div shuku-edit-id="e-2902ef96-bd99-4c11-9c70-132a05c1c51d" className="di-blur__operation" style={reveal(2)}><Typography shuku-edit-id="e-e4576e26-5190-4615-b54e-d384fde66bc5" variant="body" tone="accent">→ 模糊 →</Typography></div>
            <div shuku-edit-id="e-5d0d970e-637c-40c6-9783-0b3d99bac247" className={'di-blur__channel di-blur__channel--' + name} style={reveal(2)}><PixelCanvas data={filtered[c] ? [filtered[c]] : []} label={name + ' 模糊后'} /></div>
          </div>)}</div>
          <Typography shuku-edit-id="e-6a16a1b8-f149-4e7f-b624-1b6a8198bc23" variant="bodySmall" tone="muted">同一方法、同一强度，通道之间不混合。</Typography>
        </section>
        <section shuku-edit-id="e-9d176d7e-6cb8-4e50-aee3-585bfe3e04bb" className="di-blur__panel di-blur__merge">
          <Typography shuku-edit-id="e-71fc7c43-fca2-4868-ae14-2f1523a0366f" variant="h3" tone="accent">③ 合并结果</Typography>
          <div shuku-edit-id="e-c66dc54c-134f-40ba-a111-78411c3dc8c2" className="di-blur__result" style={reveal(3)}><PixelCanvas data={filtered} label="合并后的彩色模糊结果" /><Typography shuku-edit-id="e-20279bb8-47c8-4eb5-ac72-a3554ae0d541" variant="body" tone="accent">三个通道 → RGB</Typography></div>
          <Typography shuku-edit-id="e-734343fd-8e4b-4146-8367-ac3d97525c9d" variant="bodySmall" tone="muted">把三个通道放回各自的位置。</Typography>
        </section>
      </div>
      <div shuku-edit-id="e-64e82056-0f17-4103-b993-d178a2e0f1d0" className="di-blur__controls"><RangeControl label="模糊强度" aria-label="模糊强度" min={0} max={5} step={0.25} value={sigma} digits={2} onChange={e => { setSigma(Number(e.target.value)); setPlaying(false); setPhase(3); }} /><Button variant="primary" disabled={!source.length || playing} onClick={() => { setPhase(0); setPlaying(true); }}><Typography shuku-edit-id="e-62d724df-864c-4bb1-a96c-eb16eac5a153" variant="body" tone="inherit">{playing ? '正在演示' : '演示流程'}</Typography></Button><Button onClick={() => { setPlaying(false); setPhase(3); setSigma(2.5); }}><Typography shuku-edit-id="e-f0fdf2fc-b208-4067-b073-14be29b2e894" variant="body" tone="inherit">重置</Typography></Button></div>
      <footer shuku-edit-id="e-be7f847c-acef-4f0a-b0dd-de3b9ed74e03" className="di-blur__takeaway"><Typography shuku-edit-id="e-d2433d5d-cbe0-4a5f-a586-ae8285d9f971" variant="body" tone="accent">模糊发生在每个通道内部：用周围像素的加权平均，让局部变化更平缓。</Typography><Typography shuku-edit-id="e-aa666ee2-8387-46cf-b9ed-6bc514c689fe" variant="bodySmall" tone="muted">{error ? '图片加载失败，请重新加载页面。' : '三个通道使用相同的高斯模糊；强度为 0 时保留原图。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
