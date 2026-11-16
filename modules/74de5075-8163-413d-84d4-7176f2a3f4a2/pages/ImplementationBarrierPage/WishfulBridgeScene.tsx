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
  return <div shuku-edit-id="e-e88db973-cd6e-4a1f-b780-8a0dfba44010" className="rie-wishful-scene" data-wishful-stage={stage} data-revision={completedRevision} data-bridge-color={rainbow ? 'rainbow' : 'orange'} data-has-railing={railing} data-support={revision === 3 ? 'piers' : revision === 4 ? 'cables' : 'none'} data-capture-ready={!busy}>
    <Typography shuku-edit-id="e-d99c7b78-f43e-46ab-867b-bc022dc6ffff" variant="h2" tone="accent" className="rie-bridge-start">提出想法</Typography>
    {request && <div shuku-edit-id="e-7131a421-c71a-4db6-ba60-0dc18cdfde0a" className={`rie-wishful-route rie-wishful-route--${stage}`}>
      <svg shuku-edit-id="e-e078b586-f969-406d-b701-ef26937d7ae6" viewBox="0 -100 780 340" className="rie-wishful-route-svg" role="img" aria-label={`桥的当前修改：${request.detail}`}>
        <defs shuku-edit-id="e-c863dfb0-07bb-4a40-b5f4-1ca23e8f4e7b">
          <linearGradient shuku-edit-id="e-a4578bca-ee43-4c3f-8da6-0412ca159d94" id={`${id}-face`} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-44f08c60-908e-4f5a-be0a-34ccca764edb" offset="0" stopColor="#fff2da"/><stop shuku-edit-id="e-a2b549c7-00b1-432b-b9bc-e78d80393a5b" offset=".58" stopColor="#ffdb9f"/><stop shuku-edit-id="e-026b27a4-dff4-4f2b-bda3-b876652d739d" offset="1" stopColor="#f5bd6d"/></linearGradient>
          <linearGradient shuku-edit-id="e-e698785c-df25-4e9b-942a-2dec0df1e9c8" id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-6ebb721f-612a-47aa-9ae0-39e6ae305ae4" offset="0" stopColor="#eeb261"/><stop shuku-edit-id="e-811b6ff6-9f0d-4f1d-a786-5a8bc01cb5b2" offset="1" stopColor="#d8943e"/></linearGradient>
        </defs>
        {(revision === 3 || revision === 4) && <g shuku-edit-id="e-a3769303-7f58-41e5-92a5-f60311e1f802" className={`rie-bridge-piers${revision === 4 ? ' is-removing' : ''}`} aria-hidden="true">
          <path shuku-edit-id="e-4384dad6-cec1-4c19-8f1a-bda9d49ecce2" d="M376 123 L376 199 L365 207 L415 207 L404 199 L404 123Z" fill="#a7bace" stroke="#7f9ab6" strokeWidth="2"/>
          <path shuku-edit-id="e-b91aadfd-1539-4f33-b478-cf42d02dcf45" d="M376 123 L385 123 L385 199 L376 199Z" fill="#d4dfeb"/>
          <path shuku-edit-id="e-bf760e91-1eff-4b9c-9cb8-a8bf7ff0792a" d="M365 207H415" stroke="#7f9ab6" strokeWidth="4" strokeLinecap="round"/>
        </g>}
        {revision === 4 && <g shuku-edit-id="e-1d2a0c21-d912-4103-9e1e-0b4c62e0990b" className="rie-bridge-cable-structure" aria-hidden="true">
          {[235, 545].map(tower => <g shuku-edit-id="e-a6b06681-a677-4c32-96e0-0f3e4ac89765" key={tower}>
            <path shuku-edit-id="e-6f9760ba-0a38-40ae-a051-51ef33511a52" className="rie-bridge-tower" d={`M${tower-7} 130 L${tower-5} -77 Q${tower} -86 ${tower+5} -77 L${tower+7} 130Z`} fill="#dce7ef" stroke="#7f9ab6" strokeWidth="2"/>
            {[-185, -140, -95, -50, 50, 95, 140, 185].map((offset, index) => {
              const x = Math.max(10, Math.min(770, tower + offset));
              return <path shuku-edit-id="e-632b4ae8-dbd9-478a-a980-5d03559c17cf" key={offset} className="rie-bridge-cable" style={{ '--cable-delay': `${200 + index * 65}ms` } as CSSProperties} d={`M${tower} -73 L${x} ${arcY(x)}`} pathLength="1" stroke="#7898b5" strokeWidth="2" fill="none"/>;
            })}
          </g>)}
        </g>}
        <path shuku-edit-id="e-c54ce767-6887-41ed-bcda-1e712e041ee1" d="M10 182 Q390 102 770 182" fill="none" stroke="#946933" strokeWidth="7" opacity=".08"/>
        {segments.map(segment => {
          const i = segment.index;
          return <g shuku-edit-id="e-2271d8b9-a750-40a4-95f3-91d0cbf1e0fa" key={i} className="rie-wishful-segment" style={{
            '--segment-delay': `${stage === 'building' ? i*130 : i*80}ms`,
            '--rework-shift': `${(i-4)*3}px`, '--rework-turn': `${(i-4)*.65}deg`,
            transformOrigin: `${segment.center}px 100px`,
          } as CSSProperties}>
            <path shuku-edit-id="e-6325a071-2f65-486c-86ab-9fad300706d6" d={segment.side} fill={`url(#${id}-side)`} stroke="#d49b50" strokeWidth=".7"/>
            {rainbow && <path shuku-edit-id="e-450ad1a3-33a8-4060-90b2-cee0964f23a2" className="rie-bridge-rainbow-side" style={{ '--color-delay': `${i * 80}ms` } as CSSProperties} d={segment.side} fill={colors[i]} stroke="#ffffff" strokeOpacity=".2" strokeWidth=".7"/>}
            <path shuku-edit-id="e-ad24679f-8ef3-456a-baba-81c89df62cd2" d={segment.face} fill={`url(#${id}-face)`} stroke="#e6b77b" strokeWidth=".8"/>
            {rainbow && <path shuku-edit-id="e-c11af787-0436-472b-8b61-3955eb4760bc" className="rie-bridge-rainbow-face" style={{ '--color-delay': `${i * 80}ms` } as CSSProperties} d={segment.face} fill={colors[i]} stroke="#ffffff" strokeOpacity=".3" strokeWidth=".8"/>}
            <path shuku-edit-id="e-1056e70f-a1fb-467f-85b8-c9955324d280" d={segment.highlight} fill="none" stroke="#fffaf0" strokeWidth="2.2" opacity=".8"/>
          </g>;
        })}
        {railing && <g shuku-edit-id="e-cdb98cee-65af-47b1-9465-18a5c63bc140" className="rie-bridge-railing" aria-hidden="true">
          {Array.from({ length: 25 }, (_, i) => {
            const x = 12 + i * 31.5, y = arcY(x);
            return <path shuku-edit-id="e-3493a41a-a4be-48d7-a7b3-0e891f5617f2" key={i} d={`M${x} ${y-2}V${y-25}`} stroke="#718da7" strokeWidth="3" strokeLinecap="round"/>;
          })}
          <path shuku-edit-id="e-c40c30dc-9460-4137-ac90-777d868d254c" className="rie-bridge-handrail" d="M12 23 Q390 -56 768 23" pathLength="1" stroke="#607d98" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <path shuku-edit-id="e-2f77a7c2-d489-4394-9324-9caa9e341325" d="M12 25 Q390 -54 768 25" stroke="#e6eef4" strokeWidth="1.5" fill="none"/>
        </g>}
      </svg>
      <Typography shuku-edit-id="e-818201cd-6b30-4f47-b019-7cb2bd919ac4" as="span" variant="h2" tone="inherit" className="rie-wishful-route-label">{stage === 'adjusting' ? 'AI 按要求调整' : 'AI 推进'}</Typography>
    </div>}
    <div shuku-edit-id="e-36cea8fc-9ca4-4aa6-bd2e-b898248cfbb3" className="rie-wishful-work" aria-live="polite"><Typography shuku-edit-id="e-f8e77f5f-448b-4d0f-8c48-1ed92fb3fc5e" variant="bodySmall" tone="muted">{busy ? 'AI 正在按要求修改…' : finished ? '本轮修改完成' : '等待发送'}</Typography></div>
    <div shuku-edit-id="e-db9b7368-db0c-4e1c-93ec-63b450d12f56" className={`rie-wishful-result${result ? ' is-visible' : ''}`} aria-live="polite" aria-atomic="true">
      <Typography shuku-edit-id="e-9ebfbf0b-2593-4363-8545-8fe863d5f2a1" variant="h2" tone="accent">{result?.result ?? ''}</Typography>
      <Typography shuku-edit-id="e-32d6f462-f30f-4ebd-bdf4-388fa3c4e9b5" variant="bodySmall" tone="muted">{stage === 'adjusting' ? '按新要求修改中' : result?.detail ?? ''}</Typography>
      {completedRevision > 0 && <Typography shuku-edit-id="e-29e90ab9-5dd9-43ba-9be0-9e222f321465" variant="bodySmall" tone="muted">第 {completedRevision + 1} 版</Typography>}
    </div>
    <Typography shuku-edit-id="e-899fcfb9-bc02-4418-ab1b-191c0a85f6d7" as="form" variant="body" className="rie-wishful-composer" aria-label="向 AI 发送要求" onSubmit={event => { event.preventDefault(); sendRequest(); }}>
      <TextInput aria-label="待发送的要求" value={draft} readOnly placeholder={busy ? '等待 AI 完成修改…' : finished ? '还可以重新演示这段对话' : ''} controlClassName="rie-wishful-draft-control" className="rie-wishful-draft"/>
      <Button type="submit" variant="primary" className="rie-wishful-send" disabled={busy}>
        {!finished && <svg shuku-edit-id="e-f48e5459-71f3-4a16-b07e-3298643aa55d" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path shuku-edit-id="e-eae013d0-fde5-4a54-b10f-34ab0248f472" d="M12 19V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {finished ? '重新演示' : '发送'}
      </Button>
    </Typography>
  </div>;
}
