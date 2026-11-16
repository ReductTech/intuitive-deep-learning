import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { Formula } from '../../components/LessonPrimitives';
import { ExperienceMap, ExperienceEstimate, ReturnDistribution } from '../../components/PolicyExperience';
import { usePolicyExperience } from '../../components/usePolicyExperience';
import { experienceMean, type EvaluationPolicy } from '../../components/policyEvaluation';
import './StateValuePage.css';

function PolicyComparison({ policy }: { policy: EvaluationPolicy }) {
  const sampling = usePolicyExperience(policy);
  return <section shuku-edit-id="e-34ddb7c2-5563-45f2-a9f3-edfae0a5a655" className={'vbrl-experience-panel vbrl-value__policy--' + policy} aria-label={(policy === 'safe' ? '安全' : '随机') + '策略的实际送货样本'}>
    <header shuku-edit-id="e-b467bb25-ca26-4e3c-b36a-0cfa01b67062" className="vbrl-experience-panel__head"><Typography shuku-edit-id="e-54e567a9-a717-4931-9f23-89dceb368fa3" as="h2" variant="h3" tone="inherit">{policy === 'safe' ? '安全策略' : '随机策略'}</Typography>
      <div shuku-edit-id="e-1a9f2aae-5c53-4760-bcbb-d8ab513d12ff" className="vbrl-value__sampling"><Formula latex={'\\pi_{\\mathrm{' + policy + '}}'} />
        <Button variant="primary" disabled={sampling.pending && sampling.record} onClick={() => sampling.addBatch()}>{sampling.samples.length ? '再采样 10 次' : '采样 10 次'}</Button>
      </div></header>
    <div shuku-edit-id="e-fd1588a0-6244-4700-9ed2-7647d0670d05" className="vbrl-experience-panel__body" ref={sampling.rootRef} data-policy={policy} data-count={sampling.samples.length}
      data-cursor={sampling.cursor} data-playing={sampling.playing} data-pending={sampling.pending} data-mean={experienceMean(sampling.samples)}>
      <div shuku-edit-id="e-00577dc3-45d8-4284-8f49-3a077b724d77" className="vbrl-experience-panel__scene">
        <ExperienceMap experience={sampling.active} cursor={sampling.cursor} />
        <div shuku-edit-id="e-5f4cdd2e-b10b-4a1f-80a6-77a8c2949351" className="vbrl-experience-results">
          <Typography shuku-edit-id="e-666d99a7-02df-4e09-b566-c1a380af4903" className="vbrl-experience-policy-copy" variant="bodySmall" tone="accent">{policy === 'safe'
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
  return <ContentBlock shuku-edit-id="e-e663db26-4d6f-48b3-9c64-1063945b7e1f" className="vbrl-value vbrl-state-value" title="状态价值：站在这里，未来大概有多好？"
    subtitle="状态价值是在给定策略下，从某个状态出发能获得的期望回报。" headingLevel={1}>
    <div shuku-edit-id="e-ad868bb6-035d-4631-ba56-0683e4b8b38a" className="vbrl-value__comparison"><PolicyComparison policy="safe" /><PolicyComparison policy="random" /></div>
    <section shuku-edit-id="e-61aa5254-1630-40be-8b15-f744a49acb7c" className="vbrl-value__definition" aria-label="状态价值定义">
      <Formula latex={String.raw`V_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s]`} />
      <Typography shuku-edit-id="e-60c7b686-245f-4d45-af3b-dd16b6c21c36" variant="bodySmall" tone="accent">样本均值估计 V；策略固定，经历仍可能不同。</Typography>
    </section>
  </ContentBlock>;
}
