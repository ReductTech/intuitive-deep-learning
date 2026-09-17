import type { CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import {
  KERNEL_DIRECTIONS,
  directionLabel,
  directionShortLabel,
  kernelForDirection,
  type KernelDirection,
} from '../../model/kernelLab';
import './DirectionPicker.css';

export interface DirectionPickerProps {
  /** 当前选中的方向，也就是此刻贴在图上的那个算子。 */
  value: KernelDirection;
  onChange: (direction: KernelDirection) => void;
  /** 这一局的获胜方向，按钮上会多一个记号。 */
  winDirection?: KernelDirection | null;
  className?: string;
}

/** 四个方向一次排开：点哪个按钮，就换成哪个方向的算子去匹配。 */
export function DirectionPicker({ value, onChange, winDirection = null, className }: DirectionPickerProps) {
  return (
    <div
      className={['ck-direction-picker', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="选择要匹配的方向"
    >
      {KERNEL_DIRECTIONS.map((direction) => (
        <Button
          key={direction}
          className={'ck-direction' + (direction === winDirection ? ' is-win' : '')}
          active={direction === value}
          title={directionLabel(direction)}
          aria-pressed={direction === value}
          onClick={() => onChange(direction)}
        >
          <DirectionGlyph direction={direction} />
          <Typography as="span" variant="bodySmall" tone="inherit">{directionShortLabel(direction)}</Typography>
        </Button>
      ))}
    </div>
  );
}

/** 按钮上那个 5 × 5 小图：一条 1 排成的线，就是算子本身。 */
function DirectionGlyph({ direction }: { direction: KernelDirection }) {
  const kernel = kernelForDirection(direction);
  return (
    <span
      className="ck-direction-glyph"
      aria-hidden="true"
      style={{ '--ck-glyph-size': kernel.length } as CSSProperties}
    >
      {kernel.map((line, row) => line.map((cell, col) => (
        <span key={row + ':' + col} className={cell ? 'is-one' : 'is-zero'} />
      )))}
    </span>
  );
}
