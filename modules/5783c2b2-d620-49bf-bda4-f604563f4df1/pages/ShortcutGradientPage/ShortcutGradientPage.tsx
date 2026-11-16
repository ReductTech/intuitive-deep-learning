// @refresh reset
import { Fragment, useEffect, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography, MathFormulaBlock, MathFormulaTerm, MathFormulaStatic } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ShortcutGradientPage.css';

const experiments = ['前向 · 保留与修正', '反向 · 无捷径', '反向 · 有捷径'];
const derivative = .1;
const format = (value: number) => String(Number(value.toFixed(3)));
const nodeLabels = ['输入 x', '层 1', '层 2', '层 3', '输出 H'];
export const MERGE_DURATION = 2100;
function BottleParts({ body, cap, ghost = true }: { body: boolean; cap: boolean; ghost?: boolean }) {
  return <>{(body || ghost) && <path shuku-edit-id="e-17f49e2b-8aa9-4b4c-8910-0f6333603822" className={body ? 'rtg-shortcut-gradient__bottle-body' : 'rtg-shortcut-gradient__bottle-ghost'} d="M46 32V49Q46 58 33 70Q28 75 28 88V145Q28 154 37 154H83Q92 154 92 145V88Q92 75 87 70Q74 58 74 49V32" fill="none" strokeWidth="4" strokeDasharray={body ? undefined : '5 5'} />}
    {(cap || ghost) && <rect shuku-edit-id="e-3e2d5aeb-a3e7-4817-b6cd-d3a401de4469" className={cap ? 'rtg-shortcut-gradient__bottle-cap' : 'rtg-shortcut-gradient__bottle-ghost'} x="43" y="17" width="34" height="15" rx="4" strokeWidth="4" strokeDasharray={cap ? undefined : '5 5'} />}
    {body && <path shuku-edit-id="e-fccd1800-2dad-4ab5-a820-fc53a26bf94d" className="rtg-shortcut-gradient__bottle-body" d="M29 98H91M29 123H91" strokeWidth="3" />}</>;
}
function Bottle({ body, cap, ghost = true }: { body: boolean; cap: boolean; ghost?: boolean }) {
  return <svg shuku-edit-id="e-c9a2516d-823c-4ff4-92d8-7ece97a39775" viewBox="0 0 120 170" role="img" aria-label={`${body ? '已有' : '无'}瓶身，${cap ? '已有' : '无'}瓶盖`}><BottleParts body={body} cap={cap} ghost={ghost} /></svg>;
}
function MergeMotion() {
  return <div shuku-edit-id="e-0d92e89a-c7bb-4b86-8b51-856280b39796" className="rtg-shortcut-gradient__merge-motion" role="img" aria-label="蓝色瓶身沿保留路径移动，橙色瓶盖从分支移动，在输出位置对齐汇合">
    <div shuku-edit-id="e-9c4fbe6e-453e-4150-9781-ea9e78fe8828" className="rtg-shortcut-gradient__merge-dock" aria-hidden="true"><i shuku-edit-id="e-e93bc1fe-4bd1-40c5-bc40-e5efdaa6847a" /></div>
    <div shuku-edit-id="e-2abcfe9f-a32a-44fd-8245-330646ac58fa" className="rtg-shortcut-gradient__merge-input"><Bottle body cap={false} ghost={false} /></div>
    <div shuku-edit-id="e-336d6d8a-9494-478b-91fc-86590147d5c1" className="rtg-shortcut-gradient__merge-residual"><Bottle body={false} cap ghost={false} /></div>
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

  return <ContentBlock shuku-edit-id="e-9f87f7f9-498d-4a98-84b2-96a3436c0572" ref={root} headingLevel={1} className="rtg-shortcut-gradient" data-experiment={experiment} data-step={step} data-shortcut={shortcut} data-complete={complete} data-formula={showFormula} data-merging={merging} title="捷径为什么让训练更顺？" subtitle="直接沿路径操作：先看分支学什么，再看梯度怎样返回。"
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div shuku-edit-id="e-e4d296d7-94c4-44cb-bdd9-0c3a67d4cc3c" className="rtg-shortcut-gradient__toolbar"><nav shuku-edit-id="e-2375fe7d-ee40-4d33-a131-738aab2669c6" aria-label="选择前向或反向对照">{experiments.map((label, index) => <button shuku-edit-id="e-af40574d-e5f5-41d5-9187-f3da3cef33d6" type="button" key={label} data-experiment-tab={index} className={experiment === index ? 'is-current' : ''} aria-pressed={experiment === index} onClick={() => select(index)}><Typography shuku-edit-id="e-3374a264-e778-4bd6-9799-9b657040b4af" as="span" variant="bodySmall" tone="inherit">{seen[index] ? '✓' : `0${index + 1}`} · {label}</Typography></button>)}</nav><button shuku-edit-id="e-01676ba5-d463-4486-a9a4-92a472eeb655" type="button" data-reset onClick={restart}><Typography shuku-edit-id="e-87b2a4cc-3f50-4540-b5b7-5a7c0633aee5" as="span" variant="bodySmall" tone="inherit">↶ 重新实验</Typography></button></div>
    <section shuku-edit-id="e-b8b185e0-57a0-463e-9ad4-668afa5d986f" className="rtg-shortcut-gradient__lab">
      {showFormula ? <>
        <div shuku-edit-id="e-6a696ec1-938c-4abe-a798-58d2e76bb789" className="rtg-shortcut-gradient__formula-nav">{['上游梯度', '直接项从何而来', '专业形式与边界'].map((label, index) => <button shuku-edit-id="e-bf003581-ee8e-41e3-8176-9b32477f7b99" type="button" data-formula-topic={index} key={label} aria-pressed={topic === index} onClick={() => setTopic(index)}><Typography shuku-edit-id="e-eb93823d-a428-433a-8bfa-d1d86a4bf856" as="span" variant="bodySmall" tone="inherit">{label}</Typography></button>)}<button shuku-edit-id="e-12424176-8e8e-43d4-b29a-eb6730013c46" type="button" data-close-formula onClick={() => { setShowFormula(false); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[data-open-formula]')?.focus()); }}><Typography shuku-edit-id="e-acab1def-d3e7-44f5-bf20-dfc864bc0ca1" as="span" variant="bodySmall" tone="inherit">← 返回实验</Typography></button></div>
        <div shuku-edit-id="e-c9ecdef8-b18e-402c-8857-436bf8567243" className="rtg-shortcut-gradient__formula-content">{topic === 0 ? <>
          <section shuku-edit-id="e-4e52e908-fe3f-46ef-9435-3a927dbb6bf1"><Typography shuku-edit-id="e-3f35c926-e50c-4366-82f3-dbbe8a8bb6e8" as="h2" variant="body" tone="accent">后续网络传回的梯度</Typography><MathFormulaBlock ariaLabel="上游梯度"><MathFormulaTerm latex="g" tooltip="相加节点收到的上游梯度。" /><MathFormulaStatic latex={'=\\frac{\\partial L}{\\partial H}'} /></MathFormulaBlock><Typography shuku-edit-id="e-47d059de-adb8-4a33-b1e9-bedf1e835244" variant="bodySmall">它描述损失对当前输出的敏感程度，不是输入值或预测答案。</Typography></section>
          <section shuku-edit-id="e-346abba8-237c-4bd3-8b89-9c7604f655ef"><Typography shuku-edit-id="e-03ac1bcd-4f98-42d9-8e70-c692153decc3" as="h2" variant="body" tone="accent">本页把 g 设为 1</Typography><Typography shuku-edit-id="e-70138a66-14ea-4bd4-80b2-4188c66a9a19" variant="bodySmall">这是为了单独观察两条路径。真实梯度随数据和参数改变；若相加后有 ReLU，这里的 g 需要包含其导数。</Typography><Typography shuku-edit-id="e-8625752b-55ee-4916-b168-33ee3fda2116" variant="bodySmall" tone="muted">“上游”沿反向计算方向命名，不是指更靠近输入的层。</Typography></section>
        </> : topic === 1 ? <>
          <section shuku-edit-id="e-256a0707-95da-41f9-a9fe-fe223f664ba2"><Typography shuku-edit-id="e-00afdb07-92dd-4037-8850-4afc5b978cbf" as="h2" variant="body" tone="accent">输入影响两条路，梯度相加</Typography><MathFormulaBlock ariaLabel="直接项加分支项"><MathFormulaStatic latex={'\\frac{\\partial L}{\\partial x}='} /><MathFormulaTerm latex="g" tooltip="恒等捷径的导数为1，所以直接项为g。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="gF'(x)" tooltip="残差分支的链式法则项。" /></MathFormulaBlock><Typography shuku-edit-id="e-24b076e2-7aaa-4616-902d-2c0362d7873b" variant="bodySmall">“1”来自恒等映射的导数，不是额外奖励。</Typography></section>
          <section shuku-edit-id="e-d1ea9590-cd56-428e-86db-9bc36bd3e745"><Typography shuku-edit-id="e-fa301001-f357-4e36-8923-0e58085e078e" as="h2" variant="body" tone="accent">不是所有情况都“加 1”</Typography><Typography shuku-edit-id="e-59d7d44c-c165-45a9-affa-a41a80741922" as="code" variant="body" tone="success">g = 1：1 + 0.001 = 1.001</Typography><Typography shuku-edit-id="e-83d0cd33-4f02-4d08-ba5b-d2e7eccbfb58" as="code" variant="body" tone="accent">g = 2：2 + 0.002 = 2.002</Typography><Typography shuku-edit-id="e-00156095-cc3d-4b61-8c59-42e747d4fe43" variant="bodySmall" tone="muted">直接项保留的是上游梯度 g，本例恰好取 1。</Typography></section>
        </> : <>
          <section shuku-edit-id="e-3917e0ec-59ed-4272-a07a-be6c35a6861b"><Typography shuku-edit-id="e-5e13f4db-e1cb-4849-905f-f1452d434355" as="h2" variant="body" tone="accent">向量形式</Typography><MathFormulaBlock ariaLabel="向量梯度"><MathFormulaStatic latex={'\\nabla_x L=(I+J_F(x))^{\\mathsf T}\\nabla_H L'} /></MathFormulaBlock><Typography shuku-edit-id="e-6e3e7059-f248-4267-9afa-482c6b1d76bd" variant="bodySmall">I 是单位矩阵，J_F 是残差函数的雅可比矩阵。投影捷径需用投影的雅可比替代 I。</Typography></section>
          <section shuku-edit-id="e-74a422a7-9b0c-467f-9586-2c64a954ac50"><Typography shuku-edit-id="e-3de598b4-5888-4ded-a598-316632d92791" as="h2" variant="body" tone="accent">依据与边界</Typography><Typography shuku-edit-id="e-86bbc9b3-838b-4a73-9559-59e3901870e0" variant="bodySmall"><a shuku-edit-id="e-35aa5195-2cd2-4920-ac6c-71d87c556519" href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer">ResNet 原论文</a>给出残差相加；<a shuku-edit-id="e-222cbf65-a8b2-4734-9557-3dd96d9e186f" href="https://arxiv.org/abs/1603.05027" target="_blank" rel="noreferrer">Identity Mappings</a>推导跨块直接项。</Typography><Typography shuku-edit-id="e-4b8d18c5-0753-4706-9519-6df5ad60c76f" variant="bodySmall" tone="muted">额外通路不保证梯度恒定、不会抵消或准确率必然提高。</Typography></section>
        </>}</div>
      </> : <>
        <div shuku-edit-id="e-58a2c780-48ca-4bea-b382-f6850129e1b9" className="rtg-shortcut-gradient__stage-heading"><Typography shuku-edit-id="e-1c17b81a-23a0-4676-8ede-74d66225ef91" variant="bodySmall" tone="accent">{forward ? '轮廓补全类比 · 实际相加的是特征数值' : '相加节点前的梯度 · 三层分支组成 F(x)'}</Typography><Typography shuku-edit-id="e-0137acf4-01ab-47e3-809a-3371b341cac3" variant="bodySmall" tone="muted">已探索 {seen.filter(Boolean).length} / 3 项</Typography></div>
        {forward ? <div shuku-edit-id="e-310f294d-5091-49ac-95dd-f8046de08bae" className="rtg-shortcut-gradient__forward-board">{[
          { title: '已有线索 x', body: true, cap: false, note: '点瓶身，让信息进入分支' },
          { title: shortcut ? '分支学习差异 F(x)' : '直接学习目标 H(x)', body: !shortcut && step >= 2, cap: step >= 2, note: step >= 2 ? shortcut ? '补充缺失的瓶盖' : '产生完整轮廓' : '点击问号，查看分支结果' },
          { title: shortcut ? '相加后的输出 H(x)' : '同一个目标', body: step >= 3, cap: step >= 3, note: merging ? '保留的瓶身与修正瓶盖正在汇合' : step >= 3 ? '完整瓶身与瓶盖 · 再点可重放' : shortcut ? '点击此处，汇合 x 与 F(x)' : '点击问号，检查最终输出' },
        ].map((item, index) => <Fragment key={index}>{index > 0 && <Typography shuku-edit-id="e-88bf618c-ab48-422c-ab0b-318185e4cf95" as="span" variant="h2" tone="muted">→</Typography>}<button shuku-edit-id="e-982387e7-5c7d-4224-b5b9-52cb1669f611" type="button" data-forward-node={index + 1} disabled={index > step || merging && index === 2} className={step === index ? 'is-next' : step > index ? 'is-done' : ''} onClick={() => forwardAction(index + 1)}><Typography shuku-edit-id="e-38f26929-26b2-4753-b288-2fcd668fe8ba" as="h2" variant="bodySmall" tone={index === 1 ? 'warning' : 'accent'}>{item.title}</Typography><div shuku-edit-id="e-88e90718-0a51-446c-8f20-6f084e99a097" className="rtg-shortcut-gradient__node-visual">{index > 0 && step <= index ? <Typography shuku-edit-id="e-b3d6e4ab-fa75-44cc-adb3-cf6a976fada9" as="span" variant="h2" tone="warning" className="rtg-shortcut-gradient__forward-question">{index === 2 && shortcut && step === 2 ? '＋' : '?'}</Typography> : <Bottle body={item.body} cap={item.cap} ghost={!(index === 1 && shortcut)} />}</div><Typography shuku-edit-id="e-ed6f0d9e-b5b7-43f4-b789-dca9861025be" variant="bodySmall" tone="muted">{item.note}</Typography></button></Fragment>)}{merging && <MergeMotion key={mergeRun} />}</div>
        : <div shuku-edit-id="e-881b7f41-d56d-4f29-b86e-de0c53a290e0" className="rtg-shortcut-gradient__backward-board">{nodeLabels.map((label, index) => {
          const reached = index === 4 || index >= 4 - step, next = index === 3 - step;
          const value = index === 4 ? 1 : index === 0 ? (shortcut ? 1 : 0) + derivative ** 3 : derivative ** (4 - index);
          return <Fragment key={label}><button shuku-edit-id="e-56533e4f-86a8-4047-98a7-a00c2c04c147" type="button" data-gradient-node={index} disabled={!reached && !next} className={(next ? 'is-next' : reached ? 'is-done' : '') + (index === 0 && finished ? ' is-result' : '')} aria-label={next ? index === 0 && shortcut ? '汇合直接项与分支项' : `计算${label}处的梯度` : `${label}，${reached ? format(value) : '等待计算'}`} onClick={() => advance(4 - index)}><Typography shuku-edit-id="e-49bc6dbc-f12b-49a0-9eb3-56cc8a9d7f32" as="h2" variant="bodySmall" tone="muted">{label}</Typography><Typography shuku-edit-id="e-6e0ccbd9-f91f-4827-9569-5485f41aef1d" as="span" variant={index === 0 && finished ? 'h2' : 'h3'} tone={reached ? index === 0 && shortcut ? 'success' : 'accent' : next ? 'warning' : 'muted'}>{reached ? format(value) : next ? index === 0 && shortcut ? '+' : '?' : '·'}</Typography><Typography shuku-edit-id="e-8ad78bf1-3586-40f2-8c56-066f9f69b5af" variant="bodySmall" tone="muted">{index === 4 ? '上游梯度' : index === 0 ? reached ? shortcut ? '两项汇合' : '分支返回' : '输入端' : reached ? `乘以 ${derivative}` : next ? '点击计算' : '等待上一层'}</Typography></button>{index < 4 && <span shuku-edit-id="e-58cff44c-5c39-4a7b-a0ec-9dc856b19d0a" className="rtg-shortcut-gradient__arrow" aria-hidden="true" style={{ opacity: reached ? .2 + .8 * Math.sqrt(derivative ** Math.max(0, 3 - index)) : .18 }}>←</span>}</Fragment>;
        })}</div>}
        <div shuku-edit-id="e-b644f030-3edf-4f6f-8cca-e1405c8c475e" className={'rtg-shortcut-gradient__shortcut-row' + (shortcut ? ' is-on' : '')}><button shuku-edit-id="e-09ba8d3a-135a-4ee2-b254-603a3859680e" type="button" data-toggle-shortcut onClick={toggleShortcut}><Typography shuku-edit-id="e-cf9695fb-20f3-4ecb-acf3-fd33c378a0dd" as="span" variant="bodySmall" tone="inherit">{shortcut ? '✓ 快捷路径已接通 · 点击关闭' : '＋ 点击接通快捷路径'}</Typography></button><div shuku-edit-id="e-30dc14a3-26da-49c3-bf71-956427d92871" className="rtg-shortcut-gradient__direct-line" aria-hidden="true" /><Typography shuku-edit-id="e-3ffd7390-75df-4fbe-8d5d-62a925798ce7" as="code" variant="body" tone={shortcut ? 'success' : 'muted'}>{shortcut ? forward ? '保留 x' : '直接项 1' : '无直接项'}</Typography>{experiment === 2 && <button shuku-edit-id="e-c7256730-5115-4af4-a695-c23ab45ecdbe" type="button" data-open-formula onClick={() => { setTopic(1); setShowFormula(true); }}><Typography shuku-edit-id="e-a2fe68f2-5544-4671-8192-05264f8b1bf5" as="span" variant="bodySmall" tone="inherit">为什么有直接项？</Typography></button>}</div>
        <div shuku-edit-id="e-0d0cd186-360b-46e6-9739-22c7190586be" className="rtg-shortcut-gradient__equation" aria-live="polite">
          {forward && finished && shortcut ? <MathFormulaBlock appearance="plain" ariaLabel="保留的输入加修正量等于完整输出">
            <MathFormulaTerm latex="x" tooltip="沿快捷路径保留的输入，不是分支输出。" />
            <MathFormulaStatic latex="+" />
            <MathFormulaTerm latex="F(x)" tooltip="分支只提供修正量，本例类比为瓶盖。" tone="warm" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="H(x)" tooltip="两项汇合后的完整输出，在这个构造例子中达到同一个目标。" />
          </MathFormulaBlock> : <Typography shuku-edit-id="e-875e4b24-c69b-4067-bb16-38673905237e" as="code" variant="body" tone={finished ? shortcut ? 'success' : 'warning' : 'accent'}>
            {merging ? '保留信息与修正量分别移动，汇合后才显示完整输出'
              : forward ? finished ? '变换分支输出完整目标' : '点击图中高亮对象，逐项观察'
                : finished ? shortcut ? '1 + 0.001 = 1.001' : '1 × 0.1 × 0.1 × 0.1 = 0.001'
                  : step ? format(derivative ** (step - 1)) + ' × 0.1 = ' + format(derivative ** step) : '上游梯度 1 → 点击右侧第一个问号'}
          </Typography>}
        </div>
      </>}
    </section>
    {!showFormula && <NoticeStrip tone={finished ? shortcut ? 'green' : 'orange' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-bf5f859c-d3da-48bb-a5c6-5a9fe3af7500" variant="bodySmall" tone="inherit">{guidance}</Typography></NoticeStrip>}
  </ContentBlock>;
}
