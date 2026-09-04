import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Button, Callout, ContentBlock, Feedback, NoticeStrip } from '../../shared/react';

interface FittingDiagnosisBlockProps { onComplete?: () => void; }
interface MetricSeries { metric: 'loss' | 'accuracy'; train: number[]; validation: number[]; }
interface CurveScenario extends MetricSeries { id: string; onset: number; secondary?: MetricSeries; }

const EPOCHS = 40;
const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 390;
const PLOT = { left: 66, right: 66, top: 30, bottom: 54 };

function createLossScenario(): CurveScenario {
  const onset = 19;
  const train = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    return 1.56 * Math.exp(-epoch / 9.5) + .12 + Math.sin(epoch * .69 + .6) * .008;
  });
  const validation = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    const decreasing = 1.48 * Math.exp(-Math.min(epoch, onset - 1) / 8.2) + .27;
    const divergence = epoch >= onset ? .0045 * (epoch - onset + 1) ** 1.18 : 0;
    const ripple = Math.sin(epoch * .86 + .6) * .018 + Math.cos(epoch * .37 + 1.02) * .009;
    const bump = .038 * Math.exp(-(((epoch - 11) / 1.5) ** 2));
    return decreasing + divergence + ripple + bump;
  });
  return { id: 'A', onset, metric: 'loss', train, validation };
}

function createAccuracyScenario(id: string, onset: number, trainRate: number, validationRate: number, decline: number, power: number, phase: number, noise: number, dipEpoch: number): CurveScenario {
  const train = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    return .52 + .45 * (1 - Math.exp(-epoch / trainRate)) + Math.sin(epoch * .66 + phase) * noise * .35;
  });
  const validation = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    const improving = .5 + .39 * (1 - Math.exp(-Math.min(epoch, onset - 1) / validationRate));
    const divergence = epoch >= onset ? decline * (epoch - onset + 1) ** power : 0;
    const ripple = Math.sin(epoch * .92 + phase) * noise + Math.cos(epoch * .41 + phase * 1.4) * noise * .55;
    const transientDip = noise * 1.7 * Math.exp(-(((epoch - dipEpoch) / 1.25) ** 2));
    return improving - divergence + ripple - transientDip;
  });
  return { id, onset, metric: 'accuracy', train, validation };
}

function createNoisyLossScenario(): CurveScenario {
  const onset = 21;
  const lossWarningEpoch = 22;
  const train = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    return 1.5 * Math.exp(-epoch / 10.8) + .14 + Math.sin(epoch * .81 + 1.7) * .012;
  });
  const validation = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    const decreasing = 1.43 * Math.exp(-Math.min(epoch, lossWarningEpoch - 1) / 9.7) + .3;
    const divergence = epoch >= lossWarningEpoch ? .0038 * (epoch - lossWarningEpoch + 1) ** 1.16 : 0;
    const ripple = Math.sin(epoch * 1.03 + 3.2) * .026 + Math.cos(epoch * .47) * .014;
    const recovery = -.035 * Math.exp(-(((epoch - 34) / 1.5) ** 2));
    return decreasing + divergence + ripple + recovery;
  });
  const accuracy = createAccuracyScenario('E-accuracy', 29, 10.4, 9, .0015, 1.18, 4.4, .019, 19);
  return { id: 'E', onset, metric: 'loss', train, validation, secondary: { metric: 'accuracy', train: accuracy.train, validation: accuracy.validation } };
}

function createDualAccuracyScenario(): CurveScenario {
  const onset = 21;
  const accuracy = createAccuracyScenario('F', onset, 10.2, 8.8, .00175, 1.2, 9.1, .021, 15);
  const lossTrain = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    return 1.5 * Math.exp(-epoch / 10.1) + .13 + Math.sin(epoch * .74 + 2.3) * .011;
  });
  const lossValidation = Array.from({ length: EPOCHS }, (_, index) => {
    const epoch = index + 1;
    const decreasing = 1.44 * Math.exp(-Math.min(epoch, onset + 1) / 9.1) + .29;
    const divergence = epoch >= onset + 2 ? .0032 * (epoch - onset - 1) ** 1.16 : 0;
    return decreasing + divergence + Math.sin(epoch * .91 + 1.8) * .024 + Math.cos(epoch * .43) * .011;
  });
  return { ...accuracy, id: 'F', onset, secondary: { metric: 'loss', train: lossTrain, validation: lossValidation } };
}

