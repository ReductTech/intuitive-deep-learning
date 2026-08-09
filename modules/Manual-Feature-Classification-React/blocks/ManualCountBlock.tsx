import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Callout, ContentBlock, LessonStage } from '../../shared/react';
import { DigitGridCanvas, RegionZoomCanvas } from '../components/ManualFeatureCanvases';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { REGION_BOUNDS, SAMPLES, VECTOR_ORDERS, VECTOR_ORDER_LABELS, computeNineGrid, imageToPixels, loadImage, pickPracticeRegion, type VectorOrder } from '../model/manualFeatureMath';
import { reviewVectorOrder } from '../services/vectorOrderFeedback';

interface CountState { sampleIndex: number; countInput: string; countFeedback: '' | 'invalid' | 'wrong'; manualDone: boolean; vectorDone: boolean; selectedOrder: string; orderAnswer: string; orderFeedback: string; orderTone: 'correct' | 'wrong' | 'hint' | ''; }
const initialSample = Math.max(0, SAMPLES.findIndex((sample) => sample.label === 7 && sample.file === '60000.png'));
const createInitial = (): CountState => ({ sampleIndex: initialSample, countInput: '', countFeedback: '', manualDone: false, vectorDone: false, selectedOrder: '', orderAnswer: '', orderFeedback: '', orderTone: '' });
function normalize(stored: unknown): CountState | null { if (!stored || typeof stored !== 'object') return null; const value = stored as Partial<CountState>; return { ...createInitial(), ...value, sampleIndex: Number.isInteger(value.sampleIndex) ? Number(value.sampleIndex) % Math.max(1, SAMPLES.length) : initialSample }; }

