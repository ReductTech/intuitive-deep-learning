import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { GanModel, type Distribution, type Point } from './ganModel';
import './GanPlaygroundPage.css';

const SIZE = 640;
const screen = (value: number) => (value + 1.15) / 2.3 * SIZE;
const titles = ['训练 D，会改变什么？', '只更新判别器 D', '训练 G，会改变什么？', '只更新生成器 G', '让 D 和 G 轮流学习', '只生成一类，够好吗？', '判断为真 50%，就成功了吗？', '你已经读懂了这场对抗'];
const prompts = [
  'G 固定。左图的点或背景，哪个会变？',
  '观察背景颜色的变化。',
  'D 固定。这次哪个会变？',
  '观察橙色点的移动。',
  '让橙色点覆盖两个真实聚集区。',
  '只生成左边一团，右边没有。',
  'D 对真假样本都给出 50%。',
  '真伪相似，也要有多样性。',
];

type LossSample = { step: number; d: number; g: number };
function lossSample(model: GanModel): LossSample {
  const { dLoss, gLoss } = model.metrics();
  return { step: model.dSteps + model.gSteps, d: dLoss, g: gLoss };
}
function appendLoss(history: LossSample[], sample: LossSample) {
  const next = [...history, sample];
  // Keep the full time span while bounding memory during long experiments.
  return next.length > 512 ? next.filter((_, index) => index % 2 === 0) : next;
}

