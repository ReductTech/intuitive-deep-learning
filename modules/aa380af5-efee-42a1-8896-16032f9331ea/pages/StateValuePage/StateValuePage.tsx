import { Button, ContentBlock, Typography } from '../../../shared/react';
import { Formula } from '../../components/LessonPrimitives';
import { ExperienceMap, ExperienceEstimate, ReturnDistribution } from '../../components/PolicyExperience';
import { usePolicyExperience } from '../../components/usePolicyExperience';
import { experienceMean, type EvaluationPolicy } from '../../components/policyEvaluation';
import './StateValuePage.css';

function PolicyComparison({ policy }: { policy: EvaluationPolicy }) {
  const sampling = usePolicyExperience(policy);
  return <section className={'vbrl-experience-panel vbrl-value__policy--' + policy} aria-label={(policy === 'safe' ? '安全' : '随机') + '策略的实际送货样本'}>
    <header className="vbrl-experience-panel__head"><Typography as="h2" variant="h3" tone="inherit">{policy === 'safe' ? '安全策略' : '随机策略'}</Typography>
      <div className="vbrl-value__sampling"><Formula latex={'\\pi_{\\mathrm{' + policy + '}}'} />
        <Button variant="primary" disabled={sampling.pending && sampling.record} onClick={() => sampling.addBatch()}>{sampling.samples.length ? '再采样 10 次' : '采样 10 次'}</Button>
      </div></header>
    <div className="vbrl-experience-panel__body" ref={sampling.rootRef} data-policy={policy} data-count={sampling.samples.length}
      data-cursor={sampling.cursor} data-playing={sampling.playing} data-pending={sampling.pending} data-mean={experienceMean(sampling.samples)}>
      <div className="vbrl-experience-panel__scene">
        <ExperienceMap experience={sampling.active} cursor={sampling.cursor} />
        <div className="vbrl-experience-results">
          <Typography className="vbrl-experience-policy-copy" variant="bodySmall" tone="accent">{policy === 'safe'
            ? '80% 朝终点方向走\n20% 在安全方向中随机'
            : '上、右、下、左\n每一步各有 25% 概率'}</Typography>
          <ExperienceEstimate samples={sampling.samples} symbol={String.raw`\widehat V_\pi(s)`} />
          <ReturnDistribution samples={sampling.samples} active={sampling.active} disabled={sampling.pending && sampling.record} onSelect={sampling.replay} />
        </div>
      </div>
    </div>
  </section>;
}

export function StateValuePage() {
  return <ContentBlock className="vbrl-value vbrl-state-value" title="状态价值：站在这里，未来大概有多好？"
    subtitle="状态价值是在给定策略下，从某个状态出发能获得的期望回报。" headingLevel={1}>
    <div className="vbrl-value__comparison"><PolicyComparison policy="safe" /><PolicyComparison policy="random" /></div>
    <section className="vbrl-value__definition" aria-label="状态价值定义">
      <Formula latex={String.raw`V_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s]`} />
      <Typography variant="bodySmall" tone="accent">样本均值估计 V；策略固定，经历仍可能不同。</Typography>
    </section>
  </ContentBlock>;
}
