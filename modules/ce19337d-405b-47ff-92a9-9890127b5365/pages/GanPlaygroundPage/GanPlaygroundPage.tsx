import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-ee5b3851-8a53-4751-94e7-01d7e6c0b5ba" className="vg-gan-game__loss-chart" data-loss-samples={history.length} aria-label="实时训练损失曲线">
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
      return <div shuku-edit-id="e-55681930-b7f3-4e90-ad10-d05dcee6678e" key={key} className="vg-gan-game__single-loss">
        <div shuku-edit-id="e-d10e2264-c218-42b9-b6e5-f1c70d9196cc" className="vg-gan-game__loss-legend">
          <Typography shuku-edit-id="e-018c5722-5544-46e2-935d-92e94fc7f9ee" variant="bodySmall"><i shuku-edit-id="e-0e591d20-4769-4119-ad7d-90a6f8ceff0d" className={`vg-gan-game__${key}-line`} />{key.toUpperCase()} Loss</Typography>
          <Typography shuku-edit-id="e-e50d5bd5-d21f-4fe8-959b-ca0f71c5b147" variant="bodySmall">{last[key].toFixed(3)}</Typography>
        </div>
        <div shuku-edit-id="e-ead95d46-16b6-4e8f-a509-0acfa69f3169" className="vg-gan-game__loss-plot" title="纵轴随实际损失自动缩放" data-y-min={floor} data-y-max={ceiling}>
          <div shuku-edit-id="e-73f67886-a0b1-4840-91ba-b082c5f9a7ef" className="vg-gan-game__y-axis"><Typography shuku-edit-id="e-44a0d31f-71e9-46b7-b93a-c95fa5f6d86a" variant="bodySmall" tone="muted">{ceiling.toFixed(3)}</Typography><Typography shuku-edit-id="e-62f5869d-05f4-4319-962c-c33ef6b5f556" variant="bodySmall" tone="muted">{floor.toFixed(3)}</Typography></div>
          <svg shuku-edit-id="e-c0111ece-6d48-4c6c-840f-d76eec361fa0" viewBox="0 0 600 90" preserveAspectRatio="none" role="img" aria-label={`${name}的损失曲线。横轴是参数更新步数，纵轴自动缩放到 ${floor.toFixed(3)} 至 ${ceiling.toFixed(3)}，当前值 ${last[key].toFixed(3)}。`}>
            {[3, 45, 87].map((height) => <line shuku-edit-id="e-8c420abf-ac88-404b-b9d6-1e8e1a3062a5" key={height} x1="0" x2="600" y1={height} y2={height} stroke="#dce5ef" strokeDasharray="4 5" />)}
            <polyline shuku-edit-id="e-9e6bfe87-f372-4822-a7c7-d66972f47a9d" data-loss-curve={key} points={history.map((sample) => `${x(sample)},${y(sample[key])}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <circle shuku-edit-id="e-318823b6-399e-469a-bcea-5060f1a53aa5" cx={x(last)} cy={y(last[key])} r="3" fill={color} />
          </svg>
        </div>
      </div>;
    })}
    <div shuku-edit-id="e-5718a74d-600a-40f5-9a77-5996765bab0c" className="vg-gan-game__x-axis"><Typography shuku-edit-id="e-ce0ce7d5-c275-4b2e-9676-efcb34acab53" variant="bodySmall" tone="muted">0</Typography><Typography shuku-edit-id="e-d23f1c7d-8ee6-48a4-ad29-44c8c7beff19" variant="bodySmall" tone="muted">更新步数 {last.step}（D {dSteps} · G {gSteps}）</Typography></div>
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
      // Read the next precomputed alternating checkpoint.
      if(model.play('alternating'))setRunning(false);
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
    model.play(network);
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
    setFeedback('已重置，回放预计算缓存。');
    nextUpdate.current = 'd';
  };

  return <ContentBlock shuku-edit-id="e-de3c4844-1a01-43c2-b203-55e9d8c7f8ef" ref={pageRef} headingLevel={1} title="亲手训练一个 GAN" subtitle="让橙色生成点，学会真实样本的分布。" className="vg-shared-page vg-gan-game" bodyClassName="vg-gan-game__body" data-stage={stage} data-active={active} data-running={running} data-d-steps={model.dSteps} data-g-steps={model.gSteps} aria-label="亲手训练一个二维 GAN">
    <div shuku-edit-id="e-af444439-12a1-4510-8d28-ee8e22f1e370" className="vg-gan-game__main">
      <div shuku-edit-id="e-b75cc08b-f807-40bc-8467-2051b7f78a3a" className="vg-gan-game__plot">
        <div shuku-edit-id="e-dec16918-0a18-4aca-bc0f-ad4ead5ea835" className="vg-gan-game__plot-top">
          <div shuku-edit-id="e-c6d56607-b947-41bc-858d-15ce12324830" className="vg-gan-game__legend">
            <Typography shuku-edit-id="e-1d06fabd-516c-49c8-b7d5-0299985894a5" variant="bodySmall"><i shuku-edit-id="e-2e6a54b6-3b99-4297-a64f-c98c5575b021" className="vg-gan-game__real" />真实样本</Typography>
            <Typography shuku-edit-id="e-c2f36c4b-7396-49cc-bf84-53d795b4ec71" variant="bodySmall"><i shuku-edit-id="e-ab12d8e0-1c5c-4317-abe0-a00ce6e3d027" className="vg-gan-game__fake" />生成样本</Typography>
          </div>
          <div shuku-edit-id="e-814810f7-3561-4015-bab3-79eeba8666bc" className="vg-gan-game__datasets" aria-label="真实样本分布">
            <Button aria-pressed={model.distribution === 'blobs'} disabled={stage < 4} onClick={() => reset('blobs')}>双团</Button>
            <Button aria-pressed={model.distribution === 'ring'} disabled={stage < 4} onClick={() => reset('ring')}>圆环</Button>
          </div>
        </div>
        <div shuku-edit-id="e-29487027-5a7e-45ed-81b2-de266bdca627" className="vg-gan-game__map">
          <div shuku-edit-id="e-4f43212c-21a9-4a09-a63d-83c53612f566" className="vg-gan-game__figure">
          <canvas shuku-edit-id="e-5766af92-beb2-406f-b708-36112fce4e2f" ref={canvasRef} width={SIZE} height={SIZE} role="img" aria-label="绿色背景表示 D 更倾向判为真，紫色更倾向判为假；空心圆是真实样本，橙色菱形是生成样本。" onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setInspected([(event.clientX - bounds.left) / bounds.width * 2.3 - 1.15, 1.15 - (event.clientY - bounds.top) / bounds.height * 2.3]);
          }} />
        <div shuku-edit-id="e-d7551e00-828c-455f-8f56-d37df860b44a" className="vg-gan-game__map-caption">
          <div shuku-edit-id="e-228202ca-3691-47de-b835-f19bbbec1370" className="vg-gan-game__color-key">
            <Typography shuku-edit-id="e-6d222930-4117-4717-a015-8b293821b225" variant="bodySmall"><i shuku-edit-id="e-264609f7-86f0-4bd5-ad65-225057fce3f4" className="is-fake" />更像假</Typography>
            <Typography shuku-edit-id="e-2b89001c-5aae-4065-82a0-f0cc802144da" variant="bodySmall"><i shuku-edit-id="e-99a07a71-fdd4-4652-a392-524bc0525f60" className="is-unsure" />难区分</Typography>
            <Typography shuku-edit-id="e-1f576bf4-4277-4413-83a6-8ff67b3bdbdb" variant="bodySmall"><i shuku-edit-id="e-363b04a4-75f4-4c4d-8bd2-178c26150ee8" className="is-real" />更像真</Typography>
          </div>
          <Typography shuku-edit-id="e-e54275e6-5ddb-4e6b-aa53-ad386e0fc91c" variant="bodySmall" tone="muted">背景：D 的真假判断</Typography>
          <Typography shuku-edit-id="e-2f798c0e-8812-4e70-abe8-5a267b60aa61" variant="bodySmall" tone="muted">{inspected ? `D 判断这里为真的概率：${Math.round(model.score(inspected) * 100)}%` : '点一下图，查看 D 判断为真的概率。'}</Typography>
        </div>
          </div>
        </div>
      </div>
      <div shuku-edit-id="e-fc1c3c61-3e10-443b-9737-ec3a5b21a6d4" className="vg-gan-game__side">
        <div shuku-edit-id="e-57a2bb24-cef9-4f27-8317-359585af2849" className="vg-gan-game__flow">
          <div shuku-edit-id="e-9b4d3fbe-3f2d-4f9d-9ad6-98ed313a22a5" className={active === 'g' ? 'is-updating' : ''}><Typography shuku-edit-id="e-d391d80a-7ef4-43da-bce2-0de33a6a7491" variant="bodySmall">生成器 G</Typography><Typography shuku-edit-id="e-a03d2cdd-7db8-44a3-b2f7-b3b2f3946bbd" variant="bodySmall" tone="muted">{active === 'g' ? running ? '正在更新参数' : '刚刚更新参数' : active === 'none' ? '等待训练' : '参数固定'}</Typography></div>
          <Typography shuku-edit-id="e-764e73ba-c416-4ad5-880a-7750bc9d7577" variant="body" tone="muted">→</Typography>
          <div shuku-edit-id="e-c0c20b7b-0470-40d6-aeb0-7c4a29003743" className={active === 'd' ? 'is-updating' : ''}><Typography shuku-edit-id="e-11a0db92-fca2-4251-852b-5527bc7ac8cc" variant="bodySmall">判别器 D</Typography><Typography shuku-edit-id="e-2e398cae-a069-4409-a14d-84f2c3f118f0" variant="bodySmall" tone="muted">{active === 'd' ? running ? '正在更新参数' : '刚刚更新参数' : active === 'none' ? '等待训练' : '参数固定'}</Typography></div>
        </div>
        <LossCurves history={lossHistory} dSteps={model.dSteps} gSteps={model.gSteps} />
        <div shuku-edit-id="e-f189d9a4-e9bc-4d35-9c9b-4d2ba8123ae7" className="vg-gan-game__task">
          <Typography shuku-edit-id="e-253fa3fd-be57-4cfe-b66f-5364f4a36999" as="h2" variant="bodySmall">{titles[stage]}</Typography>
          <Typography shuku-edit-id="e-f53fcff2-eae0-4f1b-b0bd-9f32010e6fd6" variant="bodySmall" tone="main">{stage === 4 && model.distribution === 'ring' ? '让橙色点覆盖整个圆环。' : prompts[stage]}</Typography>
          {(stage === 0 || stage === 2 || stage === 5 || stage === 6) && <div shuku-edit-id="e-c5718b74-50f6-4355-b0f5-0e750ff264e5" className="vg-gan-game__answers">
            <Button onClick={() => answer(stage === 0)}>{stage < 4 ? '背景变，点不动' : stage === 5 ? '够好，点像真样本' : '是，分不清真假了'}</Button>
            <Button onClick={() => answer(stage !== 0)}>{stage < 4 ? '点动，背景不变' : stage === 5 ? '不够，漏掉一类' : '不一定，要看分布'}</Button>
          </div>}
          {stage === 1 && <Button variant="primary" onClick={() => train('d')}>回放 D 的变化</Button>}
          {stage === 3 && <Button variant="primary" onClick={() => train('g')}>回放 G 的变化</Button>}
          <Typography shuku-edit-id="e-e274b884-f299-44cd-b563-78f83745fdb0" variant="bodySmall" tone={retry ? 'warning' : 'success'} aria-live="polite">{feedback && retry ? `再想一想：${feedback}` : feedback}</Typography>
        </div>
        {stage >= 4 && <div shuku-edit-id="e-9424bf25-da46-4394-b4a0-6d471a8f8cf2" className="vg-gan-game__controls">
          <div shuku-edit-id="e-d1c73f67-0854-4582-9b83-df294cec5dcb"><Button disabled={running} onClick={() => train('d')}>回放 D</Button><Button disabled={running} onClick={() => train('g')}>回放 G</Button><Button variant="primary" onClick={() => { setRunning((value) => !value); setFeedback(''); }}>{running ? '暂停回放' : '交替回放'}</Button></div>
          {stage === 4 && <Button disabled={model.gSteps <= 20 || model.dSteps <= 20} onClick={() => { setRunning(false); setStage(5); setFeedback(''); }}>检验我的理解 →</Button>}
        </div>}
      </div>
    </div>
    <footer shuku-edit-id="e-c4739acb-b815-4d48-8c07-5bbec5669e93" className="vg-gan-game__footer">
      <Button onClick={() => reset()}>重新回放</Button>
    </footer>
  </ContentBlock>;
}
