import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
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
  return <span className={`nrnn-prediction-process__arrow ${className}`} aria-hidden="true" />;
}

function WeatherMatrixNode({ active }: { active: boolean }) {
  return (
    <div className={`nrnn-prediction-process__node nrnn-prediction-process__node--matrix nrnn-prediction-process__weather-matrix${active ? ' is-active' : ''}`}>
      <Typography as="strong" variant="h3" tone="main">W<sub>weather</sub> ·</Typography>
      <div className="nrnn-prediction-process__weather-matrix-card">
        <WeatherIcon weather="rain" label="雨天天气卡片" />
      </div>
      <Typography as="span" variant="bodySmall" tone="muted">天气矩阵处理</Typography>
    </div>
  );
}

function ParameterNode({ symbol, caption, active, className = '' }: { symbol: ReactNode; caption: string; active: boolean; className?: string }) {
  return (
    <div className={`nrnn-prediction-process__node nrnn-prediction-process__node--parameter ${className}${active ? ' is-active' : ''}`}>
      <Typography as="strong" variant="h2" tone="main">{symbol}</Typography>
      {caption && <Typography as="span" variant="bodySmall" tone="muted">{caption}</Typography>}
    </div>
  );
}

function FoodMatrixNode({ frame, active, showDish }: { frame: Iteration | null; active: boolean; showDish: boolean }) {
  return (
    <div className={`nrnn-prediction-process__node nrnn-prediction-process__node--matrix nrnn-prediction-process__food-matrix${active ? ' is-active' : ''}`}>
      <Typography as="strong" variant="h3" tone="main">W<sub>food</sub> ·</Typography>
      <div className="nrnn-prediction-process__food-matrix-card">
        {frame?.previousDish && showDish ? <DishIcon dish={frame.previousDish} label={frame.previousDishLabel ?? undefined} /> : <Typography as="span" variant="h2" tone="light">?</Typography>}
      </div>
      <Typography as="span" variant="bodySmall" tone="muted">食物矩阵处理</Typography>
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
    <section className={`nrnn-prediction-process__cell is-stage-${stage} is-phase-${phase}`} aria-label="天气与食物组成的 RNN 单元">
      <div className="nrnn-prediction-process__iteration-label">
        <Typography as="span" variant="bodySmall" tone={active ? 'accent' : 'muted'}>
          {frame?.time ?? '同一个 RNN 单元'}
        </Typography>
      </div>

      <div className={`nrnn-prediction-process__input-card${active ? ' is-active' : ''}`}>
        <div className="nrnn-prediction-process__icon-wrap">
          <WeatherIcon weather="rain" label="雨天" />
        </div>
        <div className="nrnn-prediction-process__card-copy">
          <Typography as="span" variant="bodySmall" tone="muted">天气输入</Typography>
          <Typography as="strong" variant="h3" tone="main">雨天</Typography>
        </div>
      </div>

      <Arrow className="is-weather" />
      <WeatherMatrixNode active={active} />
      <Arrow className="is-weather-result" />

      <ParameterNode symbol="SUM" caption="" active={active} className="is-sum" />
      <Arrow className="is-sum-arrow" />
      <ParameterNode symbol="b₁" caption="+0.0" active={active} className="is-bias-one" />
      <Arrow className="is-bias-arrow" />

      <div className={`nrnn-prediction-process__node nrnn-prediction-process__node--relu${active ? ' is-active' : ''}`}>
        <ReluGlyph />
        <Typography as="span" variant="bodySmall" tone="muted">ReLU</Typography>
      </div>
      <Arrow className="is-relu-arrow" />

      <div className={`nrnn-prediction-process__hidden-card${active ? ' is-active' : ''}`}>
        <div className="nrnn-prediction-process__hidden-symbol">
          <Typography as="strong" variant="h2" tone="main">W₃</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">食物隐状态 h<sub>{currentTime}</sub></Typography>
        </div>
        <div className="nrnn-prediction-process__dish-wrap">
          {displayedHiddenDish ? <DishIcon dish={displayedHiddenDish} label={displayedHiddenLabel ?? undefined} /> : <Typography as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>
      <Arrow className="is-output-weight-arrow" />
      <ParameterNode symbol="b₃" caption="+0.0" active={active} className="is-bias-three" />
      <Arrow className="is-output-bias-arrow" />

      <div className={`nrnn-prediction-process__output-card${active ? ' is-active' : ''}`}>
        <Typography as="span" variant="bodySmall" tone="muted">菜品输出</Typography>
        <div className="nrnn-prediction-process__output-dish">
          {frame && outputReady
            ? <DishIcon dish={frame.outputDish} label={frame.outputDishLabel} />
            : <Typography as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>

      <div className={`nrnn-prediction-process__memory-card${active ? ' is-active' : ''}`}>
        <div className="nrnn-prediction-process__card-copy">
          <Typography as="span" variant="bodySmall" tone="muted">食物隐状态</Typography>
          <Typography as="strong" variant="h3" tone="main">
            {frame?.previousTime ? <>h<sub>{frame.previousTime}</sub></> : '?'}
          </Typography>
        </div>
        <div className="nrnn-prediction-process__dish-wrap is-memory">
          {frame?.previousDish && memoryReady ? <DishIcon dish={frame.previousDish} label={frame.previousDishLabel ?? undefined} /> : <Typography as="span" variant="h2" tone="light">?</Typography>}
        </div>
      </div>

      <Arrow className="is-memory" />
      <FoodMatrixNode frame={frame} active={active} showDish={phase !== 'carry'} />
      <div className={`nrnn-prediction-process__return-path${active ? ' is-active' : ''}`} aria-hidden="true" />
      <div className={`nrnn-prediction-process__carry-path${active ? ' is-active' : ''}`} aria-hidden="true" />
      {phase === 'carry' && frame?.previousDish && (
        <div key={`${frame.time}-${frame.previousDish}`} className="nrnn-prediction-process__transfer-dish" aria-hidden="true">
          <DishIcon dish={frame.previousDish} />
        </div>
      )}
      <div className="nrnn-prediction-process__carry-label">
        <Typography as="span" variant="bodySmall" tone={active ? 'warning' : 'muted'}>传给下一个时间步</Typography>
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-prediction-process"
      title="同一套计算，怎样一步步预测？"
      subtitle="让雨天连续输入，看看隐状态怎样沿时间步传下去。"
      bodyClassName="nrnn-prediction-process__body"
    >
      <RnnCell stage={stage} phase={phase} />
      <div className={`nrnn-prediction-process__control${complete ? ' is-complete' : ''}`}>
        <div className="nrnn-prediction-process__progress" aria-label={`已运行 ${Math.max(0, stage)} 个时间步`}>
          {iterations.map((iteration, index) => <span key={iteration.time} className={stage >= index + 1 ? 'is-active' : ''} aria-label={iteration.time} />)}
        </div>
        <div className="nrnn-prediction-process__message">
          {!active && <Typography as="p" variant="body" tone="muted">点击预测，让同一个 RNN 单元连续处理相同的雨天输入。</Typography>}
          {active && !complete && <Typography as="p" variant="body" tone="accent">{phase === 'carry' ? 'W₃ 的食物状态正在传给下一个时间步。' : phase === 'matrix' ? '上一时刻的食物卡片正在经过 W_food 处理。' : '食物与天气两路结果汇入 SUM，生成这一时刻的食物状态。'}</Typography>}
          {complete && (
            <>
              <Typography as="strong" variant="h3" tone="success">时间步在变，隐状态和输出在变，不变的是计算。</Typography>
              <Typography as="p" variant="bodySmall" tone="muted">相同的天气矩阵、食物矩阵、SUM、偏置和 ReLU 被循环复用。</Typography>
            </>
          )}
        </div>
        {!complete && <Button variant="primary" onClick={startPrediction} disabled={playing}>{playing ? '预测中…' : '开始预测'}</Button>}
      </div>
    </ContentBlock>
  );
}
