import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import './ManualFeatureClassifierPage.css';
import { ManualClassifierNetwork } from '../../components/ManualClassifierNetwork';
import { nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';
import { MANUAL_FEATURE_EPOCHS, predictManualDigit, trainManualClassifier, type ManualTrainingResult } from '../../services/manualFeatureClassifier';

const samples = [
  { label: 2, file: 'mnist/2/60035.png' },
  { label: 6, file: 'mnist/6/60011.png' },
  { label: 3, file: 'mnist/3/60018.png' },
] as const;
const assetId = '80396753-7fc8-4f55-9188-bddbdb828169';
export function ManualFeatureClassifierPage() {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [mode, setMode] = useState<'sample' | 'handwriting'>('sample');
  const [trained, setTrained] = useState<ManualTrainingResult | null>(null);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loss, setLoss] = useState<number | null>(null);
  const probabilities = useMemo(() => trained && !training && counts?.some(value => value > 0) ? predictManualDigit(counts, trained.classifier) : null, [trained, training, counts]);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{ id: number; x: number; y: number } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  const sample = samples[sampleIndex];
  const imageUrl = moduleAssetUrl(assetId, sample.file);

  useEffect(() => {
    if (mode !== 'sample') return;
    let active = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    setCounts(null);
    image.onload = () => {
      if (!active) return;
      try {
        const pixels = readNineGridPixels(image);
        if (pixels) setCounts(nineGridCounts(pixels));
        else setError('无法读取样本像素，请重试。');
      } catch { setError('无法读取样本像素，请检查图片跨域配置。'); }
    };
    image.src = imageUrl;
    image.onerror = () => { if (active) setError('样本读取失败，请切换样本重试。'); };
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [imageUrl, mode]);

  const clearHandwriting = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) { context.fillStyle = 'black'; context.fillRect(0, 0, canvas.width, canvas.height); }
    stroke.current = null;
    setCounts(Array(9).fill(0)); setError('');
  };
  useEffect(() => { if (mode === 'handwriting') clearHandwriting(); }, [mode]);
  const readHandwriting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const small = document.createElement('canvas'); small.width = 28; small.height = 28;
    const context = small.getContext('2d');
    if (!context) return;
    context.drawImage(canvas, 0, 0, 28, 28);
    const pixels = context.getImageData(0, 0, 28, 28).data;
    setCounts(nineGridCounts(Array.from({ length: 784 }, (_, i) => pixels[i * 4] >= 128)));
  };
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>, start = false) => {
    if (!start && stroke.current?.id !== event.pointerId) return;
    if (start && stroke.current) return;
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (start) canvas.setPointerCapture(event.pointerId);
    context.strokeStyle = 'white'; context.fillStyle = 'white'; context.lineWidth = 20; context.lineCap = 'round'; context.lineJoin = 'round';
    if (start) { context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.fill(); }
    else { context.beginPath(); context.moveTo(stroke.current!.x, stroke.current!.y); context.lineTo(x, y); context.stroke(); }
    stroke.current = { id: event.pointerId, x, y };
    setError('');
  };
  const startTraining = async () => {
    if (pending.current) return;
    pending.current = true;
    const abort = new AbortController(); controller.current = abort;
    setTraining(true); setError(''); setEpoch(0); setAccuracy(null); setLoss(null); setCached(false);
    try {
      const { result, cached: hit } = await trainManualClassifier(Math.floor(Math.random() * 10), abort.signal, record => {
        setEpoch(record.epoch); setLoss(record.loss); setAccuracy(record.val_accuracy);
      });
      if (!abort.signal.aborted) { setTrained(result); setEpoch(result.epochs); setAccuracy(result.val_accuracy); setLoss(result.history.at(-1)?.loss ?? null); setCached(hit); }
    } catch (failure) {
      if (!abort.signal.aborted) {
        setError(failure instanceof Error ? failure.message : '训练失败，请重试。');
        setEpoch(trained?.epochs ?? 0); setAccuracy(trained?.val_accuracy ?? null); setLoss(trained?.history.at(-1)?.loss ?? null);
      }
    } finally { pending.current = false; if (!abort.signal.aborted) setTraining(false); }
  };
  const finishStroke = () => {
    if (!stroke.current) return;
    stroke.current = null;
    readHandwriting();
  };

  return <ContentBlock className="vfl-manual-page" headingLevel={1}
    title="基于人工特征的数字分类"
    subtitle="将九宫格统计值作为输入，由分类器学习特征与数字类别之间的关系。">
    <div className="vfl-manual-toolbar" aria-label="训练状态、损失和验证准确率">
      <Button variant="primary" disabled={training} onClick={startTraining}><span className="vfl-manual-play" aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">{training ? '训练中' : '开始训练'}</Typography></Button>
      <div className="vfl-manual-training-state" aria-live="polite"><span className="vfl-manual-status-dot" aria-hidden="true"/><Typography as="span" variant="body" tone="muted">{training ? '正在训练' : trained ? cached ? '已训练 · 缓存' : '已训练' : '未训练'}</Typography></div>
      <div className="vfl-manual-toolbar-metric"><Typography as="span" variant="body" tone="muted">Loss {loss === null ? '—' : loss.toFixed(3)}</Typography></div>
      <div className="vfl-manual-toolbar-metric"><span className="vfl-manual-chart-icon" aria-hidden="true"><i/><i/><i/></span><Typography as="span" variant="body" tone="muted">ACC {accuracy === null ? '—' : `${(accuracy * 100).toFixed(1)}%`}</Typography></div>
      <div className="vfl-manual-toolbar-metric"><svg viewBox="0 0 24 28" aria-hidden="true"><rect x="3" y="2" width="18" height="24" rx="2"/><path d="M7 9h10M7 14h10M7 19h6"/></svg><Typography as="span" variant="body" tone="muted">Epoch {epoch} / {MANUAL_FEATURE_EPOCHS}</Typography></div>
    </div>
    <div className="vfl-manual-flow">
      <section className="vfl-manual-stage" aria-label="输入图像和人工特征">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">1</Typography><Typography as="h2" variant="h2" tone="accent">输入特征</Typography></div>
        <div className="vfl-manual-input-body">
          <div className="vfl-manual-image-column"><Typography variant="bodySmall" tone="muted">3 × 3 区域像素统计</Typography>
            <div className="vfl-manual-image" aria-label={mode === 'sample' ? `真实 MNIST 数字 ${sample.label}，带九宫格划分` : '手写输入，带九宫格划分'}>
              {mode === 'sample' ? <img src={imageUrl} alt={`MNIST 手写数字 ${sample.label}`} /> : <canvas ref={canvasRef} width={252} height={252} aria-label="手写数字画布" onPointerDown={event => draw(event, true)} onPointerMove={event => draw(event)} onPointerUp={finishStroke} onPointerCancel={finishStroke} onLostPointerCapture={finishStroke} />}
              <div className="vfl-manual-image-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index}/>)}</div>
            </div>
          </div>
          <span className="vfl-manual-arrow vfl-manual-input-arrow" aria-hidden="true"/>
          <div className="vfl-manual-vector"><Typography variant="bodySmall" tone="accent">九维特征向量</Typography><div className="vfl-manual-vector-values">{Array.from({ length: 9 }, (_, index) => <Typography as="span" key={index} variant="bodySmall" tone="accent">{counts?.[index] ?? '—'}</Typography>)}</div></div>
        </div>
        <div className="vfl-manual-input-controls">
          <Button variant={mode === 'sample' ? 'primary' : 'default'} active={mode === 'sample'} onClick={() => { setCounts(null); if (mode === 'sample') setSampleIndex(current => (current + 1) % samples.length); else setMode('sample'); setError(''); }}><Typography as="span" variant="bodySmall" tone="inherit">切换样本</Typography></Button>
          <Button variant={mode === 'handwriting' ? 'primary' : 'default'} active={mode === 'handwriting'} onClick={() => setMode('handwriting')}><Typography as="span" variant="bodySmall" tone="inherit">手写输入</Typography></Button>
          {mode === 'handwriting' && <Button onClick={clearHandwriting}><Typography as="span" variant="bodySmall" tone="inherit">清空</Typography></Button>}
        </div>
      </section>
      <span className="vfl-manual-arrow vfl-manual-stage-arrow first" aria-hidden="true"/>
      <section className="vfl-manual-stage vfl-manual-classifier" aria-label="全连接分类器结构">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">2</Typography><Typography as="h2" variant="h2" tone="accent">全连接分类器</Typography></div>
        <div className="vfl-manual-network"><div className="vfl-manual-network-values" aria-label="网络的九维输入">{Array.from({length:9},(_,index)=><Typography as="span" variant="bodySmall" tone="accent" key={index}>{counts?.[index] ?? '—'}</Typography>)}</div><ManualClassifierNetwork/></div>
        <div className="vfl-manual-layers"><Typography as="span" variant="bodySmall" tone="accent">输入 9</Typography><Typography as="span" variant="bodySmall" tone="inherit">隐藏 32</Typography><Typography as="span" variant="bodySmall" tone="inherit">输出 10</Typography></div>
      </section>
      <span className="vfl-manual-arrow vfl-manual-stage-arrow second" aria-hidden="true"/>
      <section className="vfl-manual-stage" aria-label="分类结果">
        <div className="vfl-manual-stage-heading"><Typography as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">3</Typography><Typography as="h2" variant="h2" tone="accent">分类结果</Typography></div>
        <div className="vfl-manual-results" aria-label="类别零至九的预测概率">{Array.from({length:10},(_,digit)=><div className="vfl-manual-result" key={digit}><Typography as="span" variant="bodySmall" tone="accent">{digit}</Typography><span className="vfl-manual-probability-track" aria-hidden="true"><span style={{ width: `${(probabilities?.[digit] ?? 0) * 100}%` }}/></span><Typography as="span" variant="bodySmall" tone="muted">{probabilities ? `${(probabilities[digit] * 100).toFixed(1)}%` : '—'}</Typography></div>)}</div>
        <div className="vfl-manual-result-hint" aria-live="polite"><Typography as="span" variant="bodySmall" tone="muted">{probabilities ? `预测数字：${probabilities.indexOf(Math.max(...probabilities))}` : training ? '训练完成后自动预测' : trained ? '写下数字，抬笔后自动预测' : '训练后自动显示预测概率'}</Typography></div>
      </section>
    </div>
    {error && <Typography className="vfl-manual-error" variant="bodySmall" tone="muted" role="alert">{error}</Typography>}
  </ContentBlock>;
}
