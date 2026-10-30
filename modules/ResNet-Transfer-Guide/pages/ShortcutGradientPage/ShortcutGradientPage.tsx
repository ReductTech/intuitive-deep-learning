// @refresh reset
import { Fragment, useEffect, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography, MathFormulaBlock, MathFormulaTerm, MathFormulaStatic } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ShortcutGradientPage.css';

const experiments = ['前向 · 保留与修正', '反向 · 无捷径', '反向 · 有捷径'];
const derivative = .1;
const format = (value: number) => String(Number(value.toFixed(3)));
const nodeLabels = ['输入 x', '层 1', '层 2', '层 3', '输出 H'];
export const MERGE_DURATION = 2100;
function BottleParts({ body, cap, ghost = true }: { body: boolean; cap: boolean; ghost?: boolean }) {
  return <>{(body || ghost) && <path className={body ? 'rtg-shortcut-gradient__bottle-body' : 'rtg-shortcut-gradient__bottle-ghost'} d="M46 32V49Q46 58 33 70Q28 75 28 88V145Q28 154 37 154H83Q92 154 92 145V88Q92 75 87 70Q74 58 74 49V32" fill="none" strokeWidth="4" strokeDasharray={body ? undefined : '5 5'} />}
    {(cap || ghost) && <rect className={cap ? 'rtg-shortcut-gradient__bottle-cap' : 'rtg-shortcut-gradient__bottle-ghost'} x="43" y="17" width="34" height="15" rx="4" strokeWidth="4" strokeDasharray={cap ? undefined : '5 5'} />}
    {body && <path className="rtg-shortcut-gradient__bottle-body" d="M29 98H91M29 123H91" strokeWidth="3" />}</>;
}
function Bottle({ body, cap, ghost = true }: { body: boolean; cap: boolean; ghost?: boolean }) {
  return <svg viewBox="0 0 120 170" role="img" aria-label={`${body ? '已有' : '无'}瓶身，${cap ? '已有' : '无'}瓶盖`}><BottleParts body={body} cap={cap} ghost={ghost} /></svg>;
}
function MergeMotion() {
  return <div className="rtg-shortcut-gradient__merge-motion" role="img" aria-label="蓝色瓶身沿保留路径移动，橙色瓶盖从分支移动，在输出位置对齐汇合">
    <div className="rtg-shortcut-gradient__merge-dock" aria-hidden="true"><i /></div>
    <div className="rtg-shortcut-gradient__merge-input"><Bottle body cap={false} ghost={false} /></div>
    <div className="rtg-shortcut-gradient__merge-residual"><Bottle body={false} cap ghost={false} /></div>
  </div>;
}

