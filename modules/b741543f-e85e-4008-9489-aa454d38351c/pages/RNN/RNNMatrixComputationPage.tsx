import { useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography } from "@shuku/course-style/react";
import { DishIcon, type DishId } from './DishIcon';
import { WeatherIcon, type WeatherId } from './WeatherIcon';
import './RNNMatrixComputationPage.css';

export interface RNNMatrixComputationPageProps { onComplete: () => void; }

type VectorValue = number | '?';
type Stage = 'food-one' | 'food-two' | 'weather-sun' | 'weather-rain' | 'merge';
type MergeStep = 'add' | 'activate';
type AnswerVectors = { same: string[]; next: string[] };
type Feedback = 'idle' | 'correct' | 'wrong';

const foodMatrix = [
  [1, 0, 0], [0, 1, 0], [0, 0, 1],
  [0, 0, 1], [1, 0, 0], [0, 1, 0],
];
const weatherMatrix = [
  [1, 0], [1, 0], [1, 0],
  [0, 1], [0, 1], [0, 1],
];
const foodInputs = { 'food-one': [1, 0, 0], 'food-two': [0, 1, 0] } as const;
const foodOutputs = {
  'food-one': { same: [1, 0, 0] as VectorValue[], next: ['?', '?', '?'] as VectorValue[] },
  'food-two': { same: [0, 1, 0] as VectorValue[], next: ['?', '?', '?'] as VectorValue[] },
};
const weatherInputs = { 'weather-sun': [1, 0], 'weather-rain': [0, 1] } as const;
const weatherOutputs = {
  'weather-sun': { same: ['?', '?', '?'] as VectorValue[], next: [0, 0, 0] as VectorValue[] },
  'weather-rain': { same: [0, 0, 0] as VectorValue[], next: ['?', '?', '?'] as VectorValue[] },
};
const finalFoodResult = [0, 1, 0, 0, 0, 1] as VectorValue[];
const finalWeatherResult = [0, 0, 0, 1, 1, 1] as VectorValue[];
const dishLabels: Record<DishId, string> = { pie: '苹果派', steak: '牛排', burger: '汉堡' };

function Vector({ values, className = '' }: { values: readonly VectorValue[]; className?: string }) {
  return (
    <span shuku-edit-id="e-36d4c69f-0f98-40fb-a100-e7ca33c1b2f8" className={`nrnn-matrix-computation__vector ${className}`} aria-label={`向量 ${values.join('，')}`}>
      <span shuku-edit-id="e-4a489326-16b3-4d36-89ce-6ba007fb2055" className="nrnn-matrix-computation__vector-bracket is-left" aria-hidden="true" />
      <span shuku-edit-id="e-d86f2570-11f7-4de5-9968-c1a916f5f863" className="nrnn-matrix-computation__vector-values">
        {values.map((value, index) => <Typography shuku-edit-id="e-8f1ed304-2db8-481c-9fc7-ff55214fb566" as="span" variant="bodySmall" tone="main" key={`${value}-${index}`}>{value}</Typography>)}
      </span>
      <span shuku-edit-id="e-f6e749c6-b957-433b-99b5-e43e84425907" className="nrnn-matrix-computation__vector-bracket is-right" aria-hidden="true" />
    </span>
  );
}

function Matrix({ rows, splitAfter, highlightRows = [] }: { rows: number[][]; splitAfter?: number; highlightRows?: number[] }) {
  const columns = rows[0]?.length ?? 0;
  return (
    <span shuku-edit-id="e-2854952d-4c0f-4615-81ea-53e3264a7c97" className="nrnn-matrix-computation__matrix" aria-label="矩阵">
      <span shuku-edit-id="e-2bcaebb8-ed17-4320-83c3-ad80a66d9a37" className="nrnn-matrix-computation__matrix-bracket is-left" aria-hidden="true" />
      <span shuku-edit-id="e-13f371a0-0de6-485d-bb01-089a08cc71e7" className={`nrnn-matrix-computation__matrix-grid is-${columns}`}>
        {rows.map((row, rowIndex) => <span shuku-edit-id="e-c2a33868-6570-4f60-9b15-ed685933052e" className={`nrnn-matrix-computation__matrix-row${rowIndex === splitAfter ? ' is-split-before' : ''}${highlightRows.includes(rowIndex) ? ' is-highlight' : ''}`} key={`row-${rowIndex}`}>
          {row.map((value, columnIndex) => <Typography shuku-edit-id="e-01b49bc3-65bb-40cd-b852-a103de147555" as="span" variant="bodySmall" tone="main" key={`${rowIndex}-${columnIndex}`}>{value}</Typography>)}
        </span>)}
      </span>
      <span shuku-edit-id="e-4a45c426-163c-4f54-9c4e-1edf1b2235d2" className="nrnn-matrix-computation__matrix-bracket is-right" aria-hidden="true" />
    </span>
  );
}

