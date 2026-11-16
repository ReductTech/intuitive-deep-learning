// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, TextInput, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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
    <article shuku-edit-id="e-9a7a8c1b-0244-4b6f-9506-18743066e83c" className={`rtg-elementwise__matrix-card${transformedFrom ? ' is-relu' : ''}`}>
      <Typography shuku-edit-id="e-f1c003f4-9ea5-47da-9bc7-7159ca575e81" as="strong" variant="h3" tone={tone}>{label}</Typography>
      <div shuku-edit-id="e-3e29b8e2-c459-40e2-8177-4afd53bd41da" className="rtg-elementwise__matrix">
        {values.map((value, index) => onSelect ? (
          <button shuku-edit-id="e-b039f396-7f59-429c-aa42-e0273db63995" className={`${selected === index ? 'is-selected' : ''}${transformedFrom !== undefined && transformedFrom[index] < 0 ? ' is-clamped' : ''}`} type="button" key={index} onClick={() => onSelect(index)}>
            <Typography shuku-edit-id="e-8507083f-0210-4255-90f0-18af37649f80" as="span" variant="body" tone={value === null ? 'muted' : tone}>{value === null ? '?' : value}</Typography>
          </button>
        ) : (
          <span shuku-edit-id="e-dbd22c86-e142-4418-bee4-4f5a96debdbe" className={(transformedFrom !== undefined && transformedFrom[index] < 0 && value !== null ? 'is-clamped ' : '') + (active === index ? 'is-current' : '')} key={index} data-value={value ?? ''}><Typography shuku-edit-id="e-1b85dd6d-f844-4431-944c-55e13159e02b" as="span" variant="body" tone={value === null ? 'light' : tone}>{value === null ? '·' : value}</Typography></span>
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
    <ContentBlock shuku-edit-id="e-c89844df-bd0a-4327-8aed-7df70720f362" data-relu-open={reluOn} data-relu-count={reluCount} data-relu-playing={playing} data-complete={complete} headingLevel={1} className="rtg-elementwise" title="两张特征图怎样相加？" subtitle="按同一坐标填写相加结果，再观察 ReLU。">
      <section shuku-edit-id="e-d6d60551-0ed2-48e2-9451-3f39f6b10d1e" className={'rtg-elementwise__lab' + (reluOn ? ' is-relu-view' : '')} aria-label="逐元素相加练习">

        {reluOn ? <div shuku-edit-id="e-ebc728f9-8cc8-4826-8167-733219e157a3" className="rtg-elementwise__relu-view" aria-label="相加结果经过ReLU得到输出">
          <div shuku-edit-id="e-f9aec459-3c6e-4f0e-8cb9-916df27222b5" className="rtg-elementwise__relu-comparison">
            <Matrix label="相加结果 · ReLU 的输入" values={sum} active={playing ? active : undefined} />
            <div shuku-edit-id="e-11044d08-b3db-401c-b3c8-b5d812b2b4bf" className="rtg-elementwise__relu-gate">
              <Typography shuku-edit-id="e-714e04f1-d6a4-4cc3-827a-498e25275580" variant="bodySmall" tone="muted">同一位置，一一对应</Typography>
              <Button variant="primary" disabled={playing} onClick={applyRelu} aria-label="重放ReLU逐位置变换">{playing ? 'ReLU 正在变换 →' : '重放 ReLU →'}</Button>
              <Typography shuku-edit-id="e-9b8f7c0f-077d-4afe-8ac9-764e15f76a4b" variant="bodySmall" tone="muted">负数变为 0</Typography>
              <Typography shuku-edit-id="e-1b83996f-be60-4ce7-bbc3-e403cabe1a77" variant="bodySmall" tone="muted">非负值保持不变</Typography>
            </div>
            <Matrix label="ReLU 后输出" values={relu.map((value, index) => index < reluCount ? value : null)}
              active={playing ? active : undefined} tone="success" transformedFrom={sum} />
          </div>
          <div shuku-edit-id="e-8f26e3aa-fc94-4057-bb55-64cd68e2b239" className="rtg-elementwise__relu-readout" aria-live={playing ? 'off' : 'polite'}>
            <Typography shuku-edit-id="e-b0f88e57-668e-418e-a49c-f0dad5711d83" variant="bodySmall" tone="muted">{'第 ' + (Math.floor(active / 3) + 1) + ' 行 · 第 ' + (active % 3 + 1) + ' 列'}</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel="当前位置ReLU的实际计算"><MathFormulaStatic latex={reluCount ? '\\max(0,' + sum[active] + ')=' + relu[active] : '\\max(0,z)'} /></MathFormulaBlock>
          </div>
        </div> : <div shuku-edit-id="e-de9ad588-7a85-40a1-84c3-1e8ad10b4993" className="rtg-elementwise__workspace">
          <Matrix label="输入 x" values={x} />
          <Typography shuku-edit-id="e-12fd232d-ae62-4b85-87ca-8b1de9968a77" as="strong" variant="h2" tone="warning">+</Typography>
          <Matrix label="残差 F(x)" values={f} tone="warning" />
          <Typography shuku-edit-id="e-e83385d7-d6cf-47d6-86d8-40ae8131bd47" as="strong" variant="h2" tone="warning">=</Typography>
          <Matrix label="相加结果" values={answers} selected={!allFilled ? selected : undefined} onSelect={!allFilled ? setSelected : undefined} />

          <aside shuku-edit-id="e-cb3192dc-f8e1-4ffa-bf5c-727b0deea1e3" className="rtg-elementwise__entry">
            <div shuku-edit-id="e-2c870814-feae-4325-ad53-820be155dfe5" className="rtg-elementwise__entry-head">
              <Typography shuku-edit-id="e-7e205950-20ab-4e41-9a72-df87a4b90656" as="span" variant="bodySmall" tone="warning">第一步 · 填写当前格</Typography>
              {!allFilled && <Typography shuku-edit-id="e-052df3ff-374f-47a5-8792-4d513c1b7cc2" as="strong" variant="bodySmall" tone="accent">第 {Math.floor(selected / 3) + 1} 行 · 第 {selected % 3 + 1} 列</Typography>}
            </div>
            {!allFilled ? <>
              <div shuku-edit-id="e-6b4ad71d-9321-4897-84f0-a748d5577894" className="rtg-elementwise__same-coordinate">
                <Typography shuku-edit-id="e-06cbe4e2-bddf-4847-adfe-94044b996a91" as="span" variant="body" tone="accent">{x[selected]}</Typography>
                <Typography shuku-edit-id="e-5d90c77f-2281-4380-ad36-c797d5acd8ea" as="span" variant="body" tone="warning">+</Typography>
                <Typography shuku-edit-id="e-2d48b94b-a176-4a9c-b456-c48b0297b8ac" as="span" variant="body" tone="warning">{f[selected]}</Typography>
              </div>
              <TextInput className="rtg-elementwise__answer-input ui-typography ui-typography--h3 ui-typography--tone-accent" label="该位置的结果" inputMode="numeric" value={entry} onChange={(event) => setEntry(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); submitCell(); } }} />
              <Button variant="primary" onClick={submitCell}><Typography shuku-edit-id="e-e8dd39f9-c6c6-494b-bab2-6193d15c1afb" as="span" variant="body" tone="inherit">填入当前格</Typography></Button>
              <div shuku-edit-id="e-ff0ffe29-13bb-431f-9a29-bb886fb429dc" className="rtg-elementwise__quick-fill">
                <Typography shuku-edit-id="e-295d238d-22d0-4165-95d3-85e9124966e5" variant="bodySmall" tone="muted">已经理解同坐标相加？可以跳过剩余格子。</Typography>
                <Button variant="warn" onClick={revealAllAnswers}><Typography shuku-edit-id="e-c8a113fd-7077-4943-aef4-57829204c0cd" as="span" variant="body" tone="inherit">直接得到完整答案</Typography></Button>
              </div>
            </> : <div shuku-edit-id="e-f87601fc-42de-4084-95f1-e2ce3b5bb4b6" className="rtg-elementwise__answers-ready"><Typography shuku-edit-id="e-f30513b0-0bb1-405f-98ba-0ab28b7bb15d" as="strong" variant="h3" tone="success">3×3 结果已完成</Typography><Typography shuku-edit-id="e-beddb40f-1dd1-4b0e-9acd-7a8514177ba3" variant="bodySmall" tone="muted">九个位置都已得到答案。继续打开 ReLU，观察负数如何变化。</Typography></div>}
            {allFilled && <div shuku-edit-id="e-6d802d0c-6e5a-4f81-b009-2ce9a74b067a" className="rtg-elementwise__relu-step is-ready" aria-live="polite">
              <div shuku-edit-id="e-f1c02cf4-47c7-499e-a185-4b6c9bae7d35" className="rtg-elementwise__relu-head"><span shuku-edit-id="e-368d17e3-f4fc-4840-8743-9a99afcd7a78" aria-hidden="true">2</span><div shuku-edit-id="e-55375975-44a5-47ad-b97f-f2cdbd674437"><Typography shuku-edit-id="e-bd9322f6-8404-4042-9068-81a6a41d86e7" as="strong" variant="body" tone="success">第二步 · 应用 ReLU</Typography><Typography shuku-edit-id="e-50af7a14-29f5-409f-b00e-db1695b07045" variant="bodySmall" tone="muted">负数变为 0，非负值保持不变</Typography></div></div>
              <Button className="rtg-elementwise__relu-action" variant="primary" onClick={applyRelu}><Typography shuku-edit-id="e-80175433-eca3-42cf-bb81-370f10d4f718" as="span" variant="body" tone="inherit">观察 ReLU 变换</Typography><Typography shuku-edit-id="e-a081eae6-06ca-4c56-aec4-83ed4acecb2a" as="code" variant="bodySmall" tone="inherit">max(0, z)</Typography></Button>
            </div>}
          </aside>
        </div>}
      </section>

      {reluDone && <RtgQuestion pageId="d00bd957-dda5-4933-bd9f-55f41b5faff3" questionId="same-shape" className="rtg-elementwise__question" type="choice" typeLabel="理解检查" title="为什么两条分支的特征图必须形状一致？" answer="pair" options={[{ value: 'pair', label: '每个位置都要找到一一对应的加数' }, { value: 'faster', label: '形状一致只为了计算更快', wrongFeedback: '速度可能受影响，但这里的根本要求是位置能够一一对应。' }, { value: 'color', label: '形状一致能保证颜色相同', wrongFeedback: '特征图数值不是原图颜色；关键是坐标和通道能够对应。' }]} feedback={{ correct: '正确。逐元素相加要求两边每个位置都有对应项。' }} onCheck={setQuestionResult} />}

      <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-86d91d15-dafb-41c9-b6a7-545ef60d87f5" variant="body" tone="inherit">{complete ? '完成：先逐元素相加，再把负值经 ReLU 截为 0；输出形状仍是 3×3。' : reluDone ? '左侧保留相加结果，右侧是 ReLU 后输出；负值位置已归零。' : playing ? '逐格对照：左侧作为 ReLU 的输入，右侧显示变换结果。' : cellMessage}</Typography></NoticeStrip>
    </ContentBlock>
  );
}
