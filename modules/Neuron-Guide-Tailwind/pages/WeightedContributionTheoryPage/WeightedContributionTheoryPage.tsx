import type { ReactNode } from 'react';
import { ContentBlock, FormulaBlock, FormulaTerm, Typography } from '../../../shared/react';
import "./WeightedContributionTheoryPage.css";
import { effectiveInput, formatScore, normalizedWeight, useLesson, weightedSum } from '../../LessonContext';

const subscripts = ['₁', '₂', '₃'];

function FormulaVariable({ children, tooltip, className }: { children: ReactNode; tooltip: string; className?: string }) {
  return <FormulaTerm className={className} tooltip={tooltip}>{children}</FormulaTerm>;
}

function VectorBracket({
  values,
  tone,
  direction,
  tooltips,
}: {
  values: string[];
  tone: 'warm' | 'blue';
  direction: 'row' | 'column';
  tooltips: string[];
}) {
  return (
    <span className={`ngtw-matrix-representation__bracket-vector relative min-w-[92px] items-center gap-[8px] p-[12px_15px] text-center ngtw-matrix-representation__bracket-vector--${tone} ngtw-matrix-representation__bracket-vector--${direction}`}>
      {values.map((value, index) => (
        <FormulaVariable key={`${value}-${index}`} tooltip={tooltips[index]}>{value}</FormulaVariable>
      ))}
    </span>
  );
}

