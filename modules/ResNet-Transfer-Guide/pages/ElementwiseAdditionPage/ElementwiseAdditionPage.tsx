// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, TextInput, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ElementwiseAdditionPage.css';

const x = [2, 1, 0, 0, 2, 1, 1, 0, 2];
const f = [-1, 2, 0, 1, -3, 2, 0, 1, -4];
const sum = x.map((value, index) => value + f[index]);
const relu = sum.map((value) => Math.max(0, value));

interface MatrixProps { label: string; values: Array<number | null>; selected?: number; onSelect?: (index: number) => void; tone?: 'accent' | 'warning' | 'success'; transformedFrom?: number[]; active?: number; }
function Matrix({ label, values, selected, onSelect, tone = 'accent', transformedFrom, active }: MatrixProps) {
  return (
    <article className={`rtg-elementwise__matrix-card${transformedFrom ? ' is-relu' : ''}`}>
      <Typography as="strong" variant="h3" tone={tone}>{label}</Typography>
      <div className="rtg-elementwise__matrix">
        {values.map((value, index) => onSelect ? (
          <button className={`${selected === index ? 'is-selected' : ''}${transformedFrom !== undefined && transformedFrom[index] < 0 ? ' is-clamped' : ''}`} type="button" key={index} onClick={() => onSelect(index)}>
            <Typography as="span" variant="body" tone={value === null ? 'muted' : tone}>{value === null ? '?' : value}</Typography>
          </button>
        ) : (
          <span className={(transformedFrom !== undefined && transformedFrom[index] < 0 && value !== null ? 'is-clamped ' : '') + (active === index ? 'is-current' : '')} key={index} data-value={value ?? ''}><Typography as="span" variant="body" tone={value === null ? 'light' : tone}>{value === null ? '·' : value}</Typography></span>
        ))}
      </div>
    </article>
  );
}

