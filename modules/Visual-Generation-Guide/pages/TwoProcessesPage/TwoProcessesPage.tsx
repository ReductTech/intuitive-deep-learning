import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import x0 from '../../assets/two-processes/x0.jpg';
import x1 from '../../assets/two-processes/x1.jpg';
import xt from '../../assets/two-processes/xt.jpg';
import xT from '../../assets/two-processes/xT.jpg';
import './TwoProcessesPage.css';

type Phase = 'ready' | 'forward' | 'forward-done' | 'reverse' | 'complete';

const states = [
  { image: x0, math: 'x₀', caption: '清晰图像', alt: '清晰的人脸' },
  { image: x1, math: 'x₁', caption: '加入少量噪声', alt: '稍有噪声的人脸' },
  { image: xt, math: 'xₜ', caption: '更多噪声', alt: '被更多噪声覆盖的人脸' },
  { image: xT, math: 'x_T', caption: '纯噪声', alt: '纯噪声图像' },
] as const;

const forwardCopy = [
  '一张真实图像，是前向过程的起点。',
  '每一步都加入一点噪声，图像信息开始减弱。',
  '重复许多步之后，人脸越来越难辨认。',
  '到终点时，图像变成了近乎纯粹的噪声。',
] as const;

const reverseCopy = [
  '去噪器反复工作，最终得到一张图像。',
  '继续去噪，清晰的人脸逐渐出现。',
  '去噪器预测更清晰的下一步。',
  '生成从一份随机噪声开始。',
] as const;

export interface TwoProcessesPageProps {
  onComplete?: () => void;
}

export function TwoProcessesPage({ onComplete }: TwoProcessesPageProps) {
  const { stage, controls } = useLecturePlayback(10, 1000);
  const phase: Phase = stage === 0 ? 'ready' : stage <= 4 ? 'forward' : stage === 5 ? 'forward-done' : stage < 9 ? 'reverse' : 'complete';
  const forwardStep = Math.min(3, Math.max(0, stage - 1));
  const reverseStep = stage <= 5 ? 3 : Math.max(0, 8 - stage);
  const completedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [phase, onComplete]);

  const showReverse = phase === 'forward-done' || phase === 'reverse' || phase === 'complete';
  const isComplete = phase === 'complete';
  const status = phase === 'ready'
    ? forwardCopy[0]
    : phase === 'forward'
      ? forwardCopy[forwardStep]
      : phase === 'forward-done'
        ? '前向加噪走完了。现在沿相反方向，从噪声开始生成。'
        : phase === 'reverse'
          ? reverseCopy[reverseStep]
          : 'Diffusion 有两个方向：训练时逐步加噪，生成时逐步去噪。';

  return (
    <ContentBlock
      headingLevel={1}
      className="vg-process-page"
      bodyClassName="vg-process-page__body"
      title="Diffusion 的核心：先加噪，再学会逆转"
      subtitle="同一张人脸，两条相反的路径。先观察图像怎样变成噪声，再看噪声怎样变成图像。"
    >
      <div className="vg-process-page__stage" aria-live="polite">
        <section className="vg-process-page__lane vg-process-page__lane--forward" aria-label="前向加噪过程">
          <div className="vg-process-page__lane-intro">
            <Typography as="span" variant="bodySmall" tone="accent" className="vg-process-page__eyebrow">过程 01 · 训练时构造</Typography>
            <Typography as="h2" variant="h2" tone="accent">前向加噪</Typography>
            <span className="vg-process-page__direction" aria-hidden="true">图像 <span>⟶</span> 噪声</span>
          </div>
          <div className="vg-process-page__track vg-process-page__track--forward">
            {states.map((state, index) => (
              <div className="vg-process-page__node-slot" key={`forward-${state.math}-${index}`}>
                {index <= forwardStep && (
                  <figure className={`vg-process-page__node${index === forwardStep && phase === 'forward' ? ' is-current' : ''}`} aria-label={`${state.math}：${state.caption}`}>
                    <div className="vg-process-page__photo"><img src={state.image} alt={state.alt} /></div>
                    <figcaption>
                      <Typography as="strong" variant="body" tone="main">{index === 3 ? <>x<sub>T</sub></> : state.math}</Typography>
                    </figcaption>
                  </figure>
                )}
                {index < 3 && index + 1 <= forwardStep && (
                  <span className="vg-process-page__connector vg-process-page__connector--forward" aria-hidden="true">
                    <Typography as="span" variant="bodySmall" tone="inherit">加噪</Typography><b>⟶</b>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {showReverse && (
          <div className="vg-process-page__bridge">
            <span className="vg-process-page__bridge-line" aria-hidden="true" />
            <Typography as="strong" variant="bodySmall" tone="accent">前向加噪提供训练线索 · 学到的去噪器沿反方向生成</Typography>
            <span className="vg-process-page__bridge-line" aria-hidden="true" />
          </div>
        )}

        {showReverse && (
          <section className="vg-process-page__lane vg-process-page__lane--reverse" aria-label="反向去噪过程">
            <div className="vg-process-page__lane-intro">
              <Typography as="span" variant="bodySmall" tone="success" className="vg-process-page__eyebrow">过程 02 · 生成时使用</Typography>
              <Typography as="h2" variant="h2" tone="success">反向去噪</Typography>
              <span className="vg-process-page__direction" aria-hidden="true">图像 <span>⟵</span> 噪声</span>
            </div>
            <div className="vg-process-page__track vg-process-page__track--reverse">
              {states.map((state, index) => (
                <div className="vg-process-page__node-slot" key={`reverse-${state.math}-${index}`}>
                  {index >= reverseStep && (
                    <figure className={`vg-process-page__node${index === reverseStep && phase === 'reverse' ? ' is-current' : ''}`} aria-label={`${state.math}：${['生成图像', '逐渐清晰', '轮廓显现', '纯噪声'][index]}`}>
                      <div className="vg-process-page__photo"><img src={state.image} alt={state.alt} /></div>
                      <figcaption>
                        <Typography as="strong" variant="body" tone="main">{index === 3 ? <>x<sub>T</sub></> : state.math}</Typography>
                      </figcaption>
                    </figure>
                  )}
                  {index < 3 && index >= reverseStep && (
                    <span className="vg-process-page__connector vg-process-page__connector--reverse" aria-hidden="true">
                      <Typography as="span" variant="bodySmall" tone="inherit">去噪</Typography><b>⟵</b>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className={`vg-process-page__footer${isComplete ? ' is-complete' : ''}`}>
        <div className="vg-process-page__narration">
          <Typography as="span" variant="bodySmall" tone="muted" className="vg-process-page__chapter">
            {isComplete ? '两个方向，构成完整生成流程' : showReverse ? '正在理解反向过程' : '正在理解前向过程'}
          </Typography>
          <Typography as="strong" variant="body" tone="main">{status}</Typography>
          {isComplete && <Typography as="span" variant="bodySmall" tone="muted">同一人脸用于展示方向关系；实际生成并非精确还原训练图像。</Typography>}
        </div>
        <div className="vg-process-page__actions">
          {controls}
        </div>
      </div>
    </ContentBlock>
  );
}
