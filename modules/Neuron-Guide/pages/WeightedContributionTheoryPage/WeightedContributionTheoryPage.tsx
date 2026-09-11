import { ContentBlock, FormulaBlock, FormulaTerm, Typography } from '../../../shared/react';
import "./WeightedContributionTheoryPage.css";

function ColumnVector({ symbol, tone, values }: { symbol: 'W' | 'X'; tone: 'warning' | 'accent'; values: string[] }) {
  return (
    <div className="ng-matrix-definition-ppt__vector-definition">
      <FormulaBlock ariaLabel={`${symbol} 的列向量定义`}>
        <div className="ng-matrix-definition-ppt__vector-equation">
          <FormulaTerm tooltip={symbol === 'W' ? 'W：由三个权重组成的列向量' : 'X：由三个输入组成的列向量'}>{symbol}</FormulaTerm>
          <Typography as="span" variant="body" tone="muted">=</Typography>
          <Typography as="span" variant="body" tone="inherit" className={`ng-matrix-definition-ppt__column ng-matrix-definition-ppt__column--${tone}`}>
            {values.map((value, index) => (
              <FormulaTerm tooltip={symbol === 'W' ? `w${index + 1}：第 ${index + 1} 个输入的权重` : `x${index + 1}：第 ${index + 1} 个输入`} key={value}>{value}</FormulaTerm>
            ))}
          </Typography>
        </div>
      </FormulaBlock>
      <Typography variant="body" tone="muted">{symbol === 'W' ? '权重列向量' : '输入列向量'} · 3 × 1</Typography>
    </div>
  );
}

export function WeightedContributionTheoryPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ng-lecture-stage ng-matrix-definition-ppt"
      title="从加权求和到矩阵表示"
      subtitle="把权重和输入分别写成向量，同一条加权求和可以写成一次矩阵乘法。"
    >
      <section className="ng-matrix-definition-ppt__expanded">
        <div>
          <Typography variant="body" tone="warning">展开写法</Typography>
          <Typography as="h3" variant="h3" tone="accent">三个输入分别加权，再相加</Typography>
        </div>
        <FormulaBlock ariaLabel="输出 y 等于三个输入的加权和">
          <FormulaTerm tooltip="y：人工神经元的输出">y</FormulaTerm>
          {' = '}
          <FormulaTerm tooltip="第一个输入的加权贡献">w₁x₁</FormulaTerm>
          {' + '}
          <FormulaTerm tooltip="第二个输入的加权贡献">w₂x₂</FormulaTerm>
          {' + '}
          <FormulaTerm tooltip="第三个输入的加权贡献">w₃x₃</FormulaTerm>
        </FormulaBlock>
      </section>

      <section className="ng-matrix-definition-ppt__vectors">
        <div className="ng-matrix-definition-ppt__vectors-heading">
          <Typography variant="body" tone="warning">把两组数分别收进向量</Typography>
          <Typography variant="body" tone="muted">一一对应：权重 W · 输入 X</Typography>
        </div>
        <ColumnVector symbol="W" tone="warning" values={['w₁', 'w₂', 'w₃']} />
        <ColumnVector symbol="X" tone="accent" values={['x₁', 'x₂', 'x₃']} />
      </section>

      <section className="ng-matrix-definition-ppt__vertical-expansion">
        <div className="ng-matrix-definition-ppt__equation-label">
          <Typography variant="body" tone="success">合并写法</Typography>
          <Typography as="strong" variant="h3" tone="accent">一次矩阵乘法</Typography>
        </div>
        <div className="ng-matrix-definition-ppt__operand">
          <Typography variant="subtitle" tone="warning">Wᵀ</Typography>
          <div className="ng-matrix-definition-ppt__row-vector edu-formula" aria-label="W 转置后的权重行向量">
            {['w₁', 'w₂', 'w₃'].map((value, index) => <FormulaTerm tooltip={`第 ${index + 1} 个权重`} key={value}>{value}</FormulaTerm>)}
          </div>
        </div>
        <Typography variant="h3" tone="muted">×</Typography>
        <div className="ng-matrix-definition-ppt__operand">
          <Typography variant="subtitle" tone="accent">X</Typography>
          <div className="ng-matrix-definition-ppt__column ng-matrix-definition-ppt__column--accent edu-formula" aria-label="输入列向量 X">
            {['x₁', 'x₂', 'x₃'].map((value, index) => <FormulaTerm tooltip={`第 ${index + 1} 个输入`} key={value}>{value}</FormulaTerm>)}
          </div>
        </div>
        <Typography variant="h3" tone="muted">=</Typography>
        <div className="ng-matrix-definition-ppt__output">
          <Typography variant="body" tone="success">输出</Typography>
          <Typography variant="h1" tone="success">y</Typography>
        </div>
      </section>
    </ContentBlock>
  );
}




