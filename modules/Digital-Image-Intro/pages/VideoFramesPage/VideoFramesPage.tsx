import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography, moduleAssetUrl } from '../../../shared/react';
import './VideoFramesPage.css';

const ASSET_ID = '10da7e16-ff24-449a-9978-b74b99524e47';
const FPS = 24, T = 121, INITIAL_FRAME = 0;
const PREVIEWS = Array.from({ length: 9 }, (_, i) => Math.round(i * T / 9));
const videoUrl = moduleAssetUrl(ASSET_ID, 'videos/video_1791531788070.mp4');
const frameUrl = (t: number) => moduleAssetUrl(ASSET_ID, `videos/video-frames/${String(t).padStart(3, '0')}.jpg`);

export function VideoFramesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Keep fractional video time so the surrounding frames move smoothly between frames.
  const [cursor, setCursor] = useState(INITIAL_FRAME);
  const t = Math.min(T - 1, Math.floor(cursor + .001));
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const syncFrame = () => {
    const video = videoRef.current;
    if (video) setCursor(Math.min(T - .001, video.currentTime * FPS));
  };
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => { syncFrame(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const select = (frame: number) => {
    const video = videoRef.current;
    video?.pause();
    setPlaying(false);
    setCursor(frame);
    if (video && video.readyState >= 1) video.currentTime = (frame + .1) / FPS;
  };
  const play = async () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    if (!video.paused) { video.pause(); return; }
    if (t === T - 1 || video.ended) video.currentTime = 0;
    try { await video.play(); setError(false); } catch { setError(true); }
  };
  return <ContentBlock className="di-video" title="视频也是图像" subtitle="把多张数字图像按时间顺序排列，就得到一段视频。" headingLevel={1}
    style={{ '--di-video-backdrop': `url("${frameUrl(60)}")` } as CSSProperties}>
    <div className="di-video__body" data-ready={ready} data-frame={t} data-playing={playing}>
      <div className="di-video__sequence">
        <div className="di-video__fan">
          {PREVIEWS.map(frame => {
            // Circular ordering wraps at the faded outer edges, never through the hero.
            const offset = ((frame - cursor + T * 1.5) % T - T / 2) / (T / PREVIEWS.length);
            const distance = Math.abs(offset);
            if (distance > 4.2) return null;
            return <Button key={frame} className="di-video__frame" data-preview-frame={frame} aria-label={`查看第 ${frame} 帧`} onClick={() => select(frame)} tabIndex={distance < 1.3 ? -1 : 0}
              style={{ left: `${50 + offset * 10}%`, top: `${48 + distance * 1.5}%`, opacity: Math.min(1, (4.2 - distance) / 1.3), zIndex: 10 - Math.ceil(distance), filter: `blur(${Math.max(0, distance - 2.4) * .4}px)`, transform: `translate(-50%, -50%) perspective(1000px) rotateY(${Math.max(-38, Math.min(38, -offset * 12))}deg) rotateZ(${offset * .6}deg) scale(${1 - distance * .075})` }}>
              <img src={frameUrl(frame)} alt={`视频第 ${frame} 帧`} />
              <Typography className="di-video__frame-label" variant="bodySmall" tone="inherit">{frame}</Typography>
            </Button>;
          })}
          <div className="di-video__hero">
            <video ref={videoRef} src={videoUrl} poster={frameUrl(t)} preload="auto" autoPlay loop muted playsInline aria-label="猫咪视频"
              onLoadedMetadata={() => { const video = videoRef.current; if (video && t > 0) video.currentTime = (t + .1) / FPS; }}
              onLoadedData={() => setReady(true)} onCanPlay={() => setReady(true)}
              onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); syncFrame(); }}
              onSeeked={syncFrame} onEnded={() => { setCursor(T - 1); setPlaying(false); }} onError={() => { setError(true); setReady(false); }} />
            {(!ready || error) && <img className="di-video__fallback" src={frameUrl(t)} alt={`视频第 ${t} 帧`} />}
            <div className="di-video__hero-label"><Typography variant="bodySmall" tone="inherit">第 {t} 帧 · {(t / FPS).toFixed(2)} 秒</Typography></div>
          </div>
        </div>
        <div className="di-video__axis" aria-label="从第一帧到最后一帧的时间方向">
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex="t=0" /></MathFormulaBlock>
          <svg viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true"><circle cx="8" cy="12" r="5" fill="currentColor" /><path d="M8 12H980M969 5L983 12L969 19" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex="t=T-1" /></MathFormulaBlock>
        </div>
      </div>
      <div className="di-video__timeline">
        <div className="di-video__buttons"><Button variant="primary" disabled={!ready} onClick={play}><Typography variant="body" tone="inherit">{playing ? '暂停' : t === T - 1 ? '重播' : '播放'}</Typography></Button>
          <Button onClick={() => select(0)}><Typography variant="bodySmall" tone="inherit">回到开头</Typography></Button>
          <Button disabled={playing} onClick={() => select((t + 1) % T)}><Typography variant="bodySmall" tone="inherit">下一帧</Typography></Button></div>
        <RangeControl label="帧序号" aria-label="帧序号" min={0} max={T - 1} step={1} value={t} formatValue={() => `${t} / ${T - 1}`} onChange={e => select(Number(e.target.value))} />
        <Typography variant="bodySmall" tone="muted">循环播放 · 24 帧/秒</Typography>
      </div>
      <div className="di-video__steps">
        <section><div className="di-video__step-number"><Typography variant="h3" tone="inherit">1</Typography></div><div><Typography variant="h3" tone="accent">一帧是一张图像</Typography><Typography variant="bodySmall" tone="muted">许多静态图像，按时间顺序排列。</Typography></div></section>
        <section><div className="di-video__step-number"><Typography variant="h3" tone="inherit">2</Typography></div><div><Typography variant="h3" tone="accent">增加一个时间维度</Typography><Typography variant="bodySmall" tone="muted">将每帧沿时间排列。</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="H\times W\times C" /></MathFormulaBlock></div></section>
        <section><div className="di-video__step-number"><Typography variant="h3" tone="inherit">3</Typography></div><div><Typography variant="h3" tone="accent">就是一个四维数组</Typography><Typography variant="bodySmall" tone="muted">把解码后的所有帧按顺序堆叠：</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="T\times H\times W\times C" /></MathFormulaBlock></div></section>
      </div>
      <Typography className="di-video__status" variant="bodySmall" tone={error ? 'danger' : 'muted'} role="status">{error ? '视频播放失败；仍可点击帧图查看真实画面。请重新加载后重试。' : ready ? '真实视频与帧带循环演示；四维数组描述解码后的图像序列。' : '视频正在加载，帧图已可查看。'}</Typography>
    </div>
  </ContentBlock>;
}