function Dish({ dish }: { dish: DishId }) { return <DishIcon dish={dish} label={dishLabels[dish]} />; }

function EncodingPanel({ type }: { type: 'food' | 'weather' }) {
  const items = type === 'food'
    ? [{ id: 'pie' as DishId, vector: [1, 0, 0], label: '苹果派' }, { id: 'steak' as DishId, vector: [0, 1, 0], label: '牛排' }, { id: 'burger' as DishId, vector: [0, 0, 1], label: '汉堡' }]
    : [{ id: 'sun' as WeatherId, vector: [1, 0], label: '晴天' }, { id: 'rain' as WeatherId, vector: [0, 1], label: '雨天' }];
  return (
    <section shuku-edit-id="e-c1d798cf-a29a-43ac-8d64-786105f7c09d" className="nrnn-matrix-computation__encoding" aria-label={type === 'food' ? '食物向量编码' : '天气向量编码'}>
      <div shuku-edit-id="e-511882ff-b515-4851-994c-b2943a12fc8a" className="nrnn-matrix-computation__encoding-title">
        <Typography shuku-edit-id="e-51ae5740-e6ff-4827-beae-e69fea46a579" as="span" variant="bodySmall" tone="warning">{type === 'food' ? '食物向量' : '天气向量'}</Typography>
        <Typography shuku-edit-id="e-b7823264-c7a9-4a82-9c10-c3dae08f722f" as="strong" variant="h3" tone="main">{type === 'food' ? '三种菜品对应三个位置' : '两种天气对应两个位置'}</Typography>
      </div>
      <div shuku-edit-id="e-d55320b0-f317-4608-9d39-94d7e36b3222" className="nrnn-matrix-computation__encoding-items">
        {items.map((item) => <div shuku-edit-id="e-f60afa03-6838-437d-8092-b0353b16f848" className="nrnn-matrix-computation__encoding-item" key={item.label}>
          {type === 'food' ? <Dish dish={item.id as DishId} /> : <WeatherIcon weather={item.id as WeatherId} label={item.label} />}
          <Typography shuku-edit-id="e-e8b22e01-d303-4227-a236-144eccf55828" as="span" variant="bodySmall" tone="muted">{item.label}</Typography>
          <Vector values={item.vector} className="is-compact" />
        </div>)}
      </div>
    </section>
  );
}

function RouteCard({ kind, label }: { kind: 'pie' | 'steak' | 'burger' | 'sun' | 'rain'; label: string }) {
  const icon = kind === 'sun' || kind === 'rain'
    ? <WeatherIcon weather={kind} label={label} />
    : <Dish dish={kind} />;
  return <div shuku-edit-id="e-540e2fa6-5b48-4d5a-a1e1-c71e78e433c2" className="nrnn-matrix-computation__route-card">{icon}<Typography shuku-edit-id="e-cc828ed4-f80f-4f63-9ca5-90596e817246" as="span" variant="bodySmall" tone="main">{label}</Typography></div>;
}

