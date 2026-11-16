import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TRANSLATION_TRAINING_SET, TRANSLATION_STRUCTURE_EPOCH, inspectStructureTranslationStep, type TranslationStepInspection } from '../../model/attentionTranslationExperiment';
import './AttentionTranslationStructurePage.css';

// Keep the saved target step and completion from the previous reading activity.
interface ReadingState { row: number; revealed: boolean; completed: boolean }
type ModelPart = 'encoder' | 'key' | 'value' | 'query' | 'attention' | 'context' | 'decoder';
const initial: ReadingState = { row: 2, revealed: false, completed: false };
const example = TRANSLATION_TRAINING_SET[0];
const source = example.sourceTokens.slice(0, example.sourceValidLength);
const explanations: Record<ModelPart, string> = {
  encoder: '原句 → 各位置表示。',
  key: '原句表示 → K，用于匹配。',
  value: '原句表示 → V，用于汇聚。',
  query: '前一状态经 WQ 投影为 Q。',
  attention: 'Q、K 匹配 → 读取比例。',
  context: '按 ATT 汇聚 V → Context。',
  decoder: '前词、状态、Context → 译词。',
};
function valid(value: unknown): value is ReadingState {
  if (!value || typeof value !== 'object') return false;
  const state = value as ReadingState;
  return Number.isInteger(state.row) && state.row >= 0 && state.row < 3
    && typeof state.revealed === 'boolean' && typeof state.completed === 'boolean';
}
function Vector({ values }: { values: readonly number[] }) {
  return <span shuku-edit-id="e-43ec20e7-08ed-42dc-8326-60ba5439713d" className="attn-model-vector" style={{'--attn-vector-size': values.length} as CSSProperties} aria-hidden="true">{values.map((value, index) => <span shuku-edit-id="e-f499cc0e-13b2-4c0b-ad6c-b155c8a9b297" key={index} style={{ opacity: .2 + .8 * Math.min(1, Math.abs(value)) }}/>)}</span>;
}
function Memory({ values }: { values: readonly number[][] }) {
  return <span shuku-edit-id="e-72ffd822-cd7c-46c6-8778-5b598047df3d" className="attn-model-memory" aria-hidden="true">{values.slice(0, source.length).map((vector, index) => <Vector key={index} values={vector}/>)}</span>;
}
const position = (x: number, y: number, width: number, height: number): CSSProperties => ({ left: `${x / 1488 * 100}%`, top: `${y / 470 * 100}%`, width: `${width / 1488 * 100}%`, height: `${height / 470 * 100}%` });

