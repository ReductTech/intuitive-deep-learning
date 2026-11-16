import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { DishIcon, type DishId } from './DishIcon';
import { WeatherIcon } from './WeatherIcon';
import { ReluGlyph } from './CellChain';
import './RNNPredictionProcessPage.css';

export interface RNNPredictionProcessPageProps {
  onComplete: () => void;
}

type Stage = 0 | 1 | 2 | 3 | 4 | 5;
type Phase = 'idle' | 'carry' | 'matrix' | 'sum';

interface Iteration {
  time: string;
  previousTime: string | null;
  previousDish: DishId | null;
  previousDishLabel: string | null;
  outputDish: DishId;
  outputDishLabel: string;
}

const iterations: Iteration[] = [
  { time: '时间步 t−1', previousTime: null, previousDish: null, previousDishLabel: null, outputDish: 'pie', outputDishLabel: '苹果派' },
  { time: '时间步 t', previousTime: 't−1', previousDish: 'pie', previousDishLabel: '苹果派', outputDish: 'steak', outputDishLabel: '牛排' },
  { time: '时间步 t+1', previousTime: 't', previousDish: 'steak', previousDishLabel: '牛排', outputDish: 'burger', outputDishLabel: '汉堡' },
  { time: '时间步 t+2', previousTime: 't+1', previousDish: 'burger', previousDishLabel: '汉堡', outputDish: 'pie', outputDishLabel: '苹果派' },
  { time: '时间步 t+3', previousTime: 't+2', previousDish: 'pie', previousDishLabel: '苹果派', outputDish: 'steak', outputDishLabel: '牛排' },
];

function Arrow({ className = '' }: { className?: string }) {
  return <span shuku-edit-id="e-bb761008-e781-4848-a59d-28f187372ea3" className={`nrnn-prediction-process__arrow ${className}`} aria-hidden="true" />;
}

function WeatherMatrixNode({ active }: { active: boolean }) {
  return (
    <div shuku-edit-id="e-a5f89508-7aed-49e8-877f-967f7fa13220" className={`nrnn-prediction-process__node nrnn-prediction-process__node--matrix nrnn-prediction-process__weather-matrix${active ? ' is-active' : ''}`}>
      <Typography shuku-edit-id="e-d53e6b2f-76e2-4275-9ea9-fb1cd5bede80" as="strong" variant="h3" tone="main">W<sub shuku-edit-id="e-63c8ce2d-737f-458e-8da8-14323b2c28b6">weather</sub> ·</Typography>
      <div shuku-edit-id="e-3da40ce6-2aa3-43e5-bff7-f566ab2781d9" className="nrnn-prediction-process__weather-matrix-card">
        <WeatherIcon weather="rain" label="雨天天气卡片" />
      </div>
      <Typography shuku-edit-id="e-3a43feb3-4d2f-4612-86a8-e344fb10e796" as="span" variant="bodySmall" tone="muted">天气矩阵处理</Typography>
    </div>
  );
}

function ParameterNode({ symbol, caption, active, className = '' }: { symbol: ReactNode; caption: string; active: boolean; className?: string }) {
  return (
    <div shuku-edit-id="e-918ffb1b-ea97-4936-ba83-f3fa8c917b32" className={`nrnn-prediction-process__node nrnn-prediction-process__node--parameter ${className}${active ? ' is-active' : ''}`}>
      <Typography shuku-edit-id="e-cf06ab37-45e1-4adb-90b2-8e2ee2e2d6f2" as="strong" variant="h2" tone="main">{symbol}</Typography>
      {caption && <Typography shuku-edit-id="e-ea432d29-bf57-4591-aab1-2ae7fc0e0084" as="span" variant="bodySmall" tone="muted">{caption}</Typography>}
    </div>
  );
}

