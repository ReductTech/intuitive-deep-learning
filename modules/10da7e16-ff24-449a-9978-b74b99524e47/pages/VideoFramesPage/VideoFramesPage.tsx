import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import './VideoFramesPage.css';

const ASSET_ID = '10da7e16-ff24-449a-9978-b74b99524e47';
const FPS = 24, T = 121, INITIAL_FRAME = 0;
const PREVIEWS = Array.from({ length: 9 }, (_, i) => Math.round(i * T / 9));
const videoUrl = moduleAssetUrl('videos/video_1791531788070.mp4');
const frameUrl = (t: number) => moduleAssetUrl(`videos/video-frames/${String(t).padStart(3, '0')}.webp`);

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
  return <ContentBlock shuku-edit-id="e-8e6ac5c8-5eb6-41a9-ab01-8740f0593e13" className="di-video" title="视频也是图像" subtitle="把多张数字图像按时间顺序排列，就得到一段视频。" headingLevel={1}
    style={{ '--di-video-backdrop': `url("${frameUrl(60)}")` } as CSSProperties}>
    <div shuku-edit-id="e-feb9eb07-e6fb-44d0-85d5-03ee00de4708" className="di-video__body" data-ready={ready} data-frame={t} data-playing={playing}>
      <div shuku-edit-id="e-d268325b-858f-41df-a896-c0cfefe4dc89" className="di-video__sequence">
        <div shuku-edit-id="e-083587e4-e9d6-49da-a9ff-9c863b3227d3" className="di-video__fan">
          {PREVIEWS.map(frame => {
            // Circular ordering wraps at the faded outer edges, never through the hero.
            const offset = ((frame - cursor + T * 1.5) % T - T / 2) / (T / PREVIEWS.length);
            const distance = Math.abs(offset);
            if (distance > 4.2) return null;
            return <Button key={frame} className="di-video__frame" data-preview-frame={frame} aria-label={`查看第 ${frame} 帧`} onClick={() => select(frame)} tabIndex={distance < 1.3 ? -1 : 0}
              style={{ left: `${50 + offset * 10}%`, top: `${48 + distance * 1.5}%`, opacity: Math.min(1, (4.2 - distance) / 1.3), zIndex: 10 - Math.ceil(distance), filter: `blur(${Math.max(0, distance - 2.4) * .4}px)`, transform: `translate(-50%, -50%) perspective(1000px) rotateY(${Math.max(-38, Math.min(38, -offset * 12))}deg) rotateZ(${offset * .6}deg) scale(${1 - distance * .075})` }}>
              <img shuku-edit-id="e-ef823fce-8aaf-4670-afe4-dcf16b737d45" src={frameUrl(frame)} alt={`视频第 ${frame} 帧`} />
              <Typography shuku-edit-id="e-5168ef5d-5595-4c02-b292-71d76c3cef68" className="di-video__frame-label" variant="bodySmall" tone="inherit">{frame}</Typography>
            </Button>;
          })}
          <div shuku-edit-id="e-23def0b2-81e3-4f42-9928-be3ed724f177" className="di-video__hero">
            <video shuku-edit-id="e-fdb6ab8c-c7bc-484f-914e-c3696e89159b" ref={videoRef} src={videoUrl} poster={frameUrl(t)} preload="auto" autoPlay loop muted playsInline aria-label="猫咪视频"
              onLoadedMetadata={() => { const video = videoRef.current; if (video && t > 0) video.currentTime = (t + .1) / FPS; }}
              onLoadedData={() => setReady(true)} onCanPlay={() => setReady(true)}
              onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); syncFrame(); }}
              onSeeked={syncFrame} onEnded={() => { setCursor(T - 1); setPlaying(false); }} onError={() => { setError(true); setReady(false); }} />
            {(!ready || error) && <img shuku-edit-id="e-73e9ff1c-1bb1-414d-b6f5-92b8a9eafbef" className="di-video__fallback" src={frameUrl(t)} alt={`视频第 ${t} 帧`} />}
            <div shuku-edit-id="e-8ab8f166-151c-4af7-a94e-e1a319f5ad12" className="di-video__hero-label"><Typography shuku-edit-id="e-bb97c6f1-ffa9-4114-8aeb-d088492eef29" variant="bodySmall" tone="inherit">第 {t} 帧 · {(t / FPS).toFixed(2)} 秒</Typography></div>
          </div>
        </div>
        <div shuku-edit-id="e-0bc354f0-cc89-4414-aaa8-f750717e2fb2" className="di-video__axis" aria-label="从第一帧到最后一帧的时间方向">
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex="t=0" /></MathFormulaBlock>
          <svg shuku-edit-id="e-a5f85c10-bb64-448c-98e9-39baf06e5f27" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true"><circle shuku-edit-id="e-4695aa05-0506-4427-a0a6-d58fca66864f" cx="8" cy="12" r="5" fill="currentColor" /><path shuku-edit-id="e-580d0f23-0478-49b1-a4c8-cdbf868b3349" d="M8 12H980M969 5L983 12L969 19" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex="t=T-1" /></MathFormulaBlock>
        </div>
      </div>
      <div shuku-edit-id="e-400db7f7-574b-4bdb-8e8d-2ae5d44c61f5" className="di-video__timeline">
        <div shuku-edit-id="e-f606fdb7-4d25-4361-ac25-649b1b249a18" className="di-video__buttons"><Button variant="primary" disabled={!ready} onClick={play}><Typography shuku-edit-id="e-4a9f26ff-0d45-4ba3-9821-daf7f222effd" variant="body" tone="inherit">{playing ? '暂停' : t === T - 1 ? '重播' : '播放'}</Typography></Button>
          <Button onClick={() => select(0)}><Typography shuku-edit-id="e-39a4687a-ccb3-447f-8b66-6fec5e57383b" variant="bodySmall" tone="inherit">回到开头</Typography></Button>
          <Button disabled={playing} onClick={() => select((t + 1) % T)}><Typography shuku-edit-id="e-163a6ba5-b25f-4633-b792-824d7dc728a0" variant="bodySmall" tone="inherit">下一帧</Typography></Button></div>
        <RangeControl label="帧序号" aria-label="帧序号" min={0} max={T - 1} step={1} value={t} formatValue={() => `${t} / ${T - 1}`} onChange={e => select(Number(e.target.value))} />
        <Typography shuku-edit-id="e-840be256-5195-48a1-ad50-abebbb4b0e92" variant="bodySmall" tone="muted">循环播放 · 24 帧/秒</Typography>
      </div>
      <div shuku-edit-id="e-b96a3612-9c90-4379-99fc-c7f08584ec51" className="di-video__steps">
        <section shuku-edit-id="e-d1e0b65e-e61f-4796-bbff-f862058951e3"><div shuku-edit-id="e-655d8d73-8bca-44cc-85ab-5b05f6969d5e" className="di-video__step-number"><Typography shuku-edit-id="e-59dacb59-b108-4741-8813-0980c91751ad" variant="h3" tone="inherit">1</Typography></div><div shuku-edit-id="e-2b0621fb-ddf8-49ed-b720-d4f8b96919c6"><Typography shuku-edit-id="e-f6a6e1d3-37c9-4309-bcef-5d91cceb9f71" variant="h3" tone="accent">一帧是一张图像</Typography><Typography shuku-edit-id="e-be43830d-0cdc-4326-b29e-d14f083bdb51" variant="bodySmall" tone="muted">许多静态图像，按时间顺序排列。</Typography></div></section>
        <section shuku-edit-id="e-cff83172-8bb9-44f6-b323-531ef4bd49e7"><div shuku-edit-id="e-371dd113-e714-40eb-8bf9-f7f1c57e32af" className="di-video__step-number"><Typography shuku-edit-id="e-1bef7dd7-32ba-4947-b984-dc60640656ec" variant="h3" tone="inherit">2</Typography></div><div shuku-edit-id="e-ebb94466-954f-4e73-a5b8-95e74269a40d"><Typography shuku-edit-id="e-b1124b53-21de-493a-b7b2-9b367ed5b3bc" variant="h3" tone="accent">增加一个时间维度</Typography><Typography shuku-edit-id="e-447a58e8-60ea-4b27-8731-79ff8f5014d7" variant="bodySmall" tone="muted">将每帧沿时间排列。</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="H\times W\times C" /></MathFormulaBlock></div></section>
        <section shuku-edit-id="e-250327de-8fe9-4152-add8-c4c1b29f5b57"><div shuku-edit-id="e-a24361df-9e66-4d8d-ac1d-d0735c01faee" className="di-video__step-number"><Typography shuku-edit-id="e-43b6ec32-2ae0-429d-b342-9fa6d0833444" variant="h3" tone="inherit">3</Typography></div><div shuku-edit-id="e-8b2c0a79-6424-4918-9043-88615c1f6c99"><Typography shuku-edit-id="e-261ff450-e59e-4a05-ab66-b7cb9c970890" variant="h3" tone="accent">就是一个四维数组</Typography><Typography shuku-edit-id="e-9faaa329-572a-4350-9503-0f7cf92be636" variant="bodySmall" tone="muted">把解码后的所有帧按顺序堆叠：</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="T\times H\times W\times C" /></MathFormulaBlock></div></section>
      </div>
      <Typography shuku-edit-id="e-381050d9-3de2-4d0e-b4a7-58c7cdee39a2" className="di-video__status" variant="bodySmall" tone={error ? 'danger' : 'muted'} role="status">{error ? '视频播放失败；仍可点击帧图查看真实画面。请重新加载后重试。' : ready ? '真实视频与帧带循环演示；四维数组描述解码后的图像序列。' : '视频正在加载，帧图已可查看。'}</Typography>
    </div>
  </ContentBlock>;
}
