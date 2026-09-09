import { useMemo, useState, type ReactNode } from 'react';
import { Button, Callout, ContentBlock, FormulaBlock, LessonStage, RangeControl, Typography } from '../shared/react';
import { heightPairs, meanAbsoluteError, meanSquaredError, plotBounds, predict } from './data';

export interface BlockProps { onComplete?: () => void; }

function Plot({ slope = 0.78, intercept = 36, showResiduals = false, className = '' }: { slope?: number; intercept?: number; showResiduals?: boolean; className?: string }) {
  const width = 760;
  const height = 360;
  const pad = { left: 62, right: 24, top: 20, bottom: 48 };
  const x = (value: number) => pad.left + ((value - plotBounds.min) / (plotBounds.max - plotBounds.min)) * (width - pad.left - pad.right);
  const y = (value: number) => height - pad.bottom - ((value - plotBounds.min) / (plotBounds.max - plotBounds.min)) * (height - pad.top - pad.bottom);
  const lineStart = predict(plotBounds.min, slope, intercept);
  const lineEnd = predict(plotBounds.max, slope, intercept);
  const ticks = [160, 170, 180, 190];

  return (
    <svg className={`glr-plot ${className}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="父母身高与孩子身高的散点图">
      <rect x="0" y="0" width={width} height={height} rx="16" fill="#f7f9fc" />
      {ticks.map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={pad.top} y2={height - pad.bottom} stroke="#e1e7f0" /><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e1e7f0" /><text x={x(tick)} y={height - 20} textAnchor="middle" className="glr-svg-label">{tick}</text><text x={pad.left - 12} y={y(tick) + 4} textAnchor="end" className="glr-svg-label">{tick}</text></g>)}
      <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="#6d7c91" strokeWidth="1.5" />
      <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} stroke="#6d7c91" strokeWidth="1.5" />
      <text x={width / 2} y={height - 3} textAnchor="middle" className="glr-svg-axis">父母平均身高（cm）</text>
      <text x="18" y={height / 2} textAnchor="middle" transform={`rotate(-90 18 ${height / 2})`} className="glr-svg-axis">孩子身高（cm）</text>
      {showResiduals && heightPairs.map((pair) => <line key={`r-${pair.parent}`} x1={x(pair.parent)} x2={x(pair.parent)} y1={y(pair.child)} y2={y(predict(pair.parent, slope, intercept))} stroke="#f07e47" strokeWidth="2" strokeDasharray="5 4" opacity=".78" />)}
      <line x1={x(plotBounds.min)} y1={y(lineStart)} x2={x(plotBounds.max)} y2={y(lineEnd)} stroke="#27446e" strokeWidth="4" strokeLinecap="round" />
      {heightPairs.map((pair) => <circle key={`${pair.parent}-${pair.child}`} cx={x(pair.parent)} cy={y(pair.child)} r="6" fill="#f07e47" stroke="#fff" strokeWidth="2" />)}
    </svg>
  );
}

function StepTag({ children }: { children: ReactNode }) { return <span className="glr-step-tag">{children}</span>; }

export function GaltonStoryBlock({ onComplete }: BlockProps) {
  return <LessonStage className="glr-stage glr-story" variant="featured" title="1886 年：一个关于身高的奇怪问题" description="弗朗西斯·高尔顿没有先写公式，他先把一批家庭关系画成了图。">
    <div className="glr-story-grid">
      <div className="glr-archive">
        <StepTag>历史档案</StepTag>
        <div className="glr-archive-year">1886</div>
        <Typography variant="h3" tone="accent">Regression towards mediocrity in hereditary stature</Typography>
        <Typography variant="body" tone="muted">高尔顿研究父母身高与子代身高的关系，注意到：高个父母的孩子往往仍然偏高，但平均不会同样高；矮个父母的孩子也会向中间靠拢。</Typography>
        <div className="glr-quote">“回归”首先是数据里的现象，后来才成为模型里的名字。</div>
      </div>
      <div className="glr-story-visual" aria-label="父母与孩子身高的关系示意">
        <div className="glr-family-line"><span>父母</span><i>→</i><span>孩子</span></div>
        <div className="glr-height-bars"><div style={{ height: '78%' }}><b>高个父母</b><span>190 cm</span></div><div style={{ height: '69%' }}><b>孩子平均</b><span>180 cm</span></div><div style={{ height: '38%' }}><b>矮个父母</b><span>164 cm</span></div><div style={{ height: '47%' }}><b>孩子平均</b><span>170 cm</span></div></div>
        <Typography variant="bodySmall" tone="muted">不是“复制身高”，而是存在一条带有波动的趋势。</Typography>
      </div>
    </div>
    <Callout tone="orange" label="先记住一个问题" text="如果我只知道父母的平均身高，能不能给孩子的身高一个有依据的预测？" />
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>把故事变成数据 →</Button></div>
  </LessonStage>;
}

export function ScatterObservationBlock({ onComplete }: BlockProps) {
  return <LessonStage className="glr-stage" title="第一眼：点并不整齐，但它们有方向" description="每个点是一对家庭：横轴是父母平均身高，纵轴是孩子身高。">
    <div className="glr-two-col"><Plot /><div className="glr-observation-copy"><StepTag>看见</StepTag><Typography variant="h3" tone="accent">你会先看到什么？</Typography><ul className="glr-check-list"><li>点云整体从左下走向右上</li><li>同样的父母身高，孩子仍有差异</li><li>单个点不够，但整体趋势可用</li></ul><Callout tone="blue" label="相关性 ≠ 完美预测" text="相关性告诉我们“方向与强度”，不保证每个家庭都落在同一条线。" /></div></div>
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>开始预测 →</Button></div>
  </LessonStage>;
}

export function PredictionModelBlock({ onComplete }: BlockProps) {
  return <LessonStage className="glr-stage" title="把“趋势”写成一条可以计算的直线" description="线性回归先做一件朴素的事：用一条直线概括点云的中心方向。">
    <div className="glr-model-grid"><div><Plot slope={0.78} intercept={36} /><div className="glr-legend"><span className="glr-dot orange" />真实家庭数据 <span className="glr-line" />模型预测</div></div><div className="glr-model-notes"><StepTag>解释</StepTag><FormulaBlock ariaLabel="线性回归公式" formula={<><i>ŷ</i> = <i>w</i><i>x</i> + <i>b</i></>} /><div className="glr-symbols"><div><b>x</b><span>输入：父母平均身高</span></div><div><b>ŷ</b><span>输出：模型预测的孩子身高</span></div><div><b>w, b</b><span>参数：斜率与截距</span></div></div><Callout tone="green" label="模型的承诺" text="给我一个 x，我就给出一个可重复的预测 ŷ。" /></div></div>
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>看看预测错多少 →</Button></div>
  </LessonStage>;
}

export function ResidualBlock({ onComplete }: BlockProps) {
  const pair = heightPairs[8];
  const fitted = predict(pair.parent, 0.78, 36);
  const error = pair.child - fitted;
  return <LessonStage className="glr-stage" title="每个点都在问：我离直线有多远？" description="真实值与预测值之间的垂直差距，叫作残差（residual）。">
    <div className="glr-residual-grid"><div><Plot showResiduals /><div className="glr-residual-caption"><span className="glr-residual-mark" />橙色虚线 = 残差</div></div><div className="glr-residual-card"><StepTag>一个家庭</StepTag><Typography variant="h3" tone="accent">父母 176 cm</Typography><div className="glr-equation-row"><span>真实孩子身高</span><b>{pair.child} cm</b></div><div className="glr-equation-row"><span>模型预测</span><b>{fitted.toFixed(1)} cm</b></div><div className="glr-error-result"><span>残差</span><strong>{error.toFixed(1)} cm</strong></div><Typography variant="bodySmall" tone="muted">正负号保留方向：孩子比模型预测的更高，残差为正。</Typography></div></div>
    <Callout tone="orange" label="从一个点到全部点" text="如果有 16 个家庭，就有 16 个残差。我们需要把它们汇总成一个分数。" />
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>把误差汇总起来 →</Button></div>
  </LessonStage>;
}

export function LossFunctionBlock({ onComplete }: BlockProps) {
  return <LessonStage className="glr-stage" title="损失函数：给一条直线打分" description="损失函数把许多个预测误差，压缩成一个可比较的数字。">
    <div className="glr-loss-flow"><div className="glr-loss-step"><StepTag>1</StepTag><b>预测</b><span>ŷ = wx + b</span></div><i>→</i><div className="glr-loss-step"><StepTag>2</StepTag><b>计算残差</b><span>y − ŷ</span></div><i>→</i><div className="glr-loss-step is-final"><StepTag>3</StepTag><b>汇总损失</b><span>一个分数 L</span></div></div>
    <div className="glr-loss-formulas"><div><Typography variant="h3" tone="accent">平均绝对误差 MAE</Typography><FormulaBlock formula={<><i>L</i> = <span className="glr-formula-sum">1/n Σ</span> |<i>y</i> − <i>ŷ</i>|</>} /><Typography variant="bodySmall" tone="muted">每 1 cm 的误差，就增加约 1 分。</Typography></div><div><Typography variant="h3" tone="accent">均方误差 MSE</Typography><FormulaBlock formula={<><i>L</i> = <span className="glr-formula-sum">1/n Σ</span> (<i>y</i> − <i>ŷ</i>)²</>} /><Typography variant="bodySmall" tone="muted">大误差会被平方，惩罚更重。</Typography></div></div>
    <Callout tone="blue" label="基础直觉" text="损失不是“模型的错”这个标签，而是一条明确的评分规则：哪条线的分数更低，哪条线就更符合我们选定的目标。" />
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>比较两种评分方式 →</Button></div>
  </LessonStage>;
}

export function CompareLossBlock({ onComplete }: BlockProps) {
  const cases = [{ name: '小误差', errors: [1, -1, 2, -2] }, { name: '有一个大误差', errors: [1, -1, 2, -8] }];
  return <LessonStage className="glr-stage" title="为什么平方会改变“在意什么”？" description="同一组残差，用不同的损失函数，会产生不同的评价重点。">
    <div className="glr-compare-grid">{cases.map((item) => { const mae = item.errors.reduce((sum, value) => sum + Math.abs(value), 0) / item.errors.length; const mse = item.errors.reduce((sum, value) => sum + value * value, 0) / item.errors.length; return <article key={item.name}><StepTag>{item.name}</StepTag><div className="glr-error-bars">{item.errors.map((value, index) => <div key={index} className={Math.abs(value) >= 5 ? 'is-large' : ''} style={{ height: `${Math.min(100, Math.abs(value) * 10 + 14)}%` }}><span>{value > 0 ? '+' : ''}{value}</span></div>)}</div><div className="glr-metric-row"><span>MAE <b>{mae.toFixed(1)}</b></span><span>MSE <b>{mse.toFixed(1)}</b></span></div></article>; })}</div>
    <Callout tone="orange" label="关键转折" text="MSE 对离群的大误差更敏感，因此训练线性回归时常用它；MAE 则更容易保留“平均差多少厘米”的直觉。" />
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>进入小实验 →</Button></div>
  </LessonStage>;
}

export function FitLabBlock({ onComplete }: BlockProps) {
  const [slope, setSlope] = useState(0.78);
  const [intercept, setIntercept] = useState(36);
  const mae = useMemo(() => meanAbsoluteError(slope, intercept), [slope, intercept]);
  const mse = useMemo(() => meanSquaredError(slope, intercept), [slope, intercept]);
  return <LessonStage className="glr-stage glr-lab" variant="featured" title="小实验：你能让损失变小吗？" description="拖动斜率与截距，观察直线、残差和损失如何一起变化。">
    <div className="glr-lab-grid"><div><Plot slope={slope} intercept={intercept} showResiduals /><div className="glr-loss-score"><span>当前 MSE</span><strong>{mse.toFixed(2)}</strong><small>MAE {mae.toFixed(2)} cm</small></div></div><div className="glr-controls"><RangeControl label="斜率 w" min="0.4" max="1.2" step="0.01" value={slope} onChange={(event) => setSlope(Number(event.currentTarget.value))} digits={2} /><RangeControl label="截距 b" min="-20" max="80" step="1" value={intercept} onChange={(event) => setIntercept(Number(event.currentTarget.value))} suffix=" cm" /><div className="glr-parameter-card"><div><span>w</span><b>{slope.toFixed(2)}</b></div><div><span>b</span><b>{intercept.toFixed(0)}</b></div><div><span>预测 176 cm</span><b>{predict(176, slope, intercept).toFixed(1)} cm</b></div></div><Typography variant="bodySmall" tone="muted">目标不是让每个点都落在线上，而是让整体损失足够小。</Typography></div></div>
    <div className="glr-action"><Button variant="primary" onClick={onComplete}>完成这条认知链 →</Button></div>
  </LessonStage>;
}

export function SummaryBlock() {
  return <ContentBlock className="glr-summary" title="从高尔顿的点云，到训练模型的第一步" subtitle="线性回归与损失函数已经接上了。">
    <div className="glr-summary-grid"><div><span className="glr-summary-number">01</span><Typography variant="h3" tone="accent">数据先提出问题</Typography><Typography variant="body" tone="muted">父母与孩子身高的点云告诉我们：有趋势，但不完美。</Typography></div><div><span className="glr-summary-number">02</span><Typography variant="h3" tone="accent">直线给出预测</Typography><Typography variant="body" tone="muted">ŷ = wx + b 把输入变成可重复的输出。</Typography></div><div><span className="glr-summary-number">03</span><Typography variant="h3" tone="accent">损失定义“好”</Typography><Typography variant="body" tone="muted">MAE、MSE 都是评分规则；它们会影响模型在意什么。</Typography></div></div>
    <div className="glr-source-note"><Typography variant="bodySmall" tone="muted">历史来源：Francis Galton, “Regression towards mediocrity in hereditary stature”, Journal of the Anthropological Institute, 1886。图中数值为教学示意重绘。</Typography></div>
  </ContentBlock>;
}