export interface ShortcutGradientPageProps { onComplete?: () => void; }
export function ShortcutGradientPage({ onComplete }: ShortcutGradientPageProps) {
  const [experiment, setExperiment] = useState(0);
  const [steps, setSteps] = useState([0, 0, 0]);
  const [forwardShortcut, setForwardShortcut] = useState(false);
  const [seen, setSeen] = useState([false, false, false]);
  const [showFormula, setShowFormula] = useState(false);
  const [topic, setTopic] = useState(0);
  const [merging, setMerging] = useState(false);
  const [mergeRun, setMergeRun] = useState(0);
  const root = useRef<HTMLElement>(null);
  const forward = experiment === 0, shortcut = forward ? forwardShortcut : experiment === 2;
  const step = steps[experiment], finished = step === (forward ? 3 : 4);
  const complete = seen.every(Boolean);
  useCompleteOnce(complete, onComplete);
  useEffect(() => { if (showFormula) root.current?.querySelector<HTMLButtonElement>('[data-formula-topic]')?.focus({ preventScroll: true }); }, [showFormula]);
  useEffect(() => {
    if (!merging) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setMerging(false);
      setSteps(current => current.map((value, index) => index === 0 ? 3 : value));
      setSeen(current => current.map((value, index) => index === 0 || value));
    }, MERGE_DURATION);
    return () => { active = false; window.clearTimeout(timer); };
  }, [merging]);
  function select(index: number) { setMerging(false); setExperiment(index); setShowFormula(false); }
  function advance(next: number) {
    if (next > step + 1) return;
    setSteps(current => current.map((value, index) => index === experiment ? Math.max(value, next) : value));
    if (next === (forward ? 3 : 4) && (!forward || forwardShortcut)) setSeen(current => current.map((value, index) => index === experiment || value));
  }
  function toggleShortcut() {
    setMerging(false);
    if (forward) { setForwardShortcut(value => !value); setSteps(current => current.map((value, index) => index === 0 ? 0 : value)); }
    else { const target = shortcut ? 1 : 2; setSteps(current => current.map((value, index) => index === target ? Math.max(value, Math.min(step, 3)) : value)); select(target); }
  }
  function restart() { setMerging(false); setSteps([0, 0, 0]); setSeen([false, false, false]); setForwardShortcut(false); setShowFormula(false); setExperiment(0); }
  function forwardAction(next: number) {
    if (merging) return;
    if (forwardShortcut && next === 3 && step >= 2 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSteps(current => current.map((value, index) => index === 0 ? 2 : value));
      setMergeRun(value => value + 1); setMerging(true);
    } else advance(next);
  }
  const guidance = forward ? step === 0 ? '从左侧瓶身开始点击：同一输入、同一目标，比较分支要学什么。' : step === 1 ? '点击中间问号，查看分支需要产生的内容。' : step === 2 ? '点击右侧问号，检查完整输出。' : shortcut ? '已有瓶身沿捷径保留，分支补充瓶盖。可切换到反向实验。' : '无捷径也能得到完整目标。点击下方路线，比较有捷径时分支学什么。'
    : finished ? shortcut ? '输入梯度 = 直接项 1 + 分支项 0.001 = 1.001。' : '三次乘以 0.1 后只剩 0.001；点击下方捷径，对照直接项。'
    : step === 3 ? `分支项已算出 0.001；点击输入端的${shortcut ? '＋汇合两项' : '问号，写入最终梯度'}。` : '从右向左，点击当前高亮问号；每一层都乘以本例的局部导数 0.1。';

  return <ContentBlock ref={root} headingLevel={1} className="rtg-shortcut-gradient" data-experiment={experiment} data-step={step} data-shortcut={shortcut} data-complete={complete} data-formula={showFormula} data-merging={merging} title="捷径为什么让训练更顺？" subtitle="直接沿路径操作：先看分支学什么，再看梯度怎样返回。"
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div className="rtg-shortcut-gradient__toolbar"><nav aria-label="选择前向或反向对照">{experiments.map((label, index) => <button type="button" key={label} data-experiment-tab={index} className={experiment === index ? 'is-current' : ''} aria-pressed={experiment === index} onClick={() => select(index)}><Typography as="span" variant="bodySmall" tone="inherit">{seen[index] ? '✓' : `0${index + 1}`} · {label}</Typography></button>)}</nav><button type="button" data-reset onClick={restart}><Typography as="span" variant="bodySmall" tone="inherit">↶ 重新实验</Typography></button></div>
    <section className="rtg-shortcut-gradient__lab">
      {showFormula ? <>
        <div className="rtg-shortcut-gradient__formula-nav">{['上游梯度', '直接项从何而来', '专业形式与边界'].map((label, index) => <button type="button" data-formula-topic={index} key={label} aria-pressed={topic === index} onClick={() => setTopic(index)}><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></button>)}<button type="button" data-close-formula onClick={() => { setShowFormula(false); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[data-open-formula]')?.focus()); }}><Typography as="span" variant="bodySmall" tone="inherit">← 返回实验</Typography></button></div>
        <div className="rtg-shortcut-gradient__formula-content">{topic === 0 ? <>
          <section><Typography as="h2" variant="body" tone="accent">后续网络传回的梯度</Typography><MathFormulaBlock ariaLabel="上游梯度"><MathFormulaTerm latex="g" tooltip="相加节点收到的上游梯度。" /><MathFormulaStatic latex={'=\\frac{\\partial L}{\\partial H}'} /></MathFormulaBlock><Typography variant="bodySmall">它描述损失对当前输出的敏感程度，不是输入值或预测答案。</Typography></section>
          <section><Typography as="h2" variant="body" tone="accent">本页把 g 设为 1</Typography><Typography variant="bodySmall">这是为了单独观察两条路径。真实梯度随数据和参数改变；若相加后有 ReLU，这里的 g 需要包含其导数。</Typography><Typography variant="bodySmall" tone="muted">“上游”沿反向计算方向命名，不是指更靠近输入的层。</Typography></section>
        </> : topic === 1 ? <>
          <section><Typography as="h2" variant="body" tone="accent">输入影响两条路，梯度相加</Typography><MathFormulaBlock ariaLabel="直接项加分支项"><MathFormulaStatic latex={'\\frac{\\partial L}{\\partial x}='} /><MathFormulaTerm latex="g" tooltip="恒等捷径的导数为1，所以直接项为g。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="gF'(x)" tooltip="残差分支的链式法则项。" /></MathFormulaBlock><Typography variant="bodySmall">“1”来自恒等映射的导数，不是额外奖励。</Typography></section>
          <section><Typography as="h2" variant="body" tone="accent">不是所有情况都“加 1”</Typography><Typography as="code" variant="body" tone="success">g = 1：1 + 0.001 = 1.001</Typography><Typography as="code" variant="body" tone="accent">g = 2：2 + 0.002 = 2.002</Typography><Typography variant="bodySmall" tone="muted">直接项保留的是上游梯度 g，本例恰好取 1。</Typography></section>
        </> : <>
          <section><Typography as="h2" variant="body" tone="accent">向量形式</Typography><MathFormulaBlock ariaLabel="向量梯度"><MathFormulaStatic latex={'\\nabla_x L=(I+J_F(x))^{\\mathsf T}\\nabla_H L'} /></MathFormulaBlock><Typography variant="bodySmall">I 是单位矩阵，J_F 是残差函数的雅可比矩阵。投影捷径需用投影的雅可比替代 I。</Typography></section>
          <section><Typography as="h2" variant="body" tone="accent">依据与边界</Typography><Typography variant="bodySmall"><a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">ResNet 原论文</a>给出残差相加；<a href="https://arxiv.org/abs/1603.05027" target="_blank" rel="noreferrer">Identity Mappings</a>推导跨块直接项。</Typography><Typography variant="bodySmall" tone="muted">额外通路不保证梯度恒定、不会抵消或准确率必然提高。</Typography></section>
        </>}</div>
      </> : <>
        <div className="rtg-shortcut-gradient__stage-heading"><Typography variant="bodySmall" tone="accent">{forward ? '轮廓补全类比 · 实际相加的是特征数值' : '相加节点前的梯度 · 三层分支组成 F(x)'}</Typography><Typography variant="bodySmall" tone="muted">已探索 {seen.filter(Boolean).length} / 3 项</Typography></div>
        {forward ? <div className="rtg-shortcut-gradient__forward-board">{[
          { title: '已有线索 x', body: true, cap: false, note: '点瓶身，让信息进入分支' },
          { title: shortcut ? '分支学习差异 F(x)' : '直接学习目标 H(x)', body: !shortcut && step >= 2, cap: step >= 2, note: step >= 2 ? shortcut ? '补充缺失的瓶盖' : '产生完整轮廓' : '点击问号，查看分支结果' },
          { title: shortcut ? '相加后的输出 H(x)' : '同一个目标', body: step >= 3, cap: step >= 3, note: merging ? '保留的瓶身与修正瓶盖正在汇合' : step >= 3 ? '完整瓶身与瓶盖 · 再点可重放' : shortcut ? '点击此处，汇合 x 与 F(x)' : '点击问号，检查最终输出' },
        ].map((item, index) => <Fragment key={index}>{index > 0 && <Typography as="span" variant="h2" tone="muted">→</Typography>}<button type="button" data-forward-node={index + 1} disabled={index > step || merging && index === 2} className={step === index ? 'is-next' : step > index ? 'is-done' : ''} onClick={() => forwardAction(index + 1)}><Typography as="h2" variant="bodySmall" tone={index === 1 ? 'warning' : 'accent'}>{item.title}</Typography><div className="rtg-shortcut-gradient__node-visual">{index > 0 && step <= index ? <Typography as="span" variant="h2" tone="warning" className="rtg-shortcut-gradient__forward-question">{index === 2 && shortcut && step === 2 ? '＋' : '?'}</Typography> : <Bottle body={item.body} cap={item.cap} ghost={!(index === 1 && shortcut)} />}</div><Typography variant="bodySmall" tone="muted">{item.note}</Typography></button></Fragment>)}{merging && <MergeMotion key={mergeRun} />}</div>
        : <div className="rtg-shortcut-gradient__backward-board">{nodeLabels.map((label, index) => {
          const reached = index === 4 || index >= 4 - step, next = index === 3 - step;
          const value = index === 4 ? 1 : index === 0 ? (shortcut ? 1 : 0) + derivative ** 3 : derivative ** (4 - index);
          return <Fragment key={label}><button type="button" data-gradient-node={index} disabled={!reached && !next} className={(next ? 'is-next' : reached ? 'is-done' : '') + (index === 0 && finished ? ' is-result' : '')} aria-label={next ? index === 0 && shortcut ? '汇合直接项与分支项' : `计算${label}处的梯度` : `${label}，${reached ? format(value) : '等待计算'}`} onClick={() => advance(4 - index)}><Typography as="h2" variant="bodySmall" tone="muted">{label}</Typography><Typography as="span" variant={index === 0 && finished ? 'h2' : 'h3'} tone={reached ? index === 0 && shortcut ? 'success' : 'accent' : next ? 'warning' : 'muted'}>{reached ? format(value) : next ? index === 0 && shortcut ? '+' : '?' : '·'}</Typography><Typography variant="bodySmall" tone="muted">{index === 4 ? '上游梯度' : index === 0 ? reached ? shortcut ? '两项汇合' : '分支返回' : '输入端' : reached ? `乘以 ${derivative}` : next ? '点击计算' : '等待上一层'}</Typography></button>{index < 4 && <span className="rtg-shortcut-gradient__arrow" aria-hidden="true" style={{ opacity: reached ? .2 + .8 * Math.sqrt(derivative ** Math.max(0, 3 - index)) : .18 }}>←</span>}</Fragment>;
        })}</div>}
        <div className={'rtg-shortcut-gradient__shortcut-row' + (shortcut ? ' is-on' : '')}><button type="button" data-toggle-shortcut onClick={toggleShortcut}><Typography as="span" variant="bodySmall" tone="inherit">{shortcut ? '✓ 快捷路径已接通 · 点击关闭' : '＋ 点击接通快捷路径'}</Typography></button><div className="rtg-shortcut-gradient__direct-line" aria-hidden="true" /><Typography as="code" variant="body" tone={shortcut ? 'success' : 'muted'}>{shortcut ? forward ? '保留 x' : '直接项 1' : '无直接项'}</Typography>{experiment === 2 && <button type="button" data-open-formula onClick={() => { setTopic(1); setShowFormula(true); }}><Typography as="span" variant="bodySmall" tone="inherit">为什么有直接项？</Typography></button>}</div>
        <div className="rtg-shortcut-gradient__equation" aria-live="polite">
          {forward && finished && shortcut ? <MathFormulaBlock appearance="plain" ariaLabel="保留的输入加修正量等于完整输出">
            <MathFormulaTerm latex="x" tooltip="沿快捷路径保留的输入，不是分支输出。" />
            <MathFormulaStatic latex="+" />
            <MathFormulaTerm latex="F(x)" tooltip="分支只提供修正量，本例类比为瓶盖。" tone="warm" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="H(x)" tooltip="两项汇合后的完整输出，在这个构造例子中达到同一个目标。" />
          </MathFormulaBlock> : <Typography as="code" variant="body" tone={finished ? shortcut ? 'success' : 'warning' : 'accent'}>
            {merging ? '保留信息与修正量分别移动，汇合后才显示完整输出'
              : forward ? finished ? '变换分支输出完整目标' : '点击图中高亮对象，逐项观察'
                : finished ? shortcut ? '1 + 0.001 = 1.001' : '1 × 0.1 × 0.1 × 0.1 = 0.001'
                  : step ? format(derivative ** (step - 1)) + ' × 0.1 = ' + format(derivative ** step) : '上游梯度 1 → 点击右侧第一个问号'}
          </Typography>}
        </div>
      </>}
    </section>
    {!showFormula && <NoticeStrip tone={finished ? shortcut ? 'green' : 'orange' : 'blue'} role="status" aria-live="polite"><Typography variant="bodySmall" tone="inherit">{guidance}</Typography></NoticeStrip>}
  </ContentBlock>;
}
