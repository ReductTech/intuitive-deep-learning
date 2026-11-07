import { useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography } from '../../../shared/react';
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
    <span className={`nrnn-matrix-computation__vector ${className}`} aria-label={`向量 ${values.join('，')}`}>
      <span className="nrnn-matrix-computation__vector-bracket is-left" aria-hidden="true" />
      <span className="nrnn-matrix-computation__vector-values">
        {values.map((value, index) => <Typography as="span" variant="bodySmall" tone="main" key={`${value}-${index}`}>{value}</Typography>)}
      </span>
      <span className="nrnn-matrix-computation__vector-bracket is-right" aria-hidden="true" />
    </span>
  );
}

function Matrix({ rows, splitAfter, highlightRows = [] }: { rows: number[][]; splitAfter?: number; highlightRows?: number[] }) {
  const columns = rows[0]?.length ?? 0;
  return (
    <span className="nrnn-matrix-computation__matrix" aria-label="矩阵">
      <span className="nrnn-matrix-computation__matrix-bracket is-left" aria-hidden="true" />
      <span className={`nrnn-matrix-computation__matrix-grid is-${columns}`}>
        {rows.map((row, rowIndex) => <span className={`nrnn-matrix-computation__matrix-row${rowIndex === splitAfter ? ' is-split-before' : ''}${highlightRows.includes(rowIndex) ? ' is-highlight' : ''}`} key={`row-${rowIndex}`}>
          {row.map((value, columnIndex) => <Typography as="span" variant="bodySmall" tone="main" key={`${rowIndex}-${columnIndex}`}>{value}</Typography>)}
        </span>)}
      </span>
      <span className="nrnn-matrix-computation__matrix-bracket is-right" aria-hidden="true" />
    </span>
  );
}

function Dish({ dish }: { dish: DishId }) { return <DishIcon dish={dish} label={dishLabels[dish]} />; }

