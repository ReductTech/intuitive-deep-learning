import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, ContentBlock, EChartsChart, NoticeStrip, RangeControl, Typography } from '../../../shared/react';
import { UpdateStateIcon } from '../../components/ParameterRange/ParameterRange';
import { WeightCheckpoint } from '../../components/TransferVisuals/TransferVisuals';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { demoData } from '../../services/recyclingData';
import { recyclingDataset } from '../../services/recyclingDataset';
import { withAssetResources } from '../../../shared/react/withAssetResources';
import { evaluateRecyclingHead, loadRecyclingBackbone, replaceRecyclingHead, trainRecyclingHead,
  type BackboneSession, type NewHeadSession, type HeadEpoch, type HeadTestResult, type HeadTrainingResult } from '../../services/recyclingTraining';
import './RealHeadTrainingPage.css';

type Phase = 'empty' | 'loading' | 'loaded' | 'replacing' | 'head-ready' | 'training' | 'trained' | 'testing' | 'done';
type Stage = 0 | 1 | 2 | 3;
const HEAD_SEED = 0;
const STAGE_LABELS = ['装入权重', '更换分类头', '训练与验证', '独立测试'];
function predictedClass(probabilities: number[]) { return probabilities.indexOf(Math.max(...probabilities)); }
function ResNet18Structure() {
  return <div className="rtg-real-head__structure" role="group" aria-label="ResNet-18骨干：Stem卷积和池化，随后四个Stage各含两个BasicBlock，共八个残差块、十六次块内卷积；Stage 2至4首块的快捷路径包含投影；最后全局平均池化，输出512维特征。骨干参数冻结。">
    {['Stem', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'].map((name, index) => <div className="rtg-real-head__structure-group" key={name} data-resnet-stage={index}>
      <Typography variant="bodySmall" tone="accent" align="center">{name}</Typography>
      <svg className="rtg-real-head__structure-icon" viewBox="0 0 166 94" aria-hidden="true">
        {index === 0 ? <>
          <rect className="rtg-real-head__convolution" x="8" y="24" width="56" height="48" rx="4" />
          {[1, 2, 3].map(line => <g key={line}><path d={'M8 ' + (24 + line * 12) + 'H64M' + (8 + line * 14) + ' 24V72'} /></g>)}
          <path d="M68 48H96M90 42L96 48L90 54" />
          <rect className="rtg-real-head__convolution" x="106" y="32" width="40" height="32" rx="4" />
          <path d="M119 32V64M132 32V64M106 43H146M106 54H146" />
        </> : <>
          <path d="M78 48H89" />
          {[0, 1].map(block => <g key={block} transform={'translate(' + block * 84 + ',0)'} data-residual-block={block + 1}>
            <rect className="rtg-real-head__convolution" x="15" y="28" width="17" height="40" rx="3" />
            <rect className="rtg-real-head__convolution" x="41" y="28" width="17" height="40" rx="3" />
            <path d="M5 48H15M32 48H41M58 48H61M73 48H78" />
            <path className="rtg-real-head__shortcut" d="M5 48V12Q5 6 11 6H61Q67 6 67 12V42M63 36L67 42L71 36" />
            {index > 1 && block === 0 && <rect className="rtg-real-head__projection" x="29" y="1" width="14" height="10" rx="2" />}
            <circle className="rtg-real-head__addition" cx="67" cy="48" r="6" /><path d="M64 48H70M67 45V51" />
          </g>)}
        </>}
      </svg>
      <Typography variant="bodySmall" tone="accent" align="center">{index === 0 ? '卷积与池化' : '2个残差块'}</Typography>
      <div className="rtg-real-head__structure-state"><UpdateStateIcon trainable={false} /><Typography variant="bodySmall" tone="muted">{index === 0 ? '冻结' : [64, 128, 256, 512][index - 1] + '通道'}</Typography></div>
    </div>)}
  </div>;
}
export interface RealHeadTrainingPageProps { onComplete?: () => void; }
function RealHeadTrainingContent({ onComplete }: RealHeadTrainingPageProps) {
  const { DEMO_SAMPLES, DEMO_CLASSES, DEMO_COUNTS } = useMemo(demoData, []);
  const [phase, renderPhase] = useState<Phase>('empty'), [stage, setStage] = useState<Stage>(0);
  const [backbone, setBackbone] = useState<BackboneSession | null>(null), [head, setHead] = useState<NewHeadSession | null>(null);
  const [history, setHistory] = useState<HeadEpoch[]>([]), [result, setResult] = useState<HeadTrainingResult | null>(null);
  const [tested, setTested] = useState<HeadTestResult | null>(null), [epoch, setEpoch] = useState(0);
  const [selected, setSelected] = useState(0), [error, setError] = useState(''), [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null), generation = useRef(0), busy = useRef(false);
  const currentPhase = useRef<Phase>('empty'), currentStage = useRef<Stage>(0), allowedStages = useRef([true, false, false, false]);
  const transitionVersion = useRef(0), transition = useRef<{ skipTransition: () => void } | null>(null);
  currentPhase.current = phase; currentStage.current = stage;
  const renderGeneration = generation.current;
  allowedStages.current = [true, !!backbone, !!head, !!result];
  function setPhase(value: Phase) { currentPhase.current = value; renderPhase(value); }
  useEffect(() => () => { generation.current++; transitionVersion.current++; transition.current?.skipTransition(); request.current?.abort(); }, []);
  useCompleteOnce(phase === 'done', onComplete);
  const running = ['loading', 'replacing', 'training', 'testing'].includes(phase);
  const validation = DEMO_SAMPLES.filter(p => p.split === 'validation');
  const observedSplit = stage === 2 ? result ? 'validation' : 'train' : stage === 3 && tested ? 'test' : null;
  const choices = observedSplit === 'test' ? tested!.samples : observedSplit ? DEMO_SAMPLES.filter(p => p.split === observedSplit) : [];
  const page = Math.floor(selected / 6), pages = Math.max(1, Math.ceil(choices.length / 6));
  const sample = DEMO_SAMPLES.find(p => p.id === choices[selected]?.id) ?? DEMO_SAMPLES[0];
  const frame = history.find(p => p.epoch === epoch) ?? history.at(-1);
  const best = result?.history.find(row => row.epoch === result.best_epoch);
  const scores = observedSplit === 'test' ? tested!.samples[selected]?.probabilities : observedSplit === 'validation' ? frame?.probabilities[selected] : undefined;
  const prediction = scores ? predictedClass(scores) : null;
  const initialCorrect = head ? head.initial_probabilities.reduce((sum, probabilities, index) => sum + Number(predictedClass(probabilities) === validation[index].label), 0) : null;
  const comparedCorrect = best?.val_correct ?? history.at(-1)?.val_correct;
  const completed = [!!backbone, !!head, !!result, !!tested];
  const option = useMemo(() => ({
    animation: false, grid: { left: 54, right: 22, top: 46, bottom: 46 },
    legend: { top: 0, left: 'center', itemWidth: 24, textStyle: { fontSize: 19 }, data: ['训练损失', '验证损失'] },
    tooltip: { trigger: 'axis' }, textStyle: { fontSize: 19 },
    xAxis: { type: 'value', name: '训练轮次', nameLocation: 'middle', nameGap: 28, min: 0, max: result?.epochs ?? 20, minInterval: 1, axisLabel: { fontSize: 18 } },
    yAxis: { type: 'value', min: 0, axisLabel: { fontSize: 18 } },
    series: [
      { name: '训练损失', type: 'line', showSymbol: false, lineStyle: { width: 3, color: '#274777' }, data: history.map(p => [p.epoch, p.train_loss]) },
      { name: '验证损失', type: 'line', showSymbol: false, lineStyle: { width: 3, type: 'dashed', color: '#ca7900' }, data: history.map(p => [p.epoch, p.val_loss]),
        ...(result && best ? {
          markLine: { silent: true, symbol: ['none', 'none'], lineStyle: { color: '#218c62', width: 2, type: 'dashed' },
            label: { formatter: '保存第' + result.best_epoch + '轮', position: 'insideEndTop', rotate: 0, align: 'right', fontSize: 18, color: '#218c62', backgroundColor: 'rgba(255,255,255,.9)', padding: [2, 4] }, data: [{ xAxis: result.best_epoch }] },
          markPoint: { silent: true, symbol: 'circle', symbolSize: 14, itemStyle: { color: '#218c62' }, label: { show: false }, data: [{ coord: [result.best_epoch, best.val_loss] }] },
        } : {}),
      },
    ],
  }), [history, result, best]);
  function reset() {
    generation.current++; transitionVersion.current++; transition.current?.skipTransition(); request.current?.abort(); busy.current = false;
    currentStage.current = 0; allowedStages.current = [true, false, false, false]; setStage(0);
    setPhase('empty'); setBackbone(null); setHead(null); setHistory([]); setResult(null); setTested(null);
    setEpoch(0); setSelected(0); setError(''); setMessage('');
  }
  function go(target: Stage) {
    if (busy.current || generation.current !== renderGeneration || currentStage.current !== stage || !allowedStages.current[target] || target === stage) return;
    transition.current?.skipTransition();
    const token = ++transitionVersion.current;
    currentStage.current = target;
    const commit = () => { if (token === transitionVersion.current) { setStage(target); setSelected(0); setError(''); } };
    const documentWithTransition = typeof document === 'undefined' ? null : document as Document & {
      startViewTransition?: (update: () => void) => { skipTransition: () => void; ready: Promise<unknown>; finished: Promise<unknown> };
    };
    if (documentWithTransition?.startViewTransition && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        const active = documentWithTransition.startViewTransition(() => flushSync(commit));
        transition.current = active; void active.ready.catch(() => {}); void active.finished.catch(() => {});
      } catch { commit(); }
    } else commit();
  }
  function choose(index: number) {
    if (generation.current === renderGeneration && currentPhase.current === phase && currentStage.current === stage && index >= 0 && index < choices.length) setSelected(index);
  }
  async function perform(next: Phase, fallback: Phase, expectedStage: Stage, work: (signal: AbortSignal, current: () => boolean) => Promise<void>) {
    if (busy.current || generation.current !== renderGeneration || currentPhase.current !== fallback || currentStage.current !== expectedStage) return;
    busy.current = true; const token = ++generation.current;
    const controller = new AbortController(); request.current = controller;
    const current = () => token === generation.current && !controller.signal.aborted;
    setPhase(next); setError('');
    try { await work(controller.signal, current); }
    catch (failure) { if (current()) { setError(failure instanceof Error ? failure.message : '操作未完成，请重试。'); setPhase(fallback); } }
    finally { if (token === generation.current) busy.current = false; }
  }
  async function load() {
    if (phase !== 'empty' || currentPhase.current !== 'empty' || generation.current !== renderGeneration || currentStage.current !== 0) return;
    setMessage('正在读取并核对 ImageNet 预训练权重…');
    await perform('loading', 'empty', 0, async (signal, current) => {
      const loaded = await loadRecyclingBackbone(signal, progress => { if (current() && progress.message) setMessage(progress.message); });
      if (current()) { setBackbone(loaded); setPhase('loaded'); }
    });
  }
  async function replace() {
    if (phase !== 'loaded' || !backbone || currentPhase.current !== 'loaded' || generation.current !== renderGeneration || currentStage.current !== 1) return;
    await perform('replacing', 'loaded', 1, async (signal, current) => {
      const created = await replaceRecyclingHead(backbone.session_id, HEAD_SEED, signal);
      if (current()) { setHead(created); setPhase('head-ready'); }
    });
  }
  async function train() {
    if (phase !== 'head-ready' || !head || currentPhase.current !== 'head-ready' || generation.current !== renderGeneration || currentStage.current !== 2) return;
    setHistory([]); setEpoch(0); setMessage('用' + DEMO_COUNTS.train + '张训练图更新新头，' + DEMO_COUNTS.validation + '张验证图只评估。');
    await perform('training', 'head-ready', 2, async (signal, current) => {
      const computed = await trainRecyclingHead(head.session_id, signal, progress => {
        if (!current()) return;
        if (progress.history?.length) { setHistory(progress.history); setEpoch(progress.history.at(-1)!.epoch); }
        if (progress.message) setMessage(progress.message);
      });
      if (current()) { setResult(computed); setHistory(computed.history); setEpoch(computed.best_epoch); setSelected(0); setPhase('trained'); }
    });
  }
  async function evaluate() {
    if (phase !== 'trained' || !result || currentPhase.current !== 'trained' || generation.current !== renderGeneration || currentStage.current !== 3) return;
    await perform('testing', 'trained', 3, async (signal, current) => {
      const computed = await evaluateRecyclingHead(result.run_id, signal);
      if (current()) { setTested(computed); setSelected(0); setPhase('done'); }
    });
  }
  function network(newHead: boolean) {
    return <div className="rtg-real-head__network">
      <div className={'rtg-real-head__backbone' + (backbone ? ' is-loaded' : '')}>
        <Typography variant="h2" tone="accent" align="center">ResNet-18 预训练骨干</Typography>
        <ResNet18Structure />
        <div className="rtg-real-head__pooling"><Typography variant="bodySmall" tone="accent">全局平均池化</Typography><Typography as="span" variant="body" tone="muted">→</Typography><Typography variant="bodySmall" tone="accent">512维特征</Typography></div>
      </div>
      <div className={'rtg-real-head__classifier' + (newHead ? ' is-new' : ' is-old')} data-classifier={newHead ? 'new' : 'old'}>
        <Typography variant="body" tone={newHead ? 'warning' : 'muted'}>{newHead ? '新分类头' : '旧分类头'}</Typography>
        <svg viewBox="0 0 100 65" aria-hidden="true"><path d="M18 20L38 5H76L56 20Z"/><path d="M56 20L76 5V48L56 62Z"/><rect x="18" y="20" width="38" height="42"/></svg>
        <Typography variant="bodySmall" tone={newHead ? 'warning' : 'muted'}>{newHead ? '3类 · 可训练' : '1000个旧类别'}</Typography>{newHead && <UpdateStateIcon trainable />}
      </div>
    </div>;
  }
  function comparison() {
    return <div className="rtg-real-head__comparison" data-data-role="validation">
      <Typography variant="bodySmall" tone="accent">同一验证集{DEMO_COUNTS.validation}张</Typography>
      <div><Typography as="span" variant="bodySmall" tone="muted">训练前</Typography><Typography as="span" variant="h3" tone="accent" data-validation-before={initialCorrect}>{initialCorrect ?? '—'}/{DEMO_COUNTS.validation}</Typography><Typography as="span" variant="body" tone="muted">→</Typography><Typography as="span" variant="bodySmall" tone="muted">{result ? '训练后' : '当前'}</Typography><Typography as="span" variant="h3" tone={result ? 'success' : 'accent'} data-validation-after={comparedCorrect ?? null}>{comparedCorrect ?? '—'}/{DEMO_COUNTS.validation}</Typography></div>
    </div>;
  }
  function gallery() {
    return <aside className="rtg-real-head__samples" data-gallery-split={observedSplit}>
      <Typography variant="body" tone="accent">{observedSplit === 'train' ? '训练样本 · 更新新头' : observedSplit === 'test' ? '独立测试图片' : '验证样本 · 不更新参数'}</Typography>
      <div className="rtg-real-head__sample-grid">{choices.slice(page * 6, page * 6 + 6).map((p, offset) => {
        const index = page * 6 + offset, item = DEMO_SAMPLES.find(s => s.id === p.id)!, evaluated = observedSplit === 'test' ? tested?.samples[index] : undefined;
        const correct = evaluated ? evaluated.prediction === evaluated.label : null;
        return <Button key={p.id} data-sample={index} data-sample-id={p.id} aria-label={'查看' + item.class_name + ' ' + item.id + (evaluated ? correct ? '，预测正确' : '，预测错误：' + DEMO_CLASSES[evaluated.prediction] : '')} aria-pressed={selected === index} active={selected === index} onClick={() => choose(index)}>
          <img src={item.image} alt={item.class_name} />{evaluated && <Typography as="span" className="rtg-real-head__sample-mark" variant="bodySmall" tone={correct ? 'success' : 'danger'} data-prediction-correct={correct}>{correct ? '✓' : '×'}</Typography>}
        </Button>;
      })}</div>
      <div className="rtg-real-head__pagination"><Button data-photo-prev disabled={page === 0} onClick={() => choose((page - 1) * 6)}>←</Button><Typography variant="bodySmall" tone="muted">{page + 1} / {pages}</Typography><Button data-photo-next disabled={page + 1 === pages} onClick={() => choose((page + 1) * 6)}>→</Button></div>
      {observedSplit === 'train' ? <Typography variant="bodySmall" tone="muted" data-training-sample>180张训练图，仅更新新头</Typography> : observedSplit === 'validation' ? probabilities() : <Typography variant="bodySmall" tone="muted">点击图片，检查正确与错分</Typography>}
    </aside>;
  }
  function probabilities() {
    return <div className="rtg-real-head__scores">
      <Typography variant="bodySmall" tone="accent">{observedSplit === 'test' ? '单图预测概率' : '单图预测概率 · 第 ' + (frame?.epoch ?? 0) + ' 轮'} · {sample.class_name}</Typography>
      {DEMO_CLASSES.map((name, index) => <div key={name} className="rtg-real-head__score" data-predicted={prediction === index}>
        <Typography variant="bodySmall" tone={sample.label === index ? 'accent' : 'muted'}>{name + (prediction === index ? ' ←' : '')}</Typography>
        <span className="rtg-real-head__track"><i style={{ width: scores ? scores[index] * 100 + '%' : '0%' }} /></span>
        <Typography variant="bodySmall" tone="accent">{scores ? (scores[index] * 100).toFixed(1) + '%' : '—'}</Typography>
      </div>)}
    </div>;
  }
  const stageFeedback = [
    backbone ? '✓ 已装入 ImageNet 预训练权重；看清结果后，进入下一步。' : phase === 'loading' ? message : '先把已有视觉经验装入 ResNet-18。',
    head ? '随机新头已准备 · 谁在学：新头的1,539个参数。' : phase === 'replacing' ? '旧分类头移除，正在创建三分类新头…' : '骨干保留，只替换负责输出类别分数的最后一段。',
    result ? '共训练' + result.epochs + '轮，保存第' + result.best_epoch + '轮：验证损失最低。' : phase === 'training' ? message : '训练180张更新参数，验证60张只评估并选择轮次。',
    tested ? '采用第' + result!.best_epoch + '轮模型完成独立测试；测试图未用于更新参数或选择轮次。' : phase === 'testing' ? '正在用已保存的模型独立评估测试图…' : '模型已经选定，现在才开放独立测试。',
  ][stage];
  const next = completed[stage] && stage < 3 ? (stage + 1) as Stage : null;
  const operation = stage === 0 && phase === 'empty' ? load : stage === 1 && phase === 'loaded' ? replace : stage === 2 && phase === 'head-ready' ? train : stage === 3 && phase === 'trained' ? evaluate : undefined;
  const action = next !== null ? () => go(next) : operation;
  const actionText = running ? phase === 'loading' ? '正在装入权重…' : phase === 'replacing' ? '正在更换分类头…' : phase === 'training' ? '正在真实训练…' : '正在独立测试…' : next !== null ? '下一步：' + STAGE_LABELS[next] : ['① 装入预训练权重', '② 换成三分类头', '③ 冻结骨干，训练新头', tested ? '✓ 本次训练完成' : '④ 锁定并独立测试'][stage];
  return <ContentBlock headingLevel={1} className={'rtg-real-head is-' + phase} title="回到 300 张照片，你会怎样训练？" subtitle="分四步完成真实迁移训练；每步先观察结果，再继续。"
    data-phase={phase} data-scene={stage + 1} data-complete={phase === 'done'} data-observed-split={observedSplit} onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div className="rtg-real-head__toolbar"><ol className="rtg-real-head__steps" aria-label="真实迁移训练的四步">{STAGE_LABELS.map((label, index) => <li key={label} data-step={index} data-step-complete={completed[index]} className={stage === index ? 'is-current' : completed[index] ? 'is-done' : ''}>
      <Button data-scene-tab={index + 1} active={stage === index} disabled={running || !allowedStages.current[index]} aria-current={stage === index ? 'step' : undefined} onClick={() => go(index as Stage)}>{completed[index] ? '✓' : ['①', '②', '③', '④'][index]} {label}</Button>
    </li>)}</ol><Button data-reset onClick={reset}>重新开始</Button></div>
    <div className="rtg-real-head__viewport">
      <section key={stage} className={'rtg-real-head__scene rtg-real-head__scene--' + (stage + 1)} data-scene-panel={stage + 1} aria-label={'第' + (stage + 1) + '步：' + STAGE_LABELS[stage]}>
        {stage === 0 && <><Typography variant="h3" tone="accent">① 装入已有的视觉经验</Typography>
          <div className="rtg-real-head__load-layout"><div className="rtg-real-head__weight-file"><WeightCheckpoint /><Typography variant="body" tone="accent">ImageNet预训练权重</Typography></div><Typography as="span" variant="h2" tone="muted">→</Typography>{network(false)}</div>
          <Typography variant="body" align="center" tone={backbone ? 'success' : 'muted'} data-weight-status>{backbone ? '✓ 预训练权重已装入，骨干结构保持不变' : 'ResNet-18结构已准备 · 权重待装入'}</Typography>
        </>}
        {stage === 1 && <><Typography variant="h3" tone="accent">② 保留骨干，只换最后一段</Typography>{network(!!head)}
          <div className="rtg-real-head__head-caption"><Typography variant="body" tone={head ? 'warning' : 'accent'}>{head ? '新头输出：塑料瓶 · 易拉罐 · 纸盒' : '旧头输出1000个旧类别；本任务只需要3类'}</Typography>
            {head && <Typography variant="bodySmall" tone="accent">随机新头 · 训练前验证答对 <Typography as="span" variant="body" tone="accent" data-validation-before={initialCorrect}>{initialCorrect}/{DEMO_COUNTS.validation}</Typography></Typography>}
          </div>
        </>}
        {stage === 2 && <><Typography variant="h3" tone="accent">③ 只训练新头，验证用于选轮次</Typography>
          <div className="rtg-real-head__training-layout">{gallery()}<section className="rtg-real-head__results">
            {comparison()}
            {history.length ? <EChartsChart className="rtg-real-head__chart" option={option} minHeight={220} aria-label="真实训练和验证损失曲线；保存位置按最低验证损失标记" /> : <div className="rtg-real-head__chart rtg-real-head__waiting"><Typography variant="body" tone="muted">点击“训练新头”，观察真实损失曲线</Typography><Typography variant="bodySmall" tone="muted">训练180张更新参数 · 验证60张不更新参数</Typography></div>}
            {history.length > 0 && <RangeControl label="回看记录，不改变保存模型" min={0} max={history.at(-1)!.epoch} step={1} value={epoch} disabled={running} onChange={event => { if (currentPhase.current === phase && currentStage.current === 2 && !running) setEpoch(Number(event.currentTarget.value)); }} />}
            <Typography variant="bodySmall" tone={best ? 'success' : 'accent'} data-saved-epoch={result?.best_epoch ?? null} data-audit>{result ? '✓ 骨干未变 · 新头参数已更新 · 保存第' + result.best_epoch + '轮（验证损失最低）' : '骨干冻结 · 仅1,539个新头参数允许更新'}</Typography>
          </section></div>
        </>}
        {stage === 3 && <><Typography variant="h3" tone="accent">④ 模型已锁定，再看未参与选择的图片</Typography>
          <div className="rtg-real-head__test-layout">{tested ? gallery() : <div className="rtg-real-head__holdout" data-test-locked><UpdateStateIcon trainable={false} /><Typography variant="h2" tone="accent">独立测试60张</Typography><Typography variant="body" tone="muted">未参与训练 · 未用于挑选轮次</Typography><Typography variant="bodySmall" tone="muted">点击独立测试后，展示逐图结果</Typography></div>}
            <div className="rtg-real-head__test-results"><div className="rtg-real-head__result-pair">
              <div><Typography variant="bodySmall" tone="accent">验证答对</Typography><Typography as="div" variant="display" tone="accent" data-final-validation={best?.val_correct}>{best?.val_correct}/{DEMO_COUNTS.validation}</Typography></div>
              <div data-data-role="test"><Typography variant="bodySmall" tone="accent">测试答对</Typography><Typography as="div" variant="display" tone={tested ? 'success' : 'muted'} data-test-correct={tested?.correct ?? null}>{tested ? tested.correct + '/' + tested.count : '待评估'}</Typography></div>
            </div>
            {comparison()}
            {tested && <div className="rtg-real-head__prediction"><figure><img src={sample.image} alt={sample.class_name + '当前测试图片'} /><Typography as="figcaption" variant="bodySmall" tone="accent">实际：{sample.class_name}</Typography></figure>{probabilities()}</div>}
            <Typography variant="bodySmall" tone="accent" data-saved-epoch={result?.best_epoch ?? null}>第{result?.best_epoch}轮模型 · 测试不更新参数</Typography>
            </div>
          </div>
        </>}
      </section>
    </div>
    <div className="rtg-real-head__footer"><NoticeStrip role="status" tone={error ? 'orange' : completed[stage] ? 'green' : 'blue'}>{error || stageFeedback}</NoticeStrip><Button data-action={phase} data-next-scene={next !== null ? next + 1 : undefined} data-load={stage === 0 && phase === 'empty' || undefined} data-replace={stage === 1 && phase === 'loaded' || undefined} data-train={stage === 2 && phase === 'head-ready' || undefined} data-test={stage === 3 && phase === 'trained' || undefined} variant="primary" disabled={!action || running} onClick={action}>{actionText}</Button></div>
  </ContentBlock>;
}

export const RealHeadTrainingPage = withAssetResources(RealHeadTrainingContent, [recyclingDataset]);
