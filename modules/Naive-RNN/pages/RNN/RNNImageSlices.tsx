import { Fragment, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Typography } from '../../../shared/react';
import './RNNImageSlices.css';

export interface RNNImageSlicesProps {
  /** 两条切口是否已经落在字与字之间。 */
  cuts: [boolean, boolean];
  /** 学习者把刀切进了笔画里。 */
  rejected: boolean;
  /** 已经进入网络的切片数量，0–3。 */
  arrived: number;
  onToggleCut: (index: number) => void;
  onRejectCut: () => void;
}

interface Glyph {
  id: string;
  character: string;
  label: string;
  width: number;
  viewBox: string;
  paths: string[];
}

/** 三个字形按同一个高度手绘，宽度就是它们在句子里占据的宽度。 */
const glyphs: Glyph[] = [
  {
    id: 'seven',
    character: '7',
    label: 't₁',
    width: 96,
    viewBox: '0 0 96 100',
    paths: ['M 9 25 C 27 18, 58 15, 88 21 C 81 46, 64 72, 52 94'],
  },
  {
    id: 'plus',
    character: '+',
    label: 't₂',
    width: 92,
    viewBox: '0 0 92 100',
    paths: ['M 46 23 C 47 40, 46 62, 45 81', 'M 19 53 C 36 51, 58 52, 74 54'],
  },
  {
    id: 'three',
    character: '3',
    label: 't₃',
    width: 96,
    viewBox: '0 0 96 100',
    paths: [
      'M 20 31 C 24 15, 61 9, 74 23 C 84 34, 68 47, 51 49',
      'M 51 49 C 71 51, 87 62, 81 78 C 75 93, 34 97, 18 85',
    ],
  },
];

const seamWidth = 26;
const stripWidth = glyphs.reduce((total, glyph) => total + glyph.width, 0) + seamWidth * 2;
/** 允许的误差：贴着字边缘下刀也算落在字与字之间。 */
const tolerance = 0.035 * stripWidth;

/** 两条缝在整张图里的横向位置，用来判断这一刀落在哪里。 */
const seamBands: Array<[number, number]> = [];
{
  let cursor = 0;
  glyphs.forEach((glyph, index) => {
    cursor += glyph.width;
    if (index < glyphs.length - 1) {
      seamBands.push([(cursor - tolerance) / stripWidth, (cursor + seamWidth + tolerance) / stripWidth]);
      cursor += seamWidth;
    }
  });
}

const gridTemplate = glyphs
  .flatMap((glyph, index) => (index < glyphs.length - 1 ? [`${glyph.width}fr`, `${seamWidth}fr`] : [`${glyph.width}fr`]))
  .join(' ');

function GlyphInk({ glyph }: { glyph: Glyph }) {
  return (
    <svg className="nrnn-image-slices__ink" viewBox={glyph.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {glyph.paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function RNNImageSlices({ cuts, rejected, arrived, onToggleCut, onRejectCut }: RNNImageSlicesProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  /** 还没切好之前不提示“轮到哪一段”，避免把未切分的一张图说成序列。 */
  const armed = cuts[0] && cuts[1];

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    track.style.setProperty('--nrnn-cutter-x', `${Math.min(100, Math.max(0, fraction * 100))}%`);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = seamBands.findIndex(([start, end]) => fraction >= start && fraction <= end);
    if (index === -1) onRejectCut();
    else onToggleCut(index);
  };

  const shiftOf = (index: number) => {
    const awayFromLeftCut = cuts[0] ? 10 : 0;
    const awayFromRightCut = cuts[1] ? 10 : 0;
    if (index === 0) return -awayFromLeftCut;
    if (index === glyphs.length - 1) return awayFromRightCut;
    return awayFromLeftCut - awayFromRightCut;
  };

  return (
    <div className="nrnn-image-slices">
      <section className={`nrnn-image-slices__strip${rejected ? ' is-rejected' : ''}`} aria-label="手写算式 7 + 3">
        <Typography as="span" variant="bodySmall" tone="warning">一张静态图片 · 7 + 3</Typography>

        <div
          className="nrnn-image-slices__track"
          ref={trackRef}
          role="group"
          aria-label="在字与字之间点两刀，把图片切成三段"
          style={{ gridTemplateColumns: gridTemplate } as CSSProperties}
          onPointerMove={handleMove}
          onClick={handleClick}
        >
          <span className="nrnn-image-slices__cutter" aria-hidden="true" />
          {glyphs.map((glyph, index) => {
            const state = !armed
              ? ''
              : index < arrived
                ? ' is-arrived'
                : index === arrived && arrived < glyphs.length
                  ? ' is-current'
                  : '';
            return (
              <Fragment key={glyph.id}>
                <div
                  className={`nrnn-image-slices__piece${state}${cuts.some(Boolean) ? ' is-split' : ''}`}
                  style={{ '--nrnn-shift': `${shiftOf(index)}px` } as CSSProperties}
                >
                  <GlyphInk glyph={glyph} />
                </div>
                {index < glyphs.length - 1 && (
                  <button
                    type="button"
                    className={`nrnn-image-slices__seam${cuts[index] ? ' is-cut' : ''}`}
                    aria-pressed={cuts[index]}
                    aria-label={`在「${glyph.character}」和「${glyphs[index + 1].character}」之间切一刀`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleCut(index);
                    }}
                  >
                    <span aria-hidden="true" />
                  </button>
                )}
              </Fragment>
            );
          })}
        </div>

        <div className="nrnn-image-slices__labels" style={{ gridTemplateColumns: gridTemplate } as CSSProperties} aria-hidden="true">
          {glyphs.map((glyph, index) => (
            <Fragment key={glyph.id}>
              <Typography
                as="span"
                variant="bodySmall"
                tone="inherit"
                className={`nrnn-image-slices__label${armed && arrived > index ? ' is-arrived' : ''}${armed && index === arrived && arrived < glyphs.length ? ' is-current' : ''}`}
                style={{ '--nrnn-shift': `${shiftOf(index)}px` } as CSSProperties}
              >
                {glyph.label} = {glyph.character}
              </Typography>
              {index < glyphs.length - 1 && <span />}
            </Fragment>
          ))}
        </div>
      </section>

      <section className="nrnn-image-slices__network" aria-label="切片依次进入循环网络">
        <header className="nrnn-image-slices__network-head">
          <Typography as="span" variant="bodySmall" tone="warning">切片按时间进入网络</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">同一个网络单元，在 t₁ / t₂ / t₃ 各读一次。</Typography>
        </header>

        <div className="nrnn-image-slices__slots">
          {glyphs.map((glyph, index) => (
            <div className={`nrnn-image-slices__slot${arrived > index ? ' is-filled' : ''}`} key={glyph.id}>
              <Typography as="span" variant="bodySmall" tone="inherit">{glyph.label}</Typography>
              <span className="nrnn-image-slices__slot-face">
                {arrived > index && <GlyphInk glyph={glyph} />}
              </span>
            </div>
          ))}
        </div>

        <div className="nrnn-image-slices__unit">
          <Typography as="strong" variant="h3" tone="inherit" className="nrnn-image-slices__unit-title">RNN</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">每读入一段，就把当前状态带到下一段。</Typography>
        </div>
      </section>
    </div>
  );
}
