import { useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TRANSLATION_TRAINING_SET, inspectStructureTranslationStep, type TranslationStepInspection } from '../../model/attentionTranslationExperiment';
import './AttentionTranslationStructurePage.css';

// Keep the saved target step and completion from the previous reading activity.
interface ReadingState { row: number; revealed: boolean; completed: boolean }
type ModelPart = 'encoder' | 'key' | 'value' | 'query' | 'attention' | 'context' | 'decoder';
const initial: ReadingState = { row: 1, revealed: false, completed: false };
const example = TRANSLATION_TRAINING_SET[0];
const source = example.sourceTokens.slice(0, example.sourceValidLength);
const explanations: Record<ModelPart, string> = {
  encoder: '编码器把原句变成每个位置的表示。',
  key: 'K 用于匹配，来自原句的编码结果。',
  value: 'V 提供内容，与 K 来自同一组表示。',
  query: '上一步解码状态经 WQ 投影得到 Q。',
  attention: 'Q 与 K 匹配，得到读取比例。',
  context: '按 ATT 加权汇聚 V，得到 Context。',
  decoder: '结合前词、状态和 Context，解码并输出译词。',
};
function valid(value: unknown): value is ReadingState {
  if (!value || typeof value !== 'object') return false;
  const state = value as ReadingState;
  return Number.isInteger(state.row) && state.row >= 0 && state.row < 3
    && typeof state.revealed === 'boolean' && typeof state.completed === 'boolean';
}
function Vector({ values }: { values: readonly number[] }) {
  return <span className="attn-model-vector" aria-hidden="true">{values.map((value, index) => <span key={index} style={{ opacity: .2 + .8 * Math.min(1, Math.abs(value)) }}/>)}</span>;
}
function Memory({ values }: { values: readonly number[][] }) {
  return <span className="attn-model-memory" aria-hidden="true">{values.slice(0, source.length).map((vector, index) => <Vector key={index} values={vector}/>)}</span>;
}
const position = (x: number, y: number, width: number, height: number): CSSProperties => ({ left: `${x / 1488 * 100}%`, top: `${y / 470 * 100}%`, width: `${width / 1488 * 100}%`, height: `${height / 470 * 100}%` });

