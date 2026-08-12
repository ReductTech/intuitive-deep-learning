import { Button, NoticeStrip, Typography } from '../../shared/react';
import { formatScore } from '../model/neuronMath';

export function BiasReveal({
  score,
  positiveLabel,
  negativeLabel,
  step,
  onAdvance,
}: {
  score: number;
  positiveLabel: string;
  negativeLabel: string;
  step: 0 | 1 | 2;
  onAdvance: (step: 1 | 2) => void;
}) {
  const centered = score - 1.5;
  const tendency = centered >= 0 ? positiveLabel : negativeLabel;
  return (
    <section className="ng-bias-lesson" aria-label="从判断门槛推导偏置">
      <div className="edu-formula-block ng-bias-animation-card">
        <div className="edu-formula ng-bias-animated-equation" aria-live="polite">
          <Typography as="span" variant="h3" tone="accent">w₁x₁ + w₂x₂ + w₃x₃</Typography>
          {step === 0 ? (
            <><Typography as="span" variant="h3" tone="accent">&gt;</Typography><Typography as="span" variant="h3" tone="warning">1.5</Typography></>
          ) : (
            <>
              <button
                className={`ng-bias-term${step === 1 ? ' is-ready' : ' is-bias-revealed'}`}
                type="button"
                disabled={step === 2}
                aria-label={step === 1 ? '点击负 1.5 认识偏置' : '偏置 b，等于负 1.5'}
                onClick={() => onAdvance(2)}
              >
                <Typography as="span" variant="h3" tone="accent" className="ng-bias-leading-plus" aria-hidden="true">+</Typography>
                <Typography as="span" variant="h3" tone="warning" className="ng-bias-original">−1.5</Typography>
                <Typography as="span" variant="h3" tone="inherit" className="ng-bias-symbol" aria-hidden="true">b</Typography>
              </button>
              <Typography as="span" variant="h3" tone="accent">&gt;</Typography><Typography as="span" variant="h3" tone="accent">0</Typography>
            </>
          )}
        </div>
        {step === 0 && <Button className="ng-bias-shift-button" variant="primary" onClick={() => onAdvance(1)}>把 1.5 移到左边</Button>}
        {step === 1 && <Typography as="span" variant="bodySmall" tone="warning" className="ng-bias-click-hint">点击 −1.5，改写成 b</Typography>}
      </div>
      {step === 2 && (
        <div className="ng-bias-reveal is-visible">
          <NoticeStrip className="ng-bias-notice">
            <Typography variant="bodySmall" tone="inherit"><Typography as="strong" variant="bodySmall" tone="inherit">这就是偏置 b。</Typography>令 b = −1.5 后，只需看输出正负即可判断倾向。</Typography>
          </NoticeStrip>
          <div className="edu-callout edu-callout--orange ng-multi-tendency">
            <Typography as="strong" variant="bodySmall" tone="inherit" className="edu-callout-label">当前结果</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit" className="edu-callout-text">z = {formatScore(score)} − 1.50 = {formatScore(centered)}，<Typography as="strong" variant="bodySmall" tone="inherit" className={`ng-tendency-highlight ${centered >= 0 ? 'ng-tendency-highlight--positive' : 'ng-tendency-highlight--negative'}`}>更倾向于“{tendency}”</Typography>。</Typography>
          </div>
        </div>
      )}
    </section>
  );
}
