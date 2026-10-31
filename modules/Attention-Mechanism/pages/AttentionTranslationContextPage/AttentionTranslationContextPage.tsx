import { useRef, useState, type CSSProperties } from 'react';
import { MathFormulaStatic, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { getTranslationTeachingStep, TRANSLATION_TEACHING_ROWS } from '../../model/translationTeaching';
import './AttentionTranslationContextPage.css';

type ContextMode = 'fixed' | 'dynamic';
interface ContextActivity { version: 2; mode: ContextMode; compared: boolean; row: number; visited: number[] }
const INITIAL: ContextActivity = { version: 2, mode: 'fixed', compared: false, row: 0, visited: [0] };
const isRow = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 3;
function valid(value: unknown): value is ContextActivity {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<ContextActivity>;
  return state.version === 2 && (state.mode === 'fixed' || state.mode === 'dynamic')
    && typeof state.compared === 'boolean' && isRow(state.row) && Array.isArray(state.visited)
    && state.visited.length > 0 && state.visited.length <= 3 && state.visited.includes(state.row) && state.visited.every(isRow);
}
function readInitialState(): ContextActivity {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('attention-mechanism:C17-context-v20') ?? 'null');
    if (valid(saved)) return saved;
    if (saved && typeof saved === 'object') {
      const old = saved as Record<string, unknown>;
      if (isRow(old.row) && typeof old.checked === 'boolean') {
        const visited = Array.isArray(old.visited) ? old.visited.filter(isRow) : [];
        return { version: 2, mode: old.checked ? 'dynamic' : 'fixed', compared: old.checked,
          row: old.row, visited: [...new Set([...visited, old.row])] };
      }
    }
  } catch { /* Continue without saved progress. */ }
  return INITIAL;
}
const WIDTH = 1440;
const HEIGHT = 430;
const WORD_X = [30, 180, 330, 480];
const place = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / WIDTH * 100}%`, top: `${y / HEIGHT * 100}%`,
  width: `${width / WIDTH * 100}%`, height: `${height / HEIGHT * 100}%`,
});

export function AttentionTranslationContextPage(props: ActivityProps) {
  const [initial] = useState(readInitialState);
  const [state, setState] = useActivityState('C17-context', initial, valid);
  const root = useRef<HTMLDivElement>(null);
  const dynamic = state.mode === 'dynamic';
  const step = getTranslationTeachingStep(state.row);
  const active = () => Boolean(root.current && !root.current.closest('[aria-hidden="true"], [inert]'));
  const changeMode = (mode: string) => {
    if (!active() || (mode !== 'fixed' && mode !== 'dynamic')) return;
    setState(current => current.mode === mode ? current : { ...current, mode, compared: true });
  };
  const changeRow = (value: string) => {
    const row = Number(value);
    if (!active() || !isRow(row)) return;
    setState(current => ({ ...current, row, visited: [...new Set([...current.visited, row])] }));
  };
  const description = dynamic
    ? `教学示意，目标译词${step.target}：当前解码状态决定读取比例，按比例汇聚原句信息形成c${step.contextIndex}，再交给解码器。线条粗细与词块颜色表示关注程度，不是实际模型预测。`
    : `固定摘要示意：原句编码为C，仅在开始时初始化解码状态，后续沿状态传递信息。目标译词切换为${step.target}时，C不变，解码状态仍会变化。`;

  return <AttentionActivity {...props} number={17} title="翻译时按需汇聚上下文" eyebrow="买完冰水到家，小明发消息：I am home. · 教学示意"
    learningFlow={<Typography variant="bodySmall" tone="accent">手设教学示意：比较固定摘要与逐步读取；实际权重由训练学出。</Typography>}
    done={state.compared && state.visited.length >= 2} className="attn-context-page" footerHeight={132}
    footer={<><div className="attn-context-targets">
      <Typography variant="bodySmall" tone="muted">目标译词</Typography>
      <ChoiceButtons label="选择翻译目标步" value={String(state.row)} onChange={changeRow}
        options={TRANSLATION_TEACHING_ROWS.map((word, index) => ({ value: String(index), label: word }))} />
    </div><Typography variant="bodySmall" tone="accent" align="center">估价汇聚售价；翻译汇聚词的信息，再由解码器生成译词。</Typography></>}>
    <div ref={root} className="attn-context-main" data-context-mode={state.mode}>
      <ChoiceButtons label="比较 Context 的读取方式" value={state.mode} onChange={changeMode}
        options={[{ value: 'fixed', label: '固定摘要' }, { value: 'dynamic', label: '按步读取' }]} />
      <div className="attn-context-diagram" role="img" aria-label={description}>
        <div className="attn-context-label" style={place(30, 35, 570, 50)}>
          <Typography variant="bodySmall" tone="muted">小明到家发消息：怎样逐词翻译？</Typography>
        </div>
        <svg className="attn-context-wires" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          {dynamic ? step.weights.map((weight, index) => <path key={index} className="attn-context-att-wire"
            d={`M ${WORD_X[index] + 60} 191 C ${WORD_X[index] + 60} 285, 585 300, 714 300`}
            style={{ strokeWidth: 2 + weight * 13, opacity: .16 + weight * .84 }} />) : <>
            {WORD_X.map(x => <path key={x} className="attn-context-fixed-wire" d={`M ${x + 60} 191 V 275`} />)}
            <path className="attn-context-fixed-wire" d="M 90 275 H 610 Q 650 275 650 300 H 714" />
          </>}
          <polygon className="attn-context-arrow" points="730,300 714,293 714,307" />
          <path className="attn-context-decoder-wire" d="M 980 300 H 1144" />
          <polygon className="attn-context-arrow" points="1160,300 1144,293 1144,307" />
        </svg>
        {step.sourceTokens.map((token, index) => <div key={index} data-context-source={index}
          className={`attn-context-word${dynamic ? ' is-weighted' : ''}`}
          style={{ ...place(WORD_X[index], 105, 120, 86),
            ...(dynamic ? { background: `color-mix(in srgb, var(--attn-activation) ${10 + step.weights[index] * 58}%, var(--ui-bg-card))` } : {}) }}>
          <Typography variant="h3" align="center">{token}</Typography>
        </div>)}
        <div className="attn-context-label" style={place(340, 335, 290, 50)}>
          <Typography variant="bodySmall" tone="muted">{dynamic ? '按 ATT 汇聚' : '整句编码'}</Typography>
        </div>
        <div className="attn-context-node is-context" style={place(730, 220, 250, 160)} data-context-node="context">
          <Typography variant="bodySmall" tone="muted">Context</Typography>
          <Typography variant="h2" tone="accent"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={dynamic ? `Context c ${step.contextIndex}` : "固定摘要 C"} latex={dynamic ? `c_{${step.contextIndex}}` : "C"}/></Typography>
        </div>
        <div className="attn-context-label" style={place(980, 227, 180, 55)}>
          <Typography variant="bodySmall" align="center" tone="muted">{dynamic ? '每一步' : '初始化'}</Typography>
        </div>
        <div className="attn-context-node is-decoder" style={place(1160, 220, 260, 160)} data-context-node="decoder">
          <Typography variant="h3" tone="accent">解码器</Typography>
          <Typography variant="bodySmall">目标：{step.target}</Typography>
        </div>
        <div className="attn-context-label" style={place(1010, 385, 410, 45)}>
          <Typography variant="bodySmall" tone="muted" align="end">{dynamic ? '重新读取原句' : '后续沿状态传递'}</Typography>
        </div>
      </div>
    </div>
  </AttentionActivity>;
}
