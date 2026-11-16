import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChartHistogram, ChartLine, Tips, Setting, Shield } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { sigmoid } from '../SigmoidPage/SigmoidPlot';
import './ProbabilityMappingPage.css';

const clampScore = (value: number) => Math.max(-6, Math.min(6, value));

function MappingAxis({ score, probability = false, onChange }: { score: number; probability?: boolean; onChange: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const p = sigmoid(score);
  const percent = (probability ? p : (score + 6) / 12) * 100;
  const caption = probability
    ? p < .4 ? '正类概率较低' : p <= .6 ? '接近一半' : '正类概率较高'
    : score < -.1 ? '负分数' : score > .1 ? '正分数' : '零附近';
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const boundedProbability = Math.max(sigmoid(-6), Math.min(sigmoid(6), fraction));
    const value = probability
      ? Math.log(boundedProbability / (1 - boundedProbability))
      : fraction * 12 - 6;
    onChange(clampScore(Math.round(value * 10) / 10));
  };
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); onChange(event.key === 'Home' ? -6 : 6);
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      onChange(clampScore(Math.round((score + (event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -.1 : .1)) * 10) / 10));
    }
  };
  const labelPosition = { left: `clamp(100px, ${percent}%, calc(100% - 100px))` };
  return <div shuku-edit-id="e-295c3dcd-9fd7-4d02-a0bb-9dbf6dc6d4d4" ref={ref} className="rl-map-axis" onPointerDown={event => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId); update(event);
  }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
    <div shuku-edit-id="e-77f60546-d326-4254-8517-c4dd7e6785ee" className="rl-map-axis-line"/>
    <Typography shuku-edit-id="e-870275b2-cd54-40c2-bfef-2d1d424fbcd3" variant="h2" tone="inherit" wrap="nowrap" className="rl-map-point-value" style={labelPosition}>{probability ? `${(p * 100).toFixed(1)}%` : score.toFixed(1)}</Typography>
    <Button className="rl-map-dot" style={{ left: `${percent}%` }} role="slider" aria-label={probability ? '拖动概率点' : '拖动线性分数点'}
      aria-valuemin={probability ? sigmoid(-6) : -6} aria-valuemax={probability ? sigmoid(6) : 6} aria-valuenow={probability ? p : score}
      aria-valuetext={probability ? `${(p * 100).toFixed(1)}%，${caption}` : `${score.toFixed(1)}，${caption}`} title="左右拖动，两边同步变化" onKeyDown={keyboard}/>
    <Typography shuku-edit-id="e-7380c27e-ea56-4ea0-b130-96fb2d15db9f" variant="bodySmall" tone="inherit" wrap="nowrap" className="rl-map-point-caption" style={labelPosition}>{caption}</Typography>
    <div shuku-edit-id="e-c9f29feb-c83e-4807-9ad0-c11e68d9f07c" className="rl-map-axis-ends"><Typography shuku-edit-id="e-13b79a1e-43a4-408e-8b36-7fae5565227f" variant="body" tone="accent">{probability ? '0' : '−∞'}</Typography><Typography shuku-edit-id="e-8599b2b8-8d06-4304-987c-e13a52fb8259" variant="body" tone="accent">{probability ? '1' : '+∞'}</Typography></div>
  </div>;
}

const properties = [
  { title: '取值有界', detail: '输出落在 0 与 1 之间', Icon: Shield, theme: 'bounds' },
  { title: '单调递增', detail: '分数越大，概率越高', Icon: ChartHistogram, theme: 'order' },
  { title: '中心对称', detail: '相反分数对应互补概率', Icon: ChartLine, theme: 'smooth' },
];

