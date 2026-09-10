import { heightTeachingSample } from '../data/galtonStory';
import { predict, type LineParameters } from '../model/regressionMath';

const X_MIN = 150;
const X_MAX = 188;
const Y_MIN = 150;
const Y_MAX = 188;
const WIDTH = 820;
const HEIGHT = 470;

const xPosition = (value: number) => ((value - X_MIN) / (X_MAX - X_MIN)) * WIDTH;
const yPosition = (value: number) => HEIGHT - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * HEIGHT;

interface RegressionPlotProps {
  line?: LineParameters;
  showResiduals?: boolean;
  highlightedPoint?: number;
  ariaLabel?: string;
}

export function RegressionPlot({
  line,
  showResiduals = false,
  highlightedPoint,
  ariaLabel = '父母平均身高与成年子女身高的教学示意散点图',
}: RegressionPlotProps) {
  const lineStart = line ? predict(X_MIN, line) : null;
  const lineEnd = line ? predict(X_MAX, line) : null;

  return (
    <svg className="grl-plot" viewBox="0 0 900 545" role="img" aria-label={ariaLabel}>
      <g transform="translate(58 18)">
        <rect className="grl-plot__paper" width={WIDTH} height={HEIGHT} rx="4" />
        {[150, 160, 170, 180].map((tick) => (
          <g key={`x-${tick}`}>
            <line className="grl-plot__grid" x1={xPosition(tick)} x2={xPosition(tick)} y1="0" y2={HEIGHT} />
            <text x={xPosition(tick)} y={HEIGHT + 28} textAnchor="middle">{tick}</text>
          </g>
        ))}
        {[150, 160, 170, 180].map((tick) => (
          <g key={`y-${tick}`}>
            <line className="grl-plot__grid" x1="0" x2={WIDTH} y1={yPosition(tick)} y2={yPosition(tick)} />
            <text x="-14" y={yPosition(tick) + 5} textAnchor="end">{tick}</text>
          </g>
        ))}

        {showResiduals && line && heightTeachingSample.map((point, index) => (
          <line
            className={index === highlightedPoint ? 'grl-plot__residual is-highlighted' : 'grl-plot__residual'}
            key={`residual-${index}`}
            x1={xPosition(point.parent)}
            x2={xPosition(point.parent)}
            y1={yPosition(point.child)}
            y2={yPosition(predict(point.parent, line))}
          />
        ))}

        {line && lineStart !== null && lineEnd !== null && (
          <line
            className="grl-plot__line"
            x1={xPosition(X_MIN)}
            y1={yPosition(lineStart)}
            x2={xPosition(X_MAX)}
            y2={yPosition(lineEnd)}
          />
        )}

        {heightTeachingSample.map((point, index) => (
          <g key={`${point.parent}-${point.child}`}>
            <circle
              className={index === highlightedPoint ? 'grl-plot__point is-highlighted' : 'grl-plot__point'}
              cx={xPosition(point.parent)}
              cy={yPosition(point.child)}
              r={index === highlightedPoint ? 9 : 6}
            />
            {index === highlightedPoint && (
              <text className="grl-plot__annotation" x={xPosition(point.parent) + 14} y={yPosition(point.child) - 12}>
                真实值 y={point.child}
              </text>
            )}
          </g>
        ))}

        <text className="grl-plot__axis-label" x={WIDTH / 2} y={HEIGHT + 57} textAnchor="middle">父母平均身高 x（cm）</text>
        <text className="grl-plot__axis-label" transform={`translate(-46 ${HEIGHT / 2}) rotate(-90)`} textAnchor="middle">成年子女身高 y（cm）</text>
      </g>
    </svg>
  );
}

