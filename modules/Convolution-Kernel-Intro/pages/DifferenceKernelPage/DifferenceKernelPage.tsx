import type { ReactNode } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './DifferenceKernelPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
const LAP_X = [[0, 0, 0], [1, -2, 1], [0, 0, 0]];
const LAP_Y = [[0, 1, 0], [0, -2, 0], [0, 1, 0]];
const LAPLACIAN = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

function Matrix({ values, label, row = false }: { values: number[][]; label: string; row?: boolean }) {
  return (
    <div className={'ck-diff-kernel__matrix' + (row ? ' is-row' : '')} role="img" aria-label={label}>
      {values.flatMap((line, rowIndex) => line.map((value, columnIndex) => (
        <div key={rowIndex + '-' + columnIndex} className={value < 0 ? 'is-negative' : value > 1 ? 'is-heavy' : ''}>
          <MathFormulaStatic latex={String(value)} />
        </div>
      )))}
    </div>
  );
}

function Card({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <article className="ck-diff-kernel__card">
      <Typography as="h3" variant="h3" tone="accent">{title}</Typography>
      <div className="ck-diff-kernel__card-main">{children}</div>
      <Typography variant="bodySmall" tone="muted" className="ck-diff-kernel__card-note">{note}</Typography>
    </article>
  );
}

export function DifferenceKernelPage() {
  return (
    <ContentBlock headingLevel={1} className="ck-diff-kernel" title="从差分到卷积核" subtitle="一个方向的变化，如何变成可以检测边缘的二维模式。">
      <div className="ck-diff-kernel__body">
        <section className="ck-diff-kernel__group">
          <header className="ck-diff-kernel__group-head">
            <span className="ck-diff-kernel__group-number"><Typography as="span" variant="h3" tone="light">1</Typography></span>
            <Typography as="h2" variant="h3" tone="accent">Sobel：把一维差分扩展成方向核</Typography>
          </header>
          <div className="ck-diff-kernel__cards">
            <Card title="基础差分" note="比较左右像素的变化"><Matrix values={[[-1, 0, 1]]} label="一维左右差分核" row /></Card>
            <Typography as="span" variant="h1" tone="accent" className="ck-diff-kernel__operator">→</Typography>
            <Card title="Sobel X" note="检测竖直边缘；中心行乘 2"><Matrix values={SOBEL_X} label="Sobel X：检测竖直边缘" /></Card>
            <Card title="Sobel Y" note="检测水平边缘；中心列乘 2"><Matrix values={SOBEL_Y} label="Sobel Y：检测水平边缘" /></Card>
          </div>
        </section>
        <section className="ck-diff-kernel__group">
          <header className="ck-diff-kernel__group-head">
            <span className="ck-diff-kernel__group-number"><Typography as="span" variant="h3" tone="light">2</Typography></span>
            <Typography as="h2" variant="h3" tone="accent">Laplacian：两个方向的二阶差分相加</Typography>
          </header>
          <div className="ck-diff-kernel__cards ck-diff-kernel__cards--laplacian">
            <Card title="x 方向" note="一个方向上的二阶变化"><Matrix values={LAP_X} label="x 方向二阶差分核" /></Card>
            <Typography as="span" variant="h1" tone="accent" className="ck-diff-kernel__operator">+</Typography>
            <Card title="y 方向" note="另一个方向上的二阶变化"><Matrix values={LAP_Y} label="y 方向二阶差分核" /></Card>
            <Typography as="span" variant="h1" tone="accent" className="ck-diff-kernel__operator">=</Typography>
            <Card title="Laplacian" note="合并两个方向的变化"><Matrix values={LAPLACIAN} label="Laplacian 二阶差分核" /></Card>
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}