// The two GRU inputs stay separate: a 7-dimensional input and a 4-dimensional state.
function DecoderDetail({ snapshot, arrowId }: { snapshot: TranslationStepInspection; arrowId: string }) {
  const cells = (values: readonly number[], contextFrom = values.length) => <span shuku-edit-id="e-61cc6693-6675-43d5-8102-df5b6270c1ba" className="attn-model-decode-vector" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }} aria-hidden="true">{values.map((value, index) => <span shuku-edit-id="e-77934312-36a6-437e-a87f-b50adeb74e73" key={index} data-vector-value={value} className={index >= contextFrom ? 'is-context' : ''} style={{ opacity: .25 + .75 * Math.min(1, Math.abs(value)) }}/>)}</span>;
  const line = (name: string, d: string, state = false) => <path shuku-edit-id="e-4f581581-fefb-41f0-9796-b3508e4b91e1" data-connection={name} d={d} className={`is-highlighted${state ? ' is-state-link' : ''}`} markerEnd={`url(#${arrowId}-decode-arrow)`}/>;
  return <div shuku-edit-id="e-5866d899-e3cc-4806-ad47-3c3a30441568" className="attn-model-diagram attn-model-decode" role="group" aria-label="解码过程：拼接输入、更新状态、生成译词">
    <svg shuku-edit-id="e-8567726d-68a5-41cf-8511-ed4a5f06f370" className="attn-model-connections" viewBox="0 0 1488 470" preserveAspectRatio="none" aria-hidden="true">
      <defs shuku-edit-id="e-269c1905-3052-482e-9e6f-c9e030743cf5"><marker shuku-edit-id="e-9f3fb4d0-df14-498b-a65a-f53dd422f050" id={`${arrowId}-decode-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path shuku-edit-id="e-5d7159ae-8f6f-4071-9422-1c0dfd7ac451" d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="2"/></marker></defs>
      {line('embedding-concat', 'M105 181V210Q105 225 125 225H200V245')}
      {line('context-concat', 'M337.5 181V210Q337.5 225 315 225H240V245')}
      {line('input-gru', 'M395 334H515Q535 334 535 314V310Q535 290 555 290H610')}
      {line('old-state-gru', 'M720 176V245', true)}
      {line('gru-new-state', 'M720 335V365')}
      {line('new-state-output-concat', 'M870 444H950Q970 444 970 424V170Q970 150 990 150H1040')}
      {line('output-concat-layer', 'M1255 225V275')}
      {line('layer-probability', 'M1255 355V395')}
    </svg>
    <Typography shuku-edit-id="e-5bac0b9f-5a0d-4538-9784-63e00566db61" className="attn-model-decode-item" style={position(0, 0, 440, 60)} variant="h3" align="center">① 拼接输入</Typography>
    <Typography shuku-edit-id="e-fae10e9d-a831-45b9-93d7-14f56c4bca6d" className="attn-model-decode-item" style={position(520, 0, 410, 60)} variant="h3" align="center">② GRU：更新状态</Typography>
    <Typography shuku-edit-id="e-f67acea7-4a66-44b6-8e8a-11c28f856866" className="attn-model-decode-item" style={position(1025, 0, 460, 60)} variant="h3" align="center">③ 生成译词</Typography>
    <div shuku-edit-id="e-45d436f1-dfb9-4b8a-992b-7b213953cdc6" className="attn-model-decode-item attn-model-decode-data" data-decode-value="embedding" style={position(0, 90, 210, 95)}>
      <Typography shuku-edit-id="e-fed05e6a-545d-4968-989b-a54baedcb0b6" variant="bodySmall" align="center">前词：{snapshot.decoderInputToken === '<bos>' ? '开始' : snapshot.decoderInputToken}</Typography>
      {cells(snapshot.decoderInputEmbedding)}
    </div>
    <div shuku-edit-id="e-be86ae57-8939-417a-b793-be1996c5e480" className="attn-model-decode-item attn-model-decode-data" data-decode-value="context" style={position(235, 90, 205, 95)}>
      <Typography shuku-edit-id="e-24afe35e-8363-4d2e-977c-475c884ca0a7" variant="bodySmall" align="center">Context</Typography>{cells(snapshot.context, 0)}
    </div>
    <div shuku-edit-id="e-1054023e-ab70-4688-a443-a607dc9dfa45" className="attn-model-decode-item attn-model-decode-data" data-decode-value="input" style={position(45, 245, 350, 120)}>
      <Typography shuku-edit-id="e-4a74dba4-2821-4d4b-8d26-a58070052b71" variant="bodySmall" align="center">拼接 · <MathFormulaStatic className="attn-inline-math" role="math" aria-label="三加四等于七" latex={String.raw`3+4=7`}/> 维</Typography>{cells(snapshot.decoderInput, 3)}
    </div>
    <div shuku-edit-id="e-9d598036-599d-44d3-a1fd-65c873e2dde1" className="attn-model-decode-item attn-model-decode-data" data-decode-value="old-state" style={position(570, 80, 300, 105)}>
      <Typography shuku-edit-id="e-9ebcc1a0-ebe0-41e0-93a5-ce9904429d2e" variant="bodySmall" align="center">旧状态 · 4 维</Typography>{cells(snapshot.previousDecoderState)}
    </div>
    <div shuku-edit-id="e-bf033f3a-1771-4d9d-acc4-d252d0693491" className="attn-model-decode-item attn-model-decode-gru" style={position(610, 245, 220, 90)}><Typography shuku-edit-id="e-8469f16c-a155-44c6-bb91-f39fcec1e428" variant="h3" tone="accent" align="center">GRU</Typography></div>
    <div shuku-edit-id="e-6b550860-6c8d-4225-8d84-9e9293928ba5" className="attn-model-decode-item attn-model-decode-data" data-decode-value="new-state" style={position(570, 365, 300, 100)}>
      <Typography shuku-edit-id="e-95ba9dbe-032d-4ec4-ad11-b4f926ecac7f" variant="bodySmall" align="center">新状态 · 4 维</Typography>{cells(snapshot.decoderState)}
    </div>
    <div shuku-edit-id="e-5a16cb2c-aabb-481d-9a64-4064414ddf72" className="attn-model-decode-item attn-model-decode-data" data-decode-value="output-input" style={position(1040, 75, 430, 150)}>
      <Typography shuku-edit-id="e-5dc13c67-0130-4683-881b-8a0787f74313" variant="bodySmall" align="center">新状态与 Context</Typography>{cells(snapshot.outputInput, 4)}<Typography shuku-edit-id="e-c9d8ff7f-3e45-462c-bc65-2fa8e5825fc1" variant="bodySmall" tone="muted" align="center">拼接 · <MathFormulaStatic className="attn-inline-math" role="math" aria-label="四加四等于八" latex={String.raw`4+4=8`}/> 维</Typography>
    </div>
    <div shuku-edit-id="e-91ff352d-feb8-4385-bd95-3eea8de1d032" className="attn-model-decode-item attn-model-decode-gru" style={position(1125, 275, 260, 80)}><Typography shuku-edit-id="e-94eb5a0f-d4dc-4919-a38f-8d231a68207f" variant="h3" tone="accent" align="center">输出层</Typography></div>
    <Typography shuku-edit-id="e-1ceacee5-736a-4dad-86df-8d2be0be4cca" className="attn-model-decode-item" style={position(1035, 395, 440, 65)} variant="bodySmall" align="center">译词概率 → 取最大</Typography>
  </div>;
}

export function AttentionTranslationStructurePage(props: ActivityProps) {
  const [state, setState] = useActivityState('C19-campus-model-reading', initial, valid);
  const [selected, setSelected] = useState<ModelPart>('attention');
  const [sourceIndex, setSourceIndex] = useState(3);
  const root = useRef<HTMLDivElement>(null);
  const arrowId = useId().replace(/:/g, '');
  const [active,setActive]=useState(false);
  const [mathReady,setMathReady]=useState(false);
  useLayoutEffect(()=>{
    const element=root.current;if(!element)return;
    const sync=()=>{const hidden=Boolean(element.closest('[aria-hidden="true"], [hidden]'));element.inert=hidden;setActive(!hidden&&!document.hidden);};
    const observer=new MutationObserver(sync);
    for(let ancestor:HTMLElement|null=element;ancestor;ancestor=ancestor.parentElement)observer.observe(ancestor,{attributes:true,attributeFilter:['aria-hidden','hidden']});
    document.addEventListener('visibilitychange',sync);sync();
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  useEffect(()=>{let mounted=true;void customElements.whenDefined('math-field').then(()=>{if(mounted)setMathReady(true);});return()=>{mounted=false;};},[]);
  useEffect(()=>{if(active&&state.completed&&!props.isComplete)props.onComplete();},[active,state.completed,props.isComplete,props.onComplete]);
  // This is the original fixed snapshot, inspected without training. Target-step
  // buttons choose a reference step; the output node deliberately names a role,
  // rather than presenting the target token as the model's actual prediction.
  const snapshot = useMemo(() => inspectStructureTranslationStep(state.row), [state.row]);
  const safe = () => active && !document.hidden && Boolean(root.current && !root.current.closest('[aria-hidden="true"], [inert]'));
  const select = (part: ModelPart) => { if (safe()) { setSelected(part); setState(current => ({ ...current, revealed: true, completed: true })); } };
  const node = (part: ModelPart, label: string, x: number, y: number, width: number, height: number, children: ReactNode) => <Button className={`attn-model-node attn-model-${part}${selected === part ? ' is-selected' : ''}`} style={position(x, y, width, height)} aria-label={label} aria-pressed={selected === part} aria-describedby={`${arrowId}-description`} onClick={() => select(part)}>{children}</Button>;
  const edge = (name: string, d: string, parts: ModelPart[], extra = '') => <path shuku-edit-id="e-713c9bc2-e517-4f78-99b1-df1ca4d972bd" data-connection={name} className={`${parts.includes(selected) ? 'is-highlighted' : ''} ${extra}`} d={d} markerEnd={`url(#${arrowId}-arrow)`}/>;
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
  const detail = <section shuku-edit-id="e-e0f0a6cc-d0fa-4ff6-89ad-83cc33b4daa9" className="attn-model-detail" aria-label="所选节点的真实数值" data-detail-part={selected}>
    <div shuku-edit-id="e-e9874380-69a2-4568-8c34-badad395cd8c" className="attn-model-detail-info">
      <Typography shuku-edit-id="e-d9098185-bbd0-4304-a9c0-25344ff91ce1" variant="h3" tone="accent">{detailTitles[selected]}</Typography>
      <Typography shuku-edit-id="e-3cd82c37-600d-4dfb-8302-93d94b98675d" id={`${arrowId}-description`} variant="bodySmall" tone="muted">{explanation}</Typography>
      {showsSource && <ChoiceButtons label="选择查看编码表示的原词" value={String(sourceIndex)}
        options={source.map((word, index) => ({ value: String(index), label: word }))}
        onChange={value => { const index = Number(value); if (safe() && Number.isInteger(index) && index >= 0 && index < source.length) setSourceIndex(index); }}/>}
    </div>
    <div shuku-edit-id="e-496ba46a-024a-44e2-bad1-98020a006404" className="attn-model-readout" style={{gridTemplateColumns:`repeat(${numbers.length},minmax(0,1fr))`}} role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${detailTitles[selected]}${showsSource ? `，原词 ${source[sourceIndex]}` : ''}`}>
      {numbers.map((value, index) => <div shuku-edit-id="e-1b61e71b-fd17-4f17-a83b-1e5377df575e" className="attn-model-number" key={index} data-numeric-value={value}>
        <Typography shuku-edit-id="e-604a6beb-6b03-4a69-97f7-1dc56834948a" variant="bodySmall" tone="muted" align="center">{selected === 'attention' ? source[index] : `第 ${index + 1} 维`}</Typography>
        <Typography shuku-edit-id="e-2d8e35e3-968e-4488-857c-c9a9657561ef" variant="h3" tone="accent" align="center" className="attn-numeric">{selected === 'attention' ? `${(value * 100).toFixed(1)}%` : Number(value.toFixed(3)).toFixed(3).replace('-', '−')}</Typography>
        {selected === 'attention' && <span shuku-edit-id="e-3f7d3afb-8f3a-46ef-b04f-3a8e0964737f" className="attn-model-weight-track" aria-hidden="true"><span shuku-edit-id="e-3f39a3cb-53d1-4621-a885-2f16fb03f0ce" style={{ width: `${value * 100}%` }}/></span>}
      </div>)}
    </div>
  </section>;

  return <ContentBlock shuku-edit-id="e-0ddce04a-4c24-4375-aaf2-29dd92c4686d" ref={root} headingLevel={1} title="翻译模型：编码、读取与解码"
    subtitle="沿同一句讲解稿，查看信息流。"
    className="attn-model-page" bodyClassName="attn-model-body" data-capture-ready={mathReady} aria-busy={!mathReady}
    data-activity="C19" data-activity-complete={state.completed} data-model-epoch={TRANSLATION_STRUCTURE_EPOCH}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-d40adb47-1365-4add-9f79-b278c29ab255" className="attn-model-main" data-model-row={state.row} data-model-part={selected} data-model-source={sourceIndex}>
      <div shuku-edit-id="e-ce7e14b4-daf2-423c-87d1-e01f9aa468c9" className="attn-model-step">{selected === 'decoder' && <Button className="attn-model-back" onClick={() => select('attention')}><Typography shuku-edit-id="e-0920458f-32e3-49f7-b3c2-be97ce7d73fb" as="span" variant="bodySmall" tone="inherit">返回模型</Typography></Button>}<Typography shuku-edit-id="e-97f7ce13-cd3d-44f0-975b-7f2e48ab3bb5" variant="bodySmall" tone="muted">目标步</Typography><ChoiceButtons label="切换模型的目标步" value={String(state.row)} options={example.targetTokens.slice(0, 3).map((word, row) => ({ value: String(row), label: word }))} onChange={value => { const row = Number(value); if (safe() && Number.isInteger(row) && row >= 0 && row < 3) setState(current => ({ ...current, row })); }}/></div>
      {selected === 'decoder' ? <DecoderDetail snapshot={snapshot} arrowId={arrowId}/> : <div shuku-edit-id="e-6c97d22b-4c8e-4478-b28e-303bba387d95" className="attn-model-diagram" role="group" aria-label="注意力翻译模型交互结构图">
        <svg shuku-edit-id="e-bbc92cd2-8dc0-4904-b204-1d05bf1bb90a" className="attn-model-connections" viewBox="0 0 1488 470" preserveAspectRatio="none" aria-hidden="true">
          <defs shuku-edit-id="e-e28240a6-536c-4069-b55a-5c6fe468b73f"><marker shuku-edit-id="e-73d6bce9-4e9d-4bb9-87a4-c5d2652c10f3" id={`${arrowId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path shuku-edit-id="e-9f47d877-158b-49bb-af43-20881cafbf86" d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="2"/></marker></defs>
          {edge('source-encoder', 'M340 90H420', ['encoder'])}
          {edge('encoder-memory', 'M660 90H785', ['encoder', 'key', 'value'])}
          {edge('key-attention', 'M870 189V208Q870 224 850 224H600Q580 224 580 242V260', ['key', 'attention'])}
          {edge('value-context', 'M1040 189V215Q1040 231 1020 231H985Q965 231 965 249V280', ['value', 'context'])}
          {edge('query-attention', 'M280 350H420', ['query', 'attention'])}
          {edge('attention-context', 'M740 350H850', ['attention', 'context'])}
          {edge('context-decoder', 'M1080 350H1210', ['context', 'decoder'])}
          {edge('previous-word-decoder', 'M1340 252V280', ['decoder'])}
          {selected === 'query' && state.row === 0 && edge('encoder-initial-query', 'M540 135V180Q540 195 520 195H175Q150 195 150 220V275', ['query'], 'is-state-link')}
        </svg>
        <div shuku-edit-id="e-7c52be8b-d1cd-4193-be7b-37e6d3713366" className="attn-model-source" style={position(10, 15, 330, 145)}><Typography shuku-edit-id="e-52970c4b-7e0f-4395-83db-6f732cbe5fbd" variant="bodySmall" tone="muted">原句</Typography><div shuku-edit-id="e-550a3068-e6e0-412d-ae5c-99073dcdebd5" className="attn-model-source-words">{source.map((word, index) => <Typography shuku-edit-id="e-b70cc103-2137-4184-a25b-18318f1e231e" key={index} variant="bodySmall" align="center">{word}</Typography>)}</div></div>
        {node('encoder', '编码器：原句的表示', 420, 45, 240, 90, <Typography shuku-edit-id="e-8052dbef-15ad-4c90-bad0-662dc9010960" as="span" variant="h3" tone="inherit">编码器</Typography>)}
        <div shuku-edit-id="e-919b5b32-5feb-4039-94e4-f54becafea85" className="attn-model-memory-group" style={position(785, 0, 345, 204)}><Typography shuku-edit-id="e-b832b9bd-f6e7-4092-a3cf-c6634b89a5e4" variant="bodySmall" tone="muted" align="center">X 分别投影</Typography></div>
        {node('key', 'K：用于匹配的源词表示', 800, 63, 140, 126, <><Typography shuku-edit-id="e-1fd903ef-f2f7-4c52-adf2-8e315554ee69" as="span" variant="h3" tone="inherit">K</Typography><Memory values={snapshot.projectedKeys}/></>)}
        {node('value', 'V：用于汇聚的源词表示', 970, 63, 140, 126, <><Typography shuku-edit-id="e-8d311721-e467-463a-a713-d9a202aa1a23" as="span" variant="h3" tone="inherit">V</Typography><Memory values={snapshot.projectedValues}/></>)}
        <div shuku-edit-id="e-6ccc6036-7bc1-4776-8a57-97099f5b0ca4" className="attn-model-previous" style={position(1210, 180, 260, 72)}><Typography shuku-edit-id="e-86570aa0-fa90-4d18-9600-1b653630c4f7" variant="bodySmall" tone="muted">给定前词</Typography><Typography shuku-edit-id="e-aba342c6-30d3-43c1-a223-0d5a2f1cb41a" variant="h3">{snapshot.decoderInputToken === '<bos>' ? '开始' : snapshot.decoderInputToken}</Typography></div>
        {node('query', 'Q：当前查询状态', 25, 275, 255, 150, <><span shuku-edit-id="e-8d778c77-09b3-4cea-baf0-83ee5933ad26" className="attn-model-query-heading"><Typography shuku-edit-id="e-f56e83f0-55ab-4e81-b034-6a0f08eb0772" as="span" variant="h3" tone="inherit">Q</Typography><Typography shuku-edit-id="e-203331a0-1279-491b-acc3-0a4bbe70fa57" as="span" variant="bodySmall" tone="muted">{state.row === 0 ? '初始状态投影' : '状态投影'}</Typography></span><Vector values={snapshot.projectedQuery}/></>)}
        {node('attention', 'ATT：匹配得到读取比例', 420, 260, 320, 195, <><Typography shuku-edit-id="e-9fdee301-9488-4b4a-9348-cff2942fd4b9" as="span" variant="h2" tone="inherit">ATT</Typography><span shuku-edit-id="e-e9d40a68-4ffa-4c63-888f-95db14919f64" className="attn-model-att-words">{source.map((word, index) => <span shuku-edit-id="e-3ce55c7a-e8be-4e0a-9828-9055ed4bb00b" key={index} className="attn-model-att-word" data-weight={snapshot.weights[index]} style={{ background: `rgba(var(--ui-accent-rgb), ${.08 + .92 * snapshot.weights[index]})`, color: snapshot.weights[index] >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }} title={`${word}：${(snapshot.weights[index] * 100).toFixed(1)}%`}><Typography shuku-edit-id="e-1e34cede-699b-4192-a031-7b6c3ffefa9b" as="span" variant="bodySmall" tone="inherit">{word}</Typography></span>)}</span></>)}
        {node('context', 'Context：按权重汇聚的线索', 850, 280, 230, 145, <><Typography shuku-edit-id="e-2df61f9c-6ec3-446f-be1b-19233339f48e" as="span" variant="h3" tone="inherit">Context</Typography><Vector values={snapshot.context}/></>)}
        {node('decoder', '解码并输出译词', 1210, 280, 260, 145, <><Typography shuku-edit-id="e-2955cf2d-9898-4289-aebd-a72b1357aad4" as="span" variant="h3" tone="inherit">解码并输出</Typography><Typography shuku-edit-id="e-6e9704d3-5dbd-4ea9-9275-9388ed9abe3a" as="span" variant="bodySmall" tone="muted">译词</Typography></>)}
      </div>}
    </div>
    <footer shuku-edit-id="e-3fd1e619-ab85-4ec4-b760-213bfe3245a8" className="attn-model-footer">{detail}</footer>
    <Typography shuku-edit-id="e-854589b3-1ef9-4c2e-9436-81f04acf8bea" variant="bodySmall" tone="muted">{TRANSLATION_STRUCTURE_EPOCH} 轮快照 · 给定正确前词 · 不保证逐词对齐。</Typography>
  </ContentBlock>;
}