function MergeOperation({ step }: { step: MergeStep }) {
  const foodRows = finalFoodResult.map((value) => [Number(value)]);
  const weatherRows = finalWeatherResult.map((value) => [Number(value)]);
  const addedRows = [[0], [1], [0], [1], [1], [2]];
  const activatedRows = [[0], [0], [0], [0], [0], [1]];
  if (step === 'add') {
    return (
      <div shuku-edit-id="e-332f1e66-42f1-49fc-8109-37e2b325f3dc" className="nrnn-matrix-computation__operation nrnn-matrix-computation__operation--merge nrnn-matrix-computation__merge-scene" key={step}>
        <div shuku-edit-id="e-b6fb8438-b39a-4d02-bb1b-94f4b51ac2c1" className="nrnn-matrix-computation__merge-scene-head">
          <Dish dish="pie" /><WeatherIcon weather="rain" label="雨天" />
          <Typography shuku-edit-id="e-af62fe1b-a7af-4302-a5a6-c9ffefd61e93" as="strong" variant="h2" tone="main">Add</Typography>
        </div>
        <div shuku-edit-id="e-23c982b0-cc9c-4a96-8fbe-ca11248dbdc3" className="nrnn-matrix-computation__merge-add-row">
          <div shuku-edit-id="e-b86d196f-a232-4609-ae8b-3c116e420136" className="nrnn-matrix-computation__merge-input"><Matrix rows={foodRows} splitAfter={3} /><div shuku-edit-id="e-43ef8de8-dff7-42a1-b8d5-11d56663683c" className="nrnn-matrix-computation__merge-route-stack"><RouteCard kind="pie" label="Same" /><RouteCard kind="burger" label="Next day" /></div></div>
          <Typography shuku-edit-id="e-64e69718-a6af-4c95-9e89-5c1b7c675526" as="span" variant="h1" tone="light">+</Typography>
          <div shuku-edit-id="e-12e8579f-01eb-4cbe-83fc-510a15e1afee" className="nrnn-matrix-computation__merge-input"><Matrix rows={weatherRows} splitAfter={3} /><div shuku-edit-id="e-2ae9468f-00cf-41ab-904f-d271f548141e" className="nrnn-matrix-computation__merge-route-stack"><RouteCard kind="sun" label="Same" /><RouteCard kind="rain" label="Next day" /></div></div>
          <Typography shuku-edit-id="e-57439294-362b-4251-8aaa-05c8f84bf23c" as="span" variant="h1" tone="light">=</Typography>
          <Matrix rows={addedRows} splitAfter={3} highlightRows={[5]} />
        </div>
      </div>
    );
  }
  return (
    <div shuku-edit-id="e-33c3b875-4ff5-430d-8958-10a9422b6882" className="nrnn-matrix-computation__operation nrnn-matrix-computation__operation--merge nrnn-matrix-computation__merge-scene" key={step}>
      <div shuku-edit-id="e-6cf0c67f-f2d4-41f1-bd4e-44fb6c907301" className="nrnn-matrix-computation__merge-activate-row">
        <div shuku-edit-id="e-cb4aa49a-9569-40eb-aed4-3054ffba6b18" className="nrnn-matrix-computation__merge-step-block"><Typography shuku-edit-id="e-5ddedea2-7188-4ce8-a26a-4bfc25baefa7" as="span" variant="bodySmall" tone="muted">Add 结果</Typography><Matrix rows={addedRows} splitAfter={3} highlightRows={[5]} /></div>
        <Typography shuku-edit-id="e-30a5d26b-fbf8-433d-9919-ef7b36e06098" as="span" variant="h1" tone="light">→</Typography>
        <div shuku-edit-id="e-856c3492-470c-4d9e-a2fd-ce4ea0504109" className="nrnn-matrix-computation__activation-gate"><Typography shuku-edit-id="e-5556bbc1-255c-484d-8c69-0e52b49f8cef" as="strong" variant="h3" tone="main">non-linear</Typography><Typography shuku-edit-id="e-84cc0143-4b48-4dd8-8d0c-7642b151a5f7" as="span" variant="bodySmall" tone="muted">2 → 1</Typography><Typography shuku-edit-id="e-ccb29f36-f675-44c0-b72a-c8a0c5b22047" as="span" variant="bodySmall" tone="muted">其余 → 0</Typography></div>
        <Typography shuku-edit-id="e-a6134092-9c18-4057-ae8c-614f2ff68d8d" as="span" variant="h1" tone="light">→</Typography>
        <div shuku-edit-id="e-301c1310-4197-4a86-8234-77b710d4fc00" className="nrnn-matrix-computation__merge-step-block"><Typography shuku-edit-id="e-88273a88-aed5-4306-a428-5d7019f2e384" as="span" variant="bodySmall" tone="muted">激活结果</Typography><Matrix rows={activatedRows} splitAfter={3} highlightRows={[5]} /></div>
        <Typography shuku-edit-id="e-3841e73b-606e-44d1-963c-2979c20faf87" as="span" variant="h1" tone="light">→</Typography>
        <div shuku-edit-id="e-19dddb3b-cf99-4582-b050-8a5a38445040" className="nrnn-matrix-computation__merge-final-card"><Matrix rows={[[0], [0], [1]]} /><RouteCard kind="burger" label="Next day · 汉堡" /></div>
      </div>
    </div>
  );
}

