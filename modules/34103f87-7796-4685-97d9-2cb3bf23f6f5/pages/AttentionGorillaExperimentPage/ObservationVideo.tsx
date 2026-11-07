import { useEffect, useRef, useState } from 'react';

const VIDEO_ID = 'vJG698U2Mvo';
const API_URL = 'https://www.youtube.com/iframe_api';
const API_SCRIPT_ID = 'attention-observation-youtube-api';
const LOAD_TIMEOUT_MS = 20_000;
const PLAYBACK_TIMEOUT_MS = 30_000;
const MANUAL_PLAY_TIMEOUT_MS = 3_000;

type VideoSelection = { videoId: string; startSeconds: number; endSeconds: number };
type Player = {
  cueVideoById: (selection: VideoSelection) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
type PlayerEvent = { target: Player };
type PlayerDataEvent = PlayerEvent & { data: number };
type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: { events: {
      onReady: (event: PlayerEvent) => void;
      onStateChange: (event: PlayerDataEvent) => void;
      onError: (event: PlayerDataEvent) => void;
      onAutoplayBlocked: (event: PlayerEvent) => void;
    } },
  ) => Player;
};
type YouTubeWindow = Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

let apiRequest: Promise<YouTubeApi> | undefined;

/** One shared request survives StrictMode setup/cleanup; a failed request can be retried. */
function loadYouTubeApi(): Promise<YouTubeApi> {
  const youtubeWindow = window as YouTubeWindow;
  if (youtubeWindow.YT?.Player) return Promise.resolve(youtubeWindow.YT);
  if (apiRequest) return apiRequest;

  const request = new Promise<YouTubeApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="' + API_URL + '"]',
    );
    const script = existing ?? document.createElement('script');
    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    let settled = false;
    let timeout = 0;
    let poll = 0;

    const cleanListeners = () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      script.removeEventListener('error', onScriptError);
      if (youtubeWindow.onYouTubeIframeAPIReady === onReady) {
        youtubeWindow.onYouTubeIframeAPIReady = previousReady;
      }
    };
    const finish = () => {
      if (settled || !youtubeWindow.YT?.Player) return;
      settled = true;
      cleanListeners();
      resolve(youtubeWindow.YT);
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanListeners();
      // Remove only our own failed request, never another feature's script.
      if (script.id === API_SCRIPT_ID) script.remove();
      reject(new Error('视频服务暂时无法连接，请检查网络后重试。'));
    };
    function onScriptError() { fail(); }
    function onReady() {
      try { previousReady?.(); } finally { finish(); }
    }

    youtubeWindow.onYouTubeIframeAPIReady = onReady;
    script.addEventListener('error', onScriptError);
    // Poll also covers another embed replacing the global ready callback.
    poll = window.setInterval(finish, 100);
    timeout = window.setTimeout(fail, LOAD_TIMEOUT_MS);
    if (!existing) {
      script.id = API_SCRIPT_ID;
      script.src = API_URL;
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      document.head.appendChild(script);
    }
    finish();
  });
  apiRequest = request;
  void request.catch(() => { if (apiRequest === request) apiRequest = undefined; });
  return request;
}

function videoErrorMessage(code: number): string {
  if (code === 100) return '原视频暂时不可用，请稍后重试。';
  if (code === 101 || code === 150) return '原视频当前不允许嵌入播放。';
  if (code === 153) return '视频无法确认当前网页来源，请通过本地网页服务打开课程。';
  if (code === 2) return '视频播放参数无效，请重新打开本页。';
  return '视频播放失败，请检查网络后重试。';
}

export interface ObservationVideoProps {
  startSeconds: number;
  endSeconds: number;
  paused: boolean;
  label?: string;
  retryKey?: string | number;
  onEnded: () => void;
  onError: (message: string) => void;
  onPlayingChange?: (playing: boolean) => void;
  /** Sync user-visible native pauses; background/controlled pauses keep the caller's intent. */
  onPausedChange?: (paused: boolean) => void;
}

/**
 * Mount only after the learner chooses to watch. Remount (or change retryKey) to replay.
 * The caller supplies verified clip boundaries; this component never chooses an answer.
 */