function EncodingPanel({ type }: { type: 'food' | 'weather' }) {
  const items = type === 'food'
    ? [{ id: 'pie' as DishId, vector: [1, 0, 0], label: '苹果派' }, { id: 'steak' as DishId, vector: [0, 1, 0], label: '牛排' }, { id: 'burger' as DishId, vector: [0, 0, 1], label: '汉堡' }]
    : [{ id: 'sun' as WeatherId, vector: [1, 0], label: '晴天' }, { id: 'rain' as WeatherId, vector: [0, 1], label: '雨天' }];
  return (
    <section className="nrnn-matrix-computation__encoding" aria-label={type === 'food' ? '食物向量编码' : '天气向量编码'}>
      <div className="nrnn-matrix-computation__encoding-title">
        <Typography as="span" variant="bodySmall" tone="warning">{type === 'food' ? '食物向量' : '天气向量'}</Typography>
        <Typography as="strong" variant="h3" tone="main">{type === 'food' ? '三种菜品对应三个位置' : '两种天气对应两个位置'}</Typography>
      </div>
      <div className="nrnn-matrix-computation__encoding-items">
        {items.map((item) => <div className="nrnn-matrix-computation__encoding-item" key={item.label}>
          {type === 'food' ? <Dish dish={item.id as DishId} /> : <WeatherIcon weather={item.id as WeatherId} label={item.label} />}
          <Typography as="span" variant="bodySmall" tone="muted">{item.label}</Typography>
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
  return <div className="nrnn-matrix-computation__route-card">{icon}<Typography as="span" variant="bodySmall" tone="main">{label}</Typography></div>;
}

function MergeOperation({ step }: { step: MergeStep }) {
  const foodRows = finalFoodResult.map((value) => [Number(value)]);
  const weatherRows = finalWeatherResult.map((value) => [Number(value)]);
  const addedRows = [[0], [1], [0], [1], [1], [2]];
  const activatedRows = [[0], [0], [0], [0], [0], [1]];
  if (step === 'add') {
    return (
      <div className="nrnn-matrix-computation__operation nrnn-matrix-computation__operation--merge nrnn-matrix-computation__merge-scene" key={step}>
        <div className="nrnn-matrix-computation__merge-scene-head">
          <Dish dish="pie" /><WeatherIcon weather="rain" label="雨天" />
          <Typography as="strong" variant="h2" tone="main">Add</Typography>
        </div>
        <div className="nrnn-matrix-computation__merge-add-row">
          <div className="nrnn-matrix-computation__merge-input"><Matrix rows={foodRows} splitAfter={3} /><div className="nrnn-matrix-computation__merge-route-stack"><RouteCard kind="pie" label="Same" /><RouteCard kind="burger" label="Next day" /></div></div>
          <Typography as="span" variant="h1" tone="light">+</Typography>
          <div className="nrnn-matrix-computation__merge-input"><Matrix rows={weatherRows} splitAfter={3} /><div className="nrnn-matrix-computation__merge-route-stack"><RouteCard kind="sun" label="Same" /><RouteCard kind="rain" label="Next day" /></div></div>
          <Typography as="span" variant="h1" tone="light">=</Typography>
          <Matrix rows={addedRows} splitAfter={3} highlightRows={[5]} />
        </div>
      </div>
    );
  }
  return (
    <div className="nrnn-matrix-computation__operation nrnn-matrix-computation__operation--merge nrnn-matrix-computation__merge-scene" key={step}>
      <div className="nrnn-matrix-computation__merge-activate-row">
        <div className="nrnn-matrix-computation__merge-step-block"><Typography as="span" variant="bodySmall" tone="muted">Add 结果</Typography><Matrix rows={addedRows} splitAfter={3} highlightRows={[5]} /></div>
        <Typography as="span" variant="h1" tone="light">→</Typography>
        <div className="nrnn-matrix-computation__activation-gate"><Typography as="strong" variant="h3" tone="main">non-linear</Typography><Typography as="span" variant="bodySmall" tone="muted">2 → 1</Typography><Typography as="span" variant="bodySmall" tone="muted">其余 → 0</Typography></div>
        <Typography as="span" variant="h1" tone="light">→</Typography>
        <div className="nrnn-matrix-computation__merge-step-block"><Typography as="span" variant="bodySmall" tone="muted">激活结果</Typography><Matrix rows={activatedRows} splitAfter={3} highlightRows={[5]} /></div>
        <Typography as="span" variant="h1" tone="light">→</Typography>
        <div className="nrnn-matrix-computation__merge-final-card"><Matrix rows={[[0], [0], [1]]} /><RouteCard kind="burger" label="Next day · 汉堡" /></div>
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
    <div className={`nrnn-matrix-computation__operation nrnn-matrix-computation__operation--${food ? 'food' : 'weather'}`} key={stage}>
      <div className="nrnn-matrix-computation__operation-label">
        {food ? <Dish dish={inputDish} /> : <WeatherIcon weather={inputWeather} label={inputWeather === 'sun' ? '晴天' : '雨天'} />}
        <div><Typography as="strong" variant="h3" tone="main">W<sub>{food ? 'food' : 'weather'}</sub></Typography><Typography as="span" variant="bodySmall" tone="muted">{food ? '食物 → Same / Next day' : '天气 → Same / Next day'}</Typography></div>
      </div>
      <div className="nrnn-matrix-computation__equation">
        <Matrix rows={food ? foodMatrix : weatherMatrix} splitAfter={3} /><Typography as="span" variant="h2" tone="light">×</Typography><Vector values={input} className="is-input" /><Typography as="span" variant="h2" tone="light">=</Typography>
        <div className="nrnn-matrix-computation__split-result">
          <div className="nrnn-matrix-computation__result-group is-same"><Vector values={resolvedOutput.same} className={resolvedOutput.same.includes('?') ? 'is-question' : 'is-result'} /><Typography as="span" variant="bodySmall" tone="muted">Same</Typography>{food && <RouteCard kind={displayStage === 'food-one' ? 'pie' : 'steak'} label={`Same · ${displayStage === 'food-one' ? '苹果派' : '牛排'}`} />}{!food && revealed && <RouteCard kind={displayStage === 'weather-sun' ? 'sun' : 'rain'} label="Same" />}</div>
          <div className="nrnn-matrix-computation__result-divider" aria-hidden="true" />
          <div className="nrnn-matrix-computation__result-group is-next"><Vector values={revealed && revealedNext ? revealedNext : resolvedOutput.next} className={resolvedOutput.next.includes('?') && !revealed ? 'is-question' : 'is-result'} /><Typography as="span" variant="bodySmall" tone="muted">Next day</Typography>{food && revealed && <RouteCard kind={displayStage === 'food-one' ? 'steak' : 'burger'} label={`Next day · ${displayStage === 'food-one' ? '牛排' : '汉堡'}`} />}{!food && revealed && <RouteCard kind={displayStage === 'weather-sun' ? 'rain' : 'sun'} label="Next day" />}</div>
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
  return <div className="nrnn-matrix-computation__fill-vector" aria-label={label}><span className="nrnn-matrix-computation__fill-bracket is-left" aria-hidden="true" /><div className="nrnn-matrix-computation__fill-cells">{values.map((value, index) => <TextInput key={index} aria-label={`${label}第${index + 1}项`} value={value} maxLength={1} inputMode="numeric" disabled={disabled} onChange={(event) => { const nextValue = event.target.value.replace(/[^01]/g, '').slice(-1); onChange(index, nextValue); if (nextValue) moveInput(event.currentTarget as HTMLInputElement, 1); }} onKeyDown={(event) => { const input = event.currentTarget as HTMLInputElement; if (event.key === 'ArrowDown') { event.preventDefault(); moveInput(input, 1); } else if (event.key === 'ArrowUp') { event.preventDefault(); moveInput(input, -1); } else if (event.key === 'Backspace' && !input.value) { event.preventDefault(); moveInput(input, -1); } }} className="nrnn-matrix-computation__fill-input" />)}</div><span className="nrnn-matrix-computation__fill-bracket is-right" aria-hidden="true" /></div>;
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
    <ContentBlock headingLevel={1} className="nrnn-matrix-computation" title="把实例带入具体计算" subtitle="先算食物如何滚动，再算天气打开哪条路径，最后在本页 Merge。" bodyClassName="nrnn-matrix-computation__body">
      <div className="nrnn-matrix-computation__main">
        <section className="nrnn-matrix-computation__diagram" aria-label="矩阵运算动画">
          <EncodingPanel type={food ? 'food' : 'weather'} />
          <MatrixOperation stage={stage} revealed={feedback === 'correct'} revealedNext={food ? answers[stage as Exclude<Stage, 'merge'>].next.map(Number) : undefined} mergeStep={mergeStep} />
          <div className={`nrnn-matrix-computation__stage-track${merging ? ' is-done' : ''}`}><span className={stageStep >= 1 ? 'is-active' : ''} /><span className={stageStep >= 2 ? 'is-active' : ''} /><span className={stageStep >= 3 ? 'is-active' : ''} /><Typography as="span" variant="bodySmall" tone="muted">{food ? '答对后，向量沿矩阵继续滚动' : merging ? '两路结果已准备好，执行 Merge' : '天气决定 Same 还是 Next day'}</Typography></div>
        </section>

        <aside className="nrnn-matrix-computation__quiz" aria-label="矩阵填空题">
          <Typography as="span" variant="bodySmall" tone="warning">{merging ? '第三阶段 · Merge' : food ? `食物计算 ${stage === 'food-one' ? '1' : '2'} / 2` : `天气计算 ${stage === 'weather-sun' ? '1' : '2'} / 2`}</Typography>
          <Typography as="h2" variant="h2" tone="main">{merging ? (mergeStep === 'add' ? '先把两路结果相加' : '再经过非线性筛选') : food ? '补全 Next day 向量' : '填写 Same 与 Next day'}</Typography>
          {merging ? <div className="nrnn-matrix-computation__merge-quiz"><Typography as="span" variant="bodySmall" tone="muted">{mergeStep === 'add' ? '先观察两路相加，唯一的 2 落在哪里。' : '只有数值 2 被激活，成为下一道菜。'}</Typography></div> : <div className="nrnn-matrix-computation__answer-grid"><div className="nrnn-matrix-computation__quiz-result-group">{food ? <Vector values={foodOutputs[stage as 'food-one' | 'food-two'].same} className="is-result" /> : <FillVector values={answers[stage].same} onChange={(index, value) => updateAnswer('same', index, value)} label="Same 向量" disabled={feedback === 'correct'} />}<Typography as="span" variant="bodySmall" tone="muted">Same</Typography>{feedback === 'correct' && <RouteCard kind={food ? (stage === 'food-one' ? 'pie' : 'steak') : (stage === 'weather-sun' ? 'sun' : 'rain')} label="Same" />}</div><div className="nrnn-matrix-computation__quiz-result-group"><FillVector values={answers[stage].next} onChange={(index, value) => updateAnswer('next', index, value)} label="Next day 向量" disabled={feedback === 'correct'} /><Typography as="span" variant="bodySmall" tone="muted">Next day</Typography>{feedback === 'correct' && <RouteCard kind={food ? (stage === 'food-one' ? 'steak' : 'burger') : (stage === 'weather-sun' ? 'rain' : 'sun')} label="Next day" />}</div></div>}
          {merging ? <>{mergeStep === 'add' ? <Button variant="primary" onClick={() => setMergeStep('activate')}>进入非线性</Button> : <><div className="nrnn-matrix-computation__completion"><Dish dish="burger" /><Typography as="span" variant="body" tone="success">Next day · 汉堡</Typography></div><Button variant="primary" onClick={mergeStageComplete}>完成 Merge</Button></>}</> : <><Typography as="p" variant="bodySmall" tone="muted" className="nrnn-matrix-computation__hint">{food ? 'Same 已给出，只填写 Next day。' : '填写 Same 与 Next day 两组结果。'}</Typography>{feedback === 'correct' ? <Button variant="primary" onClick={advance}>下一道题</Button> : <Button variant="primary" onClick={submit}>{feedback === 'wrong' ? '再次检查' : '检查计算'}</Button>}</>}
          {feedback !== 'idle' && !merging && <div className={`nrnn-matrix-computation__quiz-feedback is-${feedback}`}><Typography as="span" variant="bodySmall" tone={feedback === 'correct' ? 'success' : 'danger'}>{feedback === 'correct' ? '计算正确，左侧结果已经展开。' : '计算还不对，请检查每一行对应的 0 和 1。'}</Typography></div>}
        </aside>
      </div>
    </ContentBlock>
  );
}
