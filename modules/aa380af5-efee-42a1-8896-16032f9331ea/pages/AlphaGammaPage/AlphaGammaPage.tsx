import { useState } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { tdTarget, updateQ } from '../../model';
import './AlphaGammaPage.css';

// A controlled numerical example: hold the observed experience and old estimate
// fixed so only the two parameters explain the change.
const REWARD = -1, NEXT_MAX = 8, OLD_Q = 2;
const GAMMA_EXAMPLES = [0, .5, .9, 1];
const ALPHA_EXAMPLES = [0, .1, .5, 1];
const shown = (value: number) => value.toFixed(2).replace('-', '−');
const latexNumber = (value: number) => value < 0 ? `(${value.toFixed(2)})` : value.toFixed(2);

function Comparison({ parameter, values, selected, resultLabel, calculate }: {
  parameter: 'γ' | 'α'; values: readonly number[]; selected: number;
  resultLabel: string; calculate: (value: number) => number;
}) {
  return <table shuku-edit-id="e-2337b759-390c-4bf5-b9d0-874d10db1ec4" className="vbrl-parameters__comparison" aria-label={`不同 ${parameter} 的${resultLabel}`}>
    <thead shuku-edit-id="e-5974037a-a883-4a9f-a686-93c5fac8dde9"><tr shuku-edit-id="e-d58698ac-96ab-43cd-abe4-0cdbf9cef68e"><th shuku-edit-id="e-4fe1c9d2-949f-4fa3-9fe4-e2c4ed9d69e5" scope="col"><Typography shuku-edit-id="e-35586119-08ee-449b-86c8-d710038286ca" variant="bodySmall" tone="muted">{parameter}</Typography></th>
      {values.map(value => <th shuku-edit-id="e-8c73d601-90d1-4d58-976e-da4a21f00a70" key={value} scope="col" className={Math.abs(value - selected) < 1e-8 ? 'is-current' : undefined}>
        <Typography shuku-edit-id="e-085123f2-13bb-4aed-8a00-c394962f9594" variant="bodySmall" tone="accent">{value}</Typography></th>)}
    </tr></thead>
    <tbody shuku-edit-id="e-71fe56fb-eced-4bc0-acf9-7afa89a98671"><tr shuku-edit-id="e-8cb13687-27d0-49c5-a7d8-938dc643266d"><th shuku-edit-id="e-2d13ae44-88a1-4c88-b474-30619c7d6750" scope="row"><Typography shuku-edit-id="e-99ed2e61-ab5f-463e-ad65-2dda15e65427" variant="bodySmall" tone="muted">{resultLabel}</Typography></th>
      {values.map(value => <td shuku-edit-id="e-490245a3-a1ef-4657-80e0-6302dd6c19d7" key={value} data-parameter={value} data-result={calculate(value)} className={Math.abs(value - selected) < 1e-8 ? 'is-current' : undefined}>
        <Typography shuku-edit-id="e-0032c332-2e3c-4cc5-b9f4-f868f4abaf1b" variant="bodySmall" tone="accent">{shown(calculate(value))}</Typography></td>)}
    </tr></tbody>
  </table>;
}

