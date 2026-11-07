// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { ParameterRange } from '../../components/ParameterRange/ParameterRange';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './StrategyMapPage.css';

export const STRATEGY_CASES = [
  { id: 'many-near', data: '多', similarity: '高', title: '可比较部分微调', scope: 'Stage 4 ＋ 新头', from: 4, why: '线索适用，数据支持适度调整', cost: '仍需防过拟合' },
  { id: 'many-far', data: '多', similarity: '低', title: '可比较全网微调', scope: '骨干全部层 ＋ 新头', from: 0, why: '任务差异大，需要更多层适应', cost: '训练开销更大' },
  { id: 'few-near', data: '少', similarity: '高', title: '优先冻结骨干', scope: '只训练新头', from: 5, why: '已有线索可复用，样本又少', cost: '骨干的适应空间受限' },
  { id: 'few-far', data: '少', similarity: '低', title: '先建基线，再谨慎试调', scope: '先新头 → 再尝试后段', from: 5, why: '需要适应，但样本少', cost: '贸然解冻易过拟合' },
] as const;
export interface StrategyMapPageProps { onComplete?: () => void; }
export function StrategyMapPage({ onComplete }: StrategyMapPageProps) {
  const [selected, setSelected] = useState<number | null>(null), [visited, setVisited] = useState<number[]>([]);
  const [trialStep, setTrialStep] = useState<0 | 1 | 2>(0);
  const complete = visited.length >= 2;
  useCompleteOnce(complete, onComplete);
  function choose(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 3) return;
    if (index === 3 && selected === 3) { advanceTrial(); return; }
    setSelected(index);
    if (index !== 3) setVisited(previous => previous.includes(index) ? previous : [...previous, index]);
  }
  function advanceTrial() {
    if (selected !== 3) return;
    const nextStep = trialStep === 0 ? 1 : trialStep === 1 ? 2 : 0;
    setTrialStep(nextStep);
    if (nextStep === 2) setVisited(previous => previous.includes(3) ? previous : [...previous, 3]);
  }
  const current = selected === null ? null : STRATEGY_CASES[selected];
  const trialScope = selected === 3 || visited.includes(3) || trialStep > 0 ? ['先冻结：只训新头', '再试调：Stage 4 ＋ 新头', '最后：比较验证表现与成本'][trialStep] : STRATEGY_CASES[3].scope;
  return <ContentBlock headingLevel={1} className="rtg-strategy" title="从条件，直接读出微调范围" subtitle="建议是试验起点，不是固定规则"
    data-selected={current?.id ?? ''} data-visited={visited.join(',')} data-complete={complete} data-trial-step={trialStep}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section className="rtg-strategy__map" aria-label="数据量与任务相似度二维决策卡">
      <div className="rtg-strategy__y-axis"><Typography variant="bodySmall" tone="accent">多</Typography><Typography variant="bodySmall" tone="accent">新数据量</Typography><Typography variant="bodySmall" tone="accent">少</Typography></div>
      <div className="rtg-strategy__matrix">{STRATEGY_CASES.map((item, index) => <article key={item.id} data-case-cell={index} data-lit={visited.includes(index) || selected === index} data-case-completed={visited.includes(index)} className={'rtg-strategy__cell' + (visited.includes(index) || selected === index ? ' is-lit' : '') + (selected === index ? ' is-selected' : '') + (index === 3 && selected === 3 ? ' has-trial-action' : '')}>
        {visited.includes(index) && <Typography as="span" variant="bodySmall" tone="accent" className="rtg-strategy__seen" data-case-check={index} aria-label={index === 3 ? '演示已完成' : '已查看'}>✓</Typography>}
        {selected === index && <svg className="rtg-strategy__pin" viewBox="0 0 48 48" aria-label="图钉：当前选中的条件" role="img">
          <ellipse className="pin-shadow" cx="22" cy="37" rx="11" ry="3" />
          <g transform="rotate(32 24 23)">
            <path className="pin-needle" d="M22.8 26H25.2L24 43Z" />
            <path className="pin-base" d="M18 20H30L34 27Q24 33 14 27Z" />
            <path className="pin-stem" d="M19 10H29V23Q24 26 19 23Z" />
            <ellipse className="pin-head-rim" cx="24" cy="11" rx="11" ry="4.5" />
            <ellipse className="pin-head-top" cx="24" cy="8.5" rx="11" ry="4.5" />
            <path className="pin-shine" d="M17 8Q23 5.5 29 8" />
          </g>
        </svg>}
        {index === 3 && selected === 3 && <Button className="rtg-strategy__trial-action" data-trial-next variant="primary" hint={trialStep < 2} aria-label={['下一步：试调后段', '下一步：验证比较', '重新演示④'][trialStep]} onClick={advanceTrial}>{['试调后段 →', '验证比较 →', '重新演示'][trialStep]}</Button>}
        <Button data-case={index} className="rtg-strategy__case-choice" aria-pressed={selected === index} onClick={() => choose(index)}
          aria-label={'数据' + item.data + '、相似度' + item.similarity + '：' + item.title + '；' + item.scope + (index === 3 ? (visited.includes(3) ? '；演示已完成' : '；演示尚未完成') + '；选中后每次点击推进一步，最后一步可重新演示' : visited.includes(index) ? '；已点亮' : '；点击点亮')}>
          <Typography as="strong" variant="body" tone={visited.includes(index) || selected === index ? 'accent' : 'muted'}>{['①', '②', '③', '④'][index] + ' ' + item.title}</Typography><Typography as="span" variant="bodySmall" tone={visited.includes(index) || selected === index ? 'accent' : 'muted'}>{index === 3 ? trialScope : item.scope}</Typography>
          {index !== 3 ? <ParameterRange compact trainableFrom={item.from} label={item.title + '的建议更新范围'} /> : trialStep < 2 ?
            <div className={'rtg-strategy__trial-live' + (trialStep === 1 ? ' is-tuning' : '')} data-trial-range>
              <ParameterRange compact trainableFrom={trialStep === 0 ? 5 : 4} label={trialStep === 0 ? '冻结基线：只训练新头' : '试调后段：Stage 4与新头，候选范围'} />
            </div> : <div className="rtg-strategy__trial-compare" data-trial-comparison aria-label="根据验证表现与训练成本选择冻结基线或后段试调，不预设胜出方案">
              <div data-trial-candidate="baseline"><Typography as="span" variant="bodySmall" tone="accent">冻结基线</Typography><ParameterRange compact trainableFrom={5} label="冻结基线：只训练新头" /></div>
              <Typography as="span" variant="bodySmall" tone="muted">或</Typography>
              <div className="is-candidate" data-trial-candidate="finetune"><Typography as="span" variant="bodySmall" tone="accent">后段试调</Typography><ParameterRange compact trainableFrom={4} label="后段试调：Stage 4与新头，候选方案" /></div>
            </div>}
        </Button>
      </article>)}</div>
      <div className="rtg-strategy__x-axis"><Typography variant="bodySmall" tone="accent">高</Typography><Typography variant="bodySmall" tone="accent">与预训练任务的相似度</Typography><Typography variant="bodySmall" tone="accent">低</Typography></div>
    </section>
    <section className="rtg-strategy__reason" role="status" aria-live="polite" aria-label="选择原因与代价">
      <Typography variant="body" tone="accent" align="center" data-reason>{current ? '原因：' + current.why : '点选条件，看看原因与代价。'}</Typography>
      <Typography variant="body" tone="warning" align="center" data-cost>{current ? '代价：' + current.cost : '④ 点击后，可分步观察。'}</Typography>
    </section>
    <footer className="rtg-strategy__footer">
      <Button data-reset onClick={() => { setTrialStep(0); setSelected(null); setVisited([]); }}>重新比较</Button></footer>
  </ContentBlock>;
}
