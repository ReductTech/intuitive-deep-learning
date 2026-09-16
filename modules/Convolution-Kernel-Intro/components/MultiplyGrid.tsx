import type { CSSProperties } from 'react';
import { Typography } from '../../shared/react';
import type { Matrix } from '../model/kernelLab';
import './MultiplyGrid.css';

export interface MultiplyGridProps {
  kernel: Matrix;
  patch: Matrix;
  className?: string;
}

/** 按位相乘的过程：每个格子同时给出乘积与两个因数。 */
export function MultiplyGrid({ kernel, patch, className }: MultiplyGridProps) {
  return (
    <div
      className={['ck-multiply-grid', className].filter(Boolean).join(' ')}
      style={{ '--ck-kernel-size': kernel.length } as CSSProperties}
      role="img"
      aria-label="算子与当前窗口按位相乘的结果"
    >
      {kernel.map((line, row) => line.map((factor, col) => {
        const input = patch[row][col];
        const product = factor * input;
        return (
          <span key={row + ':' + col} className={'ck-multiply-cell' + (product ? ' is-active' : '')}>
            <Typography as="strong" variant="bodySmall" tone="inherit" className="ck-multiply-value">{product}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit" className="ck-multiply-factors">
              {factor + '×' + input}
            </Typography>
          </span>
        );
      }))}
    </div>
  );
}
