import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Button, ContentBlock, Question } from '../../shared/react';

interface DatasetSplitProcessBlockProps { onComplete: () => void; }
type Phase = 'idle' | 'training' | 'toValidation' | 'validation' | 'toTraining' | 'done' | 'dusting' | 'tested';

const colors = ['#bd6658', '#c5813e', '#a59648', '#62a06e', '#3e9694', '#4d82b2', '#686db5', '#8a65a8', '#ad658b'];
const toTenth = (value: number) => Math.round(value * 10) / 10;

export function DatasetSplitProcessBlock({ onComplete }: DatasetSplitProcessBlockProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [modelColor, setModelColor] = useState(colors[4]);
  const [split, setSplit] = useState({ train: .7, validation: .2 });
  const [epoch, setEpoch] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const runningRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const splitBarRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<'train' | 'validation' | null>(null);

  const clearTimers = () => {
    if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const runCycle = () => {
    if (!runningRef.current) return;
    setEpoch((current) => current + 1);
    setPhase('training');
    let previous = -1;
    intervalRef.current = window.setInterval(() => {
      let next = Math.floor(Math.random() * colors.length);
      if (next === previous) next = (next + 1) % colors.length;
      previous = next;
      setModelColor(colors[next]);
    }, 620);
    timers.current.push(window.setTimeout(() => {
      if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      setPhase('toValidation');
    }, 4900));
    timers.current.push(window.setTimeout(() => setPhase('validation'), 5800));
    timers.current.push(window.setTimeout(() => {
      if (stopRequestedRef.current) {
        runningRef.current = false;
        stopRequestedRef.current = false;
        setStopRequested(false);
        setPhase('done');
        return;
      }
      setPhase('toTraining');
    }, 7800));
    timers.current.push(window.setTimeout(() => {
      if (runningRef.current && !stopRequestedRef.current) runCycle();
    }, 8700));
  };

  const start = () => {
    if (phase !== 'idle') return;
    clearTimers();
    runningRef.current = true;
    stopRequestedRef.current = false;
    setStopRequested(false);
    setEpoch(0);
    runCycle();
  };

  const finishTraining = () => {
    if (!runningRef.current) return;
    clearTimers();
    runningRef.current = false;
    stopRequestedRef.current = false;
    setStopRequested(false);
    setPhase('done');
  };

  const test = () => {
    if (phase !== 'done') return;
    setPhase('dusting');
    timers.current.push(window.setTimeout(() => {
      setPhase('tested');
    }, 1050));
  };

  const updateSplit = (clientX: number, handle: 'train' | 'validation') => {
    const bounds = splitBarRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rawPosition = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const position = Math.round(rawPosition * 10) / 10;
    setSplit((current) => {
      const validationEnd = current.train + current.validation;
      if (handle === 'train') {
        const train = Math.max(0, Math.min(validationEnd, position));
        return { train: toTenth(train), validation: toTenth(validationEnd - train) };
      }
      const nextEnd = Math.max(current.train, Math.min(1, position));
      return { ...current, validation: toTenth(nextEnd - current.train) };
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, handle: 'train' | 'validation') => {
    draggingRef.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSplit(event.clientX, handle);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (draggingRef.current) updateSplit(event.clientX, draggingRef.current);
  };

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, handle: 'train' | 'validation') => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? .1 : -.1;
    setSplit((current) => {
      if (handle === 'train') {
        const end = current.train + current.validation;
        const train = Math.max(0, Math.min(end, current.train + direction));
        return { train: toTenth(train), validation: toTenth(end - train) };
      }
      const validation = Math.max(0, Math.min(1 - current.train, current.validation + direction));
      return { ...current, validation: toTenth(validation) };
    });
  };

  const atValidation = phase === 'toValidation' || phase === 'validation';
  const returning = phase === 'toTraining';
  const style = { '--ds-live-color': modelColor } as CSSProperties;
  const testRatio = toTenth(1 - split.train - split.validation);
  const splitStyle = { '--ds-train': `${split.train * 100}%`, '--ds-validation': `${split.validation * 100}%`, '--ds-test': `${testRatio * 100}%` } as CSSProperties;
  const splitHint = split.train === 0
    ? '训练集为 0%，模型没有数据可以学习。'
    : split.validation === 0
      ? '验证集为 0%，无法比较方案或选择超参数。'
      : testRatio === 0
        ? '测试集为 0%，无法进行独立的最终评价。'
        : split.train < .6
    ? '训练集比例偏低，模型可能没有足够的数据学习。'
    : split.validation < .1
      ? '验证集比例偏低，超参数选择可能不稳定。'
      : testRatio < .1
        ? '测试集比例偏低，最终评价可能不够可靠。'
        : split.train > .85
          ? '训练集很充足，但要确认验证集和测试集仍有足够样本。'
          : '当前比例较均衡，可以同时支持学习、选择和最终评价。';

  return (
    <ContentBlock className="ds-block ds-process-block" title="三份数据，三种职责" subtitle="要选择合适的超参数，必须把学习、选择与最终评价分开。">
      <section className="ds-dataset-intro" aria-label="训练集验证集测试集定义">
        <div className="ds-dataset-definitions">
          <article><span>学习</span><strong>训练集</strong><p>更新模型参数。</p></article>
          <article><span>选择</span><strong>验证集</strong><p>比较超参数方案。</p></article>
          <article><span>验收</span><strong>测试集</strong><p>评价最终模型。</p></article>
        </div>
        <div className="ds-split-tool">
          <header><div><strong>先划分，再训练</strong><span>比例没有固定答案，取决于数据量。</span></div><div className="ds-split-presets" role="group" aria-label="常见划分比例">{[[.8, .1, '8:1:1'], [.7, .2, '7:2:1'], [.6, .2, '6:2:2']].map(([train, validation, label]) => <button type="button" key={String(label)} onClick={() => setSplit({ train: Number(train), validation: Number(validation) })}>{label}</button>)}</div></header>
          <div className="ds-split-bar" ref={splitBarRef} style={splitStyle}>
            <div className="ds-split-part ds-split-part--train"><strong>训练集</strong><span>{Math.round(split.train * 100)}%</span></div>
            <div className="ds-split-part ds-split-part--validation"><strong>验证集</strong><span>{Math.round(split.validation * 100)}%</span></div>
            <div className="ds-split-part ds-split-part--test"><strong>测试集</strong><span>{Math.round(testRatio * 100)}%</span></div>
            <button className="ds-split-handle ds-split-handle--train" type="button" role="separator" aria-label="调整训练集与验证集的分界" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split.train * 100)} onPointerDown={(event) => handlePointerDown(event, 'train')} onPointerMove={handlePointerMove} onPointerUp={() => { draggingRef.current = null; }} onKeyDown={(event) => handleKey(event, 'train')} />
            <button className="ds-split-handle ds-split-handle--validation" type="button" role="separator" aria-label="调整验证集与测试集的分界" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((split.train + split.validation) * 100)} onPointerDown={(event) => handlePointerDown(event, 'validation')} onPointerMove={handlePointerMove} onPointerUp={() => { draggingRef.current = null; }} onKeyDown={(event) => handleKey(event, 'validation')} />
          </div>
          <p className={`ds-split-hint${split.train < .6 || split.validation < .1 || testRatio < .1 ? ' is-warning' : ''}`}>{splitHint}</p>
        </div>
      </section>
      <section className="ds-training-bridge">
        <div>
          <span>训练与验证</span>
          <strong>训练集负责学，验证集负责看</strong>
          <p>定期验证，可以判断当前超参数下的模型能否泛化到未参与训练的数据。</p>
        </div>
        {phase === 'idle' && <Button variant="primary" onClick={start}>模拟训练过程</Button>}
        {(phase === 'training' || phase === 'toValidation' || phase === 'validation' || phase === 'toTraining') && <Button variant="primary" hint={!stopRequested} disabled={stopRequested} onClick={finishTraining}>{stopRequested ? '将在本轮验证后结束' : '结束模拟训练'}</Button>}
        {(phase === 'done' || phase === 'dusting' || phase === 'tested') && <span className="ds-training-ended">模拟训练已结束</span>}
      </section>
      <section className="ds-transfer-demo" style={style} aria-label="模型从训练集移动到验证集的动画">
        <header className="ds-transfer-meta">
          <span>训练—验证循环</span>
          <strong>{epoch > 0 ? `Epoch ${epoch}` : '尚未开始'}</strong>
        </header>
        <div className="ds-transfer-board">
          <article className={`ds-transfer-zone ds-transfer-zone--train${phase === 'training' || returning ? ' is-active' : ''}`}>
            <header><strong>训练</strong>{(phase === 'training' || phase === 'toValidation') && <span>训练中</span>}</header>
            {phase === 'idle' && <div className="ds-transfer-placeholder is-waiting"><strong>等待训练</strong><span>点击开始训练</span></div>}
            {(phase === 'validation' || phase === 'toTraining') && <div className="ds-transfer-placeholder is-waiting"><strong>等待训练</strong><span>模型验证完成后返回这里</span></div>}
            {(phase === 'done' || phase === 'dusting' || phase === 'tested') && <div className="ds-transfer-placeholder is-complete"><b>✓</b><strong>训练结束</strong><span>最后一轮验证已经完成</span></div>}
            {phase === 'training' && <div className="ds-zone-model is-learning is-appearing"><span className="ds-model-sparkles" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i style={{ '--spark': index } as CSSProperties} key={index} />)}</span><span className="ds-network-icon" role="img" aria-label="神经网络模型" /><b>模型</b></div>}
            {phase === 'toValidation' && <div className="ds-zone-model is-vanishing"><span className="ds-model-sparkles" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i style={{ '--spark': index } as CSSProperties} key={index} />)}</span><span className="ds-network-icon" role="img" aria-label="正在切换到验证集的模型" /><b>模型</b></div>}
            <div className={`ds-zone-note ds-zone-note--train${phase === 'training' ? ' is-active' : ''}`}>
              <span>训练集</span><strong>参数更新</strong>
            </div>
          </article>
          <article className={`ds-transfer-zone ds-transfer-zone--validation${atValidation ? ' is-active' : ''}${returning || phase === 'done' || phase === 'dusting' || phase === 'tested' ? ' is-complete' : ''}`}>
            <header><strong>验证</strong>{(phase === 'validation' || phase === 'toTraining') && <span>评估中</span>}</header>
            {(phase === 'idle' || phase === 'training' || phase === 'toValidation') && <div className="ds-transfer-placeholder is-waiting"><strong>等待验证</strong><span>模型训练完成后进入这里</span></div>}
            {(phase === 'done' || phase === 'dusting' || phase === 'tested') && <div className="ds-transfer-placeholder is-complete"><b>✓</b><strong>验证完成</strong><span>模型参数没有改变</span></div>}
            {phase === 'validation' && <div className="ds-zone-model is-appearing is-locked"><span className="ds-model-sparkles" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i style={{ '--spark': index } as CSSProperties} key={index} />)}</span><span className="ds-network-icon" role="img" aria-label="正在验证的神经网络模型" /><b>模型</b></div>}
            {phase === 'toTraining' && <div className="ds-zone-model is-vanishing"><span className="ds-model-sparkles" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i style={{ '--spark': index } as CSSProperties} key={index} />)}</span><span className="ds-network-icon" role="img" aria-label="正在返回训练集的模型" /><b>模型</b></div>}
            <div className={`ds-zone-note ds-zone-note--validation${phase === 'validation' ? ' is-active' : ''}`}>
              <span>验证集</span><strong>参数冻结</strong>
            </div>
          </article>
          <div className={`ds-transfer-cycle${atValidation || returning ? ' is-active' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 64 64" focusable="false">
              <path d="M49 20A21 21 0 0 0 14 27" />
              <path d="m14 14-1 14 14-2" />
              <path d="M15 44a21 21 0 0 0 35-7" />
              <path d="m50 50 1-14-14 2" />
            </svg>
          </div>
        </div>

      </section>

      {(phase === 'done' || phase === 'dusting' || phase === 'tested') && (
        <section className={`ds-once-test${phase === 'dusting' ? ' is-dusting' : ''}${phase === 'tested' ? ' is-tested' : ''}`} style={style}>
          <header className="ds-once-test-head"><strong>测试</strong></header>
          <div className="ds-once-test-stage">
            <div className="ds-once-test-model"><i /><span className="ds-network-icon" /><strong>最终模型</strong></div>
            <div className="ds-once-test-content">
              {phase !== 'tested' && <div className="ds-once-test-intro">
                <strong>{phase === 'dusting' ? '正在测试模型…' : '方案确定后，才进入测试'}</strong>
                <span>{phase === 'dusting' ? '参数与超参数保持不变' : '此时不再训练，也不再调整超参数。'}</span>
                <Button variant="primary" disabled={phase === 'dusting'} onClick={test}>{phase === 'dusting' ? '模拟测试中…' : '模拟测试'}</Button>
              </div>}
              {phase === 'tested' && <div className="ds-once-test-conclusion"><strong>测试集上的性能，就是模型的最终性能</strong><span>测试集只能使用一次。</span></div>}
            </div>
          </div>
        </section>
      )}
      {phase === 'tested' && <Question
        persistenceKey="report-validation-performance-v3"
        type="choice"
        title="一篇机器学习论文只报告了验证集性能，没有报告独立测试集性能。以下说法正确的是："
        options={[
          { key: 'A', value: 'A', label: '只要验证集不更新模型参数，就不会影响对泛化能力的判断', wrongFeedback: '验证集即使不更新权重，也参与了模型与超参数选择，因此结果会受到选择偏差影响。' },
          { key: 'B', value: 'B', label: '只要验证集与训练集没有样本重叠，其性能就是无偏估计', wrongFeedback: '没有样本重叠只能避免直接泄漏，不能消除反复根据验证结果选方案造成的偏高。' },
          { key: 'C', value: 'C', label: '对多次验证结果取平均，就能得到最终泛化性能的无偏估计', wrongFeedback: '取平均可以降低随机波动，但不能消除验证集参与方案选择产生的偏差。' },
          { key: 'D', value: 'D', label: '验证集参与模型选择或超参数搜索后，报告其性能可能导致估计偏高' },
        ]}
        answer="D"
        feedback={{
          correct: '正确。验证集参与了方案选择，其结果可能偏乐观；最终性能应由独立测试集评价。',
          wrong: '验证集参与了模型或超参数选择，因此不能替代独立测试集进行最终评价。',
        }}
        onCheck={(result) => { if (result.ok) onComplete(); }}
      />}
    </ContentBlock>
  );
}
