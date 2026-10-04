import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../shared/react';

// Only the notation used by these two convolution lessons is recognized here.
// Fractions and indexed symbols stay intact as semantic terms, preserving MathLive layout.
const TERMS = /\\frac\{\\partial L\}\{\\partial (?:y|z_\{ij\}|K(?:_\{\d{2}\})?)\}|\\sum(?:_\{i,j\})?|\\mathrm\{GT\}|\\eta|\\ast|(?<![A-Za-z\\])(?:K_\{\\mathrm\{new\}\}|[GKXaz]_\{(?:\d{2}|ij)\}|g(?:\^\{\(\d{2}\)\})?_\{(?:\d{2}|ij)\}|[LGKXy](?![A-Za-z]))/g;

function explanation(term: string, windowed: boolean): string {
  if (term.startsWith('\\frac')) {
    if (term.includes('z_')) return '损失对这个特征值的梯度：输出误差乘以对应的固定全连接权重。';
    if (term.includes('partial K')) return '损失对卷积核的梯度：告诉每个权重应怎样调整。';
    return '损失对输出的梯度；本例等于预测输出减去目标值。';
  }
  if (term.startsWith('\\sum')) return '求和：将下标指定的各项相加；i、j 分别表示行、列位置。';
  if (term === '\\eta') return 'η：学习率，控制每次沿梯度调整权重的幅度。';
  if (term === '\\ast') return '卷积运算：窗口与卷积核的对应位置相乘，再将结果相加。';
  if (term === '\\mathrm{GT}') return 'GT：真实目标，本例固定为 1.00。';
  if (term === 'L') return 'L：损失，用于衡量预测输出与真实目标的差距。';
  if (term === 'y') return windowed ? 'y：四个特征值经过固定全连接权重加权求和得到的预测输出。' : 'y：输入窗口与卷积核计算得到的预测输出。';
  if (term === 'K_{\\mathrm{new}}') return '更新后的卷积核；由原权重减去学习率乘总梯度得到。';
  if (term === 'K') return 'K：卷积核权重矩阵；同一个卷积核用于每个窗口。';
  if (term.startsWith('K_')) return '卷积核在下标位置的一个权重；下标依次表示行、列。';
  if (term.startsWith('a_')) return 'a：该特征对应的全连接权重；本例固定为 0.50，传递梯度但不更新。';
  if (term.startsWith('z_')) return 'z：特征图中对应位置的数值，由该位置的输入窗口与卷积核计算得到。';
  if (term === 'X') return 'X：输入图像，本例在训练过程中保持不变。';
  if (term.startsWith('X_')) return windowed ? 'X 的下标表示窗口位置；这是该窗口覆盖的 2×2 输入块。' : 'X 在下标位置的输入像素；下标依次表示行、列。';
  if (term === 'G') return windowed ? 'G：卷积核的总梯度矩阵，等于四个窗口的梯度贡献逐格相加。' : 'G：卷积核的梯度矩阵，每格由输出梯度乘对应输入像素得到。';
  if (term.startsWith('G_')) return windowed ? 'G 的下标表示窗口位置；这是该窗口贡献的 2×2 卷积核梯度矩阵。' : '梯度矩阵在下标位置的元素，对应同位置的卷积核权重。';
  return windowed ? 'g：某一个卷积核权重收到的梯度贡献；上标表示窗口，下标表示权重位置。' : 'g：该位置的卷积核梯度，等于输出梯度乘对应输入像素。';
}

export function KernelFormula({ latex, className = '', windowed = false, tooltipPlacement = 'bottom' }: { latex: string; className?: string; windowed?: boolean; tooltipPlacement?: 'bottom' | 'top' }) {
  const parts = [];
  let start = 0;
  for (const match of latex.matchAll(TERMS)) {
    const position = match.index;
    if (position > start) parts.push(<MathFormulaStatic key={`s${start}`} latex={latex.slice(start, position)} />);
    parts.push(<MathFormulaTerm key={`t${position}`} latex={match[0]} tooltipVariant="body" tooltipPlacement={tooltipPlacement} tooltip={explanation(match[0], windowed)} />);
    start = position + match[0].length;
  }
  if (start < latex.length) parts.push(<MathFormulaStatic key={`s${start}`} latex={latex.slice(start)} />);
  return <MathFormulaBlock appearance="plain" className={className} ariaLabel={latex}>{parts}</MathFormulaBlock>;
}
