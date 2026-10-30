import type { CSSProperties } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { CLUES, CLUE_LABELS, calculateComposition, cluePosition, compositionInsight, nextCompositionAction,
  type ClueId, type CompositionAction, type CompositionState } from './compositionModel';
import './FeatureCompositionLab.css';

const c = (part: string) => 'rtg-feature-composition__' + part;
const clueColor: Record<ClueId, string> = { rim: 'var(--ui-accent)', leftArc: 'var(--ui-success)', rightArc: 'var(--ui-accent-alt)' };
function CueGlyph({ id }: { id: ClueId }) {
  return <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <path d={id === 'rim' ? 'M9 30H51' : id === 'leftArc' ? 'M44 8Q15 23 15 51' : 'M16 8Q45 23 45 51'} />
  </svg>;
}
function ForwardArrow() {
  return <svg className={c('arrow')} viewBox="0 0 80 32" fill="none" aria-hidden="true"><path d="M5 16H71M59 5L71 16L59 27" /></svg>;
}
export interface FeatureCompositionLabProps {
  state: CompositionState;
  onAction: (action: CompositionAction) => void;
}
export function FeatureCompositionLab({ state, onAction }: FeatureCompositionLabProps) {
  const result = calculateComposition(state), next = nextCompositionAction(state);
  const formula = '(' + CLUES.map(id => result.contributions[id]).join('+') + '-2)=' + result.center;
  return <div className="rtg-feature-composition" data-misplaced={state.misplaced} data-response={result.center}>
    <div className={c('stage')}>
      <article className={c('column')}>
        <Typography as="h3" variant="body" tone="accent">前层：三种线索</Typography>
        <div className={c('map-slot')}>
          <div className={c('source-map')} role="group" aria-label="三个前层通道的空间叠图，点击线索接入或移除">
            <svg className={c('source-grid')} viewBox="0 0 300 300" fill="none" aria-hidden="true">
              {[1, 2, 3, 4].map(i => <path key={i} d={'M' + i * 60 + ' 0V300M0 ' + i * 60 + 'H300'} />)}
              <path className={c('guide')} d="M132 28H168V74L174 90Q210 110 222 152L228 266M132 74L126 90Q90 110 78 152L72 266" />
              <rect className={c('window')} x="60" y="60" width="180" height="180" />
            </svg>
            {state.misplaced && (['leftArc', 'rightArc'] as const).map(id => {
              const p = cluePosition(id, false);
              return <span key={id} className={c('expected')} aria-hidden="true"
                style={{ left: p.column * 20 + '%', top: p.row * 20 + '%', color: clueColor[id] }}><CueGlyph id={id} /></span>;
            })}
            {CLUES.map(id => {
              const p = cluePosition(id, state.misplaced), enabled = state.enabled[id];
              return <Button key={id} className={c('cue') + (enabled ? ' is-on' : ' is-off')}
                style={{ left: p.column * 20 + '%', top: p.row * 20 + '%', '--clue-color': clueColor[id] } as CSSProperties}
                hint={id === 'rightArc' && !state.evidence.matched} aria-pressed={enabled}
                aria-label={CLUE_LABELS[id] + (enabled ? '，已接入，点击移除' : '，未接入，点击接入')}
                onClick={() => onAction({ type: 'toggle', id })}><CueGlyph id={id} /></Button>;
            })}
          </div>
        </div>
        <div className={c('legend')}>
          {CLUES.map(id => <Typography key={id} as="span" variant="bodySmall" tone="inherit" style={{ color: clueColor[id] }}>
            <i aria-hidden="true" />{id === 'rim' ? '上沿' : id === 'leftArc' ? '左弧' : '右弧'}
          </Typography>)}
        </div>
      </article>
      <ForwardArrow />
      <article className={c('column')}>
        <Typography as="h3" variant="body" tone="accent">按位置组合</Typography>
        <div className={c('compute-stage')}>
          <div className={c('contributions')} aria-label="中心位置的各通道加权贡献">
            {CLUES.map(id => <div key={id} style={{ '--clue-color': clueColor[id] } as CSSProperties}>
              <Typography as="span" variant="bodySmall" tone="inherit">{id === 'rim' ? '上沿' : id === 'leftArc' ? '左弧' : '右弧'}</Typography>
              <MathFormulaBlock appearance="plain" ariaLabel={CLUE_LABELS[id] + '贡献' + result.contributions[id]}>
                <MathFormulaStatic latex={'+' + result.contributions[id]} />
              </MathFormulaBlock><span className={c('lane')} aria-hidden="true" />
            </div>)}
          </div>
          <div className={c('operator')}>
            <Typography variant="body" tone="accent">卷积＋激活</Typography>
            <Typography variant="bodySmall" tone="muted">示意权重固定</Typography>
          </div>
        </div>
        <MathFormulaBlock appearance="plain" className={c('formula')} ariaLabel={'负数归零后的中心响应为' + result.center}>
          <MathFormulaTerm latex={String.raw`\operatorname{ReLU}`} ariaLabel="ReLU 激活：负数归零，正数保留" tooltip="ReLU 激活：将负数变成 0，保留 0 和正数。括号内是各条线索的贡献之和，再加上偏置。" tooltipPlacement="top" />
          <MathFormulaStatic latex={formula} />
        </MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">ReLU：负数归零，正数保留</Typography>
      </article>
      <ForwardArrow />
      <article className={c('column')}>
        <Typography as="h3" variant="body" tone="accent">后层：组合响应</Typography>
        <div className={c('map-slot')}>
          <div className={c('response-map')} role="img" aria-label={'计算得到三行三列响应图，中心为' + result.center + '，其余位置均为0'}>
            {result.output.flatMap((row, y) => row.map((value, x) => <div key={y + '-' + x}
              className={(x === 1 && y === 1 ? 'is-center ' : '') + (value > 0 ? 'is-active' : '')}>
              <Typography as="span" variant="body" tone="inherit">{value}</Typography>
            </div>))}
          </div>
        </div>
        <Typography variant="bodySmall" tone="muted">响应值，非类别概率</Typography>
      </article>
    </div>
    <Typography variant="body" tone="accent" align="center" className={c('insight')}>{compositionInsight(state)}</Typography>
    <div className={c('actions')}>
      <span aria-hidden="true" />
      <Button variant="primary" onClick={() => onAction(next.action)}>
        <Typography as="span" variant="bodySmall" tone="inherit">{next.label}</Typography>
      </Button>
      <Typography variant="bodySmall" tone="muted">人工示例，非训练结果</Typography>
    </div>
  </div>;
}
