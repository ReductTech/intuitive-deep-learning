import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Question, Typography, type QuestionCheckResult } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const trainingCurve = moduleAssetUrl(moduleIdentity.id, "research/resnet-figure1-training-user.png");
import './DegradationProblemPage.css';

const predictions = [
  { value: 'plain20', label: '20 层训练误差更低' },
  { value: 'plain56', label: '56 层训练误差更低' },
  { value: 'same', label: '两者训练误差相近' },
] as const;
type Prediction = typeof predictions[number]['value'];

function PaperIcon() {
  return <svg viewBox="0 0 64 72" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3h28l13 13v52H12zM40 3v15h13M22 30h22M22 40h22M22 50h15" /><circle cx="48" cy="59" r="11" fill="#f6f8fc" /><path d="m44 59 3 3 6-7" /></svg>;
}

export interface DegradationProblemPageProps { onComplete?: () => void; }

export function DegradationProblemPage({ onComplete }: DegradationProblemPageProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [questionSession] = useState(() => String(Date.now()));
  const [attempt, setAttempt] = useState(0);
  const predictionRegion = useRef<HTMLDivElement | null>(null);
  const focusPrediction = useRef(false);
  const conclusionHeading = useRef<HTMLHeadingElement | null>(null);
  const revealed = prediction !== null;
  const complete = revealed;
  const predictionMatched = prediction === 'plain20';
  const notice = revealed
    ? '本次观察完成：层数增加，不代表更容易训练好。'
    : '先在右侧留下预测；选定后查看原论文曲线。';

  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    if (complete) conclusionHeading.current?.focus({ preventScroll: true });
    else if (focusPrediction.current) {
      focusPrediction.current = false;
      predictionRegion.current?.querySelector<HTMLButtonElement>('.dl-question-option')?.focus({ preventScroll: true });
    }
  }, [complete, attempt]);

  function choosePrediction(result: QuestionCheckResult) {
    const value = result.answer[0];
    if (!revealed && !result.empty && predictions.some(option => option.value === value)) {
      setPrediction(value as Prediction);
    }
  }

  function resetPrediction() {
    focusPrediction.current = true;
    setPrediction(null);
    setAttempt(current => current + 1);
  }

  return <ContentBlock headingLevel={1} className="rtg-degradation" data-phase={revealed ? 'explanation' : 'prediction'} data-revealed={revealed} data-prediction={prediction ?? ''} data-complete={complete}
    title="想要更好的网络，只要堆更多的层就好了吗？"
    subtitle="先预测，再看原论文实验：20 层与 56 层普通网络，谁的训练误差更低？"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <section id="rtg-degradation-evidence" className={`rtg-degradation__evidence${revealed ? ' is-revealed' : ''}`} aria-label="原论文训练误差实验">
      <figure className="rtg-degradation__figure">
        <div className="rtg-degradation__figure-head">
          <Typography as="h2" variant="bodySmall" tone="accent">02 · 原论文实验</Typography>
          <Typography variant="bodySmall" tone="muted">CIFAR-10 · 普通网络</Typography>
        </div>
        <div className="rtg-degradation__plot-viewport">
          {revealed ? <img className="rtg-degradation__plot" src={trainingCurve} width={615} height={415} alt="原论文图1左图：CIFAR-10上20层和56层普通网络的训练误差曲线。红色56层曲线在训练后期高于黄绿色20层曲线。" />
          : <div className="rtg-degradation__curtain">
            <PaperIcon />
            <Typography variant="body" tone="accent">实验曲线，暂不揭示</Typography>
            <Typography variant="bodySmall" tone="muted">先做预测，再用真实证据检验。</Typography>
            <div className="rtg-degradation__sealed-rule" aria-hidden="true"><i /><i /><i /></div>
          </div>}
        </div>
        <figcaption><Typography variant="bodySmall" tone="muted"><a href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer" aria-label="论文来源：He等，Deep Residual Learning for Image Recognition，Figure 1左图">来源：He 等，2015 · Figure 1（左）</a></Typography></figcaption>
      </figure>

      <div className="rtg-degradation__analysis">
        <div className="rtg-degradation__analysis-head">
          <Typography as="h2" variant="bodySmall" tone="accent">{revealed ? '03 · 实验解释' : '01 · 先做预测'}</Typography>
          {revealed && <Button onClick={resetPrediction} aria-label="重新预测并清除本页预测">重新预测</Button>}
        </div>

        {complete ? <section className="rtg-degradation__conclusion" aria-labelledby="rtg-degradation-conclusion">
          <Typography variant="bodySmall" tone="success">本次实验结果</Typography>
          <Typography as="h3" variant="body" tone="accent" id="rtg-degradation-conclusion" ref={conclusionHeading} tabIndex={-1}>56 层普通网络的训练误差更高</Typography>
          <div className="rtg-degradation__name"><span aria-hidden="true" /><Typography as="h4" variant="h3" tone="danger">退化问题</Typography></div>
          <Typography variant="bodySmall" tone="muted">更深，却连训练集也没有学得更好；这首先指向优化困难，不能只用典型过拟合解释。</Typography>
          <div className="rtg-degradation__prediction-review">
            <Typography variant="bodySmall" tone="accent">你的预测：{predictions.find(option => option.value === prediction)?.label}</Typography>
            <Typography variant="bodySmall" tone={predictionMatched ? 'success' : 'muted'}>{predictionMatched ? '与本次实验一致。' : '本次实验与你的预测不同。'}</Typography>
          </div>
        </section> : <div ref={predictionRegion} className="rtg-degradation__prediction">
          <Question key={attempt} type="choice" typeLabel="预测题"
            title="你预测哪一组的训练误差更低？" options={[...predictions]} answer="plain20"
            persistenceKey={`resnet-transfer-guide:11-degradation-problem:prediction:${questionSession}:${attempt}`}
            showFeedback={false} onCheck={choosePrediction} />
        </div>}
      </div>
    </section>

    <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite"><Typography variant="bodySmall" tone="inherit">{notice}</Typography></NoticeStrip>
  </ContentBlock>;
}
