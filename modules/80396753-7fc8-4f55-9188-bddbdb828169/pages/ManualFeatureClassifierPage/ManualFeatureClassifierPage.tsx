import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import './ManualFeatureClassifierPage.css';
import { ManualClassifierNetwork } from '../../components/ManualClassifierNetwork';
import { nineGridCounts, readNineGridPixels } from '../../services/nineGridDigit';
import { MANUAL_FEATURE_EPOCHS, predictManualDigit, trainManualClassifier, type ManualTrainingResult } from '../../services/manualFeatureClassifier';

const samples = [
  { label: 2, file: "mnist/2/60035.webp" },
  { label: 6, file: "mnist/6/60011.webp" },
  { label: 3, file: "mnist/3/60018.webp" },
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
  const imageUrl = moduleAssetUrl(sample.file);

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

  return <ContentBlock shuku-edit-id="e-11cba0df-e868-466b-8e37-f3fa31fa89f7" className="vfl-manual-page" headingLevel={1}
    title="基于人工特征的数字分类"
    subtitle="将九宫格统计值作为输入，由分类器学习特征与数字类别之间的关系。">
    <div shuku-edit-id="e-253b69db-eebc-4281-a8a7-6971ad3b26ec" className="vfl-manual-toolbar" aria-label="训练状态、损失和验证准确率">
      <Button variant="primary" disabled={training} onClick={startTraining}><span shuku-edit-id="e-efe327d3-ce6c-46db-9ee7-d4d9a2520851" className="vfl-manual-play" aria-hidden="true"/><Typography shuku-edit-id="e-64db68be-c080-4491-b929-02edc0ce91cb" as="span" variant="body" tone="inherit">{training ? '训练中' : '播放缓存'}</Typography></Button>
      <div shuku-edit-id="e-ebf5f354-db77-4d5a-b5f8-8bdfb1d9b21a" className="vfl-manual-training-state" aria-live="polite"><span shuku-edit-id="e-4f80c41d-3e46-4376-b36b-6385977d0c50" className="vfl-manual-status-dot" aria-hidden="true"/><Typography shuku-edit-id="e-98995214-7fcf-434a-a127-b658c6eca91e" as="span" variant="body" tone="muted">{training ? '正在训练' : trained ? cached ? '已训练 · 缓存' : '已训练' : '未训练'}</Typography></div>
      <div shuku-edit-id="e-3246dd07-4317-40b8-8d0f-7a23a815f3e3" className="vfl-manual-toolbar-metric"><Typography shuku-edit-id="e-c01f3344-2659-4682-852f-c746b773f5ba" as="span" variant="body" tone="muted">Loss {loss === null ? '—' : loss.toFixed(3)}</Typography></div>
      <div shuku-edit-id="e-09fb1fa5-1cd1-4d27-bb4b-3a60ef569529" className="vfl-manual-toolbar-metric"><span shuku-edit-id="e-b33dd646-76d2-42d0-b830-714cf277877a" className="vfl-manual-chart-icon" aria-hidden="true"><i shuku-edit-id="e-fc3b7714-37c5-469f-ad8d-76f69ad96e6c"/><i shuku-edit-id="e-4b4bfb35-6177-401a-941e-92eca7a74de4"/><i shuku-edit-id="e-a1a52a54-de04-4db5-93d0-f17eb8759101"/></span><Typography shuku-edit-id="e-e180371c-6c8e-486f-a3bd-214f31e9adb1" as="span" variant="body" tone="muted">ACC {accuracy === null ? '—' : `${(accuracy * 100).toFixed(1)}%`}</Typography></div>
      <div shuku-edit-id="e-908ea3d6-9989-4171-a002-b7bc55010326" className="vfl-manual-toolbar-metric"><svg shuku-edit-id="e-6fb27dcd-5b00-49cb-8985-b72d03f972de" viewBox="0 0 24 28" aria-hidden="true"><rect shuku-edit-id="e-a1e9005d-eb73-4e62-adda-0c6770a66317" x="3" y="2" width="18" height="24" rx="2"/><path shuku-edit-id="e-f9ccb8cc-1157-4677-b51e-e19d595d5456" d="M7 9h10M7 14h10M7 19h6"/></svg><Typography shuku-edit-id="e-7b07092a-e55c-42a3-97d5-aaaf3717b1c5" as="span" variant="body" tone="muted">Epoch {epoch} / {MANUAL_FEATURE_EPOCHS}</Typography></div>
    </div>
    <div shuku-edit-id="e-a2d06ef6-8ecf-4c86-8eac-cb5a8cc6a6af" className="vfl-manual-flow">
      <section shuku-edit-id="e-64523738-0649-49b8-923a-95d779609040" className="vfl-manual-stage" aria-label="输入图像和人工特征">
        <div shuku-edit-id="e-fd6a1923-def1-44aa-a4ab-8d8531e575d2" className="vfl-manual-stage-heading"><Typography shuku-edit-id="e-4a2cc987-78de-47d0-a7fd-1cff39217b2c" as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">1</Typography><Typography shuku-edit-id="e-ce2668a2-0fff-4fd3-9664-5e02fc604664" as="h2" variant="h2" tone="accent">输入特征</Typography></div>
        <div shuku-edit-id="e-31fbea28-5cee-4571-86ac-9bc1a3b37f5b" className="vfl-manual-input-body">
          <div shuku-edit-id="e-8cf0d197-788f-4859-bc5b-d855d3f4abda" className="vfl-manual-image-column"><Typography shuku-edit-id="e-2019d463-113d-4b53-a947-0da8730b18b1" variant="bodySmall" tone="muted">3 × 3 区域像素统计</Typography>
            <div shuku-edit-id="e-6833199a-0c75-40ec-8022-4e3e7e426ec6" className="vfl-manual-image" aria-label={mode === 'sample' ? `真实 MNIST 数字 ${sample.label}，带九宫格划分` : '手写输入，带九宫格划分'}>
              {mode === 'sample' ? <img shuku-edit-id="e-3ab6f2a2-808e-441b-a586-861313283e3f" src={imageUrl} alt={`MNIST 手写数字 ${sample.label}`} /> : <canvas shuku-edit-id="e-98fa88ca-cbd6-4545-b69f-7c8e831cefd1" ref={canvasRef} width={252} height={252} aria-label="手写数字画布" onPointerDown={event => draw(event, true)} onPointerMove={event => draw(event)} onPointerUp={finishStroke} onPointerCancel={finishStroke} onLostPointerCapture={finishStroke} />}
              <div shuku-edit-id="e-abd4709a-9f88-4d45-af78-8ed8c2061c34" className="vfl-manual-image-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span shuku-edit-id="e-efd41bfc-4e7e-4d71-9bfd-d61925a493fb" key={index}/>)}</div>
            </div>
          </div>
          <span shuku-edit-id="e-357e4e41-b549-4c7b-94c9-73fccea1c746" className="vfl-manual-arrow vfl-manual-input-arrow" aria-hidden="true"/>
          <div shuku-edit-id="e-22989822-43e9-435a-8707-b31fc6b343ae" className="vfl-manual-vector"><Typography shuku-edit-id="e-e10f61ac-b936-412c-8a1e-3c7df3102984" variant="bodySmall" tone="accent">九维特征向量</Typography><div shuku-edit-id="e-02baed31-7ae9-46fd-8a37-a07f6c274405" className="vfl-manual-vector-values">{Array.from({ length: 9 }, (_, index) => <Typography shuku-edit-id="e-acf853c3-ef34-43eb-8c6d-942408270e3e" as="span" key={index} variant="bodySmall" tone="accent">{counts?.[index] ?? '—'}</Typography>)}</div></div>
        </div>
        <div shuku-edit-id="e-8af2d80e-aa59-4757-90ab-12ab39bd0395" className="vfl-manual-input-controls">
          <Button variant={mode === 'sample' ? 'primary' : 'default'} active={mode === 'sample'} onClick={() => { setCounts(null); if (mode === 'sample') setSampleIndex(current => (current + 1) % samples.length); else setMode('sample'); setError(''); }}><Typography shuku-edit-id="e-89f43129-637d-4c0c-b7d7-29b5b0e2be0a" as="span" variant="bodySmall" tone="inherit">切换样本</Typography></Button>
          <Button variant={mode === 'handwriting' ? 'primary' : 'default'} active={mode === 'handwriting'} onClick={() => setMode('handwriting')}><Typography shuku-edit-id="e-671e7d77-6aa3-41d1-9707-8f5c45f1e692" as="span" variant="bodySmall" tone="inherit">手写输入</Typography></Button>
          {mode === 'handwriting' && <Button onClick={clearHandwriting}><Typography shuku-edit-id="e-46654a36-a3cc-40eb-a747-b5c60fa131fe" as="span" variant="bodySmall" tone="inherit">清空</Typography></Button>}
        </div>
      </section>
      <span shuku-edit-id="e-0d6255ef-9d0e-421b-8e69-2ab3543c9ce5" className="vfl-manual-arrow vfl-manual-stage-arrow first" aria-hidden="true"/>
      <section shuku-edit-id="e-30e6fde2-e3f9-45dd-aef6-d35a61e78972" className="vfl-manual-stage vfl-manual-classifier" aria-label="全连接分类器结构">
        <div shuku-edit-id="e-ac8bfa7a-850e-4ccd-a95e-fc5c4a45558f" className="vfl-manual-stage-heading"><Typography shuku-edit-id="e-f9c65620-e238-41bc-8c86-57163c78f49d" as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">2</Typography><Typography shuku-edit-id="e-eff96586-c425-4115-8605-c424231d2d84" as="h2" variant="h2" tone="accent">全连接分类器</Typography></div>
        <div shuku-edit-id="e-6377e15c-1100-41b3-8948-a4914f9f5cba" className="vfl-manual-network"><div shuku-edit-id="e-e83d7e81-efc5-433b-911a-d51852447d6b" className="vfl-manual-network-values" aria-label="网络的九维输入">{Array.from({length:9},(_,index)=><Typography shuku-edit-id="e-89ab886e-c30f-4e4f-8071-6ad48adb2061" as="span" variant="bodySmall" tone="accent" key={index}>{counts?.[index] ?? '—'}</Typography>)}</div><ManualClassifierNetwork/></div>
        <div shuku-edit-id="e-0c704f6c-f293-46e2-b72a-1c95d7a7b26d" className="vfl-manual-layers"><Typography shuku-edit-id="e-57346500-d6f6-4774-961e-f437772d679d" as="span" variant="bodySmall" tone="accent">输入 9</Typography><Typography shuku-edit-id="e-1c21addc-93b8-4544-a675-92395b95ffdf" as="span" variant="bodySmall" tone="inherit">隐藏 32</Typography><Typography shuku-edit-id="e-30e67980-77f7-4141-b456-dd0a62d72673" as="span" variant="bodySmall" tone="inherit">输出 10</Typography></div>
      </section>
      <span shuku-edit-id="e-06bc448f-5b01-4124-b7df-02753c9848c0" className="vfl-manual-arrow vfl-manual-stage-arrow second" aria-hidden="true"/>
      <section shuku-edit-id="e-86f1e12c-5eff-4c04-8929-740bb30a9602" className="vfl-manual-stage" aria-label="分类结果">
        <div shuku-edit-id="e-21fe4142-6d9b-4509-800f-540355c8398a" className="vfl-manual-stage-heading"><Typography shuku-edit-id="e-21f40eb0-6d20-43f7-8663-973a79ff9bd6" as="span" variant="h2" tone="inherit" className="vfl-manual-stage-number">3</Typography><Typography shuku-edit-id="e-0a03e291-8d40-440f-9ef6-a1524f48eceb" as="h2" variant="h2" tone="accent">分类结果</Typography></div>
        <div shuku-edit-id="e-bd656b4e-78a2-4a82-bb71-f3414a44a303" className="vfl-manual-results" aria-label="类别零至九的预测概率">{Array.from({length:10},(_,digit)=><div shuku-edit-id="e-d5d645b3-6e30-463d-801b-f3ee2a1074d6" className="vfl-manual-result" key={digit}><Typography shuku-edit-id="e-203ea88f-f0cf-4603-9012-536b012e10ec" as="span" variant="bodySmall" tone="accent">{digit}</Typography><span shuku-edit-id="e-356e6181-c20d-41fc-81f5-8ad4f8cbe3f5" className="vfl-manual-probability-track" aria-hidden="true"><span shuku-edit-id="e-992fb973-a4f7-4d39-9385-6df1aff66518" style={{ width: `${(probabilities?.[digit] ?? 0) * 100}%` }}/></span><Typography shuku-edit-id="e-5bd10fb4-7a0c-4685-9145-017a56ec9ce7" as="span" variant="bodySmall" tone="muted">{probabilities ? `${(probabilities[digit] * 100).toFixed(1)}%` : '—'}</Typography></div>)}</div>
        <div shuku-edit-id="e-48d957aa-6bdb-4e99-9e92-387f5eff1f0a" className="vfl-manual-result-hint" aria-live="polite"><Typography shuku-edit-id="e-81895db8-8e41-4b04-bd6f-0516f9adec69" as="span" variant="bodySmall" tone="muted">{probabilities ? `预测数字：${probabilities.indexOf(Math.max(...probabilities))}` : training ? '训练完成后自动预测' : trained ? '写下数字，抬笔后自动预测' : '训练后自动显示预测概率'}</Typography></div>
      </section>
    </div>
    {error && <Typography shuku-edit-id="e-92d886f8-710b-46e6-a89a-7a26678e2217" className="vfl-manual-error" variant="bodySmall" tone="muted" role="alert">{error}</Typography>}
  </ContentBlock>;
}