// The two GRU inputs stay separate: a 7-dimensional input and a 4-dimensional state.
function DecoderDetail({ snapshot, arrowId }: { snapshot: TranslationStepInspection; arrowId: string }) {
  const cells = (values: readonly number[], contextFrom = values.length) => <span className="attn-model-decode-vector" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }} aria-hidden="true">{values.map((value, index) => <span key={index} data-vector-value={value} className={index >= contextFrom ? 'is-context' : ''} style={{ opacity: .25 + .75 * Math.min(1, Math.abs(value)) }}/>)}</span>;
  const line = (name: string, d: string, state = false) => <path data-connection={name} d={d} className={`is-highlighted${state ? ' is-state-link' : ''}`} markerEnd={`url(#${arrowId}-decode-arrow)`}/>;
  return <div className="attn-model-diagram attn-model-decode" role="group" aria-label="解码过程：拼接输入、更新状态、生成译词">
    <svg className="attn-model-connections" viewBox="0 0 1488 470" preserveAspectRatio="none" aria-hidden="true">
      <defs><marker id={`${arrowId}-decode-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="2"/></marker></defs>
      {line('embedding-concat', 'M105 181V210Q105 225 125 225H200V245')}
      {line('context-concat', 'M337.5 181V210Q337.5 225 315 225H240V245')}
      {line('input-gru', 'M395 334H515Q535 334 535 314V310Q535 290 555 290H610')}
      {line('old-state-gru', 'M720 176V245', true)}
      {line('gru-new-state', 'M720 335V365')}
      {line('new-state-output-concat', 'M870 444H950Q970 444 970 424V170Q970 150 990 150H1040')}
      {line('output-concat-layer', 'M1255 225V275')}
      {line('layer-probability', 'M1255 355V395')}
    </svg>
    <Typography className="attn-model-decode-item" style={position(0, 0, 440, 60)} variant="h3" align="center">① 拼接输入</Typography>
    <Typography className="attn-model-decode-item" style={position(520, 0, 410, 60)} variant="h3" align="center">② GRU：更新状态</Typography>
    <Typography className="attn-model-decode-item" style={position(1025, 0, 460, 60)} variant="h3" align="center">③ 生成译词</Typography>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="embedding" style={position(0, 90, 210, 95)}>
      <Typography variant="bodySmall" align="center">前词：{snapshot.decoderInputToken === '<bos>' ? '开始' : snapshot.decoderInputToken}</Typography>
      {cells(snapshot.decoderInputEmbedding)}
    </div>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="context" style={position(235, 90, 205, 95)}>
      <Typography variant="bodySmall" align="center">Context</Typography>{cells(snapshot.context, 0)}
    </div>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="input" style={position(45, 245, 350, 120)}>
      <Typography variant="bodySmall" align="center">拼接 · <MathFormulaStatic className="attn-inline-math" role="math" aria-label="三加四等于七" latex={String.raw`3+4=7`}/> 维</Typography>{cells(snapshot.decoderInput, 3)}
    </div>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="old-state" style={position(570, 80, 300, 105)}>
      <Typography variant="bodySmall" align="center">旧状态 · 4 维</Typography>{cells(snapshot.previousDecoderState)}
    </div>
    <div className="attn-model-decode-item attn-model-decode-gru" style={position(610, 245, 220, 90)}><Typography variant="h3" tone="accent" align="center">GRU</Typography></div>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="new-state" style={position(570, 365, 300, 100)}>
      <Typography variant="bodySmall" align="center">新状态 · 4 维</Typography>{cells(snapshot.decoderState)}
    </div>
    <div className="attn-model-decode-item attn-model-decode-data" data-decode-value="output-input" style={position(1040, 75, 430, 150)}>
      <Typography variant="bodySmall" align="center">新状态与 Context</Typography>{cells(snapshot.outputInput, 4)}<Typography variant="bodySmall" tone="muted" align="center">拼接 · <MathFormulaStatic className="attn-inline-math" role="math" aria-label="四加四等于八" latex={String.raw`4+4=8`}/> 维</Typography>
    </div>
    <div className="attn-model-decode-item attn-model-decode-gru" style={position(1125, 275, 260, 80)}><Typography variant="h3" tone="accent" align="center">输出层</Typography></div>
    <Typography className="attn-model-decode-item" style={position(1035, 395, 440, 65)} variant="bodySmall" align="center">译词概率 → 取最大</Typography>
  </div>;
}

export function AttentionTranslationStructurePage(props: ActivityProps) {
  const [state, setState] = useActivityState('C19-att-reading', initial, valid);
  const [selected, setSelected] = useState<ModelPart>('attention');
  const [sourceIndex, setSourceIndex] = useState(2);
  const root = useRef<HTMLDivElement>(null);
  const arrowId = useId().replace(/:/g, '');
  // This is the original fixed snapshot, inspected without training. Target-step
  // buttons choose a reference step; the output node deliberately names a role,
  // rather than presenting the target token as the model's actual prediction.
  const snapshot = useMemo(() => inspectStructureTranslationStep(state.row), [state.row]);
  const safe = () => Boolean(root.current && !root.current.closest('[aria-hidden="true"], [inert]'));
  const select = (part: ModelPart) => { if (safe()) { setSelected(part); setState(current => ({ ...current, revealed: true, completed: true })); } };
  const node = (part: ModelPart, label: string, x: number, y: number, width: number, height: number, children: ReactNode) => <Button className={`attn-model-node attn-model-${part}${selected === part ? ' is-selected' : ''}`} style={position(x, y, width, height)} aria-label={label} aria-pressed={selected === part} aria-describedby={`${arrowId}-description`} onClick={() => select(part)}>{children}</Button>;
  const edge = (name: string, d: string, parts: ModelPart[], extra = '') => <path data-connection={name} className={`${parts.includes(selected) ? 'is-highlighted' : ''} ${extra}`} d={d} markerEnd={`url(#${arrowId}-arrow)`}/>;
  const showsSource = selected === 'encoder' || selected === 'key' || selected === 'value';
  const numbers = selected === 'key' ? snapshot.projectedKeys[sourceIndex]
    : selected === 'value' ? snapshot.projectedValues[sourceIndex]
    : showsSource ? snapshot.encoderStates[sourceIndex]
    : selected === 'query' ? snapshot.projectedQuery
    : selected === 'context' ? snapshot.context
    : selected === 'decoder' ? snapshot.decoderState
    : snapshot.weights.slice(0, source.length);
  const detailTitles: Record<ModelPart, string> = {
    encoder: '编码表示 · 4 维', key: 'K · 3 维', value: 'V · 4 维',
    query: 'Q · 3 维', attention: 'ATT · 读取比例', context: 'Context · 4 维',
    decoder: '解码后的新状态 · 4 维',
  };
  const explanation = selected === 'query' && state.row === 0 ? '初始状态经 WQ 投影，得到 Q。'
    : selected === 'key' ? <><MathFormulaStatic className="attn-inline-math" latex={String.raw`\boldsymbol k_i=\mathbf W_K\boldsymbol x_i`}/> · 用于匹配</>
    : selected === 'value' ? <><MathFormulaStatic className="attn-inline-math" latex={String.raw`\boldsymbol v_i=\mathbf W_V\boldsymbol x_i`}/> · 用于汇聚</>
    : selected === 'encoder' ? '每个原词各有一份表示。'
    : selected === 'decoder' ? '新状态经投影，得到下一步的 Q。'
    : explanations[selected];
  const detail = <section className="attn-model-detail" aria-label="所选节点的真实数值" data-detail-part={selected}>
    <div className="attn-model-detail-info">
      <Typography variant="h3" tone="accent">{detailTitles[selected]}</Typography>
      <Typography id={`${arrowId}-description`} variant="bodySmall" tone="muted">{explanation}</Typography>
      {showsSource && <ChoiceButtons label="选择查看编码表示的原词" value={String(sourceIndex)}
        options={source.map((word, index) => ({ value: String(index), label: word }))}
        onChange={value => { const index = Number(value); if (safe() && Number.isInteger(index) && index >= 0 && index < source.length) setSourceIndex(index); }}/>} 
    </div>
    <div className="attn-model-readout" role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${detailTitles[selected]}${showsSource ? `，原词 ${source[sourceIndex]}` : ''}`}>
      {numbers.map((value, index) => <div className="attn-model-number" key={index} data-numeric-value={value}>
        <Typography variant="bodySmall" tone="muted" align="center">{selected === 'attention' ? source[index] : `第 ${index + 1} 维`}</Typography>
        <Typography variant="h3" tone="accent" align="center" className="attn-numeric">{selected === 'attention' ? `${(value * 100).toFixed(1)}%` : Number(value.toFixed(3)).toFixed(3).replace('-', '−')}</Typography>
        {selected === 'attention' && <span className="attn-model-weight-track" aria-hidden="true"><span style={{ width: `${value * 100}%` }}/></span>}
      </div>)}
    </div>
  </section>;

  return <AttentionActivity {...props} number={19} title="翻译模型：编码、注意力与解码" eyebrow="小明的到家消息 · 英译中" learningFlow={<Typography variant="bodySmall" tone="muted">真实模型快照 · 给定正确前词 · 读取比例不保证逐词对齐</Typography>} done={state.completed || props.isComplete} footerHeight={188} className="attn-model-page"
    footer={detail}>
    <div ref={root} className="attn-model-main" data-model-row={state.row} data-model-part={selected} data-model-source={sourceIndex}>
      <div className="attn-model-step">{selected === 'decoder' && <Button className="attn-model-back" onClick={() => select('attention')}><Typography as="span" variant="bodySmall" tone="inherit">返回模型</Typography></Button>}<Typography variant="bodySmall" tone="muted">目标步</Typography><ChoiceButtons label="切换模型的目标步" value={String(state.row)} options={example.targetTokens.slice(0, 3).map((word, row) => ({ value: String(row), label: word }))} onChange={value => { const row = Number(value); if (safe() && Number.isInteger(row) && row >= 0 && row < 3) setState(current => ({ ...current, row })); }}/></div>
      {selected === 'decoder' ? <DecoderDetail snapshot={snapshot} arrowId={arrowId}/> : <div className="attn-model-diagram" role="group" aria-label="注意力翻译模型交互结构图">
        <svg className="attn-model-connections" viewBox="0 0 1488 470" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id={`${arrowId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="2"/></marker></defs>
          {edge('source-encoder', 'M340 90H420', ['encoder'])}
          {edge('encoder-memory', 'M660 90H785', ['encoder', 'key', 'value'])}
          {edge('key-attention', 'M870 160V185Q870 205 850 205H600Q580 205 580 225V260', ['key', 'attention'])}
          {edge('value-context', 'M1040 160V195Q1040 215 1020 215H985Q965 215 965 235V280', ['value', 'context'])}
          {edge('query-attention', 'M280 350H420', ['query', 'attention'])}
          {edge('attention-context', 'M740 350H850', ['attention', 'context'])}
          {edge('context-decoder', 'M1080 350H1210', ['context', 'decoder'])}
          {edge('previous-word-decoder', 'M1340 252V280', ['decoder'])}
          {selected === 'query' && state.row === 0 && edge('encoder-initial-query', 'M540 135V180Q540 195 520 195H175Q150 195 150 220V275', ['query'], 'is-state-link')}
        </svg>
        <div className="attn-model-source" style={position(10, 15, 330, 145)}><Typography variant="bodySmall" tone="muted">原句</Typography><div className="attn-model-source-words">{source.map((word, index) => <Typography key={index} variant="h3" align="center">{word}</Typography>)}</div></div>
        {node('encoder', '编码器：原句的表示', 420, 45, 240, 90, <Typography as="span" variant="h3" tone="inherit">编码器</Typography>)}
        <div className="attn-model-memory-group" style={position(785, 0, 345, 174)}><Typography variant="bodySmall" tone="muted" align="center">X 分别投影</Typography></div>
        {node('key', 'K：用于匹配的源词表示', 800, 50, 140, 110, <><Typography as="span" variant="h3" tone="inherit">K</Typography><Memory values={snapshot.projectedKeys}/></>)}
        {node('value', 'V：用于汇聚的源词表示', 970, 50, 140, 110, <><Typography as="span" variant="h3" tone="inherit">V</Typography><Memory values={snapshot.projectedValues}/></>)}
        <div className="attn-model-previous" style={position(1210, 180, 260, 72)}><Typography variant="bodySmall" tone="muted">给定前词</Typography><Typography variant="h3">{snapshot.decoderInputToken === '<bos>' ? '开始' : snapshot.decoderInputToken}</Typography></div>
        {node('query', 'Q：当前查询状态', 25, 275, 255, 150, <><span className="attn-model-query-heading"><Typography as="span" variant="h3" tone="inherit">Q</Typography><Typography as="span" variant="bodySmall" tone="muted">{state.row === 0 ? '初始状态投影' : '状态投影'}</Typography></span><Vector values={snapshot.projectedQuery}/></>)}
        {node('attention', 'ATT：匹配得到读取比例', 420, 260, 320, 165, <><Typography as="span" variant="h2" tone="inherit">ATT</Typography><span className="attn-model-att-words">{source.map((word, index) => <span key={index} className="attn-model-att-word" data-weight={snapshot.weights[index]} style={{ background: `rgba(var(--ui-accent-rgb), ${.08 + .92 * snapshot.weights[index]})`, color: snapshot.weights[index] >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }} title={`${word}：${(snapshot.weights[index] * 100).toFixed(1)}%`}><Typography as="span" variant="bodySmall" tone="inherit">{word}</Typography></span>)}</span></>)}
        {node('context', 'Context：按权重汇聚的线索', 850, 280, 230, 145, <><Typography as="span" variant="h3" tone="inherit">Context</Typography><Vector values={snapshot.context}/></>)}
        {node('decoder', '解码并输出译词', 1210, 280, 260, 145, <><Typography as="span" variant="h3" tone="inherit">解码并输出</Typography><Typography as="span" variant="bodySmall" tone="muted">译词</Typography></>)}
      </div>}
    </div>
  </AttentionActivity>;
}
