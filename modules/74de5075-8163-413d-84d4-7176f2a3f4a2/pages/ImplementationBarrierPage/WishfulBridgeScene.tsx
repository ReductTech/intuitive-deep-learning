import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Button, TextInput, Typography } from "@shuku/course-style/react";

type Stage = 'idle' | 'building' | 'review' | 'adjusting';
const segments = Array.from({ length: 9 }, (_, index) => {
  const start = index / 9, end = (index + 1) / 9;
  const x0 = 5 + start * 770 + .4, x1 = 5 + end * 770 - .4;
  const y0 = 50 - 160 * start * (1 - start), y1 = 50 - 160 * end * (1 - end);
  const cx = (x0 + x1) / 2;
  const cy = y0 - 160 * (1 - 2 * start) * (end - start) / 2;
  return {
    index, center: cx,
    face: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1} L${x1} ${y1+100} Q${cx} ${cy+100} ${x0} ${y0+100}Z`,
    side: `M${x0} ${y0+100} Q${cx} ${cy+100} ${x1} ${y1+100} L${x1} ${y1+130} Q${cx} ${cy+130} ${x0} ${y0+130}Z`,
    highlight: `M${x0+3} ${y0+5} Q${cx} ${cy+5} ${x1-3} ${y1+5}`,
  };
});
const requests = [
  { request: '帮我搭一座桥', result: '初步结果', detail: '一座连接两岸的桥' },
  { request: '把这个桥改成彩虹色', result: '修订结果', detail: '桥面改为彩虹色' },
  { request: '给这个桥加一个护栏', result: '修订结果', detail: '保留配色，加上护栏' },
  { request: '给这个桥加一个桥墩', result: '修订结果', detail: '增加桥墩支撑' },
  { request: '桥墩不好，换成斜拉的', result: '修订结果', detail: '撤去桥墩，改为斜拉结构' },
] as const;

export function WishfulBridgeScene({ reducedMotion }: { reducedMotion: boolean }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [revision, setRevision] = useState(-1);
  const [completedRevision, setCompletedRevision] = useState(-1);
  const [run, setRun] = useState(0);
  const id = useId().replaceAll(':', '');
  const request = revision >= 0 ? requests[revision] : null;
  const result = completedRevision >= 0 ? requests[completedRevision] : null;
  const rainbow = revision >= 1;
  const railing = revision >= 2;
  const colors = ['#eaa5ad', '#efb48c', '#f1d58d', '#bbd49e', '#94cbbc', '#93c8de', '#a7b6e0', '#bba8d8', '#d2abd3'];
  const arcY = (x: number) => 50 - 160 * ((x - 5) / 770) * (1 - (x - 5) / 770);
  useEffect(() => {
    if (stage === 'review' || stage === 'idle') return;
    const timer = window.setTimeout(() => { setCompletedRevision(revision); setStage('review'); }, reducedMotion ? 0 : stage === 'building' ? 2000 : 1600);
    return () => window.clearTimeout(timer);
  }, [stage, revision, run, reducedMotion]);
  const busy = stage === 'building' || stage === 'adjusting';
  const finished = revision === requests.length - 1 && stage === 'review';
  const draft = busy ? '' : finished ? '' : requests[revision + 1].request;
  function sendRequest() {
    if (busy) return;
    if (finished) { setRevision(-1); setCompletedRevision(-1); setStage('idle'); }
    else { setRevision(value => value + 1); setStage(revision < 0 ? 'building' : 'adjusting'); }
    setRun(value => value + 1);
  }
  return <div className="rie-wishful-scene" data-wishful-stage={stage} data-revision={completedRevision} data-bridge-color={rainbow ? 'rainbow' : 'orange'} data-has-railing={railing} data-support={revision === 3 ? 'piers' : revision === 4 ? 'cables' : 'none'} data-capture-ready={!busy}>
    <Typography variant="h2" tone="accent" className="rie-bridge-start">提出想法</Typography>
    {request && <div className={`rie-wishful-route rie-wishful-route--${stage}`}>
      <svg viewBox="0 -100 780 340" className="rie-wishful-route-svg" role="img" aria-label={`桥的当前修改：${request.detail}`}>
        <defs>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2da"/><stop offset=".58" stopColor="#ffdb9f"/><stop offset="1" stopColor="#f5bd6d"/></linearGradient>
          <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eeb261"/><stop offset="1" stopColor="#d8943e"/></linearGradient>
        </defs>
        {(revision === 3 || revision === 4) && <g className={`rie-bridge-piers${revision === 4 ? ' is-removing' : ''}`} aria-hidden="true">
          <path d="M376 123 L376 199 L365 207 L415 207 L404 199 L404 123Z" fill="#a7bace" stroke="#7f9ab6" strokeWidth="2"/>
          <path d="M376 123 L385 123 L385 199 L376 199Z" fill="#d4dfeb"/>
          <path d="M365 207H415" stroke="#7f9ab6" strokeWidth="4" strokeLinecap="round"/>
        </g>}
        {revision === 4 && <g className="rie-bridge-cable-structure" aria-hidden="true">
          {[235, 545].map(tower => <g key={tower}>
            <path className="rie-bridge-tower" d={`M${tower-7} 130 L${tower-5} -77 Q${tower} -86 ${tower+5} -77 L${tower+7} 130Z`} fill="#dce7ef" stroke="#7f9ab6" strokeWidth="2"/>
            {[-185, -140, -95, -50, 50, 95, 140, 185].map((offset, index) => {
              const x = Math.max(10, Math.min(770, tower + offset));
              return <path key={offset} className="rie-bridge-cable" style={{ '--cable-delay': `${200 + index * 65}ms` } as CSSProperties} d={`M${tower} -73 L${x} ${arcY(x)}`} pathLength="1" stroke="#7898b5" strokeWidth="2" fill="none"/>;
            })}
          </g>)}
        </g>}
        <path d="M10 182 Q390 102 770 182" fill="none" stroke="#946933" strokeWidth="7" opacity=".08"/>
        {segments.map(segment => {
          const i = segment.index;
          return <g key={i} className="rie-wishful-segment" style={{
            '--segment-delay': `${stage === 'building' ? i*130 : i*80}ms`,
            '--rework-shift': `${(i-4)*3}px`, '--rework-turn': `${(i-4)*.65}deg`,
            transformOrigin: `${segment.center}px 100px`,
          } as CSSProperties}>
            <path d={segment.side} fill={`url(#${id}-side)`} stroke="#d49b50" strokeWidth=".7"/>
            {rainbow && <path className="rie-bridge-rainbow-side" style={{ '--color-delay': `${i * 80}ms` } as CSSProperties} d={segment.side} fill={colors[i]} stroke="#ffffff" strokeOpacity=".2" strokeWidth=".7"/>}
            <path d={segment.face} fill={`url(#${id}-face)`} stroke="#e6b77b" strokeWidth=".8"/>
            {rainbow && <path className="rie-bridge-rainbow-face" style={{ '--color-delay': `${i * 80}ms` } as CSSProperties} d={segment.face} fill={colors[i]} stroke="#ffffff" strokeOpacity=".3" strokeWidth=".8"/>}
            <path d={segment.highlight} fill="none" stroke="#fffaf0" strokeWidth="2.2" opacity=".8"/>
          </g>;
        })}
        {railing && <g className="rie-bridge-railing" aria-hidden="true">
          {Array.from({ length: 25 }, (_, i) => {
            const x = 12 + i * 31.5, y = arcY(x);
            return <path key={i} d={`M${x} ${y-2}V${y-25}`} stroke="#718da7" strokeWidth="3" strokeLinecap="round"/>;
          })}
          <path className="rie-bridge-handrail" d="M12 23 Q390 -56 768 23" pathLength="1" stroke="#607d98" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <path d="M12 25 Q390 -54 768 25" stroke="#e6eef4" strokeWidth="1.5" fill="none"/>
        </g>}
      </svg>
      <Typography as="span" variant="h2" tone="inherit" className="rie-wishful-route-label">{stage === 'adjusting' ? 'AI 按要求调整' : 'AI 推进'}</Typography>
    </div>}
    <div className="rie-wishful-work" aria-live="polite"><Typography variant="bodySmall" tone="muted">{busy ? 'AI 正在按要求修改…' : finished ? '本轮修改完成' : '等待发送'}</Typography></div>
    <div className={`rie-wishful-result${result ? ' is-visible' : ''}`} aria-live="polite" aria-atomic="true">
      <Typography variant="h2" tone="accent">{result?.result ?? ''}</Typography>
      <Typography variant="bodySmall" tone="muted">{stage === 'adjusting' ? '按新要求修改中' : result?.detail ?? ''}</Typography>
      {completedRevision > 0 && <Typography variant="bodySmall" tone="muted">第 {completedRevision + 1} 版</Typography>}
    </div>
    <Typography as="form" variant="body" className="rie-wishful-composer" aria-label="向 AI 发送要求" onSubmit={event => { event.preventDefault(); sendRequest(); }}>
      <TextInput aria-label="待发送的要求" value={draft} readOnly placeholder={busy ? '等待 AI 完成修改…' : finished ? '还可以重新演示这段对话' : ''} controlClassName="rie-wishful-draft-control" className="rie-wishful-draft"/>
      <Button type="submit" variant="primary" className="rie-wishful-send" disabled={busy}>
        {!finished && <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {finished ? '重新演示' : '发送'}
      </Button>
    </Typography>
  </div>;
}
