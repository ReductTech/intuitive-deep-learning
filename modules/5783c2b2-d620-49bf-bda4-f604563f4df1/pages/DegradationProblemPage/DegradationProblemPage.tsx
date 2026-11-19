import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const trainingCurve = moduleAssetUrl("research/resnet-figure1-training-user.webp");
import './DegradationProblemPage.css';

const predictions = [
  { value: 'plain20', label: '20 层训练误差更低' },
  { value: 'plain56', label: '56 层训练误差更低' },
  { value: 'same', label: '两者训练误差相近' },
] as const;
type Prediction = typeof predictions[number]['value'];

function PaperIcon() {
  return <svg shuku-edit-id="e-a22ecb36-124a-4b9c-a237-1d384ff74157" viewBox="0 0 64 72" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path shuku-edit-id="e-f769c699-d86e-48d7-9176-0ec8ec2d1a1f" d="M12 3h28l13 13v52H12zM40 3v15h13M22 30h22M22 40h22M22 50h15" /><circle shuku-edit-id="e-8cab1d9e-da7c-42a6-b447-5fe5ed084b42" cx="48" cy="59" r="11" fill="#f6f8fc" /><path shuku-edit-id="e-018d4abf-e0d6-4400-a01a-43d3d40b1cf5" d="m44 59 3 3 6-7" /></svg>;
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

  return <ContentBlock shuku-edit-id="e-9901dcbb-e680-4200-aaa5-e33beabb9584" headingLevel={1} className="rtg-degradation" data-phase={revealed ? 'explanation' : 'prediction'} data-revealed={revealed} data-prediction={prediction ?? ''} data-complete={complete}
    title="想要更好的网络，只要堆更多的层就好了吗？"
    subtitle="先预测，再看原论文实验：20 层与 56 层普通网络，谁的训练误差更低？"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <section shuku-edit-id="e-6f9266cb-3804-41bf-a2a5-2ad71f3a7729" id="rtg-degradation-evidence" className={`rtg-degradation__evidence${revealed ? ' is-revealed' : ''}`} aria-label="原论文训练误差实验">
      <figure shuku-edit-id="e-2a86e57d-02d8-4910-b545-ea4c45a3820d" className="rtg-degradation__figure">
        <div shuku-edit-id="e-b7bfcc50-2b5b-41b2-88eb-f8614a80a798" className="rtg-degradation__figure-head">
          <Typography shuku-edit-id="e-31af00f7-6136-4a23-80db-1279a20929be" as="h2" variant="bodySmall" tone="accent">02 · 原论文实验</Typography>
          <Typography shuku-edit-id="e-8286c34e-ae4a-4fc9-8e4b-93bf5fd96c61" variant="bodySmall" tone="muted">CIFAR-10 · 普通网络</Typography>
        </div>
        <div shuku-edit-id="e-af06903c-ada2-4976-801d-f4cffdfee22a" className="rtg-degradation__plot-viewport">
          {revealed ? <img shuku-edit-id="e-f220202a-2d56-4b84-a78a-5ea127c3dadc" className="rtg-degradation__plot" src={trainingCurve} width={615} height={415} alt="原论文图1左图：CIFAR-10上20层和56层普通网络的训练误差曲线。红色56层曲线在训练后期高于黄绿色20层曲线。" />
          : <div shuku-edit-id="e-808b65a3-fe5b-47b6-bf5e-f4066bf7c321" className="rtg-degradation__curtain">
            <PaperIcon />
            <Typography shuku-edit-id="e-982a5ddf-ec44-4a4f-abb3-a2d8dd1d4359" variant="body" tone="accent">实验曲线，暂不揭示</Typography>
            <Typography shuku-edit-id="e-eb51e366-4a91-4c04-a5d2-0118339a02f2" variant="bodySmall" tone="muted">先做预测，再用真实证据检验。</Typography>
            <div shuku-edit-id="e-24e620d6-5cd8-47fe-adbd-817425fe61d5" className="rtg-degradation__sealed-rule" aria-hidden="true"><i shuku-edit-id="e-cfdb8688-e56d-4ae2-8932-3d27756ff6a2" /><i shuku-edit-id="e-9c821190-5da1-40f6-9a93-079777411b87" /><i shuku-edit-id="e-26316169-f8d9-4308-8e8e-eefc6d4fddad" /></div>
          </div>}
        </div>
        <figcaption shuku-edit-id="e-91228969-a99a-4306-94c3-a5ca490b5d45"><Typography shuku-edit-id="e-c67567ab-0e73-4e65-9913-ce915cfef1bc" variant="bodySmall" tone="muted"><a shuku-edit-id="e-dbfaf2d8-a659-45db-a090-ade420dece49" href="https://arxiv.org/abs/1512.03385" target="_blank" rel="noreferrer" aria-label="论文来源：He等，Deep Residual Learning for Image Recognition，Figure 1左图">来源：He 等，2015 · Figure 1（左）</a></Typography></figcaption>
      </figure>

      <div shuku-edit-id="e-82adc05a-34b0-4107-ba8b-6cf43a4b210e" className="rtg-degradation__analysis">
        <div shuku-edit-id="e-918ed2ce-1933-4835-a57e-c2d1bc18b898" className="rtg-degradation__analysis-head">
          <Typography shuku-edit-id="e-30d2eb97-e5fc-4795-aa91-629d0e1c5652" as="h2" variant="bodySmall" tone="accent">{revealed ? '03 · 实验解释' : '01 · 先做预测'}</Typography>
          {revealed && <Button onClick={resetPrediction} aria-label="重新预测并清除本页预测">重新预测</Button>}
        </div>

        {complete ? <section shuku-edit-id="e-9e04a496-6aab-4ae7-a0db-ab212488f177" className="rtg-degradation__conclusion" aria-labelledby="rtg-degradation-conclusion">
          <Typography shuku-edit-id="e-b1e4d0a4-7461-4441-8a43-0ce3046ef7e9" variant="bodySmall" tone="success">本次实验结果</Typography>
          <Typography shuku-edit-id="e-6364f418-2922-4d28-8a6d-341d6845aff4" as="h3" variant="body" tone="accent" id="rtg-degradation-conclusion" ref={conclusionHeading} tabIndex={-1}>56 层普通网络的训练误差更高</Typography>
          <div shuku-edit-id="e-3bb2d524-90ce-43e3-bddb-3d1abe9e8426" className="rtg-degradation__name"><span shuku-edit-id="e-a3cc8e22-cf5d-465d-9143-43f0b1024cd4" aria-hidden="true" /><Typography shuku-edit-id="e-aef3deec-90c9-485b-aecf-5f624b06efa7" as="h4" variant="h3" tone="danger">退化问题</Typography></div>
          <Typography shuku-edit-id="e-0668b0b1-cb83-4d45-8ece-3bd2e0fb932c" variant="bodySmall" tone="muted">更深，却连训练集也没有学得更好；这首先指向优化困难，不能只用典型过拟合解释。</Typography>
          <div shuku-edit-id="e-01e418a7-0744-4fcc-9ff6-96953f2d4df2" className="rtg-degradation__prediction-review">
            <Typography shuku-edit-id="e-ab1017b3-29a6-419d-baef-fa65efda8c68" variant="bodySmall" tone="accent">你的预测：{predictions.find(option => option.value === prediction)?.label}</Typography>
            <Typography shuku-edit-id="e-b2882110-498d-48b0-ba53-7f8bfbcc1e6a" variant="bodySmall" tone={predictionMatched ? 'success' : 'muted'}>{predictionMatched ? '与本次实验一致。' : '本次实验与你的预测不同。'}</Typography>
          </div>
        </section> : <div shuku-edit-id="e-59952f2d-4ed8-4274-9420-63258866559d" ref={predictionRegion} className="rtg-degradation__prediction">
          <Question key={attempt} type="choice" typeLabel="预测题"
            title="你预测哪一组的训练误差更低？" options={[...predictions]} answer="plain20"
            persistenceKey={`resnet-transfer-guide:11-degradation-problem:prediction:${questionSession}:${attempt}`}
            showFeedback={false} onCheck={choosePrediction} />
        </div>}
      </div>
    </section>

    <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-71366e90-50cb-4ec5-9485-a92ea4a521f9" variant="bodySmall" tone="inherit">{notice}</Typography></NoticeStrip>
  </ContentBlock>;
}
