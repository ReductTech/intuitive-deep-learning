import { Fragment, useRef, useState, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { DishIcon, type DishId } from './DishIcon';
import { ReluGlyph } from './CellChain';
import { WeatherIcon } from './WeatherIcon';
import './RNNGradientPage.css';

export interface RNNGradientPageProps {
  onComplete: () => void;
}

type FocusPart = 'ssr' | 'predicted' | 'whole' | 'x' | 'loss' | 'predictedFactor' | 'hidden' | 'sum' | 'end';

interface Factor {
  key: string;
  numerator: string;
  denominator: string;
  caption: string;
  focus: Exclude<FocusPart, 'ssr' | 'predicted' | 'whole' | 'x' | 'end'>;
}

const factors: Factor[] = [
  { key: 'loss', numerator: 'd SSR', denominator: 'd Predicted', caption: '误差对预测值', focus: 'loss' },
  { key: 'predicted', numerator: 'd Predicted', denominator: 'd y₁', caption: '预测值对隐藏层', focus: 'predictedFactor' },
  { key: 'hidden', numerator: 'd y₁', denominator: 'd x₁', caption: '隐藏层对求和', focus: 'hidden' },
  { key: 'sum', numerator: 'd x₁', denominator: 'd W₁', caption: '求和对 W₁', focus: 'sum' },
];

interface LessonStep {
  focus: FocusPart;
  text: string;
  button: string;
}

const lesson: LessonStep[] = [
  { focus: 'ssr', text: 'SSR 是 Sum of Squared Residuals（残差平方和）：把每个“真实值 − Predicted”的差先平方，再全部加起来。', button: '认识 Predicted' },
  { focus: 'predicted', text: 'Predicted 就是模型最后输出的预测值：图中两个时间步最右侧的菜品卡片。', button: '看整体分式' },
  { focus: 'whole', text: '整个分式表示：误差对 W₁ 的变化有多敏感。链式法则把一条路径拆成四个局部变化率，再相乘。', button: '找出 x₁' },
  { focus: 'x', text: 'x₁ 不是原始天气卡片，而是进入 y₁ 之前的求和结果；下一行对应 x₂。红圈里的输入、权重、食物隐状态和 SUM 一起决定它。', button: '看第一段' },
  { focus: 'loss', text: '第一段 dSSR / dPredicted：分子问“预测值变一点，误差变多少”；分母指出变化发生在 Predicted。', button: '看第二段' },
  { focus: 'predictedFactor', text: '第二段 dPredicted / dy₁：分子是输出 Predicted，分母是隐藏层 y₁；它对应 y₁ 经过 W₃ 到输出的路径。上一个时间步的 W₃ 输出还要经过 W₂，才能进入下一行的 x₂。', button: '看第三段' },
  { focus: 'hidden', text: '第三段 dy₁ / dx₁：分子是 ReLU 后的 y₁，分母是 ReLU 前的 x₁；它说明激活函数让哪一部分通过。', button: '看第四段' },
  { focus: 'sum', text: '第四段 dx₁ / dW₁：分子是 SUM 的结果，分母是 W₁；它把输入路径对 W₁ 的影响接上。', button: '收束' },
  { focus: 'end', text: '我们发现，梯度下降的公式和循环迭代必经之路 W₂ 密切相关：每经过一个时间步就会经过一次 W₂，但 W₂ 不会随迭代次数发生改变。', button: '' },
];

function Arrow() {
  return <Typography as="span" variant="h3" tone="light" className="nrnn-gradient__graph-arrow" aria-hidden="true">→</Typography>;
}

function GraphNode({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`nrnn-gradient__graph-node ${className}`}>{children}</div>;
}

function RnnGradientRow({ row, focus, dish }: { row: 1 | 2; focus: FocusPart; dish: DishId }) {
  const activation = row === 1 ? 'y₁' : 'y₂';
  const sum = row === 1 ? 'x₁' : 'x₂';
  const rowIsPredicted = focus === 'predicted';
  const rowIsX = focus === 'x';
  const factorHighlight = (part: string) => focus === part || focus === 'end';

  return (
    <div className={`nrnn-gradient__graph-row nrnn-gradient__graph-row--${row}`}>
      <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-gradient__row-label">{row === 1 ? '时间步 t' : '时间步 t+1'}</Typography>
      <div className={`nrnn-gradient__graph-path${rowIsX ? ' is-ringed' : ''}`}>
        {rowIsX && <Typography as="span" variant="bodySmall" tone="danger" className="nrnn-gradient__ring-label">x{row === 1 ? '₁' : '₂'}：进入 y{row === 1 ? '₁' : '₂'} 之前</Typography>}
        <GraphNode className="is-weather">
          <WeatherIcon weather="rain" label="雨天天气卡片" />
          <Typography as="span" variant="bodySmall" tone="muted">雨天</Typography>
        </GraphNode>
        <Arrow />
        <GraphNode className={factorHighlight('sum') ? 'is-highlighted' : ''}>
          <Typography as="strong" variant="h3" tone="main">W₁</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">天气矩阵</Typography>
        </GraphNode>
        <Arrow />
        <GraphNode className={`is-sum-node${row === 2 ? ' is-carry-target' : ''}${factorHighlight('sum') ? ' is-highlighted' : ''}`}>
          <Typography as="strong" variant="h3" tone="main">SUM</Typography>
          <Typography as="span" variant="bodySmall" tone="accent">{sum}</Typography>
        </GraphNode>
        <Arrow />
        <GraphNode className={`is-relu${factorHighlight('hidden') ? ' is-highlighted' : ''}`}>
          <ReluGlyph />
          <Typography as="span" variant="bodySmall" tone="main">{activation}</Typography>
        </GraphNode>
        <Arrow />
        <GraphNode className={`is-hidden${factorHighlight('predictedFactor') ? ' is-highlighted' : ''}`}>
          <Typography as="strong" variant="h3" tone="main">W₃</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">食物隐状态</Typography>
        </GraphNode>
        <Arrow />
        <GraphNode className={`is-output${rowIsPredicted || factorHighlight('loss') ? ' is-ringed' : ''}`}>
          <Typography as="span" variant="bodySmall" tone="muted">Predicted</Typography>
          <DishIcon dish={dish} label={dish === 'pie' ? '苹果派' : dish === 'steak' ? '牛排' : '汉堡'} />
        </GraphNode>
      </div>
    </div>
  );
}

function MathText({ value, focus }: { value: string; focus: FocusPart }) {
  const parts = value.split(/(SSR|Predicted|x₁|x₂)/g);
  return (
    <>
      {parts.map((part, index) => {
        const shouldRing = (focus === 'ssr' && part === 'SSR')
          || (focus === 'predicted' && part === 'Predicted')
          || (focus === 'x' && (part === 'x₁' || part === 'x₂'));
        return shouldRing
          ? <span className="nrnn-gradient__formula-token" key={`${part}-${index}`}>{part}</span>
          : <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}

function Fraction({ numerator, denominator, focus = 'end' }: { numerator: string; denominator: string; focus?: FocusPart }) {
  return (
    <span className="nrnn-gradient__fraction">
      <span className="edu-fraction-numerator"><MathText value={numerator} focus={focus} /></span>
      <span className="edu-fraction-denominator"><MathText value={denominator} focus={focus} /></span>
    </span>
  );
}

export function RNNGradientPage({ onComplete }: RNNGradientPageProps) {
  const [step, setStep] = useState(0);
  const completedRef = useRef(false);
  const current = lesson[step];

  const advance = () => {
    const next = Math.min(step + 1, lesson.length - 1);
    setStep(next);
    if (next === lesson.length - 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const activeFactor = factors.findIndex((factor) => factor.focus === current.focus);

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-gradient"
      title="梯度下降：沿着展开的 RNN 往回看"
      subtitle="先认出 SSR、Predicted 和 x₁，再把每个分式的分子、分母对回图中的一段路径。"
    >
      <section className="nrnn-gradient__unfold" aria-label="展开后的两行 RNN 计算图">
        <RnnGradientRow row={1} focus={current.focus} dish="pie" />
        <RnnGradientRow row={2} focus={current.focus} dish="steak" />
        <div className="nrnn-gradient__carry-wire" aria-hidden="true">
          <span className="nrnn-gradient__carry-vertical" />
          <span className="nrnn-gradient__carry-to-sum">
            <i className="nrnn-gradient__carry-drop" />
            <i className="nrnn-gradient__carry-bottom" />
            <i className="nrnn-gradient__carry-rise" />
          </span>
          <GraphNode className="nrnn-gradient__carry-weight">
            <Typography as="strong" variant="bodySmall" tone="main">W₂ · 食物矩阵</Typography>
          </GraphNode>
        </div>
      </section>

      <section className={`nrnn-gradient__formula${current.focus === 'whole' ? ' is-ringed' : ''}`} aria-label="梯度公式">
        <Fraction numerator="d SSR" denominator="d W₁" focus={current.focus} />
        <Typography as="span" variant="h3" tone="main" className="nrnn-gradient__operator">=</Typography>
        {factors.map((factor, index) => (
          <Fragment key={factor.key}>
            {index > 0 && <Typography as="span" variant="h3" tone="light" className="nrnn-gradient__operator">×</Typography>}
            <span className={`nrnn-gradient__factor${activeFactor === index ? ' is-active' : ''}${activeFactor !== -1 && activeFactor !== index && current.focus !== 'whole' && current.focus !== 'end' ? ' is-dim' : ''}`}>
              <Fraction numerator={factor.numerator} denominator={factor.denominator} focus={current.focus} />
              <Typography as="span" variant="bodySmall" tone="muted">{factor.caption}</Typography>
            </span>
          </Fragment>
        ))}
        <Typography as="span" variant="h3" tone="light" className="nrnn-gradient__operator">+ ⋯</Typography>
      </section>

      <div className={`nrnn-gradient__status${current.focus === 'end' ? ' is-success' : ''}`}>
        <Typography as="p" variant="body" tone="inherit">{current.text}</Typography>
        {current.button && (
          <Button variant="primary" onClick={advance}>
            <Typography as="span" variant="body" tone="inherit">{current.button}</Typography>
          </Button>
        )}
      </div>
    </ContentBlock>
  );
}
