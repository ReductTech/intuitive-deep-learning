import { useState } from 'react';
import { RangeControl, Typography } from '../../../shared/react';
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
  return <table className="vbrl-parameters__comparison" aria-label={`不同 ${parameter} 的${resultLabel}`}>
    <thead><tr><th scope="col"><Typography variant="bodySmall" tone="muted">{parameter}</Typography></th>
      {values.map(value => <th key={value} scope="col" className={Math.abs(value - selected) < 1e-8 ? 'is-current' : undefined}>
        <Typography variant="bodySmall" tone="accent">{value}</Typography></th>)}
    </tr></thead>
    <tbody><tr><th scope="row"><Typography variant="bodySmall" tone="muted">{resultLabel}</Typography></th>
      {values.map(value => <td key={value} data-parameter={value} data-result={calculate(value)} className={Math.abs(value - selected) < 1e-8 ? 'is-current' : undefined}>
        <Typography variant="bodySmall" tone="accent">{shown(calculate(value))}</Typography></td>)}
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
    footer={<Typography variant="body" tone="accent">γ 决定“目标怎么算”，α 决定“这次改多少”；下一页观察一次经历怎样写回 Q 表。</Typography>}>
    <div className="vbrl-parameters" data-gamma={gamma} data-alpha={alpha} data-target={target} data-new-q={newQ}>
      <section className="vbrl-parameters__experience" aria-label="保持不变的同一次未终止经历">
        <div className="vbrl-parameters__context"><Typography variant="bodySmall" tone="accent">同一次经历 · 示例</Typography>
          <Typography variant="bodySmall" tone="muted">下一状态未终止</Typography></div>
        <div><Typography variant="bodySmall" tone="muted">即时奖励</Typography><Formula latex="r=-1" /></div>
        <div><Typography variant="bodySmall" tone="muted">下一状态的最大 Q 值</Typography><Formula latex={String.raw`\max\nolimits_{a'}Q(s',a')=8`} /></div>
        <div><Typography variant="bodySmall" tone="muted">当前旧 Q 值</Typography><Formula latex={String.raw`Q_{\mathrm{old}}=2`} /></div>
      </section>

      <div className="vbrl-parameters__stages">
        <TeachingPanel title="① 用 γ 算出目标" className="vbrl-parameters__stage is-target">
          <div className="vbrl-parameters__formula"><Formula latex={String.raw`y=r+\gamma\max_{a'}Q(s',a')`} />
            <Typography variant="bodySmall" tone="muted">即时奖励 ＋ 折扣后的未来估计</Typography></div>
          <div className="vbrl-parameters__calculation" aria-label={`目标 y 等于 ${target.toFixed(2)}`}>
            <Formula latex={String.raw`y=-1+${gamma.toFixed(2)}\times8=`} />
            <Typography variant="h2" tone={target < 0 ? 'danger' : 'success'}>{shown(target)}</Typography>
          </div>
          <RangeControl label="折扣因子 γ" min={0} max={1} step={.05} digits={2} value={gamma}
            onChange={event => setGamma(Number(event.target.value))} />
          <Comparison parameter="γ" values={GAMMA_EXAMPLES} selected={gamma} resultLabel="目标 y"
            calculate={value => tdTarget(REWARD, value, NEXT_MAX)} />
          <Typography variant="bodySmall" tone="muted">奖励不变；γ 越大，未来估计的权重越大。</Typography>
        </TeachingPanel>

        <svg className="vbrl-parameters__transfer" viewBox="0 0 32 32" aria-hidden="true"><path d="M2 12h17V5l12 11-12 11v-7H2z" /></svg>

        <TeachingPanel title="② 用 α 控制改动幅度" className="vbrl-parameters__stage is-update">
          <div className="vbrl-parameters__formula"><Formula latex={String.raw`Q_{\mathrm{new}}=Q_{\mathrm{old}}+\alpha(y-Q_{\mathrm{old}})`} />
            <Typography variant="bodySmall" tone="muted">旧估计 ＋ 调整比例 × 与目标的差距</Typography></div>
          <div className="vbrl-parameters__calculation" aria-label={`用目标 ${target.toFixed(2)} 更新后，新 Q 值为 ${newQ.toFixed(2)}`}>
            <Formula latex={String.raw`Q_{\mathrm{new}}=2+${alpha.toFixed(2)}\times({\color{${target < 0 ? '#c63c55' : '#18875c'}}${latexNumber(target)}}-2)=`} />
            <Typography variant="h2" tone="accent">{shown(newQ)}</Typography>
          </div>
          <RangeControl label="学习率 α" min={0} max={1} step={.05} digits={2} value={alpha}
            onChange={event => setAlpha(Number(event.target.value))} />
          <Comparison parameter="α" values={ALPHA_EXAMPLES} selected={alpha} resultLabel="新 Q 值"
            calculate={value => updateQ(OLD_Q, target, value)} />
          <Typography variant="bodySmall" tone="muted">α = 0 保留旧值；α = 1 直接采用这个目标。</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
