import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Callout, ContentBlock, LessonStage } from '../../shared/react';
import { DigitGridCanvas, MlpNetworkCanvas } from '../components/ManualFeatureCanvases';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { argmax, blankPixels, computeNineGrid, createMlpModel, evaluateMlp, loadDataset, mlpForward, modelFeatureVector, trainMlpStep, type DatasetRow, type MlpModel } from '../model/manualFeatureMath';

interface MlpState { trained: boolean; model: MlpModel | null; accuracy: number; drawn: number[]; drawHasInk: boolean; }
const createInitial = (): MlpState => ({ trained: false, model: null, accuracy: 0, drawn: [], drawHasInk: false });
function validModel(value: unknown): value is MlpModel { const model = value as Partial<MlpModel>; return Boolean(model && model.hidden === 18 && Array.isArray(model.w1) && model.w1.length === 18 && Array.isArray(model.w2) && model.w2.length === 10); }
function normalize(stored: unknown): MlpState | null { if (!stored || typeof stored !== 'object') return null; const value = stored as Partial<MlpState>; return { ...createInitial(), ...value, trained: value.trained === true && validModel(value.model), model: validModel(value.model) ? value.model : null, drawn: Array.isArray(value.drawn) ? value.drawn.map(Number).filter((item) => item >= 0 && item < 784) : [] }; }
function drawPixels(indexes: number[]) { const pixels = blankPixels(); indexes.forEach((index) => { const row = Math.floor(index / 28), col = index % 28; pixels[row][col] = 1; }); return pixels; }