function MatrixOperation({ stage, revealed = false, revealedNext, mergeStep = 'add' }: { stage: Stage; revealed?: boolean; revealedNext?: VectorValue[]; mergeStep?: MergeStep }) {
  if (stage === 'merge') return <MergeOperation step={mergeStep} />;
  const displayStage: Exclude<Stage, 'merge'> = stage;
  const food = displayStage === 'food-one' || displayStage === 'food-two';
  const input = food ? foodInputs[displayStage] : weatherInputs[displayStage as 'weather-sun' | 'weather-rain'];
  const output = food ? foodOutputs[displayStage] : weatherOutputs[displayStage as 'weather-sun' | 'weather-rain'];
  const weatherAnswer = displayStage === 'weather-sun'
    ? { same: [1, 1, 1] as VectorValue[], next: [0, 0, 0] as VectorValue[] }
    : { same: [0, 0, 0] as VectorValue[], next: [1, 1, 1] as VectorValue[] };
  const resolvedOutput = food ? output : revealed ? weatherAnswer : { same: ['?', '?', '?'] as VectorValue[], next: ['?', '?', '?'] as VectorValue[] };
  const inputDish: DishId = displayStage === 'food-two' ? 'steak' : 'pie';
  const inputWeather: WeatherId = displayStage === 'weather-rain' ? 'rain' : 'sun';
  return (
    <div shuku-edit-id="e-343a836a-e1bc-4ade-bcb8-4e2b875d9a77" className={`nrnn-matrix-computation__operation nrnn-matrix-computation__operation--${food ? 'food' : 'weather'}`} key={stage}>
      <div shuku-edit-id="e-7ec72fe8-5301-4fa6-a18d-c1024791b8a4" className="nrnn-matrix-computation__operation-label">
        {food ? <Dish dish={inputDish} /> : <WeatherIcon weather={inputWeather} label={inputWeather === 'sun' ? '晴天' : '雨天'} />}
        <div shuku-edit-id="e-2c0cca78-b4c1-47df-9302-dedeea9ff86c"><Typography shuku-edit-id="e-d538c807-e60b-4a7e-b932-c8e3dd30364e" as="strong" variant="h3" tone="main">W<sub shuku-edit-id="e-5c3a701d-7cb8-4f62-9d57-bcaf23de7250">{food ? 'food' : 'weather'}</sub></Typography><Typography shuku-edit-id="e-dcbd555f-750c-4eb8-b3f6-6e69e3381d54" as="span" variant="bodySmall" tone="muted">{food ? '食物 → Same / Next day' : '天气 → Same / Next day'}</Typography></div>
      </div>
      <div shuku-edit-id="e-8ccc7ccf-e324-4e1c-8a0e-58a955b0b1c6" className="nrnn-matrix-computation__equation">
        <Matrix rows={food ? foodMatrix : weatherMatrix} splitAfter={3} /><Typography shuku-edit-id="e-14a5ee4e-a2f2-4194-a0d4-789251d5d5a6" as="span" variant="h2" tone="light">×</Typography><Vector values={input} className="is-input" /><Typography shuku-edit-id="e-2ca85c49-b359-4deb-b6fb-86a4c2a462a7" as="span" variant="h2" tone="light">=</Typography>
        <div shuku-edit-id="e-50c4182b-2b7d-4365-b7fe-4cb0c2bfff74" className="nrnn-matrix-computation__split-result">
          <div shuku-edit-id="e-96f7b365-1615-45c4-8141-3cecd6e070ad" className="nrnn-matrix-computation__result-group is-same"><Vector values={resolvedOutput.same} className={resolvedOutput.same.includes('?') ? 'is-question' : 'is-result'} /><Typography shuku-edit-id="e-730ae5d0-010c-4199-91a0-dc0f8173d7f8" as="span" variant="bodySmall" tone="muted">Same</Typography>{food && <RouteCard kind={displayStage === 'food-one' ? 'pie' : 'steak'} label={`Same · ${displayStage === 'food-one' ? '苹果派' : '牛排'}`} />}{!food && revealed && <RouteCard kind={displayStage === 'weather-sun' ? 'sun' : 'rain'} label="Same" />}</div>
          <div shuku-edit-id="e-57a60775-e397-4faa-bee9-f3eb4b3e61fd" className="nrnn-matrix-computation__result-divider" aria-hidden="true" />
          <div shuku-edit-id="e-2db2b8ca-5fd8-48e0-bf2f-7c5b179c431c" className="nrnn-matrix-computation__result-group is-next"><Vector values={revealed && revealedNext ? revealedNext : resolvedOutput.next} className={resolvedOutput.next.includes('?') && !revealed ? 'is-question' : 'is-result'} /><Typography shuku-edit-id="e-7de08eb7-5bd3-493c-bc82-c86cdb4daccb" as="span" variant="bodySmall" tone="muted">Next day</Typography>{food && revealed && <RouteCard kind={displayStage === 'food-one' ? 'steak' : 'burger'} label={`Next day · ${displayStage === 'food-one' ? '牛排' : '汉堡'}`} />}{!food && revealed && <RouteCard kind={displayStage === 'weather-sun' ? 'rain' : 'sun'} label="Next day" />}</div>
        </div>
      </div>
    </div>
  );
}