const scenarios = [
  createLossScenario(),
  createAccuracyScenario('B', 17, 9.2, 7.8, .0016, 1.18, 2.4, .011, 10),
  createAccuracyScenario('C', 25, 11, 9.4, .0025, 1.15, 5.1, .014, 16),
  createAccuracyScenario('D', 13, 8.6, 7.3, .0018, 1.2, 7.4, .018, 9),
  createNoisyLossScenario(),
  createDualAccuracyScenario(),
];

function xForEpoch(epoch: number) {
  return PLOT.left + (epoch - 1) / (EPOCHS - 1) * (VIEW_WIDTH - PLOT.left - PLOT.right);
}

function yForLoss(loss: number, yMin: number, yMax: number) {
  return PLOT.top + (yMax - loss) / (yMax - yMin) * (VIEW_HEIGHT - PLOT.top - PLOT.bottom);
}

function points(values: number[], visibleEpochs: number, yMin: number, yMax: number) {
  return values.slice(0, visibleEpochs).map((loss, index) => `${xForEpoch(index + 1)},${yForLoss(loss, yMin, yMax)}`).join(' ');
}

function seriesScale(series: MetricSeries) {
  const values = [...series.train, ...series.validation];
  const precision = series.metric === 'accuracy' ? 20 : 10;
  return { yMin: Math.floor(Math.min(...values) * precision) / precision, yMax: Math.ceil(Math.max(...values) * precision) / precision };
}

function MetricChart({ series, visibleEpochs, finished, selectedEpoch, result, chartRef, onMark }: { series: MetricSeries; visibleEpochs: number; finished: boolean; selectedEpoch: number | null; result: 'early' | 'correct' | 'late' | null; chartRef?: RefObject<SVGSVGElement | null>; onMark?: (event: MouseEvent<SVGSVGElement>) => void }) {
  const scale = seriesScale(series);
  const ticks = Array.from({ length: 5 }, (_, index) => scale.yMin + (scale.yMax - scale.yMin) * index / 4);
  return <svg ref={chartRef} className={finished ? 'fit-loss-chart is-ready' : 'fit-loss-chart'} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={`训练与验证 ${series.metric === 'loss' ? 'Loss' : 'Accuracy'} 曲线`} onClick={onMark}>
    {ticks.map((tick) => <g key={tick}><line x1={PLOT.left} x2={VIEW_WIDTH - PLOT.right} y1={yForLoss(tick, scale.yMin, scale.yMax)} y2={yForLoss(tick, scale.yMin, scale.yMax)} /><text x={PLOT.left - 13} y={yForLoss(tick, scale.yMin, scale.yMax) + 4} textAnchor="end">{series.metric === 'accuracy' ? `${Math.round(tick * 100)}%` : tick.toFixed(1)}</text></g>)}
    {[1, 8, 16, 24, 32, 40].map((epoch) => <g key={epoch}><line className="fit-x-grid" x1={xForEpoch(epoch)} x2={xForEpoch(epoch)} y1={PLOT.top} y2={VIEW_HEIGHT - PLOT.bottom} /><text x={xForEpoch(epoch)} y={VIEW_HEIGHT - 25} textAnchor="middle">{epoch}</text></g>)}
    <text className="fit-axis-label" x={(PLOT.left + VIEW_WIDTH - PLOT.right) / 2} y={VIEW_HEIGHT - 4} textAnchor="middle">Epoch</text><text className="fit-axis-label" x="15" y={VIEW_HEIGHT / 2} textAnchor="middle" transform={`rotate(-90 15 ${VIEW_HEIGHT / 2})`}>{series.metric === 'loss' ? 'Loss' : 'Accuracy'}</text>
    {visibleEpochs > 1 && <><polyline className="fit-line fit-line--train" points={points(series.train, visibleEpochs, scale.yMin, scale.yMax)} /><polyline className="fit-line fit-line--validation" points={points(series.validation, visibleEpochs, scale.yMin, scale.yMax)} /></>}
    {selectedEpoch !== null && <g className={`fit-marker is-${result}`}><line x1={xForEpoch(selectedEpoch)} x2={xForEpoch(selectedEpoch)} y1={PLOT.top} y2={VIEW_HEIGHT - PLOT.bottom} /><circle cx={xForEpoch(selectedEpoch)} cy={yForLoss(series.validation[selectedEpoch - 1], scale.yMin, scale.yMax)} r="7" /><text x={xForEpoch(selectedEpoch)} y={PLOT.top + 18} textAnchor="middle">Epoch {selectedEpoch}</text></g>}
  </svg>;
}

