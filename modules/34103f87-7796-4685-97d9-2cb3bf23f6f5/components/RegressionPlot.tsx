import type { KeyboardEvent, MouseEvent } from 'react';
import { MathFormulaStatic, Typography } from "@shuku/course-style/react";
import {
  ATTENTION_DATASET,
  attentionAverage,
  attentionCurve,
  attentionPrediction,
  attentionWeights,
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
  wide?: boolean;
}

const DOMAIN = { xMin: 0, xMax: 5, yMin: 2.5, yMax: 5.5 };
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
  wide = false,
}: RegressionPlotProps) {
  const height = wide ? 430 : 500;
  const PLOT = { left:85, right:960, top:60, bottom:height-90 };
  const xPosition = (value:number) => PLOT.left+(value-DOMAIN.xMin)/(DOMAIN.xMax-DOMAIN.xMin)*(PLOT.right-PLOT.left);
  const yPosition = (value:number) => PLOT.bottom-(value-DOMAIN.yMin)/(DOMAIN.yMax-DOMAIN.yMin)*(PLOT.bottom-PLOT.top);
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
    if (selectable && !element.closest('[aria-hidden="true"], [inert], [hidden]')) onSelect?.(index);
  };
  const selectAtPointer = (event: MouseEvent<SVGGElement>, index: number) => {
    if (!selectable || event.currentTarget.closest('[aria-hidden="true"], [inert], [hidden]')) return;
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
    if (!selectable || event.currentTarget.closest('[aria-hidden="true"], [inert], [hidden]')) return;
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
    <svg shuku-edit-id="e-abba6a4f-d1bc-46bd-8d53-3638e8b27cf3" className="attn-regression-plot" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="xMidYMid meet"
      role={selectable ? 'group' : 'img'} data-regression-mode={mode}
      aria-label={'同一段已录制活动中的 50 条合成位置记录：橙点的横轴是观测时刻，单位秒；纵轴是队员水平位置，单位米；绿色竖线为待重建时刻 q=' + q.toFixed(1)
        + (showWeights ? '。点越大、越深，读取权重越高' : '')
        + (prediction !== null ? '。当前' + (mode === 'mean' ? '普通平均' : '注意力') + '重建位置为 ' + prediction.toFixed(2) + '米' : '')
        + (selectable ? '。可逐点选择或撤销；方向键浏览记录，回车或空格选择' : '')}>
      <g shuku-edit-id="e-05852d20-d75b-45b3-b8ee-f47c19b44c50" className="attn-regression-plot__decoration" aria-hidden="true">
        {showWindow && <rect shuku-edit-id="e-4d7c23c1-cc8a-4f2f-9cb6-94e2014b0a35" className="attn-regression-plot__window"
          x={windowLeft} y={PLOT.top} width={Math.max(0, windowRight - windowLeft)} height={PLOT.bottom - PLOT.top} />}
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <g shuku-edit-id="e-7b260d1a-0d5e-487f-b2bc-c0ccb9f2d9ee" key={'x-' + value}>
            <line shuku-edit-id="e-981609c9-895f-43f5-805b-620e3242371f" className="attn-regression-plot__grid" x1={xPosition(value)} y1={PLOT.top} x2={xPosition(value)} y2={PLOT.bottom} />
            <foreignObject shuku-edit-id="e-29aa3969-129d-4d7e-9cc8-602632a247a9" x={xPosition(value) - 24} y={PLOT.bottom + 6} width="48" height="44">
              <Typography shuku-edit-id="e-4ed1047d-7046-4bc2-8889-442b17ecd3cd" as="div" variant="bodySmall" tone="muted" align="center">{value}</Typography>
            </foreignObject>
          </g>
        ))}
        {[3, 4, 5].map((value) => (
          <g shuku-edit-id="e-dc1b3afa-e439-46ac-bf3d-7acfaebb8253" key={'y-' + value}>
            <line shuku-edit-id="e-96f67d3e-65c0-4a2a-a0a1-5ddf47381164" className="attn-regression-plot__grid" x1={PLOT.left} y1={yPosition(value)} x2={PLOT.right} y2={yPosition(value)} />
            <foreignObject shuku-edit-id="e-c46c4cec-9d89-47f8-b152-f41b748ac41b" x="28" y={yPosition(value) - 21} width="42" height="44">
              <Typography shuku-edit-id="e-82e13faa-74c4-4687-b653-429ed04745f7" as="div" variant="bodySmall" tone="muted" align="end">{value}</Typography>
            </foreignObject>
          </g>
        ))}
        <path shuku-edit-id="e-b353ffce-bcba-496d-b3c9-b47692d0041e" className="attn-regression-plot__axis"
          d={'M ' + PLOT.left + ' ' + PLOT.top + ' V ' + PLOT.bottom + ' H ' + PLOT.right} />
        <foreignObject shuku-edit-id="e-6b2f4992-5833-4298-bc90-92bd2575c6e4" x="10" y="3" width="175" height="44">
          <Typography shuku-edit-id="e-bd1a84ad-55bb-4cfa-b198-bc3f35c2de9c" as="div" variant="bodySmall" tone="muted">水平位置（m）</Typography>
        </foreignObject>
        <foreignObject shuku-edit-id="e-6c88b4f3-081d-432d-8949-1ab0538ba22f" x="760" y={height-46} width="222" height="44">
          <Typography shuku-edit-id="e-8fde2f2c-93a9-4b0c-aae5-3cab3ed84560" as="div" variant="bodySmall" tone="muted" align="end">时间（s） <MathFormulaStatic className="attn-inline-math" role="math" aria-label="观测时刻t" latex={String.raw`t`}/></Typography>
        </foreignObject>
        <line shuku-edit-id="e-49a1593b-4669-4292-ad69-818ef733b1b2" className="attn-regression-plot__query" x1={queryX} y1={PLOT.top} x2={queryX} y2={PLOT.bottom} />
        <foreignObject shuku-edit-id="e-a98976a2-f491-42c5-a814-cffe999992d0" x={Math.max(195, Math.min(795, queryX - 95))} y="3" width="200" height="44">
          <Typography shuku-edit-id="e-5c1df5b3-83c4-4910-9a39-42955b31dd62" as="div" variant="bodySmall" tone="success" align="center">Q = {q.toFixed(1)} s</Typography>
        </foreignObject>
        {guide && <>
          <path shuku-edit-id="e-b212f123-1f33-417f-9795-ea8e7e69bec4" className="attn-regression-plot__guide"
            d={'M ' + PLOT.left + ' ' + yPosition(guide.y) + ' H ' + xPosition(guide.x) + ' V ' + PLOT.bottom} />
          <foreignObject shuku-edit-id="e-49d325f2-4aae-4331-9b52-efde4239e0b8" x={Math.min(PLOT.right - 40, xPosition(guide.x) + 9)} y={PLOT.bottom - 45} width="38" height="44">
            <Typography shuku-edit-id="e-5024fb7b-0a8f-4baf-80b8-fcdca8367d15" as="div" variant="bodySmall" className="attn-regression-plot__guide-label">K</Typography>
          </foreignObject>
          <foreignObject shuku-edit-id="e-91c6b81e-f6f0-414a-ae18-a7833094adcd" x={PLOT.left + 8} y={Math.max(PLOT.top, yPosition(guide.y) - 43)} width="38" height="44">
            <Typography shuku-edit-id="e-163700a7-2d49-4154-bf4e-5801ee1820a7" as="div" variant="bodySmall" className="attn-regression-plot__guide-label">V</Typography>
          </foreignObject>
        </>}
        {curve && <polyline shuku-edit-id="e-a240d3be-e3d9-4ab9-92ae-dda613e1044e"
          className={'attn-regression-plot__curve' + (mode === 'mean' ? ' is-mean' : '')} points={curve} />}
      </g>

      {samples.map((sample, index) => {
        const isSelected = selected.has(index);
        const isRevealed = revealed.has(index);
        const isGuided = index === guideIndex;
        const ratio = showWeights ? (weights[index] ?? 0) / maximumWeight : 0;
        const pointRadius = Math.max(showWeights ? 4 + ratio * 7 : 6.5, isSelected || isRevealed || isGuided ? 9 : 0);
        return (
          <g shuku-edit-id="e-6a5ae25b-990a-43eb-8ab9-d4dc402d4e80" key={index} className={'attn-regression-plot__sample'
            + (selectable ? ' is-selectable' : '')
            + (isSelected ? ' is-selected' : '')
            + (isRevealed ? ' is-revealed' : '')
            + (isGuided ? ' is-guided' : '')}
            transform={'translate(' + xPosition(sample.x) + ' ' + yPosition(sample.y) + ')'}
            role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
            aria-pressed={selectable ? isSelected : undefined}
            aria-label={selectable ? '记录 ' + (index + 1) + '，时刻 ' + sample.x.toFixed(2) + ' 秒，位置 ' + sample.y.toFixed(2) + ' 米'
              + (isSelected ? '，已选择，再次激活可撤销' : '，未选择')
              + (isRevealed ? '，权重前三' : '') : undefined}
            data-regression-index={index}
            onClick={(event) => selectAtPointer(event, index)}
            onKeyDown={(event) => navigate(event, index)}>
            <title>{`记录 ${index+1} · 时刻 ${sample.x.toFixed(2)} s · 位置 ${sample.y.toFixed(2)} 米`}</title>
            <circle shuku-edit-id="e-b7e68028-76ad-460a-91e9-b8007f1bea2d" className="attn-regression-plot__point" r={pointRadius}
              opacity={isSelected || isRevealed || isGuided ? 1 : showWeights ? 0.25 + ratio * 0.75 : 0.9} />
            {(isSelected || isRevealed || isGuided) && <circle shuku-edit-id="e-ec8fbf70-0680-4f3d-b982-c54124eb6c29" className="attn-regression-plot__ring" r={pointRadius + 4} />}
            <circle shuku-edit-id="e-694a48bd-8faa-46d8-90d6-c530e2f09773" className="attn-regression-plot__focus" r={pointRadius + 7} />
            {selectable && <circle shuku-edit-id="e-8a56c1f8-2b1f-4632-96e0-0d29d6ae199b" className="attn-regression-plot__hit" r={Math.max(15, pointRadius + 4)} />}
          </g>
        );
      })}

      {prediction !== null && <circle shuku-edit-id="e-7e97be03-38d4-4a6d-b9da-7d06d74f01c1" className={'attn-regression-plot__prediction' + (mode === 'mean' ? ' is-mean' : '')}
        cx={queryX} cy={yPosition(prediction)} r="10" aria-hidden="true" />}
    </svg>
  );
}