function moveInput(current: HTMLInputElement, offset: number) {
  const quiz = current.closest('.nrnn-matrix-computation__quiz');
  const inputs = Array.from(quiz?.querySelectorAll<HTMLInputElement>('.nrnn-matrix-computation__fill-input') ?? []);
  const currentIndex = inputs.indexOf(current);
  inputs[currentIndex + offset]?.focus();
  inputs[currentIndex + offset]?.select();
}

function FillVector({ values, onChange, label, disabled = false }: { values: string[]; onChange: (index: number, value: string) => void; label: string; disabled?: boolean }) {
  return <div shuku-edit-id="e-5ae00995-3e53-40c0-81a0-cb4c047020c6" className="nrnn-matrix-computation__fill-vector" aria-label={label}><span shuku-edit-id="e-68eea148-2dff-42d6-ab06-823bc8a53bfb" className="nrnn-matrix-computation__fill-bracket is-left" aria-hidden="true" /><div shuku-edit-id="e-b015d7ef-8f3b-4fb4-b1ea-3d269c2fdb09" className="nrnn-matrix-computation__fill-cells">{values.map((value, index) => <TextInput key={index} aria-label={`${label}第${index + 1}项`} value={value} maxLength={1} inputMode="numeric" disabled={disabled} onChange={(event) => { const nextValue = event.target.value.replace(/[^01]/g, '').slice(-1); onChange(index, nextValue); if (nextValue) moveInput(event.currentTarget as HTMLInputElement, 1); }} onKeyDown={(event) => { const input = event.currentTarget as HTMLInputElement; if (event.key === 'ArrowDown') { event.preventDefault(); moveInput(input, 1); } else if (event.key === 'ArrowUp') { event.preventDefault(); moveInput(input, -1); } else if (event.key === 'Backspace' && !input.value) { event.preventDefault(); moveInput(input, -1); } }} className="nrnn-matrix-computation__fill-input" />)}</div><span shuku-edit-id="e-89561bee-2008-484c-b9a0-1f861cfbd9da" className="nrnn-matrix-computation__fill-bracket is-right" aria-hidden="true" /></div>;
}