function DualMetricChart({ primary, secondary, visibleEpochs, finished, selectedEpoch, result, chartRef, onMark }: { primary: MetricSeries; secondary: MetricSeries; visibleEpochs: number; finished: boolean; selectedEpoch: number | null; result: 'early' | 'correct' | 'late' | null; chartRef: RefObject<SVGSVGElement | null>; onMark: (event: MouseEvent<SVGSVGElement>) => void }) {
  const loss = primary.metric === 'loss' ? primary : secondary;
  const accuracy = primary.metric === 'accuracy' ? primary : secondary;
  const lossScale = seriesScale(loss);
  const accuracyScale = seriesScale(accuracy);
  const lossTicks = Array.from({ length: 5 }, (_, index) => lossScale.yMin + (lossScale.yMax - lossScale.yMin) * index / 4);
  const accuracyTicks = Array.from({ length: 5 }, (_, index) => accuracyScale.yMin + (accuracyScale.yMax - accuracyScale.yMin) * index / 4);
  return <svg ref={chartRef} className={finished ? 'fit-loss-chart fit-dual-chart is-ready' : 'fit-loss-chart fit-dual-chart'} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="训练与验证的 Loss、Accuracy 双轴曲线" onClick={onMark}>
    {lossTicks.map((tick, index) => <g key={tick}><line x1={PLOT.left} x2={VIEW_WIDTH - PLOT.right} y1={yForLoss(tick, lossScale.yMin, lossScale.yMax)} y2={yForLoss(tick, lossScale.yMin, lossScale.yMax)} /><text x={PLOT.left - 13} y={yForLoss(tick, lossScale.yMin, lossScale.yMax) + 4} textAnchor="end">{tick.toFixed(1)}</text><text className="fit-right-tick" x={VIEW_WIDTH - PLOT.right + 13} y={yForLoss(accuracyTicks[index], accuracyScale.yMin, accuracyScale.yMax) + 4}>{Math.round(accuracyTicks[index] * 100)}%</text></g>)}
    {[1, 8, 16, 24, 32, 40].map((epoch) => <g key={epoch}><line className="fit-x-grid" x1={xForEpoch(epoch)} x2={xForEpoch(epoch)} y1={PLOT.top} y2={VIEW_HEIGHT - PLOT.bottom} /><text x={xForEpoch(epoch)} y={VIEW_HEIGHT - 25} textAnchor="middle">{epoch}</text></g>)}
    <text className="fit-axis-label" x={(PLOT.left + VIEW_WIDTH - PLOT.right) / 2} y={VIEW_HEIGHT - 4} textAnchor="middle">Epoch</text><text className="fit-axis-label" x="15" y={VIEW_HEIGHT / 2} textAnchor="middle" transform={`rotate(-90 15 ${VIEW_HEIGHT / 2})`}>Loss</text><text className="fit-axis-label fit-right-axis" x={VIEW_WIDTH - 15} y={VIEW_HEIGHT / 2} textAnchor="middle" transform={`rotate(90 ${VIEW_WIDTH - 15} ${VIEW_HEIGHT / 2})`}>Accuracy</text>
    {visibleEpochs > 1 && <><polyline className="fit-line fit-line--train" points={points(loss.train, visibleEpochs, lossScale.yMin, lossScale.yMax)} /><polyline className="fit-line fit-line--validation" points={points(loss.validation, visibleEpochs, lossScale.yMin, lossScale.yMax)} /><polyline className="fit-line fit-line--train fit-line--accuracy" points={points(accuracy.train, visibleEpochs, accuracyScale.yMin, accuracyScale.yMax)} /><polyline className="fit-line fit-line--validation fit-line--accuracy" points={points(accuracy.validation, visibleEpochs, accuracyScale.yMin, accuracyScale.yMax)} /></>}
    {selectedEpoch !== null && <g className={`fit-marker is-${result}`}><line x1={xForEpoch(selectedEpoch)} x2={xForEpoch(selectedEpoch)} y1={PLOT.top} y2={VIEW_HEIGHT - PLOT.bottom} /><circle cx={xForEpoch(selectedEpoch)} cy={yForLoss(accuracy.validation[selectedEpoch - 1], accuracyScale.yMin, accuracyScale.yMax)} r="7" /><text x={xForEpoch(selectedEpoch)} y={PLOT.top + 18} textAnchor="middle">Epoch {selectedEpoch}</text></g>}
  </svg>;
}