export function AlphaGammaPage() {
  const [gamma, setGamma] = useState(.9), [alpha, setAlpha] = useState(.5);
  const target = tdTarget(REWARD, gamma, NEXT_MAX);
  const newQ = updateQ(OLD_Q, target, alpha);

  return <LessonPage className="vbrl-foundation-page vbrl-alpha-page"
    title="先算目标，再改评分：γ 和 α 各管哪一步？"
    subtitle="折扣因子决定未来估计在目标中的权重，学习率决定旧估计向目标靠近多少。"
    footer={<Typography shuku-edit-id="e-771f31b4-eb24-45e0-a7a7-8fbc6508a342" variant="body" tone="accent">γ 决定“目标怎么算”，α 决定“这次改多少”；下一页观察一次经历怎样写回 Q 表。</Typography>}>
    <div shuku-edit-id="e-4ffe71bc-7c23-4dcc-9d64-704da73254ec" className="vbrl-parameters" data-gamma={gamma} data-alpha={alpha} data-target={target} data-new-q={newQ}>
      <section shuku-edit-id="e-a3ec3238-3e71-433d-b57e-0d36f78cd167" className="vbrl-parameters__experience" aria-label="保持不变的同一次未终止经历">
        <div shuku-edit-id="e-7815b717-dbbe-4273-9677-6187783d734d" className="vbrl-parameters__context"><Typography shuku-edit-id="e-10f731ba-5964-4680-845a-3f423a261a45" variant="bodySmall" tone="accent">同一次经历 · 示例</Typography>
          <Typography shuku-edit-id="e-3ca21754-c06e-416d-a5f6-cb806b9c838b" variant="bodySmall" tone="muted">下一状态未终止</Typography></div>
        <div shuku-edit-id="e-8fb9db5a-f818-4f56-8312-d3849f12d9b1"><Typography shuku-edit-id="e-e7a9b8b2-09f9-4a3c-9941-3615f94b3dd3" variant="bodySmall" tone="muted">即时奖励</Typography><Formula latex="r=-1" /></div>
        <div shuku-edit-id="e-8f681e46-a4b3-4291-b410-c3f54ac74374"><Typography shuku-edit-id="e-d792f2ef-2077-4ae2-87e4-5645487fb700" variant="bodySmall" tone="muted">下一状态的最大 Q 值</Typography><Formula latex={String.raw`\max\nolimits_{a'}Q(s',a')=8`} /></div>
        <div shuku-edit-id="e-ba829f58-5d01-46d8-8799-a6bfe331c3d8"><Typography shuku-edit-id="e-2d5bbb1b-c2aa-4797-9f5d-db07f460a6d3" variant="bodySmall" tone="muted">当前旧 Q 值</Typography><Formula latex={String.raw`Q_{\mathrm{old}}=2`} /></div>
      </section>

      <div shuku-edit-id="e-2520f539-786e-437d-be5c-399a65d316de" className="vbrl-parameters__stages">
        <TeachingPanel title="① 用 γ 算出目标" className="vbrl-parameters__stage is-target">
          <div shuku-edit-id="e-132828a6-52d8-432b-8769-0031e9e64fc0" className="vbrl-parameters__formula"><Formula latex={String.raw`y=r+\gamma\max_{a'}Q(s',a')`} />
            <Typography shuku-edit-id="e-5ce9a4fc-675a-41ed-bd37-747c33076dad" variant="bodySmall" tone="muted">即时奖励 ＋ 折扣后的未来估计</Typography></div>
          <div shuku-edit-id="e-00e45073-76eb-41eb-8776-207c93913b85" className="vbrl-parameters__calculation" aria-label={`目标 y 等于 ${target.toFixed(2)}`}>
            <Formula latex={String.raw`y=-1+${gamma.toFixed(2)}\times8=`} />
            <Typography shuku-edit-id="e-5dd5a53a-3d8f-4b70-b011-e7ae9c5a2278" variant="h2" tone={target < 0 ? 'danger' : 'success'}>{shown(target)}</Typography>
          </div>
          <RangeControl label="折扣因子 γ" min={0} max={1} step={.05} digits={2} value={gamma}
            onChange={event => setGamma(Number(event.target.value))} />
          <Comparison parameter="γ" values={GAMMA_EXAMPLES} selected={gamma} resultLabel="目标 y"
            calculate={value => tdTarget(REWARD, value, NEXT_MAX)} />
          <Typography shuku-edit-id="e-5ce4272f-4bed-4ad7-9c5e-56278096e7a9" variant="bodySmall" tone="muted">奖励不变；γ 越大，未来估计的权重越大。</Typography>
        </TeachingPanel>

        <svg shuku-edit-id="e-428221b4-90bc-4a47-9a39-28cbf66d4c67" className="vbrl-parameters__transfer" viewBox="0 0 32 32" aria-hidden="true"><path shuku-edit-id="e-32cdf35c-aff1-4592-a48b-dde728d07c04" d="M2 12h17V5l12 11-12 11v-7H2z" /></svg>

        <TeachingPanel title="② 用 α 控制改动幅度" className="vbrl-parameters__stage is-update">
          <div shuku-edit-id="e-2b8cc32d-c0e9-4df6-8f7b-f68e8d46fcb8" className="vbrl-parameters__formula"><Formula latex={String.raw`Q_{\mathrm{new}}=Q_{\mathrm{old}}+\alpha(y-Q_{\mathrm{old}})`} />
            <Typography shuku-edit-id="e-4f267775-f9dd-4dca-b1c6-9c3cb9797e64" variant="bodySmall" tone="muted">旧估计 ＋ 调整比例 × 与目标的差距</Typography></div>
          <div shuku-edit-id="e-135421e2-cb42-4928-b448-a60d59ce9db4" className="vbrl-parameters__calculation" aria-label={`用目标 ${target.toFixed(2)} 更新后，新 Q 值为 ${newQ.toFixed(2)}`}>
            <Formula latex={String.raw`Q_{\mathrm{new}}=2+${alpha.toFixed(2)}\times({\color{${target < 0 ? '#c63c55' : '#18875c'}}${latexNumber(target)}}-2)=`} />
            <Typography shuku-edit-id="e-bad2186c-fad1-43ff-b7d6-372544cbc287" variant="h2" tone="accent">{shown(newQ)}</Typography>
          </div>
          <RangeControl label="学习率 α" min={0} max={1} step={.05} digits={2} value={alpha}
            onChange={event => setAlpha(Number(event.target.value))} />
          <Comparison parameter="α" values={ALPHA_EXAMPLES} selected={alpha} resultLabel="新 Q 值"
            calculate={value => updateQ(OLD_Q, target, value)} />
          <Typography shuku-edit-id="e-7dd10c33-9f9a-4bb5-8bc4-8a1abe44c644" variant="bodySmall" tone="muted">α = 0 保留旧值；α = 1 直接采用这个目标。</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
