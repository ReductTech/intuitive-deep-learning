import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './TwoProcessesPage.css';

const x0 = moduleAssetUrl("images/two-processes/x0.webp");
const x1 = moduleAssetUrl("images/two-processes/x1.webp");
const xt = moduleAssetUrl("images/two-processes/xt.webp");
const xT = moduleAssetUrl("images/two-processes/xt.webp");

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
    <ContentBlock shuku-edit-id="e-75f37b40-2c60-4e47-8841-bc06dce4206c"
      headingLevel={1}
      className="vg-shared-page vg-process-page"
      bodyClassName="vg-process-page__body"
      title="Diffusion 的核心：先加噪，再学会逆转"
      subtitle="同一张人脸，两条相反的路径。先观察图像怎样变成噪声，再看噪声怎样变成图像。"
    >
      <div shuku-edit-id="e-5988bc9e-0ab4-463f-9edb-b5ad8c8e0360" className="vg-process-page__stage" aria-live="polite">
        <section shuku-edit-id="e-b20ee300-4050-4daf-adc2-ccd93e39a96a" className="vg-process-page__lane vg-process-page__lane--forward" aria-label="前向加噪过程">
          <div shuku-edit-id="e-42350df3-070b-471b-bc3f-31afe6953334" className="vg-process-page__lane-intro">
            <Typography shuku-edit-id="e-19a23039-4710-4fbf-8cb8-cb6b2ade3444" as="span" variant="bodySmall" tone="accent" className="vg-process-page__eyebrow">过程 01 · 训练时构造</Typography>
            <Typography shuku-edit-id="e-14609576-6331-4ab4-b872-3b8247afa992" as="h2" variant="h2" tone="accent">前向加噪</Typography>
            <span shuku-edit-id="e-688b4f23-3f14-4581-81c3-4aec81d45d8f" className="vg-process-page__direction" aria-hidden="true">图像 <span shuku-edit-id="e-ff7369d1-6c95-4fb3-acda-471a8dc53e0b">⟶</span> 噪声</span>
          </div>
          <div shuku-edit-id="e-f3f10db9-721e-4990-8f01-09a693f0e675" className="vg-process-page__track vg-process-page__track--forward">
            {states.map((state, index) => (
              <div shuku-edit-id="e-5286be30-8367-4f3f-8224-186632cd0cd1" className="vg-process-page__node-slot" key={`forward-${state.math}-${index}`}>
                {index <= forwardStep && (
                  <figure shuku-edit-id="e-72bde970-16ca-4b12-8c02-49814cf53de7" className={`vg-process-page__node${index === forwardStep && phase === 'forward' ? ' is-current' : ''}`} aria-label={`${state.math}：${state.caption}`}>
                    <div shuku-edit-id="e-8f2f66a8-4979-4183-9105-24b47b70b2f0" className="vg-process-page__photo"><img shuku-edit-id="e-45a8660e-979e-42a1-a29b-48b437103ca8" src={state.image} alt={state.alt} /></div>
                    <figcaption shuku-edit-id="e-fe697ebc-b083-4a2c-96c5-708890b76632">
                      <Typography shuku-edit-id="e-05203786-d670-425d-89c3-eee66750966b" as="strong" variant="body" tone="main">{index === 3 ? <>x<sub shuku-edit-id="e-3efb1d08-2b30-4802-9fe4-a7e95173c998">T</sub></> : state.math}</Typography>
                    </figcaption>
                  </figure>
                )}
                {index < 3 && index + 1 <= forwardStep && (
                  <span shuku-edit-id="e-fc8bff7a-e079-4de5-8387-655b44ecc851" className="vg-process-page__connector vg-process-page__connector--forward" aria-hidden="true">
                    <Typography shuku-edit-id="e-58fe9944-d3e3-4635-9df3-edcc4940e4a4" as="span" variant="bodySmall" tone="inherit">加噪</Typography><b shuku-edit-id="e-34cc60b3-cfb0-4a85-a796-fcb475634dcd">⟶</b>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {showReverse && (
          <div shuku-edit-id="e-359efbbe-7793-4ba9-816f-155586633f95" className="vg-process-page__bridge">
            <span shuku-edit-id="e-356cc2ea-8a58-4982-8a50-991df0090252" className="vg-process-page__bridge-line" aria-hidden="true" />
            <Typography shuku-edit-id="e-921f4b4d-6814-4482-b85d-ee8067e1bcb5" as="strong" variant="bodySmall" tone="accent">前向加噪提供训练线索 · 学到的去噪器沿反方向生成</Typography>
            <span shuku-edit-id="e-9f5b12e9-b65f-406a-b232-29cc37e031a2" className="vg-process-page__bridge-line" aria-hidden="true" />
          </div>
        )}

        {showReverse && (
          <section shuku-edit-id="e-ca1ac190-be75-47f9-93cf-04a77aa852cf" className="vg-process-page__lane vg-process-page__lane--reverse" aria-label="反向去噪过程">
            <div shuku-edit-id="e-18ce2290-f774-4c42-9e7a-4b7c7facb3a2" className="vg-process-page__lane-intro">
              <Typography shuku-edit-id="e-0343cd0a-b932-42c5-8843-8a415620fd4e" as="span" variant="bodySmall" tone="success" className="vg-process-page__eyebrow">过程 02 · 生成时使用</Typography>
              <Typography shuku-edit-id="e-fd553905-1bac-4e51-838b-58ee18c390e2" as="h2" variant="h2" tone="success">反向去噪</Typography>
              <span shuku-edit-id="e-b4015118-1f53-448b-97a1-809a3dd54077" className="vg-process-page__direction" aria-hidden="true">图像 <span shuku-edit-id="e-3ee60be0-10e8-413e-886b-55771bb5d73c">⟵</span> 噪声</span>
            </div>
            <div shuku-edit-id="e-57b1812f-14e7-4717-9480-718bd530e2dd" className="vg-process-page__track vg-process-page__track--reverse">
              {states.map((state, index) => (
                <div shuku-edit-id="e-b40d6d23-627b-4e9c-a942-2434f5825751" className="vg-process-page__node-slot" key={`reverse-${state.math}-${index}`}>
                  {index >= reverseStep && (
                    <figure shuku-edit-id="e-9cd5cd70-f0d0-44b5-ae88-e2e9be9b0931" className={`vg-process-page__node${index === reverseStep && phase === 'reverse' ? ' is-current' : ''}`} aria-label={`${state.math}：${['生成图像', '逐渐清晰', '轮廓显现', '纯噪声'][index]}`}>
                      <div shuku-edit-id="e-d010574b-38dd-4c93-9722-de9158f76593" className="vg-process-page__photo"><img shuku-edit-id="e-301c1f8e-2644-4f72-a41b-f2e5fba39c62" src={state.image} alt={state.alt} /></div>
                      <figcaption shuku-edit-id="e-f6370c3c-40cc-4d07-a6b8-b22f671a98cf">
                        <Typography shuku-edit-id="e-33e48436-fd10-4084-984a-817108c576b8" as="strong" variant="body" tone="main">{index === 3 ? <>x<sub shuku-edit-id="e-4420599d-30ce-46f3-9e86-92eed5f79fc6">T</sub></> : state.math}</Typography>
                      </figcaption>
                    </figure>
                  )}
                  {index < 3 && index >= reverseStep && (
                    <span shuku-edit-id="e-f5c0e6f6-ffc7-490d-93c6-866472e7ad57" className="vg-process-page__connector vg-process-page__connector--reverse" aria-hidden="true">
                      <Typography shuku-edit-id="e-9b2955fc-ee14-4fe1-a7b5-46292649313e" as="span" variant="bodySmall" tone="inherit">去噪</Typography><b shuku-edit-id="e-60f76756-a1fd-49e4-b14c-81c1a2be16ed">⟵</b>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div shuku-edit-id="e-a1a7fba0-d35d-4537-a199-0e1aa1573a50" className={`vg-process-page__footer${isComplete ? ' is-complete' : ''}`}>
        <div shuku-edit-id="e-e702a6f6-3354-404f-9156-26abc8293069" className="vg-process-page__narration">
          <Typography shuku-edit-id="e-4dcb9ec0-7a5f-4992-9b4d-6c3287438d8f" as="span" variant="bodySmall" tone="muted" className="vg-process-page__chapter">
            {isComplete ? '两个方向，构成完整生成流程' : showReverse ? '正在理解反向过程' : '正在理解前向过程'}
          </Typography>
          <Typography shuku-edit-id="e-c3ec490b-c45e-4ca8-9079-d46c52908e74" as="strong" variant="body" tone="main">{status}</Typography>
          {isComplete && <Typography shuku-edit-id="e-b4503f2e-51a4-49cf-8b10-7097c3f33421" as="span" variant="bodySmall" tone="muted">同一人脸用于展示方向关系；实际生成并非精确还原训练图像。</Typography>}
        </div>
        <div shuku-edit-id="e-0b434315-834f-4836-b0e8-e117ae51e5c8" className="vg-process-page__actions">
          {controls}
        </div>
      </div>
    </ContentBlock>
  );
}
