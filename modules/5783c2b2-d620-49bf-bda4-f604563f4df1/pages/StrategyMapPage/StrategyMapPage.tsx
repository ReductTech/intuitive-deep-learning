// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-ba5a1eb3-906d-43be-8940-78bacd52abf0" headingLevel={1} className="rtg-strategy" title="从条件，直接读出微调范围" subtitle="建议是试验起点，不是固定规则"
    data-selected={current?.id ?? ''} data-visited={visited.join(',')} data-complete={complete} data-trial-step={trialStep}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section shuku-edit-id="e-70bed85a-f491-478f-80f6-5f9a0bc2632d" className="rtg-strategy__map" aria-label="数据量与任务相似度二维决策卡">
      <div shuku-edit-id="e-c4e1da80-308f-4c27-aebb-a22d7b6006e3" className="rtg-strategy__y-axis"><Typography shuku-edit-id="e-5d7caf03-bae2-429c-915a-ecc62f8f2b93" variant="bodySmall" tone="accent">多</Typography><Typography shuku-edit-id="e-eab604be-de70-41f4-8f20-daaf0620ce34" variant="bodySmall" tone="accent">新数据量</Typography><Typography shuku-edit-id="e-6c72b91d-2cc5-45d3-8939-b5605828fb68" variant="bodySmall" tone="accent">少</Typography></div>
      <div shuku-edit-id="e-e899d5b8-162c-47ec-bde2-b2cb1a4d07c3" className="rtg-strategy__matrix">{STRATEGY_CASES.map((item, index) => <article shuku-edit-id="e-28eb456b-7bdb-498f-96e6-19e32797bdac" key={item.id} data-case-cell={index} data-lit={visited.includes(index) || selected === index} data-case-completed={visited.includes(index)} className={'rtg-strategy__cell' + (visited.includes(index) || selected === index ? ' is-lit' : '') + (selected === index ? ' is-selected' : '') + (index === 3 && selected === 3 ? ' has-trial-action' : '')}>
        {visited.includes(index) && <Typography shuku-edit-id="e-3a1f89c1-4500-4e39-b9e0-893f20c6f969" as="span" variant="bodySmall" tone="accent" className="rtg-strategy__seen" data-case-check={index} aria-label={index === 3 ? '演示已完成' : '已查看'}>✓</Typography>}
        {selected === index && <svg shuku-edit-id="e-c164d305-02d4-497c-9e6c-c1f47e05a364" className="rtg-strategy__pin" viewBox="0 0 48 48" aria-label="图钉：当前选中的条件" role="img">
          <ellipse shuku-edit-id="e-19aebc7a-5b7c-4377-83f2-513de0ea49d2" className="pin-shadow" cx="22" cy="37" rx="11" ry="3" />
          <g shuku-edit-id="e-68c60f7e-a905-4af5-8eed-a6a1ee40ff9c" transform="rotate(32 24 23)">
            <path shuku-edit-id="e-5b5de89b-19f4-4826-b2b1-84dde9ee33d7" className="pin-needle" d="M22.8 26H25.2L24 43Z" />
            <path shuku-edit-id="e-20cc6c67-42e8-44eb-a017-8cc5cf95a965" className="pin-base" d="M18 20H30L34 27Q24 33 14 27Z" />
            <path shuku-edit-id="e-53418923-56cf-4b6a-b8ef-59847fc9b74b" className="pin-stem" d="M19 10H29V23Q24 26 19 23Z" />
            <ellipse shuku-edit-id="e-66dda56f-8b03-4b8f-8fd7-7df64996f931" className="pin-head-rim" cx="24" cy="11" rx="11" ry="4.5" />
            <ellipse shuku-edit-id="e-bccab2a1-4a6e-4e42-8b81-15199612f505" className="pin-head-top" cx="24" cy="8.5" rx="11" ry="4.5" />
            <path shuku-edit-id="e-34949394-921f-4598-a3ad-599184b9232e" className="pin-shine" d="M17 8Q23 5.5 29 8" />
          </g>
        </svg>}
        {index === 3 && selected === 3 && <Button className="rtg-strategy__trial-action" data-trial-next variant="primary" hint={trialStep < 2} aria-label={['下一步：试调后段', '下一步：验证比较', '重新演示④'][trialStep]} onClick={advanceTrial}>{['试调后段 →', '验证比较 →', '重新演示'][trialStep]}</Button>}
        <Button data-case={index} className="rtg-strategy__case-choice" aria-pressed={selected === index} onClick={() => choose(index)}
          aria-label={'数据' + item.data + '、相似度' + item.similarity + '：' + item.title + '；' + item.scope + (index === 3 ? (visited.includes(3) ? '；演示已完成' : '；演示尚未完成') + '；选中后每次点击推进一步，最后一步可重新演示' : visited.includes(index) ? '；已点亮' : '；点击点亮')}>
          <Typography shuku-edit-id="e-e5b4014a-a1c9-4f86-94a5-52930e5a039c" as="strong" variant="body" tone={visited.includes(index) || selected === index ? 'accent' : 'muted'}>{['①', '②', '③', '④'][index] + ' ' + item.title}</Typography><Typography shuku-edit-id="e-3503dd9e-bf16-4f53-9567-102462a9a9cd" as="span" variant="bodySmall" tone={visited.includes(index) || selected === index ? 'accent' : 'muted'}>{index === 3 ? trialScope : item.scope}</Typography>
          {index !== 3 ? <ParameterRange compact trainableFrom={item.from} label={item.title + '的建议更新范围'} /> : trialStep < 2 ?
            <div shuku-edit-id="e-0d4d751c-1ce9-4f57-b8ee-8807e0bdb431" className={'rtg-strategy__trial-live' + (trialStep === 1 ? ' is-tuning' : '')} data-trial-range>
              <ParameterRange compact trainableFrom={trialStep === 0 ? 5 : 4} label={trialStep === 0 ? '冻结基线：只训练新头' : '试调后段：Stage 4与新头，候选范围'} />
            </div> : <div shuku-edit-id="e-2dc99fbb-306f-439a-a93a-e3ff3ed54f93" className="rtg-strategy__trial-compare" data-trial-comparison aria-label="根据验证表现与训练成本选择冻结基线或后段试调，不预设胜出方案">
              <div shuku-edit-id="e-cc6c1700-846a-4f69-8175-3ceefa7811b1" data-trial-candidate="baseline"><Typography shuku-edit-id="e-05a9df79-10a8-4d53-a58e-d5d1f2241b01" as="span" variant="bodySmall" tone="accent">冻结基线</Typography><ParameterRange compact trainableFrom={5} label="冻结基线：只训练新头" /></div>
              <Typography shuku-edit-id="e-e94e3d61-571e-43e3-9c08-ab2195e88142" as="span" variant="bodySmall" tone="muted">或</Typography>
              <div shuku-edit-id="e-5c22b86f-b74e-4bae-bff3-47e39741a76f" className="is-candidate" data-trial-candidate="finetune"><Typography shuku-edit-id="e-502565d6-d9eb-43fb-9300-49641c421106" as="span" variant="bodySmall" tone="accent">后段试调</Typography><ParameterRange compact trainableFrom={4} label="后段试调：Stage 4与新头，候选方案" /></div>
            </div>}
        </Button>
      </article>)}</div>
      <div shuku-edit-id="e-1cde49c8-fb22-4c06-be47-e1354beacf0c" className="rtg-strategy__x-axis"><Typography shuku-edit-id="e-bc02f7fc-9237-4ed6-b9d7-4c54dcd98367" variant="bodySmall" tone="accent">高</Typography><Typography shuku-edit-id="e-e346133a-9f15-4ff5-bb19-6d426838608c" variant="bodySmall" tone="accent">与预训练任务的相似度</Typography><Typography shuku-edit-id="e-d211f24b-15b7-4e0c-9541-0dd81bad93be" variant="bodySmall" tone="accent">低</Typography></div>
    </section>
    <section shuku-edit-id="e-10201106-90d6-40eb-9f08-bd5f61ff7d58" className="rtg-strategy__reason" role="status" aria-live="polite" aria-label="选择原因与代价">
      <Typography shuku-edit-id="e-995eacb5-00cf-425a-a070-b92791bac6e3" variant="body" tone="accent" align="center" data-reason>{current ? '原因：' + current.why : '点选条件，看看原因与代价。'}</Typography>
      <Typography shuku-edit-id="e-4bec6510-b634-40b6-bce7-d5396a794bb2" variant="body" tone="warning" align="center" data-cost>{current ? '代价：' + current.cost : '④ 点击后，可分步观察。'}</Typography>
    </section>
    <footer shuku-edit-id="e-b03035ed-6f6e-43f3-9aa5-7588c52eccc0" className="rtg-strategy__footer">
      <Button data-reset onClick={() => { setTrialStep(0); setSelected(null); setVisited([]); }}>重新比较</Button></footer>
  </ContentBlock>;
}