function FoodMatrixNode({ frame, active, showDish }: { frame: Iteration | null; active: boolean; showDish: boolean }) {
  return (
    <div shuku-edit-id="e-62be2931-7b07-4517-aa64-87cfea0621d8" className={`nrnn-prediction-process__node nrnn-prediction-process__node--matrix nrnn-prediction-process__food-matrix${active ? ' is-active' : ''}`}>
      <Typography shuku-edit-id="e-8c6002a1-121d-4292-8afa-eaa437439203" as="strong" variant="h3" tone="main">W<sub shuku-edit-id="e-0642d126-9c55-440a-8f7c-b302a9d2bfc4">food</sub> ·</Typography>
      <div shuku-edit-id="e-adbff574-146f-4562-bc8d-41d7244db58d" className="nrnn-prediction-process__food-matrix-card">
        {frame?.previousDish && showDish ? <DishIcon dish={frame.previousDish} label={frame.previousDishLabel ?? undefined} /> : <Typography shuku-edit-id="e-bc777d1f-3d82-49da-988e-9078ca7ccc28" as="span" variant="h2" tone="light">?</Typography>}
      </div>
      <Typography shuku-edit-id="e-11bd5d4e-0ec6-4883-930c-49d62ac9c760" as="span" variant="bodySmall" tone="muted">食物矩阵处理</Typography>
    </div>
  );
}