export function MlpTrainingBlock({ onComplete, lessonStepComplete = false }: { onComplete: () => void; lessonStepComplete?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { state, stateRef, hydrated, setDraft, commit } = usePersistedActivity<MlpState>({ stateKey: 'manual-feature:mlp', createInitial, normalizeState: normalize, getElement: () => rootRef.current });
  const [rows, setRows] = useState<DatasetRow[]>([]), [training, setTraining] = useState(false), [epoch, setEpoch] = useState(0), [sampleIndex, setSampleIndex] = useState(0), [drawMode, setDrawMode] = useState(false), drawingRef = useRef(false);
  useEffect(() => { let active = true; void loadDataset().then((value) => { if (active) setRows(value); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!state?.trained || drawMode || !rows.length) return; const timer = window.setInterval(() => setSampleIndex((current) => (current + 1) % rows.length), 2000); return () => window.clearInterval(timer); }, [state?.trained, drawMode, rows.length]);
  const drawnPixels = useMemo(() => drawPixels(state?.drawn ?? []), [state?.drawn]);
  const currentRow = useMemo<DatasetRow | null>(() => { if (!rows.length) return null; if (drawMode) return { sample: { label: -1, file: '你的手写输入', path: '', url: '' }, pixels: drawnPixels, features: computeNineGrid(drawnPixels) }; return rows[sampleIndex % rows.length]; }, [rows, drawMode, drawnPixels, sampleIndex]);
  if (!hydrated || !state) return <LessonStage title="把九宫格特征交给一个双层 MLP"><ContentBlock>正在恢复活动状态…</ContentBlock></LessonStage>;

  async function train() {
    if (training || !rows.length) return; setTraining(true); setDrawMode(false); setEpoch(0);
    const model = createMlpModel(rows);
    for (let current = 0; current < 900; current += 1) {
      for (let index = 0; index < rows.length; index += 1) trainMlpStep(model, rows[(index + current) % rows.length]);
      if (current % 50 === 0 || current === 899) { setEpoch(current + 1); await new Promise<void>((resolve) => requestAnimationFrame(() => resolve())); }
    }
    model.trained = true; model.accuracy = evaluateMlp(model, rows);
    commit('manual_feature_mlp_trained', (current) => ({ ...current, trained: true, model, accuracy: model.accuracy, drawn: [], drawHasInk: false }), { epochs: 900, accuracy: model.accuracy });
    setTraining(false);
  }
  function paint(row: number, col: number) {
    if (!drawMode || !stateRef.current) return; drawingRef.current = true;
    const additions = [[row,col],[row-1,col],[row+1,col],[row,col-1],[row,col+1]].filter(([r,c]) => r >= 0 && r < 28 && c >= 0 && c < 28).map(([r,c]) => r * 28 + c);
    setDraft((current) => ({ ...current, drawn: Array.from(new Set([...current.drawn, ...additions])), drawHasInk: true }));
  }
  function finishStroke() { if (!drawingRef.current) return; drawingRef.current = false; const next = commit('manual_feature_digit_drawn', (current) => ({ ...current }), { pixel_count: stateRef.current?.drawn.length ?? 0 }); if (next?.drawHasInk && !lessonStepComplete) onComplete(); }
  function clear() { commit('manual_feature_drawing_cleared', (current) => ({ ...current, drawn: [], drawHasInk: false })); }
  const output = currentRow && state.model ? mlpForward(state.model, modelFeatureVector(currentRow, state.model)) : null;
  const prediction = output ? argmax(output.probs) : -1;

  return <LessonStage ref={rootRef} className="hdf-stage hdf-mlp-stage" title="把九宫格特征交给一个双层 MLP" description="这里只看训练集效果；遇到没见过的写法，泛化会变差。">
    <ContentBlock className="hdf-mlp-panel" title="输入特征 → 双层 MLP → Softmax 概率" subtitle="训练完成后立即用自己的手写数字测试模型，同时观察不同训练集样本的预测结果。">
      <div className="edu-toolbar hdf-mlp-toolbar"><div className="edu-metrics"><div className="edu-metric"><span>训练状态</span><strong>{training ? '训练中' : state.trained ? '训练完成' : '等待训练'}</strong></div><div className="edu-metric"><span>训练轮数</span><strong>{state.trained ? 900 : epoch} / 900</strong></div><div className="edu-metric is-success"><span>训练集准确率</span><strong>{state.trained ? `${(state.accuracy * 100).toFixed(1)}%` : '-'}</strong></div></div><div className="edu-toolbar-actions">{state.trained && <Button variant="primary" onClick={() => setDrawMode((value) => !value)}>{drawMode ? '查看训练样本' : '手写测试'}</Button>}{!state.trained && <Button variant="primary" disabled={training || !rows.length} onClick={() => void train()}>{training ? '训练中' : '训练 MLP'}</Button>}</div></div>
      {currentRow && <div className="hdf-mlp-flow"><section className="hdf-mlp-input-panel"><span className="hdf-mini-title">输入与自动计数 <strong>{drawMode ? '你的手写输入' : `数字 ${currentRow.sample.label} · ${currentRow.sample.file}`}</strong></span><DigitGridCanvas compact pixels={currentRow.pixels} features={currentRow.features} revealedRegions={Array.from({ length: 9 }, (_, i) => i)} onPointerCell={drawMode ? paint : undefined} onPointerEnd={drawMode ? finishStroke : undefined} />{drawMode && <Button className="hdf-clear-drawing" onClick={clear}>清空画板</Button>}</section><section className="hdf-mlp-network-panel"><span className="hdf-mini-title">双层 MLP</span><MlpNetworkCanvas row={currentRow} model={state.model} /></section><section className="hdf-mlp-logit-panel"><span className="hdf-mini-title">Softmax 后的概率</span><div className="hdf-mlp-prediction"><span>预测结果</span><strong>{output ? `${prediction}（${(output.probs[prediction] * 100).toFixed(1)}%）` : '先训练模型'}</strong></div><div className="hdf-prob-bars">{Array.from({ length: 10 }, (_, digit) => <div className={`hdf-prob-row ${prediction === digit ? 'is-top' : ''}`} key={digit}><span>{digit}</span><div><i style={{ width: `${(output?.probs[digit] ?? .1) * 100}%` }} /></div><strong>{((output?.probs[digit] ?? .1) * 100).toFixed(1)}%</strong></div>)}</div></section></div>}
      {state.drawHasInk && <Callout tone="green" label="手写测试完成" text="模型只看九宫格计数；当写法与训练样本差异很大时，同一组人工特征可能无法保留足够的形状信息。" />}
    </ContentBlock>
  </LessonStage>;
}
