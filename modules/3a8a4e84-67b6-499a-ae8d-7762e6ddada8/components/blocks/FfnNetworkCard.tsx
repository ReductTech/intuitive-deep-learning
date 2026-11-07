import { useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../LessonPageFrame';
import { FFN_SAMPLE_INPUTS, ffnTeachingExample } from '../../domain/ffnTeachingExample';
import './FfnNetworkCard.css';
const stations = [260, 550, 850, 1160];
const heights = [82, 192, 192, 82];
const colors = ['#38909b', '#c3854f', '#8e79ab'];
const sample = (station: number, count: number, lane: number) => Array.from({ length: count }, (_, j) => station === 2 && (j + lane) % 4 === 1 ? 0 : .3 + ((j * 7 + lane * 3 + station * 2) % 9) / 12);
const yAt = (j: number, count: number, height: number) => -height * .39 + j * height * .78 / Math.max(1, count - 1);
export function FfnNetworkCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [selected, setSelected] = useState(1);
    const [step, setStep] = useState(0);
    const [small, setSmall] = useState(false);
    const [parameters, setParameters] = useState(false);
    const selectedExample = ffnTeachingExample(FFN_SAMPLE_INPUTS[selected]);
    function laneGraphic(lane: number, focus: boolean) {
        const depth = 2 - lane, dx = depth * 43, cy = 240 - depth * 45;
        const example = ffnTeachingExample(FFN_SAMPLE_INPUTS[lane]);
        const values = [example.input, example.hidden, example.activated, example.output];
        const counts = small ? [2, 3, 3, 2] : [6, 12, 12, 6];
        const color = colors[lane];
        return <g key={`${lane}-${focus}`} className={`ffn3-lane ${focus ? 'is-selected' : ''}`} style={{ '--lane-color': color } as CSSProperties}>
      <path className="ffn3-plane" d={`M ${190 + dx} ${cy - 110} L ${1235 + dx} ${cy - 110} L ${1235 + dx} ${cy + 110} L ${190 + dx} ${cy + 110} Z`}/>
      {[1, 2, 3].map(stage => <g key={stage} className={`ffn3-connections is-stage-${stage} ${step === stage ? 'is-current' : ''}`}>
        {Array.from({ length: counts[stage - 1] }, (_, a) => Array.from({ length: counts[stage] }, (_, b) => {
                    if (stage === 2 && a !== b)
                        return null;
                    return <line key={`${a}-${b}`} x1={stations[stage - 1] + dx + 25} y1={cy + yAt(a, counts[stage - 1], heights[stage - 1])} x2={stations[stage] + dx - 25} y2={cy + yAt(b, counts[stage], heights[stage])}/>;
                }))}
      </g>)}
      {stations.map((x, station) => {
                const xx = x + dx, h = heights[station], yy = cy - h / 2;
                return <g className="ffn3-vector" key={station}>
          <path className="ffn3-vector-top" d={`M ${xx - 25} ${yy} l 12 -10 h 50 l -12 10 Z`}/>
          <path className="ffn3-vector-side" d={`M ${xx + 25} ${yy} l 12 -10 v ${h} l -12 10 Z`}/>
          <rect className="ffn3-vector-front" x={xx - 25} y={yy} width="50" height={h} rx="4"/>
          {Array.from({ length: counts[station] }, (_, j) => <g key={j}>
            {small ? <text className="ffn3-number" x={xx} y={cy + yAt(j, counts[station], h) + 6} textAnchor="middle">{values[station][j]}</text> : <rect className={`ffn3-value ${station === 2 && (j + lane) % 4 === 1 ? 'is-zero' : ''}`} x={xx - 15} y={cy + yAt(j, counts[station], h) - 5} width="30" height="10" rx="4" opacity={sample(station, counts[station], lane)[j]}/>}
          </g>)}
        </g>;
            })}
      <text className="ffn3-parameter is-first" x={397 + dx} y={cy - 70} textAnchor="middle">W₁、b₁</text>
      <text className="ffn3-parameter is-second" x={1005 + dx} y={cy - 70} textAnchor="middle">W₂、b₂</text>

    </g>;
    }
    return <LessonPageFrame><section className="ffn3-page">
    <header className="tr-lesson-header ffn3-header"><div><Typography as="h1" variant="display" tone="accent">逐位前馈网络：升维、激活、降维</Typography><p>选一个 Token，再点下方步骤；切换小向量，可查看每步的数值。</p></div></header>
    <main className="ffn3-main">
      <section className="ffn3-scene" aria-label="三维逐位前馈网络">
        <div className="ffn3-scene-top"><span>点一个 Token，查看它的计算过程</span><div className="ffn3-scene-actions"><span>{small ? '2 → 3 → 2 教学示例' : '仅示意部分维度'}</span><button className="ffn3-example-toggle" onClick={() => { setSmall(!small); setParameters(false); }}>{small ? '返回 512 维结构' : '用小向量看看'}</button>{small && <button onClick={() => setParameters(!parameters)} aria-expanded={parameters}>共享参数 {parameters ? '收起' : '展开'}</button>}</div></div>
        <svg className="ffn3-diagram" viewBox="20 10 1360 390" role="group" aria-label="三个不同纵深的独立计算平面。每个Token经过全连接升维、ReLU和全连接降维，Token之间没有连线。">
          <defs><linearGradient id="ffn3-face" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#e9f3f5"/></linearGradient></defs>
          {[0, 1, 2].filter(i => i !== selected).map(i => laneGraphic(i, false))}
          {laneGraphic(selected, true)}
          {[0, 1, 2].map(lane => <g key={lane} role="button" tabIndex={0} aria-label={`选择 Token ${lane + 1}`} aria-pressed={selected === lane} className={`ffn3-token ${selected === lane ? 'is-selected' : ''}`} style={{ '--lane-color': colors[lane] } as CSSProperties} onClick={() => { setSelected(lane); setStep(0); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelected(lane);
        setStep(0);
    } }} transform={`translate(${68 + (2 - lane) * 43},${240 - (2 - lane) * 45})`}><rect x="-3" y="-22" width="115" height="44" rx="22"/><circle cx="18" cy="0" r="5"/><text x="66" y="7" textAnchor="middle">Token {lane + 1}</text></g>)}
          {stations.map((x, j) => <g key={x} className="ffn3-dimension"><text x={x + 43} y="357" textAnchor="middle">{['输入', '升维后', 'ReLU 后', '输出'][j]}</text><text x={x + 43} y="385" textAnchor="middle">{(small ? [2, 3, 3, 2] : [512, 2048, 2048, 512])[j]} 维</text></g>)}
        </svg>
        <div className="ffn3-scene-note"><div className="ffn3-key-point is-independent"><strong>各 Token <mark>独立计算</mark></strong><span>Token 之间没有 FFN 连线</span></div><div className="ffn3-key-point is-shared"><strong>各 Token <mark>共享同一组参数</mark></strong><span><b className="ffn3-first-label">W₁、b₁</b> 与 <b className="ffn3-second-label">W₂、b₂</b> 在各位置相同</span></div></div>
        {small && parameters && <aside className="ffn3-parameters"><strong>三个 Token，共用这两组参数</strong><code>W₁ = [[1, −1, 1], [1, 1, −1]]</code><code>W₂ = [[1, 0], [0, 1], [1, 1]]</code><span>b₁、b₂ 均为 0</span><button aria-label="关闭共享参数" onClick={() => setParameters(false)}>×</button></aside>}
      </section>
      <div className="ffn3-steps" aria-label="网络中的三个步骤">
        {[{ name: '先展开', sub: '全连接 · 升维', dim: small ? '2 → 3' : '512 → 2048', formula: 'hᵢ = xᵢW₁ + b₁', note: small ? `[${selectedExample.hidden.join(', ')}]` : '同一组 W₁、b₁，处理每个输入' }, { name: '再激活', sub: '激活函数 · ReLU', dim: small ? '3 → 3' : '2048 → 2048', formula: 'aᵢ = ReLU(hᵢ) = max(0, hᵢ)', note: small ? `[${selectedExample.activated.join(', ')}]` : '负值归零，向量维数不变' }, { name: '收回来', sub: '全连接 · 降维', dim: small ? '3 → 2' : '2048 → 512', formula: 'yᵢ = aᵢW₂ + b₂', note: small ? `[${selectedExample.output.join(', ')}]` : '同一组 W₂、b₂，得到新的表示' }].map((item, i) => <button key={item.name} className={`ffn3-step is-step-${i} ${step === i + 1 ? 'is-active' : ''}`} aria-pressed={step === i + 1} onClick={() => setStep(step === i + 1 ? 0 : i + 1)}><div className="ffn3-step-title"><span className="ffn3-step-icon">{i === 0 ? '↗' : i === 1 ? '✦' : '↘'}</span><h2>{item.name}<small>{item.sub}</small></h2><b>{item.dim}</b></div><code>{item.formula}</code><p>{item.note}</p></button>)}
      </div>
    </main>
    <footer className="ffn3-footer"><span>参数相同，输出不必相同。</span><Button variant="primary" onClick={onComplete}>继续：残差连接 →</Button></footer>
  </section></LessonPageFrame>;
}
