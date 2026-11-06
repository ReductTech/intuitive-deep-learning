import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChartHistogram, ChartLine, Tips, Setting, Shield } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from '../../../shared/react';
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
  return <div ref={ref} className="rl-map-axis" onPointerDown={event => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId); update(event);
  }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
    <div className="rl-map-axis-line"/>
    <Typography variant="h2" tone="inherit" wrap="nowrap" className="rl-map-point-value" style={labelPosition}>{probability ? `${(p * 100).toFixed(1)}%` : score.toFixed(1)}</Typography>
    <Button className="rl-map-dot" style={{ left: `${percent}%` }} role="slider" aria-label={probability ? '拖动概率点' : '拖动线性分数点'}
      aria-valuemin={probability ? sigmoid(-6) : -6} aria-valuemax={probability ? sigmoid(6) : 6} aria-valuenow={probability ? p : score}
      aria-valuetext={probability ? `${(p * 100).toFixed(1)}%，${caption}` : `${score.toFixed(1)}，${caption}`} title="左右拖动，两边同步变化" onKeyDown={keyboard}/>
    <Typography variant="bodySmall" tone="inherit" wrap="nowrap" className="rl-map-point-caption" style={labelPosition}>{caption}</Typography>
    <div className="rl-map-axis-ends"><Typography variant="body" tone="accent">{probability ? '0' : '−∞'}</Typography><Typography variant="body" tone="accent">{probability ? '1' : '+∞'}</Typography></div>
  </div>;
}

const properties = [
  { title: '取值有界', detail: '输出落在 0 与 1 之间', Icon: Shield, theme: 'bounds' },
  { title: '单调递增', detail: '分数越大，概率越高', Icon: ChartHistogram, theme: 'order' },
  { title: '中心对称', detail: '相反分数对应互补概率', Icon: ChartLine, theme: 'smooth' },
];

export function ProbabilityMappingPage() {
  const [score, setScore] = useState(.6);
  return <ContentBlock headingLevel={1} title="从线性分数到类别概率" subtitle="概率映射满足取值有界、单调递增与中心对称。" className="rl-map-page">
    <div className="rl-map-layout">
      <section className="rl-map-panel rl-map-score">
        <div className="rl-map-panel-heading"><Typography variant="h3" tone="inherit">线性分数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="z=\mathbf w^\top\mathbf x+b" tooltip="x是输入特征向量，w是权重向量，b是偏置。线性分数z可以取任意实数。"/></MathFormulaBlock></div>
        <MappingAxis score={score} onChange={setScore}/>
      </section>
      <div className="rl-map-bridge"><span className="rl-map-flow-arrow rl-map-flow-arrow--in" aria-hidden="true"/><Typography variant="h3" tone="accent">映射函数</Typography><div className="rl-map-gears" aria-hidden="true"><Setting theme="two-tone" size={72} fill={['#377df4','#d8e8ff']} strokeWidth={3}/><Setting theme="two-tone" size={43} fill={['#79a8fa','#edf4ff']} strokeWidth={3}/></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="g(z)" tooltip="g表示概率映射。本页操作展示分数与概率的对应关系。"/></MathFormulaBlock><span className="rl-map-flow-arrow rl-map-flow-arrow--out" aria-hidden="true"/></div>
      <section className="rl-map-panel rl-map-probability">
        <div className="rl-map-panel-heading"><Typography variant="h3" tone="inherit">类别概率</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=g(z)" tooltip="g将线性分数映射为正类概率p=P(Y=1|x)。在乘客存活任务中，1表示存活，p为存活概率。"/></MathFormulaBlock></div>
        <MappingAxis score={score} probability onChange={setScore}/>
      </section>

      <section className="rl-map-properties" aria-label="映射的性质与解释"><div className="rl-map-properties-heading"><Typography variant="h3" tone="accent">概率映射的基本要求</Typography><span/></div><div className="rl-map-property-grid">
        {properties.map(({title,detail,Icon,theme})=><div key={title} className={`rl-map-property rl-map-property--${theme}`}><span className="rl-map-property-icon" aria-hidden="true"><Icon theme="two-tone" size={52} fill={['currentColor','white']} strokeWidth={3}/></span><div><Typography variant="h3" tone="accent">{title}</Typography><Typography variant="bodySmall" tone="muted">{detail}</Typography></div></div>)}
      </div></section>
      <div className="rl-map-conclusion"><span aria-hidden="true"><Tips theme="two-tone" size={48} fill={['#efa94b','#fff0c9']} strokeWidth={3}/></span><Typography variant="h3" tone="accent">映射形式由概率模型的具体假设确定。</Typography></div>
    </div>
  </ContentBlock>;
}


