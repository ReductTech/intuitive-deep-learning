import type { KeyboardEvent, MouseEvent } from 'react';
import { MathFormulaStatic, Typography } from '../../shared/react';
import {
  ATTENTION_DATASET,
  attentionAverage,
  attentionCurve,
  attentionPrediction,
  attentionWeights,
  regressionPriceYuan,
} from '../model/attentionRegression';
import './RegressionPlot.css';

export interface RegressionPlotProps {
  q: number;
  w: number;
  mode?: 'mean' | 'attention' | 'none';
  showPrediction?: boolean;
  showWeights?: boolean;
  showCurve?: boolean;
  selectedIndices?: number[];
  revealedIndices?: number[];
  guideIndex?: number;
  onSelect?: (index: number) => void;
  selectable?: boolean;
  window?: boolean;
}

const DOMAIN = { xMin: 0, xMax: 5, yMin: -5, yMax: 25 };
const PLOT = { left: 85, right: 960, top: 60, bottom: 410 };
const xPosition = (value: number) =>
  PLOT.left + (value - DOMAIN.xMin) / (DOMAIN.xMax - DOMAIN.xMin) * (PLOT.right - PLOT.left);
const yPosition = (value: number) =>
  PLOT.bottom - (value - DOMAIN.yMin) / (DOMAIN.yMax - DOMAIN.yMin) * (PLOT.bottom - PLOT.top);

