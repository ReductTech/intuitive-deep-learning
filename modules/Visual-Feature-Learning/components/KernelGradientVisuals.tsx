import type { CSSProperties } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, Typography } from '../../shared/react';
import './KernelGradientVisuals.css';

export const trainingInput = [1, 0, 1, 0, 1, 0, 1, 0, 1];
export const initialKernel = Array<number>(9).fill(0.1);
export const learningRate = 0.1;
export const formatNumber = (value: number) => Number(value.toFixed(5)).toString();
export const dot = (input: number[], kernel: number[]) => input.reduce((sum, x, i) => sum + x * kernel[i], 0);

export function KernelFormula({ latex, className = '' }: { latex: string; className?: string }) {
  return <MathFormulaBlock className={`vfl-gradient-formula ${className}`} ariaLabel={latex}>
    <MathFormulaStatic latex={latex} />
  </MathFormulaBlock>;
}

/** A spatial number grid: the selected cell keeps the same offset across input, kernel and gradient. */
export function KernelMatrix({ values, size = 3, selected, onSelect, label, compact = false, marked = [], success = false, formatValue = formatNumber, cellStyle }: {
  values: number[]; size?: number; selected?: number; onSelect?: (index: number) => void;
  label: string; compact?: boolean; marked?: number[]; success?: boolean; formatValue?: (value: number) => string; cellStyle?: (value: number) => CSSProperties;
}) {
  return <MathFormulaBlock ariaLabel={label} className={`vfl-gradient-matrix ${compact ? 'vfl-gradient-matrix--compact' : ''} ${success ? 'vfl-gradient-matrix--success' : ''}`}>
    <div className="vfl-gradient-matrix__grid" style={{ '--vfl-gradient-size': size } as CSSProperties}>
      {values.map((value, index) => {
        const className = `vfl-gradient-matrix__cell ${value === 0 ? 'is-zero' : ''} ${selected === index ? 'is-traced' : ''} ${marked.includes(index) ? 'is-window' : ''}`;
        const number = <MathFormulaStatic latex={formatValue(value)} />;
        return onSelect
          ? <Button key={index} className={className} style={cellStyle?.(value)} aria-label={`${label}，第 ${Math.floor(index / size) + 1} 行第 ${index % size + 1} 列`} aria-pressed={selected === index} onClick={() => onSelect(index)}>{number}</Button>
          : <div key={index} className={className} style={cellStyle?.(value)}>{number}</div>;
      })}
    </div>
  </MathFormulaBlock>;
}

export function KernelArrow({ reverse = false }: { reverse?: boolean }) {
  return <Typography as="span" variant="h2" tone={reverse ? 'warning' : 'muted'} className="vfl-gradient-arrow" aria-hidden="true">{reverse ? '←' : '→'}</Typography>;
}