function LossCurves({ history, dSteps, gSteps }: { history: LossSample[]; dSteps: number; gSteps: number }) {
  const last = history[history.length - 1];
  const x = (sample: LossSample) => 3 + sample.step / Math.max(1, last.step) * 594;
  return <div className="vg-gan-game__loss-chart" data-loss-samples={history.length} aria-label="实时训练损失曲线">
    {(['d', 'g'] as const).map((key) => {
      const values = history.map((sample) => sample[key]);
      const minimum = Math.min(...values);
      const maximum = Math.max(...values);
      const padding = Math.max(.005, (maximum - minimum) * .15);
      const floor = Math.max(0, Math.floor((minimum - padding) * 200) / 200);
      const ceiling = Math.ceil((maximum + padding) * 200) / 200;
      const y = (loss: number) => 87 - (loss - floor) / (ceiling - floor) * 84;
      const color = key === 'd' ? '#e25c72' : '#3678cc';
      const name = key === 'd' ? '判别器 D' : '生成器 G';
      return <div key={key} className="vg-gan-game__single-loss">
        <div className="vg-gan-game__loss-legend">
          <Typography variant="bodySmall"><i className={`vg-gan-game__${key}-line`} />{key.toUpperCase()} Loss</Typography>
          <Typography variant="bodySmall">{last[key].toFixed(3)}</Typography>
        </div>
        <div className="vg-gan-game__loss-plot" title="纵轴随实际损失自动缩放" data-y-min={floor} data-y-max={ceiling}>
          <div className="vg-gan-game__y-axis"><Typography variant="bodySmall" tone="muted">{ceiling.toFixed(3)}</Typography><Typography variant="bodySmall" tone="muted">{floor.toFixed(3)}</Typography></div>
          <svg viewBox="0 0 600 90" preserveAspectRatio="none" role="img" aria-label={`${name}的损失曲线。横轴是参数更新步数，纵轴自动缩放到 ${floor.toFixed(3)} 至 ${ceiling.toFixed(3)}，当前值 ${last[key].toFixed(3)}。`}>
            {[3, 45, 87].map((height) => <line key={height} x1="0" x2="600" y1={height} y2={height} stroke="#dce5ef" strokeDasharray="4 5" />)}
            <polyline data-loss-curve={key} points={history.map((sample) => `${x(sample)},${y(sample[key])}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <circle cx={x(last)} cy={y(last[key])} r="3" fill={color} />
          </svg>
        </div>
      </div>;
    })}
    <div className="vg-gan-game__x-axis"><Typography variant="bodySmall" tone="muted">0</Typography><Typography variant="bodySmall" tone="muted">更新步数 {last.step}（D {dSteps} · G {gSteps}）</Typography></div>
  </div>;
}

export function GanPlaygroundPage({ onComplete }: { onComplete?: () => void }) {
  const [model, setModel] = useState(() => new GanModel());
  const [revision, setRevision] = useState(0);
  const [lossHistory, setLossHistory] = useState<LossSample[]>(() => [lossSample(model)]);
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<'d' | 'g' | 'none'>('none');
  const [feedback, setFeedback] = useState('');
  const [retry, setRetry] = useState(false);
  const [inspected, setInspected] = useState<Point | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const nextUpdate = useRef<'d' | 'g'>('d');
  const completed = useRef(false);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setRunning(false); });
    observer.observe(page);
    const pause = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', pause);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', pause); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const update = nextUpdate.current;
      // Each tick updates one network; the other network's parameters remain fixed.
      if (update === 'd') model.trainD(6); else model.trainG(6);
      const sample = lossSample(model);
      setLossHistory((history) => appendLoss(history, sample));
      nextUpdate.current = update === 'd' ? 'g' : 'd';
      setActive(update);
      setRevision((value) => value + 1);
    }, 90);
    return () => window.clearInterval(timer);
  }, [model, running]);

  useEffect(() => {
    if (stage !== 7 || completed.current) return;
    completed.current = true;
    onComplete?.();
  }, [onComplete, stage]);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const cells = 32;
    const width = SIZE / cells;
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
      const score = model.score([(x + .5) / cells * 2.3 - 1.15, 1.15 - (y + .5) / cells * 2.3]);
      const color = score >= .5 ? [34, 165, 113] : [144, 89, 199];
      const intensity = Math.sqrt(Math.abs(score - .5) * 2) * .72;
      context.fillStyle = `rgb(${color.map((channel) => Math.round(248 + (channel - 248) * intensity)).join(',')})`;
      context.fillRect(x * width, y * width, width + .5, width + .5);
    }
    context.strokeStyle = '#cbd5e155';
    context.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      context.beginPath(); context.moveTo(i * SIZE / 8, 0); context.lineTo(i * SIZE / 8, SIZE); context.stroke();
      context.beginPath(); context.moveTo(0, i * SIZE / 8); context.lineTo(SIZE, i * SIZE / 8); context.stroke();
    }
    for (const [x, y] of model.real) {
      context.beginPath(); context.arc(screen(x), SIZE - screen(y), 6, 0, Math.PI * 2);
      context.fillStyle = '#fff'; context.fill(); context.strokeStyle = '#087f8c'; context.lineWidth = 2; context.stroke();
    }
    for (const [x, y] of model.generated()) {
      const sx = screen(x), sy = SIZE - screen(y);
      context.beginPath(); context.moveTo(sx, sy - 6); context.lineTo(sx + 6, sy); context.lineTo(sx, sy + 6); context.lineTo(sx - 6, sy); context.closePath();
      context.fillStyle = '#e88227'; context.fill(); context.strokeStyle = '#fff'; context.lineWidth = .8; context.stroke();
    }
    if (inspected) {
      context.beginPath(); context.arc(screen(inspected[0]), SIZE - screen(inspected[1]), 12, 0, Math.PI * 2);
      context.strokeStyle = '#18304e'; context.lineWidth = 2; context.stroke();
    }
  }, [model, revision, inspected]);

  const train = (network: 'd' | 'g') => {
    setRunning(false);
    setRetry(false);
    if (network === 'd') model.trainD(20); else model.trainG(20);
    const sample = lossSample(model);
    setLossHistory((history) => appendLoss(history, sample));
    setActive(network);
    setRevision((value) => value + 1);
    setFeedback(network === 'd' ? 'D 更新 → 背景变；G 固定 → 点不动。' : 'G 更新 → 点移动；D 固定 → 背景不变。');
    if (stage === 1) setStage(2);
    if (stage === 3) setStage(4);
  };

  const answer = (correct: boolean) => {
    if (!correct) {
      setRetry(true);
      setFeedback(stage === 0 ? 'G 固定，点不动；D 改变，背景变。' : stage === 2 ? 'D 固定，背景不变；G 改变，点才动。' : stage === 5 ? '漏掉一类结果，缺少多样性。' : 'D 没学好，也可能给出 50%。');
      return;
    }
    setRetry(false);
    setFeedback(stage === 0 ? '对，D 改变判断，G 的输出不变。' : stage === 2 ? '对，G 改变输出，D 的判断不变。' : stage === 5 ? '对，还要覆盖不同类型。' : '对，还要看生成分布。');
    setStage((value) => value + 1);
  };

  const reset = (distribution: Distribution = model.distribution) => {
    const nextModel = new GanModel(distribution);
    setRunning(false); setActive('none'); setModel(nextModel); setLossHistory([lossSample(nextModel)]); setRevision(0); setInspected(null);
    setRetry(false);
    setFeedback('已重置，重新观察训练。');
    nextUpdate.current = 'd';
  };

  return <section ref={pageRef} className="vg-gan-game" data-stage={stage} data-active={active} data-running={running} data-d-steps={model.dSteps} data-g-steps={model.gSteps} aria-label="亲手训练一个二维 GAN">
    <header className="vg-gan-game__heading">
      <Typography as="h1" variant="h1">亲手训练一个 GAN</Typography>
      <Typography variant="bodySmall" tone="muted">让橙色生成点，学会真实样本的分布。</Typography>
    </header>
    <div className="vg-gan-game__main">
      <div className="vg-gan-game__plot">
        <div className="vg-gan-game__plot-top">
          <div className="vg-gan-game__legend">
            <Typography variant="bodySmall"><i className="vg-gan-game__real" />真实样本</Typography>
            <Typography variant="bodySmall"><i className="vg-gan-game__fake" />生成样本</Typography>
          </div>
          <div className="vg-gan-game__datasets" aria-label="真实样本分布">
            <Button aria-pressed={model.distribution === 'blobs'} disabled={stage < 4} onClick={() => reset('blobs')}>双团</Button>
            <Button aria-pressed={model.distribution === 'ring'} disabled={stage < 4} onClick={() => reset('ring')}>圆环</Button>
          </div>
        </div>
        <div className="vg-gan-game__map">
          <div className="vg-gan-game__figure">
          <canvas ref={canvasRef} width={SIZE} height={SIZE} role="img" aria-label="绿色背景表示 D 更倾向判为真，紫色更倾向判为假；空心圆是真实样本，橙色菱形是生成样本。" onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setInspected([(event.clientX - bounds.left) / bounds.width * 2.3 - 1.15, 1.15 - (event.clientY - bounds.top) / bounds.height * 2.3]);
          }} />
        <div className="vg-gan-game__map-caption">
          <div className="vg-gan-game__color-key">
            <Typography variant="bodySmall"><i className="is-fake" />更像假</Typography>
            <Typography variant="bodySmall"><i className="is-unsure" />难区分</Typography>
            <Typography variant="bodySmall"><i className="is-real" />更像真</Typography>
          </div>
          <Typography variant="bodySmall" tone="muted">背景：D 的真假判断</Typography>
          <Typography variant="bodySmall" tone="muted">{inspected ? `D 判断这里为真的概率：${Math.round(model.score(inspected) * 100)}%` : '点一下图，查看 D 判断为真的概率。'}</Typography>
        </div>
          </div>
        </div>
      </div>
      <div className="vg-gan-game__side">
        <div className="vg-gan-game__flow">
          <div className={active === 'g' ? 'is-updating' : ''}><Typography variant="bodySmall">生成器 G</Typography><Typography variant="bodySmall" tone="muted">{active === 'g' ? running ? '正在更新参数' : '刚刚更新参数' : active === 'none' ? '等待训练' : '参数固定'}</Typography></div>
          <Typography variant="body" tone="muted">→</Typography>
          <div className={active === 'd' ? 'is-updating' : ''}><Typography variant="bodySmall">判别器 D</Typography><Typography variant="bodySmall" tone="muted">{active === 'd' ? running ? '正在更新参数' : '刚刚更新参数' : active === 'none' ? '等待训练' : '参数固定'}</Typography></div>
        </div>
        <LossCurves history={lossHistory} dSteps={model.dSteps} gSteps={model.gSteps} />
        <div className="vg-gan-game__task">
          <Typography as="h2" variant="bodySmall">{titles[stage]}</Typography>
          <Typography variant="bodySmall" tone="main">{stage === 4 && model.distribution === 'ring' ? '让橙色点覆盖整个圆环。' : prompts[stage]}</Typography>
          {(stage === 0 || stage === 2 || stage === 5 || stage === 6) && <div className="vg-gan-game__answers">
            <Button onClick={() => answer(stage === 0)}>{stage < 4 ? '背景变，点不动' : stage === 5 ? '够好，点像真样本' : '是，分不清真假了'}</Button>
            <Button onClick={() => answer(stage !== 0)}>{stage < 4 ? '点动，背景不变' : stage === 5 ? '不够，漏掉一类' : '不一定，要看分布'}</Button>
          </div>}
          {stage === 1 && <Button variant="primary" onClick={() => train('d')}>训练 D，看背景变化</Button>}
          {stage === 3 && <Button variant="primary" onClick={() => train('g')}>训练 G，观察生成点变化</Button>}
          <Typography variant="bodySmall" tone={retry ? 'warning' : 'success'} aria-live="polite">{feedback && retry ? `再想一想：${feedback}` : feedback}</Typography>
        </div>
        {stage >= 4 && <div className="vg-gan-game__controls">
          <div><Button disabled={running} onClick={() => train('d')}>训练 D</Button><Button disabled={running} onClick={() => train('g')}>训练 G</Button><Button variant="primary" onClick={() => { setRunning((value) => !value); setFeedback(''); }}>{running ? '暂停训练' : '交替训练'}</Button></div>
          {stage === 4 && <Button disabled={model.gSteps <= 20 || model.dSteps <= 20} onClick={() => { setRunning(false); setStage(5); setFeedback(''); }}>检验我的理解 →</Button>}
        </div>}
      </div>
    </div>
    <footer className="vg-gan-game__footer">
      <Button onClick={() => reset()}>重新训练</Button>
    </footer>
  </section>;
}