export function WeightedContributionTheoryPage() {
  const { scenario, state } = useLesson();
  const rawValues = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const values = scenario.factors.map((factor, index) => effectiveInput(factor, rawValues[index]));
  const weights = scenario.factors.map((factor) => normalizedWeight(factor.suggestedImportance));
  const total = weightedSum(scenario, rawValues);

  return (
    <ContentBlock
      headingLevel={1}
      className="ngtw-lecture-stage ngtw-matrix-representation"
      title="从加权求和到矩阵表示"
      subtitle="刚才那一长串乘法没有变，只是换了一种更紧凑的写法。"
    >
      <section className="ngtw-matrix-representation__expanded">
        <div className="ngtw-matrix-representation__section-copy grid min-w-0 content-center gap-[3px]">
          <Typography variant="body" tone="warning">上一页的写法</Typography>
          <Typography as="h3" variant="h3" tone="accent">三个输入分别加权，再相加</Typography>
        </div>
        <FormulaBlock ariaLabel="三个输入的加权和以及当前数值">
          <div className="ngtw-matrix-representation__formula-line">
            <FormulaVariable tooltip="y：三个输入经过加权后相加得到的总输入。">y</FormulaVariable>
            {' = '}
            {subscripts.map((subscript, index) => (
              <span key={subscript}>
                {index > 0 && ' + '}
                <FormulaVariable tooltip={`w${subscript}x${subscript}：第 ${index + 1} 个输入乘以对应权重后的贡献。`}>
                  w{subscript}x{subscript}
                </FormulaVariable>
              </span>
            ))}
          </div>
          <div className="ngtw-matrix-representation__formula-detail">
            {'= '}
            {weights.map((weight, index) => (
              <span key={index}>
                {index > 0 && ' + '}
                <FormulaVariable tooltip={`第 ${index + 1} 个权重与输入的数值：${formatScore(weight)} × ${formatScore(values[index])}。`}>
                  {formatScore(weight)} × {formatScore(values[index])}
                </FormulaVariable>
              </span>
            ))}
            {' = '}
            <FormulaVariable tooltip={`y：当前三个加权贡献相加后的总输入，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
        </FormulaBlock>
      </section>

      <div className="ngtw-matrix-representation__down-arrow grid place-items-center" aria-hidden="true">↓</div>
      <div className="ngtw-matrix-representation__bridge-label justify-self-center rounded-[999px] bg-[#edf4fd] p-[5px_25px] text-center">
        <Typography as="strong" variant="body" tone="accent">把权重放在一起，把输入放在一起</Typography>
      </div>

      <section className="ngtw-matrix-representation__vectors grid min-w-0 min-h-0 grid-cols-[minmax(0,_1fr)_42px_minmax(0,_1fr)] items-stretch gap-[12px]" aria-label="权重向量和输入向量">
        <article className="ngtw-matrix-representation__vector-card grid min-w-0 grid-cols-[minmax(120px,_.7fr)_minmax(0,_1.3fr)] items-center gap-[12px] rounded-[12px] bg-[#fffdfb] p-[12px_16px] ngtw-matrix-representation__vector-card--weights">
          <div className="ngtw-matrix-representation__card-copy grid min-w-0 content-center gap-[3px]">
            <Typography variant="body" tone="warning">权重</Typography>
            <Typography variant="bodySmall" tone="muted">把三个权重排成一个行向量。</Typography>
          </div>
          <FormulaBlock ariaLabel="权重行向量 W 转置">
            <div className="ngtw-matrix-representation__vector-equation flex min-w-0 items-center justify-center gap-[8px]">
              <FormulaVariable tooltip="Wᵀ：由三个输入权重组成的行向量。">Wᵀ</FormulaVariable>
              {' = '}
              <VectorBracket
                tone="warm"
                direction="row"
                values={weights.map(formatScore)}
                tooltips={weights.map((weight, index) => `w${subscripts[index]}：第 ${index + 1} 个因素的权重，为 ${formatScore(weight)}。`)}
              />
            </div>
          </FormulaBlock>
        </article>

        <div className="ngtw-matrix-representation__multiply grid place-items-center" aria-hidden="true">×</div>

        <article className="ngtw-matrix-representation__vector-card grid min-w-0 grid-cols-[minmax(120px,_.7fr)_minmax(0,_1.3fr)] items-center gap-[12px] rounded-[12px] bg-[#fffdfb] p-[12px_16px] ngtw-matrix-representation__vector-card--inputs bg-[#fbfdff]">
          <div className="ngtw-matrix-representation__card-copy grid min-w-0 content-center gap-[3px]">
            <Typography variant="body" tone="accent">输入</Typography>
            <Typography variant="bodySmall" tone="muted">把三个输入排成一个列向量。</Typography>
          </div>
          <FormulaBlock ariaLabel="输入列向量 X">
            <div className="ngtw-matrix-representation__vector-equation flex min-w-0 items-center justify-center gap-[8px]">
              <FormulaVariable tooltip="X：由三个输入组成的列向量。">X</FormulaVariable>
              {' = '}
              <VectorBracket
                tone="blue"
                direction="column"
                values={values.map(formatScore)}
                tooltips={values.map((value, index) => `x${subscripts[index]}：第 ${index + 1} 个输入，为 ${formatScore(value)}。`)}
              />
            </div>
          </FormulaBlock>
        </article>
      </section>

      <section className="ngtw-matrix-representation__compact">
        <div className="ngtw-matrix-representation__section-copy grid min-w-0 content-center gap-[3px]">
          <Typography variant="body" tone="success">合并写法</Typography>
          <Typography as="h3" variant="h3" tone="accent">一次矩阵乘法</Typography>
        </div>
        <FormulaBlock ariaLabel="权重转置乘以输入向量得到神经元总输入">
          <div className="ngtw-matrix-representation__compact-formula">
            <FormulaVariable tooltip="y：神经元接收到的总输入。">y</FormulaVariable>
            {' = '}
            <FormulaVariable tooltip="Wᵀ：权重组成的行向量。">Wᵀ</FormulaVariable>
            {' × '}
            <FormulaVariable tooltip="X：输入组成的列向量。">X</FormulaVariable>
            {' = '}
            <FormulaVariable tooltip={`当前矩阵乘法的结果，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
          <div className="ngtw-matrix-representation__compact-detail">
            {'= '}
            <FormulaVariable tooltip="WᵀX：把对应位置的权重和输入相乘，再把结果相加。">
              {weights.map((weight, index) => `${formatScore(weight)} × ${formatScore(values[index])}`).join(' + ')}
            </FormulaVariable>
            {' = '}
            <FormulaVariable tooltip={`y：矩阵表示与展开写法得到相同结果，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
        </FormulaBlock>
      </section>

      <aside className="ngtw-matrix-representation__key-point flex min-w-0 items-baseline justify-center gap-[8px] rounded-[10px] bg-[#fffaf0] p-[7px_14px]">
        <Typography as="strong" variant="body" tone="warning">理解重点：</Typography>
        <Typography as="span" variant="bodySmall" tone="muted">矩阵写法没有发明新的计算，只是把同样的加权过程写得更紧凑。</Typography>
      </aside>
    </ContentBlock>
  );
}

