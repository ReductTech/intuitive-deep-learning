import { useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
        return <g shuku-edit-id="e-9b77c9db-82b0-46bb-a0df-3e01493b9521" key={`${lane}-${focus}`} className={`ffn3-lane ${focus ? 'is-selected' : ''}`} style={{ '--lane-color': color } as CSSProperties}>
      <path shuku-edit-id="e-c0dfb8a7-1941-4792-b395-be68d0f1dfa6" className="ffn3-plane" d={`M ${190 + dx} ${cy - 110} L ${1235 + dx} ${cy - 110} L ${1235 + dx} ${cy + 110} L ${190 + dx} ${cy + 110} Z`}/>
      {[1, 2, 3].map(stage => <g shuku-edit-id="e-dceda16b-fdfb-4e9c-baf1-1b54561cf1ce" key={stage} className={`ffn3-connections is-stage-${stage} ${step === stage ? 'is-current' : ''}`}>
        {Array.from({ length: counts[stage - 1] }, (_, a) => Array.from({ length: counts[stage] }, (_, b) => {
                    if (stage === 2 && a !== b)
                        return null;
                    return <line shuku-edit-id="e-9a316775-f0ac-4b47-917b-72ea0c0c2dc5" key={`${a}-${b}`} x1={stations[stage - 1] + dx + 25} y1={cy + yAt(a, counts[stage - 1], heights[stage - 1])} x2={stations[stage] + dx - 25} y2={cy + yAt(b, counts[stage], heights[stage])}/>;
                }))}
      </g>)}
      {stations.map((x, station) => {
                const xx = x + dx, h = heights[station], yy = cy - h / 2;
                return <g shuku-edit-id="e-12d2ca05-87ba-47a7-9263-ae5547078bf8" className="ffn3-vector" key={station}>
          <path shuku-edit-id="e-8133a682-5c34-4503-8365-638725c3469f" className="ffn3-vector-top" d={`M ${xx - 25} ${yy} l 12 -10 h 50 l -12 10 Z`}/>
          <path shuku-edit-id="e-32d3b7c4-b4ff-45a5-b3cd-9358f2a71858" className="ffn3-vector-side" d={`M ${xx + 25} ${yy} l 12 -10 v ${h} l -12 10 Z`}/>
          <rect shuku-edit-id="e-d5d8ad1e-f665-4040-931f-24b4c60dd9b6" className="ffn3-vector-front" x={xx - 25} y={yy} width="50" height={h} rx="4"/>
          {Array.from({ length: counts[station] }, (_, j) => <g shuku-edit-id="e-b5db9a07-6dbf-4be6-8f02-b0a802e11c46" key={j}>
            {small ? <text shuku-edit-id="e-989130c8-eaa4-4005-86a1-c7051f9a9f18" className="ffn3-number" x={xx} y={cy + yAt(j, counts[station], h) + 6} textAnchor="middle">{values[station][j]}</text> : <rect shuku-edit-id="e-7a2d179e-15bf-4875-b1ff-79326ade7ece" className={`ffn3-value ${station === 2 && (j + lane) % 4 === 1 ? 'is-zero' : ''}`} x={xx - 15} y={cy + yAt(j, counts[station], h) - 5} width="30" height="10" rx="4" opacity={sample(station, counts[station], lane)[j]}/>}
          </g>)}
        </g>;
            })}
      <text shuku-edit-id="e-cc3d42d0-82a2-4311-b124-d6c56ef34624" className="ffn3-parameter is-first" x={397 + dx} y={cy - 70} textAnchor="middle">W₁、b₁</text>
      <text shuku-edit-id="e-ac700c91-cca8-4467-b86c-e82ff980a1e9" className="ffn3-parameter is-second" x={1005 + dx} y={cy - 70} textAnchor="middle">W₂、b₂</text>

    </g>;
    }
    return <LessonPageFrame><section shuku-edit-id="e-6c0673da-e52c-4e9a-b1c5-e998f54856e8" className="ffn3-page">
    <header shuku-edit-id="e-1374a834-52f9-48ae-bc39-6a5e472a4b0b" className="tr-lesson-header ffn3-header"><div shuku-edit-id="e-43f499bb-480f-49b7-97a8-7de640966537"><Typography shuku-edit-id="e-a8b7129f-e2ac-45b0-8160-9d53220ac699" as="h1" variant="display" tone="accent">逐位前馈网络：升维、激活、降维</Typography><p shuku-edit-id="e-c4b34985-d83f-4056-a547-656f499fdca2">选一个 Token，再点下方步骤；切换小向量，可查看每步的数值。</p></div></header>
    <main shuku-edit-id="e-1b8d9cd1-6f29-4543-b755-7d4f3da604a1" className="ffn3-main">
      <section shuku-edit-id="e-474d3d69-ca33-4df9-938c-334ef50ad94b" className="ffn3-scene" aria-label="三维逐位前馈网络">
        <div shuku-edit-id="e-0c53a940-aee3-4c8a-9ed7-c77a16fb5f27" className="ffn3-scene-top"><span shuku-edit-id="e-cf4e0ce9-b32e-4d62-810c-32d517461db8">点一个 Token，查看它的计算过程</span><div shuku-edit-id="e-e5193fcb-56b0-4a92-a98f-ade8260d6fe3" className="ffn3-scene-actions"><span shuku-edit-id="e-5919584a-3a56-4fd4-a3a3-c8b6ceb4aa3d">{small ? '2 → 3 → 2 教学示例' : '仅示意部分维度'}</span><button shuku-edit-id="e-8f8a5c84-0771-470c-84f8-827d9b2a0c39" className="ffn3-example-toggle" onClick={() => { setSmall(!small); setParameters(false); }}>{small ? '返回 512 维结构' : '用小向量看看'}</button>{small && <button shuku-edit-id="e-de4b33cc-0c10-4d89-9827-b0352d9a02ff" onClick={() => setParameters(!parameters)} aria-expanded={parameters}>共享参数 {parameters ? '收起' : '展开'}</button>}</div></div>
        <svg shuku-edit-id="e-6939a069-d84f-4502-b56d-f1b8b7566c71" className="ffn3-diagram" viewBox="20 10 1360 390" role="group" aria-label="三个不同纵深的独立计算平面。每个Token经过全连接升维、ReLU和全连接降维，Token之间没有连线。">
          <defs shuku-edit-id="e-d5ad6296-27fc-4075-997a-10ca4740302e"><linearGradient shuku-edit-id="e-1e564429-530f-4c52-9ccc-4048d0becf0b" id="ffn3-face" x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-7c9ad278-71d2-4116-a5b7-ab1964eda28f" stopColor="#fff"/><stop shuku-edit-id="e-bfd24624-e6b6-4bd0-b1ad-abd980f102f4" offset="1" stopColor="#e9f3f5"/></linearGradient></defs>
          {[0, 1, 2].filter(i => i !== selected).map(i => laneGraphic(i, false))}
          {laneGraphic(selected, true)}
          {[0, 1, 2].map(lane => <g shuku-edit-id="e-470e2dae-282f-49a1-9be7-1923fa64f740" key={lane} role="button" tabIndex={0} aria-label={`选择 Token ${lane + 1}`} aria-pressed={selected === lane} className={`ffn3-token ${selected === lane ? 'is-selected' : ''}`} style={{ '--lane-color': colors[lane] } as CSSProperties} onClick={() => { setSelected(lane); setStep(0); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelected(lane);
        setStep(0);
    } }} transform={`translate(${68 + (2 - lane) * 43},${240 - (2 - lane) * 45})`}><rect shuku-edit-id="e-3555f5eb-cf6b-46be-bd4b-48a57172069c" x="-3" y="-22" width="115" height="44" rx="22"/><circle shuku-edit-id="e-ce536026-085d-4f7a-ac8f-111f030dafc1" cx="18" cy="0" r="5"/><text shuku-edit-id="e-59dc6fe9-384a-4c4a-8c5b-2c143e4cffff" x="66" y="7" textAnchor="middle">Token {lane + 1}</text></g>)}
          {stations.map((x, j) => <g shuku-edit-id="e-c1d02c18-9faa-47d4-af82-21619ca086f1" key={x} className="ffn3-dimension"><text shuku-edit-id="e-2845773f-0ac4-4c08-a754-fccac4fea337" x={x + 43} y="357" textAnchor="middle">{['输入', '升维后', 'ReLU 后', '输出'][j]}</text><text shuku-edit-id="e-deb12202-ce6b-4feb-ad2f-849e4c9706cc" x={x + 43} y="385" textAnchor="middle">{(small ? [2, 3, 3, 2] : [512, 2048, 2048, 512])[j]} 维</text></g>)}
        </svg>
        <div shuku-edit-id="e-d0ead667-3f26-4242-8afc-17b1c727dae8" className="ffn3-scene-note"><div shuku-edit-id="e-64eeb675-f967-44fd-9773-e0ee2e1dd15c" className="ffn3-key-point is-independent"><strong shuku-edit-id="e-d8a47841-3e3d-4bac-a6a5-a5eba262a229">各 Token <mark shuku-edit-id="e-c6f2b115-4ec7-4801-ae73-c70b091307b8">独立计算</mark></strong><span shuku-edit-id="e-b579d038-d959-4086-aade-fc5f36c3da26">Token 之间没有 FFN 连线</span></div><div shuku-edit-id="e-3f2bc489-d744-49af-b633-1b5d78eb267e" className="ffn3-key-point is-shared"><strong shuku-edit-id="e-90b4b4b8-d9a6-4468-86b6-5fbc1c239187">各 Token <mark shuku-edit-id="e-e502cf58-f256-4000-8a9a-82a1241413b1">共享同一组参数</mark></strong><span shuku-edit-id="e-78bbdfd7-d6f4-4765-9a6b-b7ecb156eba7"><b shuku-edit-id="e-f1e06112-ad0e-483f-bb40-6f75c5409288" className="ffn3-first-label">W₁、b₁</b> 与 <b shuku-edit-id="e-e0e0a08c-7775-479c-ada9-94be7e305c95" className="ffn3-second-label">W₂、b₂</b> 在各位置相同</span></div></div>
        {small && parameters && <aside shuku-edit-id="e-6b0f38e5-4369-40a8-98f9-11a59462baef" className="ffn3-parameters"><strong shuku-edit-id="e-1dc72edf-1eef-41c1-8d1d-549d8eda0313">三个 Token，共用这两组参数</strong><code shuku-edit-id="e-d75d70ba-3744-4adb-a037-902d9933902a">W₁ = [[1, −1, 1], [1, 1, −1]]</code><code shuku-edit-id="e-c848a8e2-62f4-4a38-81a6-908c37f8e2fa">W₂ = [[1, 0], [0, 1], [1, 1]]</code><span shuku-edit-id="e-00c9e339-a44b-406f-b685-808bf4b8a381">b₁、b₂ 均为 0</span><button shuku-edit-id="e-8b013ac7-430f-454f-b97d-e5da823eb067" aria-label="关闭共享参数" onClick={() => setParameters(false)}>×</button></aside>}
      </section>
      <div shuku-edit-id="e-fe6e1057-a4ac-420e-9866-486adb4d346e" className="ffn3-steps" aria-label="网络中的三个步骤">
        {[{ name: '先展开', sub: '全连接 · 升维', dim: small ? '2 → 3' : '512 → 2048', formula: 'hᵢ = xᵢW₁ + b₁', note: small ? `[${selectedExample.hidden.join(', ')}]` : '同一组 W₁、b₁，处理每个输入' }, { name: '再激活', sub: '激活函数 · ReLU', dim: small ? '3 → 3' : '2048 → 2048', formula: 'aᵢ = ReLU(hᵢ) = max(0, hᵢ)', note: small ? `[${selectedExample.activated.join(', ')}]` : '负值归零，向量维数不变' }, { name: '收回来', sub: '全连接 · 降维', dim: small ? '3 → 2' : '2048 → 512', formula: 'yᵢ = aᵢW₂ + b₂', note: small ? `[${selectedExample.output.join(', ')}]` : '同一组 W₂、b₂，得到新的表示' }].map((item, i) => <button shuku-edit-id="e-a5bca3c7-37fc-4265-86d0-cef1f66e0d95" key={item.name} className={`ffn3-step is-step-${i} ${step === i + 1 ? 'is-active' : ''}`} aria-pressed={step === i + 1} onClick={() => setStep(step === i + 1 ? 0 : i + 1)}><div shuku-edit-id="e-3823b919-fc4f-47d0-98d8-33f6788c339e" className="ffn3-step-title"><span shuku-edit-id="e-b4bd39a1-01c8-4dd0-8234-16617bcd72ec" className="ffn3-step-icon">{i === 0 ? '↗' : i === 1 ? '✦' : '↘'}</span><h2 shuku-edit-id="e-1c809ef2-cf15-4f3d-8e42-7dc8ddfe1107">{item.name}<small shuku-edit-id="e-e5523f62-aa48-42a6-a062-cd92b40de947">{item.sub}</small></h2><b shuku-edit-id="e-eb4067af-8257-4da6-b258-46337443965c">{item.dim}</b></div><code shuku-edit-id="e-68be5543-98e4-45e9-a8ff-210c9c2cef94">{item.formula}</code><p shuku-edit-id="e-2ba24828-c43e-4573-a8b3-c958f997a472">{item.note}</p></button>)}
      </div>
    </main>
    <footer shuku-edit-id="e-b99504a8-0313-4ac2-a359-834d4f8e0516" className="ffn3-footer"><span shuku-edit-id="e-8db106a9-ebe0-4f60-9e34-df245e57801f">参数相同，输出不必相同。</span><Button variant="primary" onClick={onComplete}>继续：残差连接 →</Button></footer>
  </section></LessonPageFrame>;
}