function RnnCell({ stage, phase }: { stage: Stage; phase: Phase }) {
  const frame = stage > 0 ? iterations[stage - 1] : null;
  const active = Boolean(frame);
  const outputReady = active && (stage === 1 || phase === 'sum');
  const memoryReady = active && phase !== 'carry';
  const currentTime = frame?.time.replace('时间步 ', '') ?? 't';
  const displayedHiddenDish = outputReady ? frame?.outputDish : frame?.previousDish;
  const displayedHiddenLabel = outputReady ? frame?.outputDishLabel : frame?.previousDishLabel;

  return (
    <section shuku-edit-id="e-52ab1853-6cf9-43e5-af03-534957e52897" className={`nrnn-prediction-process__cell is-stage-${stage} is-phase-${phase}`} aria-label="天气与食物组成的 RNN 单元">
      <div shuku-edit-id="e-ee250551-1aaf-47f3-bbe2-98ee6a32575a" className="nrnn-prediction-process__iteration-label">
        <Typography shuku-edit-id="e-5907fc78-d8cd-4733-9c1d-446214678a19" as="span" variant="bodySmall" tone={active ? 'accent' : 'muted'}>
          {frame?.time ?? '同一个 RNN 单元'}
        </Typography>
      </div>

      <div shuku-edit-id="e-241b2163-ea42-438b-a5c1-6cbaa60ac128" className={`nrnn-prediction-process__input-card${active ? ' is-active' : ''}`}>
        <div shuku-edit-id="e-a35615a1-f733-435e-85d3-39ccd613c63a" className="nrnn-prediction-process__icon-wrap">
          <WeatherIcon weather="rain" label="雨天" />
        </div>
        <div shuku-edit-id="e-e3eb1451-ed4f-4cfb-87d5-64468274bc05" className="nrnn-prediction-process__card-copy">
          <Typography shuku-edit-id="e-e02f155c-1494-48b9-8494-763bf9d5c275" as="span" variant="bodySmall" tone="muted">天气输入</Typography>
          <Typography shuku-edit-id="e-10875127-6ee2-4fb1-8541-1f8e45236993" as="strong" variant="h3" tone="main">雨天</Typography>
        </div>
      </div>

      <Arrow className="is-weather" />
      <WeatherMatrixNode active={active} />
      <Arrow className="is-weather-result" />

      <ParameterNode symbol="SUM" caption="" active={active} className="is-sum" />
      <Arrow className="is-sum-arrow" />
      <ParameterNode symbol="b₁" caption="+0.0" active={active} className="is-bias-one" />
      <Arrow className="is-bias-arrow" />

      <div shuku-edit-id="e-fa2a96bd-fc57-45c7-96c5-ef88eacd69ed" className={`nrnn-prediction-process__node nrnn-prediction-process__node--relu${active ? ' is-active' : ''}`}>
        <ReluGlyph />
        <Typography shuku-edit-id="e-ba807445-929c-45bd-90f5-9a0727a48870" as="span" variant="bodySmall" tone="muted">ReLU</Typography>
      </div>
      <Arrow className="is-relu-arrow" />

      <div shuku-edit-id="e-6502a2c4-eed3-4591-81a5-172bf884ffad" className={`nrnn-prediction-process__hidden-card${active ? ' is-active' : ''}`}>
        <div shuku-edit-id="e-23e901f5-47c4-434a-8c1b-f9a5c7a90327" className="nrnn-prediction-process__hidden-symbol">
          <Typography shuku-edit-id="e-7ce6fe9c-033f-4c9d-b02f-49c0bb939e1d" as="strong" variant="h2" tone="main">W₃</Typography>
          <Typography shuku-edit-id="e-7e08bce9-7627-435b-8acf-da3d23fa1cd8" as="span" variant="bodySmall" tone="muted">食物隐状态 h<sub shuku-edit-id="e-d05e46c4-ecaf-4468-8074-17bfda41f40d">{currentTime}</sub></Typography>
        </div>
        <div shuku-edit-id="e-2c4531a2-770b-45a3-81d3-78a4d6e71318" className="nrnn-prediction-process__dish-wrap">
          {displayedHiddenDish ? <DishIcon dish={displayedHiddenDish} label={displayedHiddenLabel ?? undefined} /> : <Typography shuku-edit-id="e-31f429b1-4c6e-4128-aca1-7c14ff118639" as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>
      <Arrow className="is-output-weight-arrow" />
      <ParameterNode symbol="b₃" caption="+0.0" active={active} className="is-bias-three" />
      <Arrow className="is-output-bias-arrow" />

      <div shuku-edit-id="e-dd14cc97-4858-4038-88a8-f8bec2f61b85" className={`nrnn-prediction-process__output-card${active ? ' is-active' : ''}`}>
        <Typography shuku-edit-id="e-57973ce6-9c5c-405d-a4e8-082f2f2729d0" as="span" variant="bodySmall" tone="muted">菜品输出</Typography>
        <div shuku-edit-id="e-4c5f433a-6cb0-4152-871b-aa6e5d4c333d" className="nrnn-prediction-process__output-dish">
          {frame && outputReady
            ? <DishIcon dish={frame.outputDish} label={frame.outputDishLabel} />
            : <Typography shuku-edit-id="e-f1ec7d8f-c45a-43b8-9122-9e73cc079404" as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>

      <div shuku-edit-id="e-e5e742c5-6902-4d2d-b581-5e70750881ac" className={`nrnn-prediction-process__memory-card${active ? ' is-active' : ''}`}>
        <div shuku-edit-id="e-751fc45e-da3c-4256-94f7-ea03c798d483" className="nrnn-prediction-process__card-copy">
          <Typography shuku-edit-id="e-4cbb1b98-4f31-4d0d-8e3d-d4884038ff1e" as="span" variant="bodySmall" tone="muted">食物隐状态</Typography>
          <Typography shuku-edit-id="e-75be61f6-7db0-4023-8593-fd0396534eee" as="strong" variant="h3" tone="main">
            {frame?.previousTime ? <>h<sub shuku-edit-id="e-4140a568-182c-4ee1-9812-e1bd66b95bd8">{frame.previousTime}</sub></> : '?'}
          </Typography>
        </div>
        <div shuku-edit-id="e-33db8d4f-96f4-4c74-bbed-5205c52998aa" className="nrnn-prediction-process__dish-wrap is-memory">
          {frame?.previousDish && memoryReady ? <DishIcon dish={frame.previousDish} label={frame.previousDishLabel ?? undefined} /> : <Typography shuku-edit-id="e-beca90b6-b4a5-4b0f-86d4-b39f759800dc" as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>

      <Arrow className="is-memory" />
      <FoodMatrixNode frame={frame} active={active} showDish={phase !== 'carry'} />
      <div shuku-edit-id="e-626ed501-a2bb-4af9-94d6-5c53246dbc40" className={`nrnn-prediction-process__return-path${active ? ' is-active' : ''}`} aria-hidden="true" />
      <div shuku-edit-id="e-e0d87488-6f90-49c6-8ea2-9640d4cefe87" className={`nrnn-prediction-process__carry-path${active ? ' is-active' : ''}`} aria-hidden="true" />
      {phase === 'carry' && frame?.previousDish && (
        <div shuku-edit-id="e-ea02720a-b008-4d68-8fb6-33de5bf77672" key={`${frame.time}-${frame.previousDish}`} className="nrnn-prediction-process__transfer-dish" aria-hidden="true">
          <DishIcon dish={frame.previousDish} />
        </div>
      )}
      <div shuku-edit-id="e-294a5215-9e0a-4d07-ac0b-265ff112b3f0" className="nrnn-prediction-process__carry-label">
        <Typography shuku-edit-id="e-39fa3698-db70-4635-b231-e48273786aeb" as="span" variant="bodySmall" tone={active ? 'warning' : 'muted'}>传给下一个时间步</Typography>
      </div>
    </section>
  );
}

export function RNNPredictionProcessPage({ onComplete }: RNNPredictionProcessPageProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!playing || stage < 1) return undefined;
    const duration = phase === 'carry' ? 2100 : phase === 'matrix' ? 1900 : 2500;
    const timer = window.setTimeout(() => {
      if (phase === 'carry') {
        setPhase('matrix');
        return;
      }
      if (phase === 'matrix') {
        setPhase('sum');
        return;
      }
      if (stage < 5) {
        setStage((current) => Math.min(current + 1, 5) as Stage);
        setPhase('carry');
        return;
      }
      setPlaying(false);
      setFinished(true);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [phase, playing, stage]);

  useEffect(() => {
    if (!finished) return;
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [finished, onComplete]);

  const startPrediction = () => {
    if (playing) return;
    setFinished(false);
    setStage(1);
    setPhase('sum');
    setPlaying(true);
  };

  const complete = finished;
  const active = stage > 0;

  return (
    <ContentBlock shuku-edit-id="e-aecff82c-586d-479d-ad54-0db9686474fa"
      headingLevel={1}
      className="nrnn-prediction-process"
      title="同一套计算，怎样一步步预测？"
      subtitle="让雨天连续输入，看看隐状态怎样沿时间步传下去。"
      bodyClassName="nrnn-prediction-process__body"
    >
      <RnnCell stage={stage} phase={phase} />
      <div shuku-edit-id="e-0df254e0-888e-4294-8577-d670d117fb9c" className={`nrnn-prediction-process__control${complete ? ' is-complete' : ''}`}>
        <div shuku-edit-id="e-d24b653c-a0d7-42ad-b411-097543be9888" className="nrnn-prediction-process__progress" aria-label={`已运行 ${Math.max(0, stage)} 个时间步`}>
          {iterations.map((iteration, index) => <span shuku-edit-id="e-bdf16410-a32a-4d60-ab34-9999b8a69dfb" key={iteration.time} className={stage >= index + 1 ? 'is-active' : ''} aria-label={iteration.time} />)}
        </div>
        <div shuku-edit-id="e-45981132-2652-4918-9495-eca8261a66e5" className="nrnn-prediction-process__message">
          {!active && <Typography shuku-edit-id="e-911f4c76-4d25-4774-b5b4-73acf44e2ad3" as="p" variant="body" tone="muted">点击预测，让同一个 RNN 单元连续处理相同的雨天输入。</Typography>}
          {active && !complete && <Typography shuku-edit-id="e-be516b25-7c36-4201-9f19-7eb708ec0ea0" as="p" variant="body" tone="accent">{phase === 'carry' ? 'W₃ 的食物状态正在传给下一个时间步。' : phase === 'matrix' ? '上一时刻的食物卡片正在经过 W_food 处理。' : '食物与天气两路结果汇入 SUM，生成这一时刻的食物状态。'}</Typography>}
          {complete && (
            <>
              <Typography shuku-edit-id="e-c4690988-96e3-4240-b1fc-043e71233742" as="strong" variant="h3" tone="success">时间步在变，隐状态和输出在变，不变的是计算。</Typography>
              <Typography shuku-edit-id="e-cd786a07-71c4-4559-9590-db79376f08e5" as="p" variant="bodySmall" tone="muted">相同的天气矩阵、食物矩阵、SUM、偏置和 ReLU 被循环复用。</Typography>
            </>
          )}
        </div>
        {!complete && <Button variant="primary" onClick={startPrediction} disabled={playing}>{playing ? '预测中…' : '开始预测'}</Button>}
      </div>
    </ContentBlock>
  );
}