/** The same observations and coordinate system are reused by C13-C15. Reveal flags are opt-in. */
export function RegressionPlot({
  q,
  w,
  mode = 'attention',
  showPrediction = false,
  showWeights = false,
  showCurve = false,
  selectedIndices = [],
  revealedIndices = [],
  guideIndex,
  onSelect,
  selectable = false,
  window: showWindow = false,
}: RegressionPlotProps) {
  const samples = ATTENTION_DATASET.train;
  const selected = new Set(selectedIndices);
  const revealed = new Set(revealedIndices);
  const guide = guideIndex === undefined ? undefined : samples[guideIndex];
  const weighted = showWeights && mode !== 'mean' ? attentionWeights(q, samples, w) : [];
  const weights = mode === 'mean' ? samples.map(() => 1 / samples.length) : weighted.map((item) => item.weight);
  const maximumWeight = Math.max(...weights, Number.EPSILON);
  const predictionVisible = showPrediction && mode !== 'none';
  const prediction = predictionVisible
    ? mode === 'mean' ? attentionAverage(samples) : attentionPrediction(q, samples, w)
    : null;
  const curve = showCurve && mode !== 'none'
    ? attentionCurve(ATTENTION_DATASET, w, mode === 'mean' ? 'average' : 'attention')
      .map((point) => xPosition(point.query) + ',' + yPosition(point.prediction)).join(' ')
    : null;
  const queryX = xPosition(q);
  const radius = w > 0 ? 1 / w : Number.POSITIVE_INFINITY;
  // Bound the reference range mathematically; no SVG clipping is used.
  const windowLeft = xPosition(Math.max(DOMAIN.xMin, q - radius));
  const windowRight = xPosition(Math.min(DOMAIN.xMax, q + radius));

  const choose = (element: SVGGElement, index: number) => {
    if (selectable && !element.closest('[aria-hidden="true"]')) onSelect?.(index);
  };
  const selectAtPointer = (event: MouseEvent<SVGGElement>, index: number) => {
    if (!selectable || event.currentTarget.closest('[aria-hidden="true"]')) return;
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM();
    // Larger pointer targets can overlap. Resolve the nearest visible point, not DOM paint order.
    if (event.detail > 0 && matrix) {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const distance = (candidate: number) =>
        (point.x - xPosition(samples[candidate].x)) ** 2 + (point.y - yPosition(samples[candidate].y)) ** 2;
      index = samples.reduce((nearest, _sample, candidate) => distance(candidate) < distance(nearest) ? candidate : nearest, index);
    }
    choose(event.currentTarget, index);
  };
  const navigate = (event: KeyboardEvent<SVGGElement>, index: number) => {
    if (!selectable || event.currentTarget.closest('[aria-hidden="true"]')) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) choose(event.currentTarget, index);
      return;
    }
    const backwards = key === 'ArrowLeft' || key === 'ArrowUp';
    const forwards = key === 'ArrowRight' || key === 'ArrowDown';
    if (!backwards && !forwards && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    const next = key === 'Home' ? 0 : key === 'End' ? samples.length - 1
      : (index + (backwards ? -1 : 1) + samples.length) % samples.length;
    event.currentTarget.ownerSVGElement
      ?.querySelector<SVGGElement>('[data-regression-index="' + next + '"]')?.focus();
  };

  return (
    <svg className="attn-regression-plot" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet"
      role={selectable ? 'group' : 'img'} data-regression-mode={mode}
      aria-label={'同一天沿街收集的 50 条合成冰水报价：橙点的横轴是店铺位置 x，单位千米；纵轴是冰水售价，单位元；绿色竖线为待估店铺位置 q=' + q.toFixed(1)
        + (showWeights ? '。点越大、越深，读取权重越高' : '')
        + (prediction !== null ? '。当前' + (mode === 'mean' ? '普通平均' : '注意力') + '估价为 ' + regressionPriceYuan(prediction).toFixed(2) + '元' : '')
        + (selectable ? '。可逐点选择或撤销；方向键浏览记录，回车或空格选择' : '')}>
      <g className="attn-regression-plot__decoration" aria-hidden="true">
        {showWindow && <rect className="attn-regression-plot__window"
          x={windowLeft} y={PLOT.top} width={Math.max(0, windowRight - windowLeft)} height={PLOT.bottom - PLOT.top} />}
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <g key={'x-' + value}>
            <line className="attn-regression-plot__grid" x1={xPosition(value)} y1={PLOT.top} x2={xPosition(value)} y2={PLOT.bottom} />
            <foreignObject x={xPosition(value) - 24} y={PLOT.bottom + 6} width="48" height="44">
              <Typography as="div" variant="bodySmall" tone="muted" align="center">{value}</Typography>
            </foreignObject>
          </g>
        ))}
        {[0, 10, 20].map((value) => (
          <g key={'y-' + value}>
            <line className="attn-regression-plot__grid" x1={PLOT.left} y1={yPosition(value)} x2={PLOT.right} y2={yPosition(value)} />
            <foreignObject x="28" y={yPosition(value) - 21} width="42" height="44">
              <Typography as="div" variant="bodySmall" tone="muted" align="end">{regressionPriceYuan(value).toFixed(2)}</Typography>
            </foreignObject>
          </g>
        ))}
        <path className="attn-regression-plot__axis"
          d={'M ' + PLOT.left + ' ' + PLOT.top + ' V ' + PLOT.bottom + ' H ' + PLOT.right} />
        <foreignObject x="10" y="3" width="175" height="44">
          <Typography as="div" variant="bodySmall" tone="muted">售价（元）</Typography>
        </foreignObject>
        <foreignObject x="760" y="454" width="222" height="44">
          <Typography as="div" variant="bodySmall" tone="muted" align="end">店铺位置（km） <MathFormulaStatic className="attn-inline-math" role="math" aria-label="店铺位置x" latex={String.raw`x`}/></Typography>
        </foreignObject>
        <line className="attn-regression-plot__query" x1={queryX} y1={PLOT.top} x2={queryX} y2={PLOT.bottom} />
        <foreignObject x={Math.max(195, Math.min(795, queryX - 95))} y="3" width="200" height="44">
          <Typography as="div" variant="bodySmall" tone="success" align="center">估 {q.toFixed(1)} km 处</Typography>
        </foreignObject>
        {guide && <>
          <path className="attn-regression-plot__guide"
            d={'M ' + PLOT.left + ' ' + yPosition(guide.y) + ' H ' + xPosition(guide.x) + ' V ' + PLOT.bottom} />
          <foreignObject x={Math.min(PLOT.right - 40, xPosition(guide.x) + 9)} y={PLOT.bottom - 45} width="38" height="44">
            <Typography as="div" variant="bodySmall" className="attn-regression-plot__guide-label">K</Typography>
          </foreignObject>
          <foreignObject x={PLOT.left + 8} y={Math.max(PLOT.top, yPosition(guide.y) - 43)} width="38" height="44">
            <Typography as="div" variant="bodySmall" className="attn-regression-plot__guide-label">V</Typography>
          </foreignObject>
        </>}
        {curve && <polyline
          className={'attn-regression-plot__curve' + (mode === 'mean' ? ' is-mean' : '')} points={curve} />}
      </g>

      {samples.map((sample, index) => {
        const isSelected = selected.has(index);
        const isRevealed = revealed.has(index);
        const isGuided = index === guideIndex;
        const ratio = showWeights ? (weights[index] ?? 0) / maximumWeight : 0;
        const pointRadius = Math.max(showWeights ? 4 + ratio * 7 : 6.5, isSelected || isRevealed || isGuided ? 9 : 0);
        return (
          <g key={index} className={'attn-regression-plot__sample'
            + (selectable ? ' is-selectable' : '')
            + (isSelected ? ' is-selected' : '')
            + (isRevealed ? ' is-revealed' : '')
            + (isGuided ? ' is-guided' : '')}
            transform={'translate(' + xPosition(sample.x) + ' ' + yPosition(sample.y) + ')'}
            role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
            aria-pressed={selectable ? isSelected : undefined}
            aria-label={selectable ? '店铺 ' + (index + 1) + '，位置 ' + sample.x.toFixed(2) + ' 千米，售价 ' + regressionPriceYuan(sample.y).toFixed(2) + ' 元'
              + (isSelected ? '，已选择，再次激活可撤销' : '，未选择')
              + (isRevealed ? '，权重前三' : '') : undefined}
            data-regression-index={index}
            onClick={(event) => selectAtPointer(event, index)}
            onKeyDown={(event) => navigate(event, index)}>
            <title>{`店铺 ${index+1} · 位置 ${sample.x.toFixed(2)} km · 售价 ${regressionPriceYuan(sample.y).toFixed(2)} 元`}</title>
            <circle className="attn-regression-plot__point" r={pointRadius}
              opacity={isSelected || isRevealed || isGuided ? 1 : showWeights ? 0.25 + ratio * 0.75 : 0.9} />
            {(isSelected || isRevealed || isGuided) && <circle className="attn-regression-plot__ring" r={pointRadius + 4} />}
            <circle className="attn-regression-plot__focus" r={pointRadius + 7} />
            {selectable && <circle className="attn-regression-plot__hit" r={Math.max(15, pointRadius + 4)} />}
          </g>
        );
      })}

      {prediction !== null && <circle className={'attn-regression-plot__prediction' + (mode === 'mean' ? ' is-mean' : '')}
        cx={queryX} cy={yPosition(prediction)} r="10" aria-hidden="true" />}
    </svg>
  );
}