export interface ElementwiseAdditionPageProps { onComplete?: () => void; }
export function ElementwiseAdditionPage({ onComplete }: ElementwiseAdditionPageProps) {
  const [answers, setAnswers] = useState<Array<number | null>>(Array(9).fill(null));
  const [selected, setSelected] = useState(0);
  const [entry, setEntry] = useState('');
  const [cellMessage, setCellMessage] = useState('点击结果矩阵中的一个格子，填写同一坐标的相加结果。');
  const [reluOn, setReluOn] = useState(false);
  const [reluCount, setReluCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);
  const allFilled = answers.every((value, index) => value === sum[index]);
  const reluDone = reluOn && reluCount === 9 && !playing;
  const complete = allFilled && reluDone && Boolean(questionResult?.ok);
  const active = reluOn ? Math.max(0, Math.min(8, reluCount - 1)) : -1;
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReluCount(9); setPlaying(false); return;
    }
    let live = true;
    const timer = window.setInterval(() => { if (live) setReluCount(count => Math.min(9, count + 1)); }, 200);
    return () => { live = false; window.clearInterval(timer); };
  }, [playing, run]);
  useEffect(() => { if (reluCount === 9 && playing) setPlaying(false); }, [reluCount, playing]);

  function submitCell() {
    const numeric = Number(entry);
    if (entry.trim() === '' || !Number.isFinite(numeric)) {
      setCellMessage('请输入一个数值。');
      return;
    }
    if (numeric !== sum[selected]) {
      setCellMessage('再看同一坐标：' + x[selected] + ' + (' + f[selected] + ')。');
      return;
    }
    const next = [...answers];
    next[selected] = numeric;
    setAnswers(next);
    setEntry('');
    const nextEmpty = next.findIndex((value) => value === null);
    if (nextEmpty >= 0) {
      setSelected(nextEmpty);
      setCellMessage('填写正确。已移动到下一个空格。');
    } else {
      setCellMessage('九个位置全部正确。现在打开 ReLU，观察负数如何变化。');
    }
  }

  function revealAllAnswers() {
    setAnswers([...sum]);
    setEntry('');
    setCellMessage('已直接生成完整的 3×3 相加结果。现在可以进入第二步，打开 ReLU。');
  }

  function applyRelu() {
    if (!allFilled || playing) return;
    setReluOn(true); setReluCount(0); setPlaying(true); setRun(value => value + 1);
    setCellMessage('对照左右相同位置：负值变为 0，非负值保持不变。');
  }

  return (
    <ContentBlock data-relu-open={reluOn} data-relu-count={reluCount} data-relu-playing={playing} data-complete={complete} headingLevel={1} className="rtg-elementwise" title="两张特征图怎样相加？" subtitle="按同一坐标填写相加结果，再观察 ReLU。">
      <section className={'rtg-elementwise__lab' + (reluOn ? ' is-relu-view' : '')} aria-label="逐元素相加练习">

        {reluOn ? <div className="rtg-elementwise__relu-view" aria-label="相加结果经过ReLU得到输出">
          <div className="rtg-elementwise__relu-comparison">
            <Matrix label="相加结果 · ReLU 的输入" values={sum} active={playing ? active : undefined} />
            <div className="rtg-elementwise__relu-gate">
              <Typography variant="bodySmall" tone="muted">同一位置，一一对应</Typography>
              <Button variant="primary" disabled={playing} onClick={applyRelu} aria-label="重放ReLU逐位置变换">{playing ? 'ReLU 正在变换 →' : '重放 ReLU →'}</Button>
              <Typography variant="bodySmall" tone="muted">负数变为 0</Typography>
              <Typography variant="bodySmall" tone="muted">非负值保持不变</Typography>
            </div>
            <Matrix label="ReLU 后输出" values={relu.map((value, index) => index < reluCount ? value : null)}
              active={playing ? active : undefined} tone="success" transformedFrom={sum} />
          </div>
          <div className="rtg-elementwise__relu-readout" aria-live={playing ? 'off' : 'polite'}>
            <Typography variant="bodySmall" tone="muted">{'第 ' + (Math.floor(active / 3) + 1) + ' 行 · 第 ' + (active % 3 + 1) + ' 列'}</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel="当前位置ReLU的实际计算"><MathFormulaStatic latex={reluCount ? '\\max(0,' + sum[active] + ')=' + relu[active] : '\\max(0,z)'} /></MathFormulaBlock>
          </div>
        </div> : <div className="rtg-elementwise__workspace">
          <Matrix label="输入 x" values={x} />
          <Typography as="strong" variant="h2" tone="warning">+</Typography>
          <Matrix label="残差 F(x)" values={f} tone="warning" />
          <Typography as="strong" variant="h2" tone="warning">=</Typography>
          <Matrix label="相加结果" values={answers} selected={!allFilled ? selected : undefined} onSelect={!allFilled ? setSelected : undefined} />

          <aside className="rtg-elementwise__entry">
            <div className="rtg-elementwise__entry-head">
              <Typography as="span" variant="bodySmall" tone="warning">第一步 · 填写当前格</Typography>
              {!allFilled && <Typography as="strong" variant="bodySmall" tone="accent">第 {Math.floor(selected / 3) + 1} 行 · 第 {selected % 3 + 1} 列</Typography>}
            </div>
            {!allFilled ? <>
              <div className="rtg-elementwise__same-coordinate">
                <Typography as="span" variant="body" tone="accent">{x[selected]}</Typography>
                <Typography as="span" variant="body" tone="warning">+</Typography>
                <Typography as="span" variant="body" tone="warning">{f[selected]}</Typography>
              </div>
              <TextInput className="rtg-elementwise__answer-input ui-typography ui-typography--h3 ui-typography--tone-accent" label="该位置的结果" inputMode="numeric" value={entry} onChange={(event) => setEntry(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); submitCell(); } }} />
              <Button variant="primary" onClick={submitCell}><Typography as="span" variant="body" tone="inherit">填入当前格</Typography></Button>
              <div className="rtg-elementwise__quick-fill">
                <Typography variant="bodySmall" tone="muted">已经理解同坐标相加？可以跳过剩余格子。</Typography>
                <Button variant="warn" onClick={revealAllAnswers}><Typography as="span" variant="body" tone="inherit">直接得到完整答案</Typography></Button>
              </div>
            </> : <div className="rtg-elementwise__answers-ready"><Typography as="strong" variant="h3" tone="success">3×3 结果已完成</Typography><Typography variant="bodySmall" tone="muted">九个位置都已得到答案。继续打开 ReLU，观察负数如何变化。</Typography></div>}
            {allFilled && <div className="rtg-elementwise__relu-step is-ready" aria-live="polite">
              <div className="rtg-elementwise__relu-head"><span aria-hidden="true">2</span><div><Typography as="strong" variant="body" tone="success">第二步 · 应用 ReLU</Typography><Typography variant="bodySmall" tone="muted">负数变为 0，非负值保持不变</Typography></div></div>
              <Button className="rtg-elementwise__relu-action" variant="primary" onClick={applyRelu}><Typography as="span" variant="body" tone="inherit">观察 ReLU 变换</Typography><Typography as="code" variant="bodySmall" tone="inherit">max(0, z)</Typography></Button>
            </div>}
          </aside>
        </div>}
      </section>

      {reluDone && <RtgQuestion pageId="15-elementwise-addition" questionId="same-shape" className="rtg-elementwise__question" type="choice" typeLabel="理解检查" title="为什么两条分支的特征图必须形状一致？" answer="pair" options={[{ value: 'pair', label: '每个位置都要找到一一对应的加数' }, { value: 'faster', label: '形状一致只为了计算更快', wrongFeedback: '速度可能受影响，但这里的根本要求是位置能够一一对应。' }, { value: 'color', label: '形状一致能保证颜色相同', wrongFeedback: '特征图数值不是原图颜色；关键是坐标和通道能够对应。' }]} feedback={{ correct: '正确。逐元素相加要求两边每个位置都有对应项。' }} onCheck={setQuestionResult} />}

      <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite"><Typography variant="body" tone="inherit">{complete ? '完成：先逐元素相加，再把负值经 ReLU 截为 0；输出形状仍是 3×3。' : reluDone ? '左侧保留相加结果，右侧是 ReLU 后输出；负值位置已归零。' : playing ? '逐格对照：左侧作为 ReLU 的输入，右侧显示变换结果。' : cellMessage}</Typography></NoticeStrip>
    </ContentBlock>
  );
}
