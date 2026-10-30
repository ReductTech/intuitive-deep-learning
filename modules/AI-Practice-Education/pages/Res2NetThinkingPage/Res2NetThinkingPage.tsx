import { useId, useState, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './Res2NetThinkingPage.css';

const blue = '#426d9e', teal = '#218f92', orange = '#e78a46', grey = '#c5cfdb';
function Text({ x, y, width = 160, children, muted = false }: { x: number; y: number; width?: number; children: ReactNode; muted?: boolean }) {
  return <foreignObject x={x - width / 2} y={y} width={width} height="44"><Typography as="div" variant="bodySmall" tone={muted ? 'muted' : 'accent'} align="center">{children}</Typography></foreignObject>;
}
const stages = [
  { name: '拆成小组', heading: '把一个大卷积，拆成几个小卷积', explanation: '空间仍是3×3；原来覆盖全部通道，现在每次只处理一组通道。第一组直接保留输入。', next: '看看小组怎样接力 →' },
  { name: '逐组接力', heading: '后一组，不再从零开始', explanation: '第3组把“自己的输入”和“第2组的结果”相加，再做卷积：既保留短路径，也接入更长的路径。', next: '把各组结果合起来 →' },
  { name: '保留并合并', heading: '不同长短的路径，在同一个模块里汇合', explanation: '第一组保留原信息，后面的组逐步结合更大范围；各组拼接后，再用1×1卷积融合。', next: '重新看一遍' },
];

export function Res2NetThinkingPage() {
  const id = useId().replaceAll(':', '');
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(2);
  const current = stages[stage];
  const xs = [110, 280, 450, 620];
  const selectedGroup = stage === 1 ? 2 : selected;
  function advance() { setStage((stage + 1) % 3); setSelected(stage === 1 ? 3 : 2); }
  const marker = (color: string) => `url(#${id}-${color})`;
  const highlighted = (i: number) => stage === 0 ? i > 0 : stage === 1 ? i === 1 || i === 2 : i > 0 && i <= selectedGroup;
  return <ContentBlock className="aipe-r2-page" headingLevel={1} title={outline.pages[26].title} subtitle="只改残差块内部：拆成小组，逐组接力，再把结果合起来" bodyClassName="aipe-r2-body">
    <div className="aipe-r2-comparison">
      <section className="aipe-r2-before">
        <Typography as="h2" variant="h3" tone="accent" align="center">原来的残差块</Typography>
        <svg viewBox="0 0 360 500" role="img" aria-label="普通瓶颈残差块：1乘1卷积、覆盖全部通道的3乘3卷积、1乘1卷积，外部保留捷径">
          <defs><marker id={`${id}-before`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill={blue}/></marker></defs>
          <path d="M160 8V49M160 99V193M160 257V354M160 404V451M160 483V498" fill="none" stroke={blue} strokeWidth="3" markerEnd={`url(#${id}-before)`}/>
          <path d="M160 18H334V467H180" fill="none" stroke={grey} strokeWidth="3" markerEnd={`url(#${id}-before)`}/>
          <rect x="40" y="49" width="240" height="50" rx="6" fill="#f4f7fb" stroke="#bccbdb"/><Text x={160} y={53}>1 × 1</Text>
          <rect x="40" y="193" width="240" height="64" rx="7" fill="#e5effb" stroke={blue} strokeWidth="2"/><Text x={160} y={202}>3 × 3</Text>
          <Text x={160} y={265} width={300}>覆盖全部通道</Text>
          <rect x="40" y="354" width="240" height="50" rx="6" fill="#f4f7fb" stroke="#bccbdb"/><Text x={160} y={358}>1 × 1</Text>
          <circle cx="160" cy="467" r="17" fill="white" stroke={blue} strokeWidth="2"/><path d="M153 467H167M160 460V474" stroke={blue} strokeWidth="2"/>
        </svg>
        <Typography as="p" variant="bodySmall" tone="muted" align="center">一次让整组通道共同计算</Typography>
      </section>
      <div className="aipe-r2-transform" aria-hidden="true">→</div>
      <section className="aipe-r2-after">
        <Typography as="h2" variant="h3" tone="accent" align="center">Res2Net：小组接力，组合多尺度</Typography>
        <svg viewBox="0 0 800 550" aria-label="Res2Net保留上下1乘1卷积和外部捷径；中间按通道分组，小组卷积处理后逐组传递，各组输出最终拼接">
          <defs>{[['blue', blue], ['teal', teal], ['grey', grey], ['orange', orange]].map(([key, color]) => <marker key={key} id={`${id}-${key}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill={color}/></marker>)}</defs>
          <path d="M365 5V25M365 452V474M365 516V526M365 550V554" stroke={blue} strokeWidth="2" fill="none"/>
          <path d="M365 12H774V538H380" stroke={grey} strokeWidth="2.5" fill="none" markerEnd={marker('grey')}/>
          <rect x="45" y="25" width="640" height="42" rx="6" fill="#f4f7fb" stroke="#bccbdb"/><Text x={365} y={26}>1 × 1</Text>
          <rect x="25" y="86" width="680" height="44" rx="5" fill="#ecf3fc" stroke={stage === 0 ? blue : '#cbd8e7'} strokeWidth={stage === 0 ? 2.5 : 1}/>
          {xs.map((x, i) => <g key={x}>
            {i > 0 && <path d={`M${x - 85} 86V130`} stroke="#cad8e6"/>}
            <Text x={x} y={88} width={150}>第{i + 1}组</Text>
            <path d={`M${x} 130V${i === 0 ? 344 : i === 1 ? 211 : 177}`} stroke={highlighted(i) ? i === selectedGroup && stage >= 1 ? orange : teal : grey} strokeWidth={highlighted(i) ? 3 : 2} markerEnd={marker(highlighted(i) ? i === selectedGroup && stage >= 1 ? 'orange' : 'teal' : 'grey')}/>
            {i >= 2 && <><circle cx={x} cy="192" r="15" fill="white" stroke={stage > 0 ? teal : '#d7e0e9'} strokeWidth="2"/><path d={`M${x - 6} 192H${x + 6}M${x} 186V198M${x} 207V211`} stroke={stage > 0 ? teal : '#d7e0e9'} strokeWidth="2"/></>}
            {i > 0 && <><rect x={x - 55} y="211" width="110" height="56" rx="7" fill={highlighted(i) ? '#e0f2f0' : '#f6f8fb'} stroke={highlighted(i) ? teal : grey} strokeWidth="2"/><Text x={x} y={217} width={130}>3 × 3</Text><path d={`M${x} 267V344`} stroke={highlighted(i) ? teal : grey} strokeWidth={highlighted(i) ? 3 : 2} markerEnd={marker(highlighted(i) ? 'teal' : 'grey')}/></>}
            <foreignObject x={x - 65} y="344" width="130" height="48">{stage === 2 ? <Button className="aipe-r2-output" active={selectedGroup === i} aria-pressed={selectedGroup === i} aria-label={`观察第${i + 1}组路径`} onPointerEnter={() => setSelected(i)} onFocus={() => setSelected(i)} onClick={() => setSelected(i)}><Typography as="span" variant="bodySmall" tone="inherit">{i === 0 ? '直接保留' : `第${i + 1}组结果`}</Typography></Button> : <Typography as="div" variant="bodySmall" align="center" tone={i === selectedGroup && stage === 1 ? 'accent' : 'muted'}>{i === 0 ? '直接保留' : `第${i + 1}组结果`}</Typography>}</foreignObject>
            <path d={`M${x} 392V414`} stroke={stage === 2 ? teal : grey} strokeWidth="2" markerEnd={marker(stage === 2 ? 'teal' : 'grey')}/>
          </g>)}
          {stage > 0 && [0, 1].map(i => <path key={i} className={stage === 1 && i === 0 ? 'aipe-r2-new-link' : undefined} d={`M${xs[i + 1]} 298H${xs[i + 1] + 82}V192H${xs[i + 2] - 17}`} fill="none" stroke={stage === 1 && i === 0 ? orange : stage === 1 ? '#c5dadb' : teal} strokeWidth={stage === 1 && i === 0 ? 5 : 3} markerEnd={marker(stage === 1 && i === 0 ? 'orange' : 'teal')}/>)}
          <rect x="25" y="414" width="680" height="38" rx="5" fill={stage === 2 ? '#daf1ee' : '#f4f7fb'} stroke={stage === 2 ? teal : '#cbd8e7'} strokeWidth={stage === 2 ? 2.5 : 1}/><Text x={365} y={410} width={620}>各组结果保留，再拼接</Text>
          <circle cx="365" cy="538" r="12" fill="white" stroke={blue} strokeWidth="2"/><path d="M359 538H371M365 532V544" stroke={blue} strokeWidth="2"/>
          <rect x="245" y="474" width="240" height="42" rx="4" fill="#f4f7fb" stroke="#bccbdb"/><Text x={365} y={476}>1 × 1</Text>
          {stage === 1 && <Text x={366} y={302} width={165}>前组结果 ↗</Text>}
        </svg>
        <Typography as="p" variant="bodySmall" tone="muted" align="center">{stage === 0 ? '小卷积只处理一组通道，空间大小仍是3×3' : stage === 1 ? '橙色这条线：把已经处理过的信息交给下一组' : '划过各组结果，观察它保留了哪些长短路径'}</Typography>
      </section>
    </div>
    <div className="aipe-r2-explanation" aria-live="polite"><Typography as="span" variant="bodySmall" tone="muted" className="aipe-r2-step">{stage + 1} / 3 · {current.name}</Typography><Typography as="h3" variant="h3" tone="accent">{current.heading}</Typography><Typography as="p" variant="bodySmall" tone="muted">{current.explanation}</Typography>{stage === 2 && <Typography as="p" variant="bodySmall" tone="success">第{selectedGroup + 1}组的路径范围：{selectedGroup === 0 ? '直接保留输入（1×1）' : Array.from({length:selectedGroup},(_,i)=>`${3 + i * 2}×${3 + i * 2}`).join('、')}；这些特征共同参与训练。</Typography>}</div>
    <div className="aipe-r2-bottom"><footer className="aipe-r2-references"><Typography as="a" variant="bodySmall" tone="muted" href="https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html" target="_blank" rel="noreferrer">Deep Residual Learning for Image Recognition · CVPR 2016 ↗</Typography><Typography as="a" variant="bodySmall" tone="muted" href="https://arxiv.org/abs/1904.01169" target="_blank" rel="noreferrer">Res2Net: A New Multi-scale Backbone Architecture · IEEE TPAMI 2021 ↗</Typography></footer><Button variant="primary" onClick={advance}>{current.next}</Button></div>
  </ContentBlock>;
}