export function ProbabilityMappingPage() {
  const [score, setScore] = useState(.6);
  return <ContentBlock shuku-edit-id="e-ad5e73e6-281c-4329-88ae-2494e6c78211" headingLevel={1} title="从线性分数到类别概率" subtitle="概率映射满足取值有界、单调递增与中心对称。" className="rl-map-page">
    <div shuku-edit-id="e-d6167f3d-60fa-4bfb-97b0-ff13ceee9f03" className="rl-map-layout">
      <section shuku-edit-id="e-3f306d02-ad36-4811-b5ce-2a449c493cdd" className="rl-map-panel rl-map-score">
        <div shuku-edit-id="e-b7fd8a09-10d9-4402-b623-40720315a29e" className="rl-map-panel-heading"><Typography shuku-edit-id="e-1a733d96-837c-47e4-b379-3dd782aa9891" variant="h3" tone="inherit">线性分数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="z=\mathbf w^\top\mathbf x+b" tooltip="x是输入特征向量，w是权重向量，b是偏置。线性分数z可以取任意实数。"/></MathFormulaBlock></div>
        <MappingAxis score={score} onChange={setScore}/>
      </section>
      <div shuku-edit-id="e-09e4f357-533f-4511-aa47-911331c73ede" className="rl-map-bridge"><span shuku-edit-id="e-7d4a9ac0-fd0d-4a50-813d-de35a01a2fe1" className="rl-map-flow-arrow rl-map-flow-arrow--in" aria-hidden="true"/><Typography shuku-edit-id="e-1542feb8-77ea-4277-8f16-95e7159846ca" variant="h3" tone="accent">映射函数</Typography><div shuku-edit-id="e-48eb1505-e128-4d08-916f-d4c2e046e37a" className="rl-map-gears" aria-hidden="true"><Setting theme="two-tone" size={72} fill={['#377df4','#d8e8ff']} strokeWidth={3}/><Setting theme="two-tone" size={43} fill={['#79a8fa','#edf4ff']} strokeWidth={3}/></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="g(z)" tooltip="g表示概率映射。本页操作展示分数与概率的对应关系。"/></MathFormulaBlock><span shuku-edit-id="e-39fac9a7-11f2-4b89-b6aa-1774a13f94f1" className="rl-map-flow-arrow rl-map-flow-arrow--out" aria-hidden="true"/></div>
      <section shuku-edit-id="e-de06df04-99ec-434c-a9df-f4433089b031" className="rl-map-panel rl-map-probability">
        <div shuku-edit-id="e-cce73638-1ae4-40d9-9e7f-bcd5f7b9c3ca" className="rl-map-panel-heading"><Typography shuku-edit-id="e-9b0b5400-80ff-4251-8dde-ceb9da35ef38" variant="h3" tone="inherit">类别概率</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=g(z)" tooltip="g将线性分数映射为正类概率p=P(Y=1|x)。在乘客存活任务中，1表示存活，p为存活概率。"/></MathFormulaBlock></div>
        <MappingAxis score={score} probability onChange={setScore}/>
      </section>

      <section shuku-edit-id="e-183b6524-a991-4dbe-8c8c-943f9008bfcc" className="rl-map-properties" aria-label="映射的性质与解释"><div shuku-edit-id="e-77b239f5-6943-4c60-9e02-1fcf8e77bb85" className="rl-map-properties-heading"><Typography shuku-edit-id="e-539470ce-f398-42bc-82dc-ca042e95f5f4" variant="h3" tone="accent">概率映射的基本要求</Typography><span shuku-edit-id="e-13de97a3-bee1-4900-9263-4f03b2059aaf"/></div><div shuku-edit-id="e-c4d0f9e3-596b-47a0-bfb9-f69a15a8dc50" className="rl-map-property-grid">
        {properties.map(({title,detail,Icon,theme})=><div shuku-edit-id="e-e9468064-db68-487a-b4f9-f461554efecf" key={title} className={`rl-map-property rl-map-property--${theme}`}><span shuku-edit-id="e-f1ec92c6-e33c-495a-9752-c53f7f110bd6" className="rl-map-property-icon" aria-hidden="true"><Icon theme="two-tone" size={52} fill={['currentColor','white']} strokeWidth={3}/></span><div shuku-edit-id="e-5204e925-2b63-407b-97c3-cf640a47486c"><Typography shuku-edit-id="e-68cd8233-8699-49a4-a9ad-82fe9666f106" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-c88bf81f-13eb-4682-9828-87aa0ba02ec8" variant="bodySmall" tone="muted">{detail}</Typography></div></div>)}
      </div></section>
      <div shuku-edit-id="e-c32cd979-6edc-4b60-a85c-b64447e6f2c2" className="rl-map-conclusion"><span shuku-edit-id="e-92834656-3d91-41bc-9a31-cc04a1945e7b" aria-hidden="true"><Tips theme="two-tone" size={48} fill={['#efa94b','#fff0c9']} strokeWidth={3}/></span><Typography shuku-edit-id="e-93b1a4a5-af23-4e4c-8106-e7d96b0b9bd6" variant="h3" tone="accent">映射形式由概率模型的具体假设确定。</Typography></div>
    </div>
  </ContentBlock>;
}