export function RNNMatrixComputationPage({ onComplete }: RNNMatrixComputationPageProps) {
  const [stage, setStage] = useState<Stage>('food-one');
  const [mergeStep, setMergeStep] = useState<MergeStep>('add');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [answers, setAnswers] = useState<Record<Exclude<Stage, 'merge'>, AnswerVectors>>({
    'food-one': { same: ['', '', ''], next: ['', '', ''] },
    'food-two': { same: ['', '', ''], next: ['', '', ''] },
    'weather-sun': { same: ['', '', ''], next: ['', '', ''] },
    'weather-rain': { same: ['', '', ''], next: ['', '', ''] },
  });
  const completedRef = useRef(false);
  const expected: Record<Exclude<Stage, 'merge'>, AnswerVectors> = {
    'food-one': { same: ['1', '0', '0'], next: ['0', '1', '0'] },
    'food-two': { same: ['0', '1', '0'], next: ['0', '0', '1'] },
    'weather-sun': { same: ['1', '1', '1'], next: ['0', '0', '0'] },
    'weather-rain': { same: ['0', '0', '0'], next: ['1', '1', '1'] },
  };

  const updateAnswer = (part: 'same' | 'next', index: number, value: string) => {
    if (stage === 'merge') return;
    setAnswers((current) => ({ ...current, [stage]: { ...current[stage], [part]: current[stage][part].map((entry, entryIndex) => entryIndex === index ? value : entry) } }));
    if (feedback === 'wrong') setFeedback('idle');
  };
  const submit = () => {
    if (stage === 'merge') return;
    const answer = answers[stage];
    const target = expected[stage];
    const sameCorrect = food || answer.same.every((value, index) => value === target.same[index]);
    setFeedback(sameCorrect && answer.next.every((value, index) => value === target.next[index]) ? 'correct' : 'wrong');
  };
  const advance = () => {
    if (stage === 'merge' || feedback !== 'correct') return;
    const next: Record<Exclude<Stage, 'merge'>, Stage> = { 'food-one': 'food-two', 'food-two': 'weather-sun', 'weather-sun': 'weather-rain', 'weather-rain': 'merge' };
    const nextStage = next[stage];
    setStage(nextStage);
    setFeedback('idle');
    if (nextStage === 'merge') setMergeStep('add');
  };

  const food = stage === 'food-one' || stage === 'food-two';
  const merging = stage === 'merge';
  const mergeStageComplete = () => { if (!completedRef.current) { completedRef.current = true; onComplete(); } };
  const stageStep = merging ? 3 : food ? 1 : 2;

  return (
    <ContentBlock shuku-edit-id="e-810216ac-daae-4253-b07d-d64380bd4c70" headingLevel={1} className="nrnn-matrix-computation" title="把实例带入具体计算" subtitle="先算食物如何滚动，再算天气打开哪条路径，最后在本页 Merge。" bodyClassName="nrnn-matrix-computation__body">
      <div shuku-edit-id="e-b9e5431c-adae-4bb3-bbc1-bc06ef13f4d5" className="nrnn-matrix-computation__main">
        <section shuku-edit-id="e-4b4c0a4f-ecd8-4547-8983-0c97f22ab85b" className="nrnn-matrix-computation__diagram" aria-label="矩阵运算动画">
          <EncodingPanel type={food ? 'food' : 'weather'} />
          <MatrixOperation stage={stage} revealed={feedback === 'correct'} revealedNext={food ? answers[stage as Exclude<Stage, 'merge'>].next.map(Number) : undefined} mergeStep={mergeStep} />
          <div shuku-edit-id="e-0e432f30-8da9-4471-9f8f-7ed9e63eec54" className={`nrnn-matrix-computation__stage-track${merging ? ' is-done' : ''}`}><span shuku-edit-id="e-0c0279c4-b79f-4cf3-8aa3-7ef4fc2d9ec6" className={stageStep >= 1 ? 'is-active' : ''} /><span shuku-edit-id="e-16961eef-6a91-4600-a547-d6f72ab4e90d" className={stageStep >= 2 ? 'is-active' : ''} /><span shuku-edit-id="e-065f590f-32e4-400e-ad3c-c897224a057a" className={stageStep >= 3 ? 'is-active' : ''} /><Typography shuku-edit-id="e-cbee9b8a-7af8-4cb0-b16d-42c3b594fe7d" as="span" variant="bodySmall" tone="muted">{food ? '答对后，向量沿矩阵继续滚动' : merging ? '两路结果已准备好，执行 Merge' : '天气决定 Same 还是 Next day'}</Typography></div>
        </section>

        <aside shuku-edit-id="e-41bd14e8-ca4a-4b39-a485-14f21f79d979" className="nrnn-matrix-computation__quiz" aria-label="矩阵填空题">
          <Typography shuku-edit-id="e-618cf13d-a144-400b-9e63-920831ebc7d9" as="span" variant="bodySmall" tone="warning">{merging ? '第三阶段 · Merge' : food ? `食物计算 ${stage === 'food-one' ? '1' : '2'} / 2` : `天气计算 ${stage === 'weather-sun' ? '1' : '2'} / 2`}</Typography>
          <Typography shuku-edit-id="e-457d28f8-fe70-4666-920d-17cf00684c02" as="h2" variant="h2" tone="main">{merging ? (mergeStep === 'add' ? '先把两路结果相加' : '再经过非线性筛选') : food ? '补全 Next day 向量' : '填写 Same 与 Next day'}</Typography>
          {merging ? <div shuku-edit-id="e-0e029aae-bc65-416f-8737-34adec134f49" className="nrnn-matrix-computation__merge-quiz"><Typography shuku-edit-id="e-8222fa06-9026-4225-b8b3-b169985ef83c" as="span" variant="bodySmall" tone="muted">{mergeStep === 'add' ? '先观察两路相加，唯一的 2 落在哪里。' : '只有数值 2 被激活，成为下一道菜。'}</Typography></div> : <div shuku-edit-id="e-1d4b1c7a-e44e-4827-9254-9eda3b65f9b3" className="nrnn-matrix-computation__answer-grid"><div shuku-edit-id="e-a49eea6b-4f3d-4d50-aeda-ebccf3c05a97" className="nrnn-matrix-computation__quiz-result-group">{food ? <Vector values={foodOutputs[stage as 'food-one' | 'food-two'].same} className="is-result" /> : <FillVector values={answers[stage].same} onChange={(index, value) => updateAnswer('same', index, value)} label="Same 向量" disabled={feedback === 'correct'} />}<Typography shuku-edit-id="e-a9f77ee0-4e19-4230-b12c-5dbea692013d" as="span" variant="bodySmall" tone="muted">Same</Typography>{feedback === 'correct' && <RouteCard kind={food ? (stage === 'food-one' ? 'pie' : 'steak') : (stage === 'weather-sun' ? 'sun' : 'rain')} label="Same" />}</div><div shuku-edit-id="e-c7a551e3-29b8-456a-acc7-ad3f98c3d5a7" className="nrnn-matrix-computation__quiz-result-group"><FillVector values={answers[stage].next} onChange={(index, value) => updateAnswer('next', index, value)} label="Next day 向量" disabled={feedback === 'correct'} /><Typography shuku-edit-id="e-6a440677-6869-4626-b984-7bdf2c29abd9" as="span" variant="bodySmall" tone="muted">Next day</Typography>{feedback === 'correct' && <RouteCard kind={food ? (stage === 'food-one' ? 'steak' : 'burger') : (stage === 'weather-sun' ? 'rain' : 'sun')} label="Next day" />}</div></div>}
          {merging ? <>{mergeStep === 'add' ? <Button variant="primary" onClick={() => setMergeStep('activate')}>进入非线性</Button> : <><div shuku-edit-id="e-edb004a8-89b8-45c6-96a3-d10552dac4e6" className="nrnn-matrix-computation__completion"><Dish dish="burger" /><Typography shuku-edit-id="e-99d73f30-9123-475a-91e7-3bb1dd930c30" as="span" variant="body" tone="success">Next day · 汉堡</Typography></div><Button variant="primary" onClick={mergeStageComplete}>完成 Merge</Button></>}</> : <><Typography shuku-edit-id="e-dff4008c-0873-4c19-bf65-0c10a7a3c2ef" as="p" variant="bodySmall" tone="muted" className="nrnn-matrix-computation__hint">{food ? 'Same 已给出，只填写 Next day。' : '填写 Same 与 Next day 两组结果。'}</Typography>{feedback === 'correct' ? <Button variant="primary" onClick={advance}>下一道题</Button> : <Button variant="primary" onClick={submit}>{feedback === 'wrong' ? '再次检查' : '检查计算'}</Button>}</>}
          {feedback !== 'idle' && !merging && <div shuku-edit-id="e-cd5b01e9-b2eb-470d-9389-677b3ffd375d" className={`nrnn-matrix-computation__quiz-feedback is-${feedback}`}><Typography shuku-edit-id="e-a88eed91-6c9f-469d-8134-e7502c80cdfe" as="span" variant="bodySmall" tone={feedback === 'correct' ? 'success' : 'danger'}>{feedback === 'correct' ? '计算正确，左侧结果已经展开。' : '计算还不对，请检查每一行对应的 0 和 1。'}</Typography></div>}
        </aside>
      </div>
    </ContentBlock>
  );
}
