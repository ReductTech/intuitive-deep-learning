import type { CSSProperties } from 'react';
import {
  WEATHER_ITEMS,
  clamp,
  formatPercent,
  type WeatherItem,
} from '../model/lossGuideMath';

export interface ProbabilityBarsProps {
  probabilities: readonly number[];
  items?: readonly WeatherItem[];
  digits?: number;
  showTotal?: boolean;
  totalLabel?: string;
  totalNote?: string;
  expectedTotal?: number;
  invalidTotal?: boolean;
  className?: string;
}

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Weather probability bars shared by the independent-Sigmoid, Softmax and
 * forecast-card interactions. Layout remains module-private; values and labels
 * are supplied as content.
 */
export function ProbabilityBars({
  probabilities,
  items = WEATHER_ITEMS,
  digits = 1,
  showTotal = false,
  totalLabel = '概率总和',
  totalNote,
  expectedTotal = 1,
  invalidTotal,
  className,
}: ProbabilityBarsProps) {
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  const totalIsInvalid = invalidTotal
    ?? Math.abs(total - expectedTotal) > 0.005;

  return (
    <div className={classNames('lg2-probability-bars', className)}>
      {items.map((item, index) => {
        const probability = Number.isFinite(probabilities[index])
          ? probabilities[index]
          : 0;
        const boundedProbability = clamp(probability, 0, 1);
        const width = formatPercent(boundedProbability, 2);

        return (
          <div
            className={classNames(
              'lg2-probability-row',
              item.className,
            )}
            key={item.key}
          >
            <span className="lg2-probability-label">
              <span aria-hidden="true">{item.icon}</span>
              {' '}
              {item.label}
            </span>
            <div
              className="lg2-probability-track"
              role="progressbar"
              aria-label={`${item.label}概率`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={boundedProbability * 100}
              aria-valuetext={formatPercent(probability, digits)}
            >
              <i
                className="lg2-probability-fill"
                style={{ width } as CSSProperties}
              />
            </div>
            <strong className="lg2-probability-value">
              {formatPercent(probability, digits)}
            </strong>
          </div>
        );
      })}

      {showTotal ? (
        <div
          className={classNames(
            'lg2-probability-total',
            totalIsInvalid && 'is-invalid',
          )}
        >
          <span>{totalLabel}</span>
          <strong>{formatPercent(total, digits)}</strong>
          {totalNote ? <small>{totalNote}</small> : null}
        </div>
      ) : null}
    </div>
  );
}
