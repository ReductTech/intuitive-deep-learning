import { useState, type CSSProperties } from 'react';
import { Typography } from '../../shared/react';
import type { Matrix } from '../model/kernelLab';
import './KernelGrid.css';

export interface KernelGridProps {
  matrix: Matrix;
  /** 可编辑时每个格子是可点击的按钮，悬浮会临时预览切换后的结果。 */
  editable?: boolean;
  onToggle?: (row: number, col: number) => void;
  /** 与输入矩阵同时为 1 的位置，用来标记算子命中的格子。 */
  hitMask?: Matrix | null;
  label?: string;
  className?: string;
}

export function KernelGrid({ matrix, editable = false, onToggle, hitMask, label, className }: KernelGridProps) {
  const size = matrix.length;
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div
      className={['ck-kernel-grid', editable && 'is-editable', className].filter(Boolean).join(' ')}
      style={{ '--ck-kernel-size': size } as CSSProperties}
      role={editable ? 'group' : 'img'}
      aria-label={label}
    >
      {matrix.map((line, row) => line.map((value, col) => {
        const key = row + ':' + col;
        const previewing = editable && preview === key;
        const shown = previewing ? (value ? 0 : 1) : value;
        const classes = [
          'ck-kernel-cell',
          shown ? 'is-one' : 'is-zero',
          Boolean(hitMask && hitMask[row] && hitMask[row][col] && value) && 'is-hit',
          previewing && 'is-preview',
        ].filter(Boolean).join(' ');
        if (!editable) {
          return (
            <span key={key} className={classes}>
              <Typography as="span" variant="bodySmall" tone="inherit">{value}</Typography>
            </span>
          );
        }
        return (
          <button
            key={key}
            type="button"
            className={classes}
            onMouseEnter={() => setPreview(key)}
            onMouseLeave={() => setPreview(null)}
            onFocus={() => setPreview(key)}
            onBlur={() => setPreview(null)}
            onClick={() => onToggle?.(row, col)}
            aria-label={'第 ' + (row + 1) + ' 行第 ' + (col + 1) + ' 列，当前为 ' + value + '，点击切换为 ' + (value ? 0 : 1)}
          >
            <Typography as="span" variant="bodySmall" tone="inherit">{shown}</Typography>
          </button>
        );
      }))}
    </div>
  );
}
