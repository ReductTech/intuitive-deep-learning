import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, TextInput, Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import { ObservationVideo } from './ObservationVideo';
import { writeObservationRecord, freshObservationRecord, readObservationRecord, type ObservationRecord } from './observationRecord';
import './AttentionGorillaExperimentPage.css';

const posterUrl = moduleAssetUrl("observation/passing-poster.webp");
// Verified against the author's upload on 2026-11-04. The count answer starts at
// 41s, and the explicit reveal is at 45s; stop BEFORE both, then unmount the player.
const CLIP_START = 12;
const CLIP_END = 38;
const CORRECT_COUNT = 15;

export function AttentionGorillaExperimentPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const [record, setRecord] = useState<ObservationRecord>(readObservationRecord);
  const [viewing, setViewing] = useState<'first' | 'replay' | null>(null);
  const [countText, setCountText] = useState('');
  const [recallText, setRecallText] = useState('');
  const [formError, setFormError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [posterReady, setPosterReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const root = useRef<HTMLElement>(null);
  const phaseHeading = useRef<HTMLHeadingElement>(null);
  const revealed = record.phase === 'reveal' || record.phase === 'complete';

  useEffect(() => {
    writeObservationRecord(record);
  }, [record]);
  useEffect(() => {
    if (record.phase === 'complete' && !isComplete && !root.current?.closest('[aria-hidden="true"]')) onComplete();
  }, [record.phase, onComplete, isComplete]);
  useLayoutEffect(() => {
    if (root.current) root.current.inert = Boolean(root.current.closest('[aria-hidden="true"]'));
    if (record.phase !== 'intro') phaseHeading.current?.focus({ preventScroll: true });
  }, [record.phase]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let inView = true;
    const update = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setVisible(inView && !document.hidden && !hidden);
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: 0.1 });
    observer.observe(element);
    const mutation = new MutationObserver(update);
    for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) mutation.observe(parent, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); mutation.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const finishVideo = useCallback(() => {
    if (viewing === 'first') setRecord(previous => ({ ...previous, phase: 'count' }));
    setViewing(null);
    setPlaying(false);
  }, [viewing]);
  const failVideo = useCallback((message: string) => { setVideoError(message); setPlaying(false); }, []);
  const startVideo = (mode: 'first' | 'replay') => {
    setVideoError(''); setPaused(false); setPlaying(false); setHasStarted(false); setRetryKey(value => value + 1); setViewing(mode);
  };
  const submitCount = () => {
    if (!/^\d{1,2}$/.test(countText.trim())) { setFormError('请输入 0 到 99 之间的整数。'); return; }
    setFormError('');
    setRecord(previous => ({ ...previous, count: Number(countText), phase: 'recall' }));
  };
  const submitRecall = (text = recallText) => {
    const value = text.trim();
    if (!value) { setFormError('写下你的印象，或选择“没有其他印象”。'); return; }
    setFormError('');
    setRecord(previous => ({ ...previous, recall: value.slice(0, 160), phase: 'reveal' }));
  };
  const reset = () => {
    setViewing(null); setVideoError(''); setFormError(''); setCountText(''); setRecallText(''); setPaused(false);
    setRecord(freshObservationRecord());
  };
  const phaseTitle = viewing ? (viewing === 'first' ? '只数白衣队传球' : '这次，自由回看') :
    record.phase === 'count' ? '你数到了多少次？' :
    record.phase === 'recall' ? '刚才，你还看到了什么？' :
    revealed ? '你的观察记录' : '只数白衣队传球';

  return <article shuku-edit-id="e-dc813501-82b9-4591-82e1-800579c07c69" ref={root} className="attn-observation-experiment" data-observation-phase={viewing ?? record.phase} aria-label="帮小明数清传球">
    <header shuku-edit-id="e-787fbef9-23b2-44a1-82b2-45bc75a0eaae" className="attn-observation-header">
      <Typography shuku-edit-id="e-023cea4d-1904-478d-8558-ae7614a049e1" as="h1" variant="h1" tone="accent">帮小明数清传球</Typography>
      <Typography shuku-edit-id="e-b2870494-e45a-4ca1-956c-c29caa6562bc" variant="body" tone="muted">小明要把校园传球活动讲给没到场的同学。</Typography>
    </header>
    <div shuku-edit-id="e-3204dba1-f7d3-4fc1-9ab5-a8409947683b" className="attn-observation-layout">
      <section shuku-edit-id="e-76124525-e90e-4c03-a7ad-0b0ddf8a0416" className="attn-observation-task-panel" onKeyDown={event => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation();
      }}>
        <Typography shuku-edit-id="e-116c78ab-d873-4404-8e42-7255e07533a9" variant="bodySmall" tone="muted">{revealed ? '记录与回看' : '经典实验练习'}</Typography>
        <Typography shuku-edit-id="e-f4f7736f-a1c9-417a-a68b-427ce10281dc" ref={phaseHeading} as="h2" variant="h3" tone="accent" tabIndex={-1}>{phaseTitle}</Typography>
        {viewing ? <>
          <Typography shuku-edit-id="e-b81033cb-dde6-4778-af79-791a48e4a4b6" variant="bodySmall" tone="muted">{viewing === 'first' ? '黑衣队不计。' : '观察同一段录像中的其他信息。'}</Typography>
          {!videoError && <Button disabled={!playing && !paused} onClick={() => setPaused(value => !value)} data-action="pause-video">{paused ? (hasStarted ? '继续观看' : '播放视频') : '暂停'}</Button>}
          <Typography shuku-edit-id="e-0856b196-cac8-4f28-8ee7-a4143cb81496" variant="bodySmall" tone="muted">{!visible ? '页面离开视野后会暂停。' : paused ? (hasStarted ? '已暂停，按自己的节奏继续。' : '视频已就绪，点击播放。') : playing ? '正在播放作者原始演示' : videoError ? '连接恢复后可以重试。' : '正在连接原始视频…'}</Typography>
        </> : record.phase === 'intro' ? <>
          <Typography shuku-edit-id="e-4f9c1ac8-67b4-42ad-831a-b308d3f0f33d" variant="bodySmall" tone="muted">黑衣队不计。</Typography>
          <Button variant="primary" onClick={() => startVideo('first')} data-action="start-video"><Typography shuku-edit-id="e-aaeede67-3f6c-4491-ad2c-ac77c100ddc1" as="span" variant="bodySmall" tone="inherit">▶ 开始观看</Typography></Button>
        </> : record.phase === 'count' ? <>
          <TextInput label="白衣队的传球次数" value={countText} onChange={event => { setCountText(event.target.value); setFormError(''); }} inputMode="numeric" maxLength={2} autoComplete="off" className="ui-typography ui-typography--body" data-answer="pass-count" />
          <Button variant="primary" onClick={submitCount} data-action="submit-count">记录次数</Button>
        </> : record.phase === 'recall' ? <>
          <TextInput label="凭刚才的印象填写" multiline rows={3} value={recallText} onChange={event => { setRecallText(event.target.value); setFormError(''); }} maxLength={160} className="ui-typography ui-typography--bodySmall" data-answer="recall" />
          <Button variant="primary" onClick={() => submitRecall()} data-action="submit-recall">保存观察记录</Button>
          <Button onClick={() => submitRecall('没有其他印象。')} data-action="no-recall">没有其他印象</Button>
        </> : <>
          <Typography shuku-edit-id="e-a41e55e2-10d4-49c2-b138-97f19ddc5925" variant="bodySmall" tone="muted">重新看同一段录像，这次不再计数。</Typography>
          <Button variant="primary" onClick={() => startVideo('replay')} data-action="replay-video">回看原视频</Button>
          <Button onClick={() => setRecord(previous => ({ ...previous, phase: 'complete' }))} data-action="complete-observation">{record.phase === 'complete' ? '记录已交给小明' : '把记录交给小明'}</Button>
          <Button variant="default" onClick={reset} data-action="reset-observation">重新体验</Button>
        </>}
        {formError && <Typography shuku-edit-id="e-cf620ff9-05db-4e3c-8923-38b08011b081" variant="bodySmall" tone="danger" role="alert">{formError}</Typography>}
      </section>
      <section shuku-edit-id="e-5776f672-5623-4230-b7a3-372772603c49" className="attn-observation-media" aria-label="观察画面">
        <div shuku-edit-id="e-d681044c-ed35-411a-8574-5206b117fdac" className="attn-observation-media-frame">
          {viewing ? videoError ? <div shuku-edit-id="e-72f59e43-c359-4ebb-be42-62c627b49ee5" className="attn-observation-message" role="alert" data-capture-ready="true">
            <Typography shuku-edit-id="e-e3be77cd-7247-49de-b2b5-556bc6eaf7d0" variant="h3" tone="accent">视频暂时无法播放</Typography>
            <Typography shuku-edit-id="e-bae74d74-5200-4fa5-b8e7-29fc53553bac" variant="bodySmall" tone="muted">原版视频需要能连接 YouTube 的网络。</Typography>
            <Button variant="primary" onClick={() => startVideo(viewing)} data-action="retry-video">重新连接</Button>
            <Button onClick={() => { setViewing(null); setVideoError(''); }}>返回当前任务</Button>
          </div> : <ObservationVideo startSeconds={CLIP_START} endSeconds={CLIP_END} paused={paused || !visible} onPlayingChange={value => { setPlaying(value); if (value) setHasStarted(true); }} onPausedChange={setPaused} onEnded={finishVideo} onError={failVideo} retryKey={retryKey} label="经典传球实验原始演示" /> :
          record.phase === 'intro' ? <div shuku-edit-id="e-0f3fa137-0ac3-454e-bf03-c593db03204b" className="attn-observation-poster" data-capture-ready={posterReady || posterFailed} aria-busy={!posterReady && !posterFailed}>
            {posterFailed ? <div shuku-edit-id="e-be54aa59-55e1-4f92-b066-ebe297fc1711" className="attn-observation-message"><Typography shuku-edit-id="e-d0e3d609-5217-4f08-9be9-0cbd5d08c26a" variant="bodySmall" tone="muted">场景预览暂时无法加载，仍可开始观看。</Typography></div> :
              <img shuku-edit-id="e-8b49e8e9-df5e-4f91-88ca-ec477b607f39" src={posterUrl} alt="六名队员准备传球，三人穿白衣，三人穿黑衣，每队各持一个篮球。" onLoad={() => setPosterReady(true)} onError={() => setPosterFailed(true)} draggable={false} />}
          </div> : record.phase === 'count' || record.phase === 'recall' ? <div shuku-edit-id="e-05b784df-9e45-4e34-862c-eeb90dae6683" className="attn-observation-message">
            <Typography shuku-edit-id="e-ccabf2bb-6129-4fbe-8ec9-5cacc8ebddbe" variant="h2" tone="accent">{record.phase === 'count' ? '先记下你的次数' : '把你记得的内容写下来'}</Typography>
            <Typography shuku-edit-id="e-cdbf3532-0cbc-4f88-95ba-09607536d415" variant="body" tone="muted">{record.phase === 'count' ? '按印象作答，先不回放。' : '写下记得的细节。'}</Typography>
          </div> : <div shuku-edit-id="e-0357eef8-a8f3-490a-8f3f-fded374b99f6" className="attn-observation-reveal">

            <div shuku-edit-id="e-365cb587-e209-4585-8d7a-da55a4bb34d1" className="attn-observation-count-result">
              <Typography shuku-edit-id="e-b7b53d12-2785-430d-ae52-b461c68ba1b1" variant="h3" tone="accent">你的计数：{record.count} 次</Typography>
              <Typography shuku-edit-id="e-aceb7313-a7de-4307-9a8c-7fb706560103" variant="body">原视频白衣队传球：{CORRECT_COUNT} 次</Typography>
            </div>
            <div shuku-edit-id="e-82523788-1b64-4eba-a6cd-44b4506a19d7" className="attn-observation-recall-result">
              <Typography shuku-edit-id="e-49da22e1-ce21-45ce-8913-59e450b5ca59" variant="bodySmall" tone="muted">你写下的印象</Typography>
              <Typography shuku-edit-id="e-02869abe-6dd5-4a3d-b0c5-ac3c503eb472" variant="bodySmall">{record.recall}</Typography>
            </div>
            <Typography shuku-edit-id="e-dc6d37af-d65b-436d-8533-5cd08cabdb76" variant="h3" tone="accent">有人穿大猩猩服走过。</Typography>
            <Typography shuku-edit-id="e-9424da93-fcef-43ff-b7ff-f162dc69e2cd" variant="bodySmall">回看中央，你注意到了吗？</Typography>
            <Typography shuku-edit-id="e-8cc6d7df-ba91-4f39-857c-c648c44bd393" variant="bodySmall" tone="muted">专注计数，也会漏看。</Typography>
          </div>}
        </div>
        <Typography shuku-edit-id="e-22aa75bf-2879-4024-834d-306edb6f24dd" variant="bodySmall" tone="muted" className="attn-observation-source">
          {record.phase === 'intro' && !viewing ? '场景示意 · 点击播放原视频' : revealed ? <>实验来源：<a shuku-edit-id="e-8cc07248-60bd-46d8-a5b9-28e6b35f2487" href="https://theinvisiblegorilla.com/IGvideos.html" target="_blank" rel="noreferrer">Simons 与 Chabris，1999</a> · 视频由 Daniel Simons 发布</> : '作者原始演示 · Daniel Simons'}
        </Typography>
      </section>
    </div>
    <footer shuku-edit-id="e-69cfe0a4-2e5f-440c-ad38-380d23564e75" className="attn-observation-page-footer"><Typography shuku-edit-id="e-29535945-ae47-4026-9b0c-e23ca6c4cbef" variant="bodySmall" tone="muted">注意力机制 · 小明的讲解短片</Typography><Typography shuku-edit-id="e-321584f8-500b-4822-92b9-bbec3eac279b" variant="bodySmall" tone="muted">01</Typography></footer>
  </article>;
}
