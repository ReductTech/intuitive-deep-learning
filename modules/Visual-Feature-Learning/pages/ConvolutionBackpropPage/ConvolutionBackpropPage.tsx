import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { BEFORE, INITIAL_KERNEL, LEARNING_RATE, UPDATED_KERNEL } from '../../services/convolutionBackpropDemo';
import './ConvolutionBackpropPage.css';

const indexName = (index: number) => `w${Math.floor(index / 3) + 1}${index % 3 + 1}`;
const decimal = (value: number, digits = 2) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;
const signed = (value: number, digits = 3) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(digits)}`;

export function ConvolutionBackpropPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const terms = selected === null ? null : BEFORE.contributions[selected];

  return <ContentBlock
    className="vfl-kernel-update-page"
    headingLevel={1}
    title="卷积核权重的梯度更新"
    subtitle="根据分类损失对各权重的梯度，按梯度下降规则更新 3 × 3 卷积核。"
  >
    <div className="vfl-kernel-update-equation">
      <MathFormulaBlock ariaLabel="新卷积核等于旧卷积核减去学习率乘损失对卷积核的梯度">
        <MathFormulaStatic latex="W^{\mathrm{new}}=W^{\mathrm{old}}-\eta\nabla_W L" />
      </MathFormulaBlock>
      <Typography as="p" variant="body" tone="muted">本例学习率 η = {LEARNING_RATE}；每个权重对应一个梯度值。</Typography>
    </div>

    <div className="vfl-kernel-update-matrices" aria-label="更新前卷积核、九个梯度与更新后卷积核">
      <section className="vfl-kernel-update-column" aria-label="更新前的卷积核">
        <Typography as="h2" variant="h3" tone="accent">更新前的卷积核</Typography>
        <div className="vfl-kernel-update-grid vfl-kernel-update-old" role="img" aria-label="更新前的九个权重">
          {INITIAL_KERNEL.map((value, index) => <div key={index} className={selected === index ? 'is-linked' : ''}>
            <Typography as="span" variant="body" tone="inherit">{decimal(value)}</Typography>
          </div>)}
        </div>
      </section>

      <Typography as="span" variant="h2" tone="accent" className="vfl-kernel-update-operator">− {LEARNING_RATE} ×</Typography>

      <section className="vfl-kernel-update-column" aria-label="损失对卷积核各权重的梯度">
        <Typography as="h2" variant="h3" tone="warning">损失对各权重的梯度</Typography>
        <div className="vfl-kernel-update-grid vfl-kernel-update-gradients" role="group" aria-label="悬浮任意梯度格查看来源" onMouseLeave={() => setSelected(null)}>
          {BEFORE.gradient.map((value, index) => <Button
            key={index}
            type="button"
            variant="default"
            className={`${value >= 0 ? 'is-positive' : 'is-negative'}${selected === index ? ' is-linked' : ''}`}
            aria-label={`${indexName(index)} 的梯度为 ${signed(value)}；悬浮或聚焦查看来源`}
            aria-pressed={selected === index}
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onClick={() => setSelected(index)}
          ><Typography as="span" variant="body" tone="inherit">{signed(value, 2)}</Typography></Button>)}
        </div>
      </section>

      <Typography as="span" variant="h2" tone="accent" className="vfl-kernel-update-operator">＝</Typography>

      <section className="vfl-kernel-update-column" aria-label="更新后的卷积核">
        <Typography as="h2" variant="h3" tone="success">更新后的卷积核</Typography>
        <div className="vfl-kernel-update-grid vfl-kernel-update-new" role="img" aria-label="更新后的九个权重">
          {UPDATED_KERNEL.map((value, index) => <div key={index} className={`${BEFORE.gradient[index] >= 0 ? 'has-decreased' : 'has-increased'}${selected === index ? ' is-linked' : ''}`}>
            <Typography as="span" variant="body" tone="inherit">{decimal(value)}</Typography>
          </div>)}
        </div>
      </section>
    </div>

    <div className="vfl-kernel-update-source" role="status" aria-live="polite">
      {selected === null ? <>
        <Typography as="strong" variant="h3" tone="accent">梯度的计算路径</Typography>
        <Typography as="p" variant="body" tone="muted">将指针移至任一梯度值，查看分类损失对相应权重的影响路径。</Typography>
      </> : <>
        <div className="vfl-kernel-update-source-head">
          <Typography as="strong" variant="h3" tone="accent">{indexName(selected)} 的梯度来源</Typography>
          <Typography as="p" variant="body" tone="muted">类别标签 3 → 分类损失 L → 卷积输出梯度 → 当前权重梯度</Typography>
        </div>
        <div className="vfl-kernel-update-source-terms">
          {terms?.map((term, index) => <div key={index}>
            <Typography as="span" variant="body" tone="muted">位置 {index + 1}</Typography>
            <Typography as="span" variant="body" tone="accent">{signed(term.delta)} × {term.pixel}</Typography>
          </div>)}
          <Typography as="strong" variant="body" tone="warning">贡献之和 ≈ {signed(BEFORE.gradient[selected])}</Typography>
        </div>
        <Typography as="p" variant="body" tone="accent" className="vfl-kernel-update-source-result">
          {indexName(selected)}：{decimal(INITIAL_KERNEL[selected])} − {LEARNING_RATE} × ({signed(BEFORE.gradient[selected])}) ≈ {decimal(UPDATED_KERNEL[selected], 3)}
        </Typography>
      </>}
    </div>
  </ContentBlock>;
}