export function ManualCountBlock({ onComplete, lessonStepComplete = false }: { onComplete: () => void; lessonStepComplete?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { state, stateRef, hydrated, setDraft, commit } = usePersistedActivity<CountState>({ stateKey: 'manual-feature:count', createInitial, normalizeState: normalize, getElement: () => rootRef.current });
  const [pixels, setPixels] = useState<number[][]>([]), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [scanRegion, setScanRegion] = useState(0), [scanPixel, setScanPixel] = useState<[number, number] | null>(null), [scanDone, setScanDone] = useState(false), [previewOrder, setPreviewOrder] = useState<VectorOrder | ''>(''), [previewAll, setPreviewAll] = useState(false), [reviewing, setReviewing] = useState(false);
  const sample = SAMPLES[state?.sampleIndex ?? initialSample] ?? SAMPLES[0];
  const features = useMemo(() => pixels.length ? computeNineGrid(pixels) : [], [pixels]);
  const targetRegion = useMemo(() => features.length ? pickPracticeRegion(features) : 4, [features]);

  useEffect(() => { let active = true; if (!sample) return; setLoading(true); setLoadError(''); void loadImage(sample).then((image) => { if (!active) return; setPixels(imageToPixels(image)); setLoading(false); }).catch(() => { if (!active) return; setLoadError(`无法加载样本 ${sample.file}`); setLoading(false); }); return () => { active = false; }; }, [sample]);
  useEffect(() => {
    if (loading || !features.length || state?.manualDone) { setScanDone(Boolean(state?.manualDone)); setScanPixel(null); return; }
    const sequence: Array<{ region: number; pixel: [number, number] | null }> = [];
    for (let region = 0; region <= targetRegion; region += 1) {
      const gridRow = Math.floor(region / 3), gridCol = region % 3;
      for (let row = REGION_BOUNDS[gridRow]; row < REGION_BOUNDS[gridRow + 1]; row += 1) for (let col = REGION_BOUNDS[gridCol]; col < REGION_BOUNDS[gridCol + 1]; col += 1) if (pixels[row]?.[col]) sequence.push({ region, pixel: [row, col] });
      for (let pause = 0; pause < 5; pause += 1) sequence.push({ region, pixel: null });
    }
    let index = 0; setScanRegion(0); setScanPixel(null); setScanDone(false);
    const timer = window.setInterval(() => { const step = sequence[index]; if (!step) { window.clearInterval(timer); setScanRegion(targetRegion); setScanPixel(null); setScanDone(true); return; } setScanRegion(step.region); setScanPixel(step.pixel); index += 1; }, 46);
    return () => window.clearInterval(timer);
  }, [loading, features.length, pixels, targetRegion, state?.sampleIndex, state?.manualDone]);
  useEffect(() => { if (!previewAll) return; const orders: VectorOrder[] = ['row', 'column', 'reverse', 'snake']; let index = 0; setPreviewOrder(orders[0]); const timer = window.setInterval(() => { index = (index + 1) % orders.length; setPreviewOrder(orders[index]); }, 900); return () => { window.clearInterval(timer); setPreviewOrder(''); }; }, [previewAll]);

  if (!hydrated || !state || !sample) return <LessonStage title="设计第一个人工特征"><ContentBlock>正在恢复活动状态…</ContentBlock></LessonStage>;
  const revealed = state.manualDone ? Array.from({ length: 9 }, (_, i) => i) : Array.from({ length: Math.min(scanRegion, targetRegion) }, (_, i) => i);
  const taskTitle = state.manualDone ? `选择这个 ${sample.label} 的特征向量` : scanDone ? '轮到你数白色像素点' : loading ? '跟着计算机从左上扫到右下' : '自动计数中';
  const taskSubtitle = state.manualDone
    ? '图上的 9 个数字已经提取出来了。请选择哪一个判断最准确。'
    : scanDone
      ? '请观察放大图，数完后输入数量。'
      : loading
        ? '计算机会先自动数前面的格子。扫到最少的那个非空格时，它会停下来，把这一格交给你。'
        : '计算机正按从左上到右下的顺序数格子。每个被数到的像素会闪一下，数完后数量会直接写在图上。';
  const vectorText = (order: VectorOrder) => `[${VECTOR_ORDERS[order].map((index) => features[index]?.count ?? 0).join(', ')}]`;
  const orderLabels: Record<VectorOrder, string> = {
    row: `从左上到右下：${vectorText('row')}`,
    column: `先按列从上到下：${vectorText('column')}`,
    reverse: `从右下到左上：${vectorText('reverse')}`,
    snake: `蛇形顺序：${vectorText('snake')}`,
  };

  function newSample() { let index = Math.floor(Math.random() * SAMPLES.length); if (index === state!.sampleIndex) index = (index + 1) % SAMPLES.length; commit('manual_feature_sample_changed', { ...createInitial(), sampleIndex: index }, { sample_label: SAMPLES[index]?.label }); }
  function submitCount() { const rawValue = String(stateRef.current?.countInput ?? '').trim(); const value = Number(rawValue); if (!rawValue || !Number.isFinite(value) || !Number.isInteger(value)) { commit('manual_feature_count_checked', (current) => ({ ...current, countFeedback: 'invalid' }), { valid: false, region: targetRegion }); return; } if (value === features[targetRegion]?.count) commit('manual_feature_count_checked', (current) => ({ ...current, countFeedback: '', manualDone: true }), { correct: true, region: targetRegion, value }); else commit('manual_feature_count_checked', (current) => ({ ...current, countFeedback: 'wrong' }), { correct: false, region: targetRegion, value }); }
  function chooseOrder(value: string) { setPreviewAll(false); setPreviewOrder(''); const done = value === 'all'; const next = commit('manual_feature_vector_order_selected', (current) => ({ ...current, selectedOrder: value, vectorDone: done }), { value, correct: done }); if (done && next && !lessonStepComplete) onComplete(); }
  async function submitReason() { if (!state!.orderAnswer.trim() || reviewing) return; setReviewing(true); try { const reviewed = await reviewVectorOrder(state!.orderAnswer, state!.selectedOrder); const next = commit('manual_feature_order_reason_reviewed', (current) => ({ ...current, vectorDone: true, orderFeedback: String(reviewed.message), orderTone: reviewed.tone }), { reviewed: true }); if (next && !lessonStepComplete) onComplete(); } catch { const next = commit('manual_feature_order_reason_review_failed', (current) => ({ ...current, vectorDone: true, orderFeedback: '评阅服务暂时不可用，请稍后重试。统一顺序的核心作用是让每一维始终代表同一个九宫格位置。', orderTone: 'wrong' }), { reviewed: false }); if (next && !lessonStepComplete) onComplete(); } finally { setReviewing(false); } }

  return <LessonStage ref={rootRef} className="hdf-stage hdf-count-stage" title="设计第一个人工特征" description="请观察被高亮的格子，数一数里面有多少个亮起来的像素。">
    <div className="hdf-count-layout">
      <ContentBlock className="hdf-digit-panel" title={<>当前样本：数字 {sample.label}</>}>
        <div className="hdf-panel-actions"><Button onClick={newSample}>换一张</Button></div>
        <div className="hdf-digit-frame"><DigitGridCanvas pixels={pixels} features={features} activeRegion={state.manualDone ? targetRegion : scanRegion} highlightCountRegion={targetRegion} flashPixel={scanPixel} revealedRegions={revealed} previewOrder={previewOrder} label={sample.label} /></div>
      </ContentBlock>
      <ContentBlock className="hdf-task-panel" bodyClassName="hdf-task-body" title={taskTitle} subtitle={taskSubtitle}>
        {loading && <Callout tone="orange" label="正在处理" text="图片加载中。" />}
        {loadError && <Callout tone="red" label="需要调整" text={loadError} />}
        {!loading && !loadError && !state.manualDone && !scanDone && <Callout tone="blue" label="观察提示" text="先看图上的高亮框移动和像素闪烁。" />}
        {!loading && !state.manualDone && scanDone && <>
          <div className="hdf-region-zoom"><div className="hdf-region-zoom-head">待计数区域放大</div><div className="hdf-region-zoom-frame"><RegionZoomCanvas pixels={pixels} region={targetRegion} /></div></div>
          <form className="hdf-count-form" onSubmit={(event) => { event.preventDefault(); submitCount(); }}><label className="edu-control"><span className="edu-label">白色像素点数量</span><span className="hdf-input-row"><input className="edu-input" type="number" min="0" max="100" step="1" inputMode="numeric" placeholder="输入数量" value={state.countInput} onChange={(event) => setDraft((current) => ({ ...current, countInput: event.target.value }))} onBlur={() => commit('manual_feature_count_draft_changed', (current) => ({ ...current }))} /><Button variant="primary" hint type="submit">提交</Button></span></label></form>
          {state.countFeedback === 'invalid' ? <Callout tone="red" label="需要调整" text="先输入一个整数，再提交。" /> : state.countFeedback === 'wrong' ? <Callout tone="orange" label="思考提示" text="还不对。白色小方块一个一个数，只数这一格里的白块。" /> : <Callout tone="blue" label="观察提示" text="数数图中有几个白色像素点。" />}
        </>}
        {state.manualDone && <>
          <section className="dl-question hdf-vector-question"><header className="dl-question-head"><span className="dl-question-type">单选题</span><strong className="dl-question-stem">哪一个可以作为这个数字 {sample.label} 的特征向量？</strong></header><div className="dl-question-options">
            {(['row','column','reverse','snake'] as VectorOrder[]).map((order) => <button className={`dl-question-option ${state.selectedOrder === order ? 'is-selected' : ''} ${previewOrder === order && !previewAll ? 'is-previewing' : ''}`} key={order} type="button" onPointerEnter={() => setPreviewOrder(order)} onPointerDown={() => setPreviewOrder(order)} onPointerLeave={() => setPreviewOrder('')} onFocus={() => setPreviewOrder(order)} onBlur={() => setPreviewOrder('')} onClick={() => chooseOrder(order)}><span className="dl-option-key">{String.fromCharCode(65 + Object.keys(VECTOR_ORDER_LABELS).indexOf(order))}</span><span className="dl-option-body">{orderLabels[order]}</span></button>)}
            <button className={`dl-question-option ${state.selectedOrder === 'all' ? 'is-correct' : ''} ${previewAll ? 'is-previewing' : ''}`} type="button" onPointerEnter={() => setPreviewAll(true)} onPointerDown={() => setPreviewAll(true)} onPointerLeave={() => setPreviewAll(false)} onFocus={() => setPreviewAll(true)} onBlur={() => setPreviewAll(false)} onClick={() => chooseOrder('all')}><span className="dl-option-key">E</span><span className="dl-option-body">以上都可以，只要所有样本始终使用同一种顺序</span></button>
          </div></section>
          {state.selectedOrder && state.selectedOrder !== 'all' && !state.vectorDone && <section className="dl-question dl-question--short"><header className="dl-question-head"><span className="dl-question-type">简答题</span><div className="dl-question-title-row"><strong className="dl-question-stem">为什么所有样本必须坚持同一种顺序？</strong><Button variant="primary" disabled={reviewing} onClick={() => void submitReason()}>{reviewing ? '正在分析' : '提交回答'}</Button></div></header><div className="dl-question-fields"><textarea rows={4} value={state.orderAnswer} onChange={(event) => setDraft((current) => ({ ...current, orderAnswer: event.target.value }))} onBlur={() => commit('manual_feature_order_reason_changed', (current) => ({ ...current }))} /></div></section>}
          {state.orderFeedback && <Callout tone={state.orderTone === 'correct' ? 'green' : state.orderTone === 'wrong' ? 'orange' : 'blue'} label="评阅结果" text={state.orderFeedback} />}
          {state.vectorDone && <Callout tone="green" label="特征向量准备好了" text="只要每个样本都采用同一顺序，每一维就会稳定代表同一个区域。" />}
        </>}
      </ContentBlock>
    </div>
  </LessonStage>;
}
