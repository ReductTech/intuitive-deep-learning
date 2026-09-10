import { useMemo, useState, type ReactNode } from 'react';
import { ContentBlock, ModuleShell, RangeControl, Typography } from '../shared/react';
import './linear-regression-lesson.css';

type Point = { parent: number; child: number };

const data: Point[] = [
  { parent: 62, child: 64 }, { parent: 64, child: 65 }, { parent: 65, child: 66.5 },
  { parent: 66, child: 65.5 }, { parent: 67, child: 68 }, { parent: 68, child: 67 },
  { parent: 69, child: 69 }, { parent: 70, child: 68.5 }, { parent: 71, child: 70.5 },
  { parent: 72, child: 70 }, { parent: 73, child: 72 }, { parent: 74, child: 71 },
];

const W = 720;
const H = 410;
const pad = { l: 64, r: 24, t: 24, b: 54 };
const xScale = (x: number) => pad.l + ((x - 60) / 16) * (W - pad.l - pad.r);
const yScale = (y: number) => H - pad.b - ((y - 60) / 16) * (H - pad.t - pad.b);

function RegressionPlot({ slope, intercept, residuals = false }: { slope: number; intercept: number; residuals?: boolean }) {
  const ticks = [60, 64, 68, 72, 76];
  return <svg className="grl-plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="父母平均身高与成年子女身高散点图">
    <rect className="grl-plot__paper" x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} />
    {ticks.map((tick) => <g key={tick}>
      <line className="grl-plot__grid" x1={xScale(tick)} x2={xScale(tick)} y1={pad.t} y2={H - pad.b} />
      <line className="grl-plot__grid" x1={pad.l} x2={W - pad.r} y1={yScale(tick)} y2={yScale(tick)} />
      <text x={xScale(tick)} y={H - 20} textAnchor="middle">{tick}</text>
      <text x={45} y={yScale(tick) + 5} textAnchor="end">{tick}</text>
    </g>)}
    {residuals && data.map((p, i) => <line key={`r-${i}`} className="grl-plot__residual" x1={xScale(p.parent)} x2={xScale(p.parent)} y1={yScale(p.child)} y2={yScale(slope * p.parent + intercept)} />)}
    <line className="grl-plot__line" x1={xScale(60)} y1={yScale(slope * 60 + intercept)} x2={xScale(76)} y2={yScale(slope * 76 + intercept)} />
    {data.map((p, i) => <circle key={i} className="grl-plot__point" cx={xScale(p.parent)} cy={yScale(p.child)} r="7" />)}
    <text className="grl-plot__axis-label" x={(pad.l + W - pad.r) / 2} y={H - 2} textAnchor="middle">父母平均身高 x（英寸）</text>
    <text className="grl-plot__axis-label" transform={`translate(17 ${(pad.t + H - pad.b) / 2}) rotate(-90)`} textAnchor="middle">成年子女身高 y（英寸）</text>
  </svg>;
}

function Story() {
  return <ContentBlock className="grl-block" title="一张家庭身高表，提出了一个新问题" subtitle="19 世纪末，高尔顿收集父母与成年子女的身高，寻找遗传中的规律。">
    <div className="grl-story">
      <div className="grl-archive"><Typography variant="bodySmall" tone="muted">伦敦 · 1886</Typography><Typography variant="h3">“高个父母的孩子，也一定同样高吗？”</Typography><div className="grl-family"><span className="is-tall">父母</span><b>→</b><span>子女</span></div><Typography variant="body">他发现：父母越高，子女通常也越高；但极端身高的下一代，往往更接近平均值。这正是“回归”一词的历史来源。</Typography></div>
      <aside className="grl-question"><Typography variant="display">?</Typography><Typography variant="h3">如果知道父母身高，能否给孩子的成年身高一个合理预测？</Typography><Typography variant="bodySmall" tone="muted">我们不追求命中每个人，而是寻找数据整体的趋势。</Typography></aside>
    </div>
  </ContentBlock>;
}