export function FittingDiagnosisBlock({ onComplete }: FittingDiagnosisBlockProps) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [visibleEpochs, setVisibleEpochs] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);
  const [result, setResult] = useState<'early' | 'correct' | 'late' | null>(null);
  const timerRef = useRef<number | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const scenario = scenarios[scenarioIndex];
  const finished = visibleEpochs === EPOCHS;

  useEffect(() => () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); }, []);

  function reset(nextScenario = scenarioIndex) {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setScenarioIndex(nextScenario);
    setVisibleEpochs(0);
    setSelectedEpoch(null);
    setResult(null);
    setRunning(false);
  }

  function start() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setVisibleEpochs(1);
    setSelectedEpoch(null);
    setResult(null);
    setRunning(true);
    timerRef.current = window.setInterval(() => {
      setVisibleEpochs((current) => {
        if (current >= EPOCHS - 1) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          return EPOCHS;
        }
        return current + 1;
      });
    }, 90);
  }

  function mark(event: MouseEvent<SVGSVGElement>) {
    if (!finished || running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = (event.clientX - bounds.left) / bounds.width * VIEW_WIDTH;
    const ratio = Math.max(0, Math.min(1, (svgX - PLOT.left) / (VIEW_WIDTH - PLOT.left - PLOT.right)));
    const epoch = Math.round(ratio * (EPOCHS - 1)) + 1;
    if (selectedEpoch === null) onComplete?.();
    setSelectedEpoch(epoch);
    if (epoch < scenario.onset - 2) setResult('early');
    else if (epoch > scenario.onset + 2) setResult('late');
    else {
      setResult('correct');
    }
  }

  const feedback = result === 'correct'
    ? scenario.secondary ? `标记正确。第 ${scenario.onset} 轮附近，训练 Loss 继续下降，验证 Loss 开始持续上升；Accuracy 暂时上升并不能排除过拟合。` : `标记正确。第 ${scenario.onset} 轮附近，训练指标继续改善，但验证指标开始总体恶化。`
    : result === 'early'
      ? scenario.secondary ? '标记太早：此时验证 Loss 还没有形成持续上升趋势，单次波动不足以判断过拟合。' : '标记太早：一次短暂波动还不能说明过拟合，要观察后续总体趋势。'
      : result === 'late'
        ? '标记太晚：不要等差距很大才判断，应寻找验证损失开始持续恶化的位置。'
        : null;

  return (
    <ContentBlock className="fit-block fit-diagnosis" title="欠拟合与过拟合" subtitle="先看训练集与验证集上的表现是否一起改善。">
      <Callout tone="blue" label="欠拟合" text="模型还没有学好，训练集和验证集表现都不理想。" />
      <Callout tone="orange" label="过拟合" text="模型继续贴合训练集，但验证集表现开始变差。" />

      <section className="fit-curve-lab">
        <header><div><strong>训练记录 {scenario.id}</strong><span>{running ? `Epoch ${visibleEpochs} / ${EPOCHS}` : finished ? '曲线已完成' : '尚未开始'}</span></div><div className={scenario.secondary ? 'fit-legend is-dual' : 'fit-legend'}>{scenario.secondary ? <><span className="is-train">训练 Loss</span><span className="is-validation">验证 Loss</span><span className="is-train is-accuracy">训练 Acc</span><span className="is-validation is-accuracy">验证 Acc</span></> : <><span className="is-train">训练</span><span className="is-validation">验证</span></>}</div></header>
        <div className="fit-chart-stack">{scenario.secondary ? <DualMetricChart primary={scenario} secondary={scenario.secondary} visibleEpochs={visibleEpochs} finished={finished} selectedEpoch={selectedEpoch} result={result} chartRef={chartRef} onMark={mark} /> : <MetricChart series={scenario} visibleEpochs={visibleEpochs} finished={finished} selectedEpoch={selectedEpoch} result={result} chartRef={chartRef} onMark={mark} />}</div>
        {!finished ? <div className="fit-curve-action"><Button variant={running ? 'default' : 'primary'} hint={!running} loading={running} onClick={start}>{running ? '正在模拟训练' : '模拟训练'}</Button></div> : <div className="fit-finished-actions"><NoticeStrip tone="blue" lead="请标记：">{scenario.secondary ? '优先看验证 Loss 的持续趋势，再用 Accuracy 理解任务表现。' : '寻找训练与验证曲线开始持续分叉的位置，不要被单次波动误导。'}</NoticeStrip><Button onClick={() => reset((scenarioIndex + 1) % scenarios.length)}>换一组训练</Button></div>}
        {feedback && <Feedback status={result === 'correct' ? 'correct' : 'wrong'} message={feedback} />}
      </section>
    </ContentBlock>
  );
}