export function ObservationVideo({
  startSeconds,
  endSeconds,
  paused,
  label = '传球观察视频',
  retryKey = 0,
  onEnded,
  onError,
  onPlayingChange,
  onPausedChange,
}: ObservationVideoProps) {
  const host = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const syncPlaybackRef = useRef<(() => void) | null>(null);
  const latest = useRef({ paused, label, onEnded, onError, onPlayingChange, onPausedChange });
  latest.current = { paused, label, onEnded, onError, onPlayingChange, onPausedChange };
  const [status, setStatus] = useState<'loading' | 'ready' | 'ended' | 'failed'>('loading');

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let settled = false;
    let ready = false;
    let hasPlayed = false;
    let awaitingManualPlayback = false;
    let playRequestedAt: number | null = null;
    let player: Player | null = null;
    let poll = 0;
    let readyTimeout = 0;
    let lastTime = -1;
    let lastProgressAt = performance.now();
    let resumeAfterVisibility = !latest.current.paused && document.hidden;
    let lastReportedPlaying = false;
    let frame: HTMLIFrameElement | null = null;

    setStatus('loading');
    const reportPlaying = (playing: boolean) => {
      if (disposed || lastReportedPlaying === playing) return;
      lastReportedPlaying = playing;
      latest.current.onPlayingChange?.(playing);
    };
    const stopTimers = () => {
      window.clearInterval(poll);
      window.clearTimeout(readyTimeout);
    };
    const pausePlayer = () => {
      try { player?.pauseVideo(); } catch { /* A failing/destroyed embed is handled below. */ }
    };
    const fail = (message: string) => {
      if (disposed || settled) return;
      settled = true;
      stopTimers();
      pausePlayer();
      reportPlaying(false);
      setStatus('failed');
      latest.current.onError(message);
    };
    const finish = () => {
      if (disposed || settled) return;
      settled = true;
      stopTimers();
      pausePlayer();
      reportPlaying(false);
      setStatus('ended');
      latest.current.onEnded();
    };
    const offerManualPlayback = () => {
      if (disposed || settled || awaitingManualPlayback) return;
      awaitingManualPlayback = true;
      pausePlayer();
      reportPlaying(false);
      if (latest.current.onPausedChange) latest.current.onPausedChange(true);
      else fail('浏览器需要点击后播放，请重新开始观看。');
    };
    const syncPlayback = () => {
      if (!ready || !player || disposed || settled) return;
      lastProgressAt = performance.now();
      if (latest.current.paused || document.hidden) {
        if (!latest.current.paused && document.hidden) resumeAfterVisibility = true;
        if (latest.current.paused) resumeAfterVisibility = false;
        pausePlayer();
        reportPlaying(false);
      } else {
        awaitingManualPlayback = false;
        playRequestedAt = performance.now();
        player.playVideo();
      }
    };
    syncPlaybackRef.current = syncPlayback;
    const onVisibilityChange = () => {
      if (!ready || !player || disposed || settled) return;
      if (document.hidden) {
        const playerState = player.getPlayerState();
        resumeAfterVisibility = !latest.current.paused && (playerState === 1 || playerState === 3);
        pausePlayer();
        reportPlaying(false);
      } else if (resumeAfterVisibility && !latest.current.paused) {
        // Keep this flag until PLAYING: a delayed background PAUSED event is not user intent.
        syncPlayback();
      }
      lastProgressAt = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)
      || startSeconds < 0 || endSeconds <= startSeconds) {
      fail('视频片段范围无效，请重新打开本页。');
    } else if (!/^https?:$/.test(window.location.protocol)) {
      fail('请通过本地网页服务打开课程后观看视频。');
    } else {
      void loadYouTubeApi().then(api => {
        if (disposed || settled) return;
        // Create the iframe ourselves so referrer and permissions are set BEFORE its request.
        frame = document.createElement('iframe');
        const parameters = new URLSearchParams({
          enablejsapi: '1',
          origin: window.location.origin,
          autoplay: '0',
          controls: '0',
          disablekb: '1',
          rel: '0',
          fs: '0',
          playsinline: '1',
          iv_load_policy: '3',
          start: String(Math.floor(startSeconds)),
          end: String(Math.ceil(endSeconds)),
        });
        frame.src = 'https://www.youtube.com/embed/' + VIDEO_ID + '?' + parameters.toString();
        frame.title = latest.current.label;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture';
        frame.style.cssText = 'display:block;width:100%;height:100%;max-width:100%;border:0';
        container.appendChild(frame);
        readyTimeout = window.setTimeout(
          () => fail('视频加载超时，请检查网络后重试。'), LOAD_TIMEOUT_MS,
        );
        player = new api.Player(frame, {
          events: {
            onReady: event => {
              if (disposed || settled) return;
              player = event.target;
              playerRef.current = player;
              ready = true;
              window.clearTimeout(readyTimeout);
              setStatus('ready');
              lastProgressAt = performance.now();
              // cueVideoById is asynchronous. PLAYING must be requested after CUED.
              player.cueVideoById({ videoId: VIDEO_ID, startSeconds, endSeconds });
              poll = window.setInterval(() => {
                if (!player || disposed || settled) return;
                const currentTime = player.getCurrentTime();
                if (hasPlayed && currentTime >= endSeconds) { finish(); return; }
                const playerState = player.getPlayerState();
                if (!hasPlayed && playerState === 5 && !awaitingManualPlayback
                  && !latest.current.paused && !document.hidden) {
                  if (playRequestedAt === null) syncPlayback();
                  else if (performance.now() - playRequestedAt >= MANUAL_PLAY_TIMEOUT_MS) {
                    offerManualPlayback();
                  }
                }
                if (latest.current.paused || document.hidden || awaitingManualPlayback || playerState === 2
                  || Math.abs(currentTime - lastTime) > 0.02) {
                  lastProgressAt = performance.now();
                }
                lastTime = currentTime;
                if (performance.now() - lastProgressAt > PLAYBACK_TIMEOUT_MS) {
                  fail('视频连接中断，请检查网络后重新观看。');
                }
              }, 100);
            },
            onStateChange: event => {
              if (disposed || settled) return;
              if (event.data === 0) {
                if (hasPlayed) finish();
                return;
              }
              if (event.data === 5 && ready && playRequestedAt === null) {
                syncPlayback();
                return;
              }
              if (event.data === 1 && (latest.current.paused || document.hidden)) {
                pausePlayer();
                reportPlaying(false);
                return;
              }
              if (event.data === 1) {
                hasPlayed = true;
                awaitingManualPlayback = false;
                resumeAfterVisibility = false;
                latest.current.onPausedChange?.(false);
              } else if (event.data === 2 && hasPlayed && !latest.current.paused
                && !document.hidden && !resumeAfterVisibility) {
                // Clicking the iframe can pause even with controls=0. Keep the course button usable.
                latest.current.onPausedChange?.(true);
              }
              reportPlaying(event.data === 1);
            },
            onError: event => fail(videoErrorMessage(event.data)),
            onAutoplayBlocked: () => {
              if (!latest.current.paused && !document.hidden) {
                offerManualPlayback();
              }
            },
          },
        });
        playerRef.current = player;
      }).catch(error => fail(error instanceof Error ? error.message : '视频服务暂时无法连接。'));
    }

    return () => {
      disposed = true;
      stopTimers();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (syncPlaybackRef.current === syncPlayback) syncPlaybackRef.current = null;
      if (playerRef.current === player) playerRef.current = null;
      try { player?.destroy(); } catch { /* The iframe may have already been removed. */ }
      frame?.remove();
    };
  }, [startSeconds, endSeconds, retryKey]);

  useEffect(() => { syncPlaybackRef.current?.(); }, [paused]);
  useEffect(() => {
    try { const frame = playerRef.current?.getIframe(); if (frame) frame.title = label; } catch { /* Loading. */ }
  }, [label]);

  return <div ref={host} className="attn-video-player" aria-label={label}
    aria-busy={status === 'loading'} data-capture-ready={status !== 'loading'}
    data-video-status={status} style={{ width: '100%', height: '100%', minWidth: 0, maxWidth: '100%' }} />;
}