function Evidence() {
  return <ContentBlock className="grl-block" title="先别急着画线：散点告诉了我们什么？" subtitle="每个点代表一个家庭；横坐标是父母平均身高，纵坐标是成年子女身高。">
    <div className="grl-two"><RegressionPlot slope={0} intercept={68} /><aside className="grl-note"><Typography variant="h3">读图结论</Typography><Typography variant="body">点云总体向右上方延伸：存在<strong>正相关</strong>。</Typography><Typography variant="body">点没有排成一条线：身高还受营养、环境与随机差异影响。</Typography><Typography variant="bodySmall" tone="muted">线性回归描述平均趋势，不是确定性预言。</Typography></aside></div>
  </ContentBlock>;
}

function Model() {
  return <ContentBlock className="grl-block" title="把模糊的趋势，写成一条可计算的直线">
    <div className="grl-model"><div className="grl-formula"><Typography as="div" variant="display">ŷ = wx + b</Typography><Typography variant="body">x 是父母平均身高，ŷ 是模型预测；w 控制斜率，b 控制整条线的上下位置。</Typography></div><div className="grl-parameter-map"><div><b>w</b><Typography variant="body">每当 x 增加 1，预测值改变多少</Typography></div><div><b>b</b><Typography variant="body">直线的基准位置</Typography></div><div><b>ŷ</b><Typography variant="body">“帽子”提醒我们：这是预测，不是真实观测 y</Typography></div></div></div>
  </ContentBlock>;
}

function LossLab() {
  const [slope, setSlope] = useState(0.35);
  const [intercept, setIntercept] = useState(44);
  const mse = useMemo(() => data.reduce((sum, p) => sum + (p.child - (slope * p.parent + intercept)) ** 2, 0) / data.length, [slope, intercept]);
  return <ContentBlock className="grl-block" title="让损失函数替我们判断：哪条线更好？" subtitle="残差 e = y − ŷ；均方误差把所有残差平方后取平均。">
    <div className="grl-two"><RegressionPlot slope={slope} intercept={intercept} residuals /><aside className="grl-lab"><div className="grl-loss"><Typography variant="bodySmall">均方误差 MSE</Typography><Typography as="output" variant="display">{mse.toFixed(2)}</Typography><Typography variant="bodySmall" tone="muted">MSE = (1/n) Σ(yᵢ − ŷᵢ)²</Typography></div><RangeControl label="斜率 w" min="0" max="1" step="0.01" value={slope} digits={2} onChange={(e) => setSlope(Number(e.currentTarget.value))} /><RangeControl label="截距 b" min="0" max="60" step="0.5" value={intercept} digits={1} onChange={(e) => setIntercept(Number(e.currentTarget.value))} /><Typography variant="bodySmall" tone={mse < 2.2 ? 'success' : 'muted'}>{mse < 2.2 ? '很接近了：短残差意味着更小的整体错误。' : '拖动参数，让橙色残差线整体变短。'}</Typography></aside></div>
  </ContentBlock>;
}

function Summary() {
  return <ContentBlock className="grl-block" title="线性回归，其实是一条完整的推理链">
    <div className="grl-chain">{[['数据','把成对观测画成散点'],['模型','用 ŷ = wx + b 给出预测'],['误差','用 y − ŷ 衡量一次偏差'],['损失','用 MSE 汇总整批误差']].map(([a,b], i) => <article key={a}><span>{i + 1}</span><Typography variant="h3">{a}</Typography><Typography variant="bodySmall" tone="muted">{b}</Typography></article>)}</div>
    <Typography className="grl-takeaway" variant="h3">训练线性回归 = 寻找让损失最小的 w 和 b。</Typography>
  </ContentBlock>;
}

export const regressionSlides: { id: string; title: string; content: ReactNode }[] = [
  { id: 'story', title: '高尔顿的身高问题', content: <Story /> },
  { id: 'evidence', title: '从散点读出趋势', content: <Evidence /> },
  { id: 'model', title: '把趋势写成直线', content: <Model /> },
  { id: 'loss', title: '残差与均方误差', content: <LossLab /> },
  { id: 'summary', title: '从数据到训练目标', content: <Summary /> },
];

export function LinearRegressionLessonPage() {
  return <ModuleShell title="从高尔顿的身高问题到损失函数" subtitle="先看见关系，再把直线的好坏变成一个可以优化的数字。" badge="线性回归 · 入门" shellClassName="grl-shell"><div className="grl-flow"><Story /><Evidence /><Model /><LossLab /><Summary /></div></ModuleShell>;
}
