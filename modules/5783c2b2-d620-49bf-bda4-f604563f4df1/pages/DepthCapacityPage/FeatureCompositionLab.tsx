import type { CSSProperties } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { CLUES, CLUE_LABELS, calculateComposition, cluePosition, compositionInsight, nextCompositionAction,
  type ClueId, type CompositionAction, type CompositionState } from './compositionModel';
import './FeatureCompositionLab.css';

const c = (part: string) => 'rtg-feature-composition__' + part;
const clueColor: Record<ClueId, string> = { rim: 'var(--ui-accent)', leftArc: 'var(--ui-success)', rightArc: 'var(--ui-accent-alt)' };
function CueGlyph({ id }: { id: ClueId }) {
  return <svg shuku-edit-id="e-4147577e-2ef4-4b22-87bd-58f788151e5c" viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <path shuku-edit-id="e-06540567-ec9f-45f2-9a5a-c666b3cd0a0c" d={id === 'rim' ? 'M9 30H51' : id === 'leftArc' ? 'M44 8Q15 23 15 51' : 'M16 8Q45 23 45 51'} />
  </svg>;
}
function ForwardArrow() {
  return <svg shuku-edit-id="e-095872ce-8670-4445-9f96-c6529f615af0" className={c('arrow')} viewBox="0 0 80 32" fill="none" aria-hidden="true"><path shuku-edit-id="e-89e69312-6e6a-4abe-a9b9-9a57209ed74c" d="M5 16H71M59 5L71 16L59 27" /></svg>;
}
export interface FeatureCompositionLabProps {
  state: CompositionState;
  onAction: (action: CompositionAction) => void;
}
export function FeatureCompositionLab({ state, onAction }: FeatureCompositionLabProps) {
  const result = calculateComposition(state), next = nextCompositionAction(state);
  const formula = '(' + CLUES.map(id => result.contributions[id]).join('+') + '-2)=' + result.center;
  return <div shuku-edit-id="e-145c79fc-dbf6-40c6-8609-0467d5c7cea8" className="rtg-feature-composition" data-misplaced={state.misplaced} data-response={result.center}>
    <div shuku-edit-id="e-27dfb3fe-8d35-4695-b738-0f90a4c8ebf2" className={c('stage')}>
      <article shuku-edit-id="e-0fcf065c-1ac1-4504-9669-f924dccae9ad" className={c('column')}>
        <Typography shuku-edit-id="e-f8d4ab2d-b55f-4d45-82ae-eb055b05d7ad" as="h3" variant="body" tone="accent">前层：三种线索</Typography>
        <div shuku-edit-id="e-bfc0201c-c0bd-41fb-b611-9fbb6e9445d4" className={c('map-slot')}>
          <div shuku-edit-id="e-edcb4637-5a3d-4017-b782-424806653ad2" className={c('source-map')} role="group" aria-label="三个前层通道的空间叠图，点击线索接入或移除">
            <svg shuku-edit-id="e-163200dd-c38d-42d1-9129-117236cfe299" className={c('source-grid')} viewBox="0 0 300 300" fill="none" aria-hidden="true">
              {[1, 2, 3, 4].map(i => <path shuku-edit-id="e-f5d2e6ab-b99e-4f22-a815-dacf31694148" key={i} d={'M' + i * 60 + ' 0V300M0 ' + i * 60 + 'H300'} />)}
              <path shuku-edit-id="e-e8186577-328e-40bd-9778-fedba5d91cc4" className={c('guide')} d="M132 28H168V74L174 90Q210 110 222 152L228 266M132 74L126 90Q90 110 78 152L72 266" />
              <rect shuku-edit-id="e-f5dbe3be-4613-4df8-a70a-98502b7720e6" className={c('window')} x="60" y="60" width="180" height="180" />
            </svg>
            {state.misplaced && (['leftArc', 'rightArc'] as const).map(id => {
              const p = cluePosition(id, false);
              return <span shuku-edit-id="e-5b3eb4f8-e6f0-4656-983f-c64c8a1c7f3d" key={id} className={c('expected')} aria-hidden="true"
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
        <div shuku-edit-id="e-8a74935a-15ed-4e27-81c9-312eedba9102" className={c('legend')}>
          {CLUES.map(id => <Typography shuku-edit-id="e-0e8916cd-3f7a-4d70-8d24-747df284cb7a" key={id} as="span" variant="bodySmall" tone="inherit" style={{ color: clueColor[id] }}>
            <i shuku-edit-id="e-2edda73f-bdc8-4ec5-b09e-7728efc153dc" aria-hidden="true" />{id === 'rim' ? '上沿' : id === 'leftArc' ? '左弧' : '右弧'}
          </Typography>)}
        </div>
      </article>
      <ForwardArrow />
      <article shuku-edit-id="e-285d2c0e-8377-4782-83ef-364000384057" className={c('column')}>
        <Typography shuku-edit-id="e-cf5028ea-5e0c-42b1-b507-d00af786f4cb" as="h3" variant="body" tone="accent">按位置组合</Typography>
        <div shuku-edit-id="e-5c27642b-36ae-4bdc-9e28-a8261d13d155" className={c('compute-stage')}>
          <div shuku-edit-id="e-faeb8662-72e9-4951-9f46-2ed8b8f46397" className={c('contributions')} aria-label="中心位置的各通道加权贡献">
            {CLUES.map(id => <div shuku-edit-id="e-5cd1de4b-12ac-4ea3-9600-90ba4c5469b7" key={id} style={{ '--clue-color': clueColor[id] } as CSSProperties}>
              <Typography shuku-edit-id="e-7eaae205-aa01-440e-b122-289d43b01dc7" as="span" variant="bodySmall" tone="inherit">{id === 'rim' ? '上沿' : id === 'leftArc' ? '左弧' : '右弧'}</Typography>
              <MathFormulaBlock appearance="plain" ariaLabel={CLUE_LABELS[id] + '贡献' + result.contributions[id]}>
                <MathFormulaStatic latex={'+' + result.contributions[id]} />
              </MathFormulaBlock><span shuku-edit-id="e-7d849fc3-4c29-4a20-a5a0-43ebc450ac78" className={c('lane')} aria-hidden="true" />
            </div>)}
          </div>
          <div shuku-edit-id="e-f2a4db8e-a084-45b2-b3bf-1f326d614e61" className={c('operator')}>
            <Typography shuku-edit-id="e-015c5b95-3632-485d-aff4-53e2c62d8fe7" variant="body" tone="accent">卷积＋激活</Typography>
            <Typography shuku-edit-id="e-4a50dfa4-a5e8-4d8a-a99e-c31d3ab4966b" variant="bodySmall" tone="muted">示意权重固定</Typography>
          </div>
        </div>
        <MathFormulaBlock appearance="plain" className={c('formula')} ariaLabel={'负数归零后的中心响应为' + result.center}>
          <MathFormulaTerm latex={String.raw`\operatorname{ReLU}`} ariaLabel="ReLU 激活：负数归零，正数保留" tooltip="ReLU 激活：将负数变成 0，保留 0 和正数。括号内是各条线索的贡献之和，再加上偏置。" tooltipPlacement="top" />
          <MathFormulaStatic latex={formula} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-99f6cc9f-897e-4c50-9de4-fa1f8f6ecbd3" variant="bodySmall" tone="muted">ReLU：负数归零，正数保留</Typography>
      </article>
      <ForwardArrow />
      <article shuku-edit-id="e-7913e1c3-363a-44b4-81ac-0ff64aae53ad" className={c('column')}>
        <Typography shuku-edit-id="e-469b42cb-9b7d-401a-8c11-ae1554114a8e" as="h3" variant="body" tone="accent">后层：组合响应</Typography>
        <div shuku-edit-id="e-8f08beb7-49a1-41b3-871b-8abf91da5f2e" className={c('map-slot')}>
          <div shuku-edit-id="e-51b59432-da42-4d9e-84fb-712872f6b1d9" className={c('response-map')} role="img" aria-label={'计算得到三行三列响应图，中心为' + result.center + '，其余位置均为0'}>
            {result.output.flatMap((row, y) => row.map((value, x) => <div shuku-edit-id="e-f9be1e1a-b041-4367-bc8a-3a2f9d966a30" key={y + '-' + x}
              className={(x === 1 && y === 1 ? 'is-center ' : '') + (value > 0 ? 'is-active' : '')}>
              <Typography shuku-edit-id="e-3c133abf-0512-48a7-9861-77ef5244b139" as="span" variant="body" tone="inherit">{value}</Typography>
            </div>))}
          </div>
        </div>
        <Typography shuku-edit-id="e-11f8664d-d22c-432c-bde8-5c452e6ad487" variant="bodySmall" tone="muted">响应值，非类别概率</Typography>
      </article>
    </div>
    <Typography shuku-edit-id="e-7c7d12c9-1edc-425a-9d84-91a3e5d21003" variant="body" tone="accent" align="center" className={c('insight')}>{compositionInsight(state)}</Typography>
    <div shuku-edit-id="e-8e2d52e7-6e2b-4997-a2a3-03877e454734" className={c('actions')}>
      <span shuku-edit-id="e-bdd621e5-be30-4533-afd8-c60115e65237" aria-hidden="true" />
      <Button variant="primary" onClick={() => onAction(next.action)}>
        <Typography shuku-edit-id="e-b271611a-c602-4c31-81dc-d8654bb57ba3" as="span" variant="bodySmall" tone="inherit">{next.label}</Typography>
      </Button>
      <Typography shuku-edit-id="e-39ac2e3a-29ed-4d95-bf1b-6c38906ec59b" variant="bodySmall" tone="muted">人工示例，非训练结果</Typography>
    </div>
  </div>;
}
