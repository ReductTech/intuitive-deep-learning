import { memo, useMemo, type CSSProperties } from 'react';
import { Typography } from '../../shared/react';
import { featureColor, formatResponse, maxAbsValue } from '../model/mnistLab';
import './FeatureMap.css';

export interface FeatureMapProps {
  /** 先行后列的特征值；还没有扫描到的位置传 null。 */
  values: ReadonlyArray<number | null>;
  size: number;
  /** 扫描动画此刻停在哪个位置。 */
  currentIndex?: number | null;
  selectedIndex?: number | null;
  /** 扫描完成后可以点格子看响应强度。 */
  interactive?: boolean;
  onSelect?: (index: number) => void;
  label?: string;
  className?: string;
}

interface FeatureCellProps {
  index: number;
  size: number;
  value: number | null;
  color: string | undefined;
  current: boolean;
  selected: boolean;
  interactive: boolean;
  onSelect?: ((index: number) => void) | undefined;
}

/**
 * 一格特征图。扫描动画会以每秒几十次的频率推进，特征图有五百多格，
 * 所以每一格都做成 memo：每一步只有真正变化的那几格重新渲染。
 */
const FeatureCell = memo(function FeatureCell({
  index,
  size,
  value,
  color,
  current,
  selected,
  interactive,
  onSelect,
}: FeatureCellProps) {
  const classes = [
    'ck-feature-cell',
    value === null && 'is-empty',
    current && 'is-current',
    selected && 'is-selected',
  ].filter(Boolean).join(' ');
  const row = Math.floor(index / size);
  const col = index % size;
  const style = color === undefined ? undefined : { background: color };
  if (!interactive) return <span className={classes} style={style} />;
  const ariaLabel = '第 ' + (col + 1) + ' 列第 ' + (row + 1) + ' 行'
    + (value === null ? '，还没有扫描到' : '，响应强度 ' + formatResponse(value));
  return (
    <button
      type="button"
      className={classes}
      style={style}
      disabled={value === null}
      aria-label={ariaLabel}
      onClick={() => onSelect?.(index)}
    >
      <Typography as="span" variant="bodySmall" tone="inherit" className="ck-feature-tip">
        {value === null ? '' : formatResponse(value)}
      </Typography>
    </button>
  );
});

/** 卷积核扫过整张图之后得到的特征图；每个格子是一个位置的响应值。 */
export function FeatureMap({
  values,
  size,
  currentIndex = null,
  selectedIndex = null,
  interactive = false,
  onSelect,
  label,
  className,
}: FeatureMapProps) {
  const numeric = useMemo(
    () => values.filter((value): value is number => value !== null),
    [values],
  );
  const maxAbs = maxAbsValue(numeric);
  return (
    <div
      className={['ck-feature-map', interactive && 'is-interactive', className].filter(Boolean).join(' ')}
      style={{ '--ck-feature-size': size } as CSSProperties}
      role="img"
      aria-label={label ?? '卷积输出的特征图'}
    >
      {values.map((value, index) => (
        <FeatureCell
          key={index}
          index={index}
          size={size}
          value={value}
          color={value === null ? undefined : featureColor(value, maxAbs)}
          current={index === currentIndex}
          selected={index === selectedIndex}
          interactive={interactive}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

