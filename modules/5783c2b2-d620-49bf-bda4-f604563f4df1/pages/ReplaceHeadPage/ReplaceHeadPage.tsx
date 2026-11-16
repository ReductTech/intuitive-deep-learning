import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { useTeachingPlayback } from '../../hooks/useTeachingPlayback';
const bottle = moduleAssetUrl("recycling/bottle-upright.jpg");
const can = moduleAssetUrl("recycling/can-upright.jpg");
const carton = moduleAssetUrl("recycling/carton-upright.jpg");
import './ReplaceHeadPage.css';

const samples = [
  { id: 'bottle', label: '塑料瓶', image: bottle, scores: [2.8, .5, -.2] },
  { id: 'can', label: '易拉罐', image: can, scores: [.3, 2.6, .1] },
  { id: 'carton', label: '纸盒', image: carton, scores: [-.1, .4, 2.5] },
] as const;
const classNames = ['塑料瓶', '易拉罐', '纸盒'];

export interface ReplaceHeadPageProps { onComplete?: () => void; }

export function ReplaceHeadPage({ onComplete }: ReplaceHeadPageProps) {
  const [phase, setPhase] = useState<'old' | 'removing' | 'removed' | 'new'>('old');
  const removal = useTeachingPlayback(320);
  const removalStarted = useRef(false);
  const [sampleId, setSampleId] = useState<(typeof samples)[number]['id']>('bottle');
  const [tested, setTested] = useState<Set<string>>(() => new Set());
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);
  const sample = samples.find((item) => item.id === sampleId)!;
  const testedAll = tested.size === samples.length;
  const complete = phase === 'new' && testedAll && Boolean(questionResult?.ok);
  useCompleteOnce(complete, onComplete);
  useEffect(() => { if (phase === 'removing' && removal.frame === 3) setPhase('removed'); }, [phase, removal.frame]);

  function removeOldHead() {
    if (phase !== 'old' || removalStarted.current) return;
    removalStarted.current = true;
    setPhase('removing'); removal.play();
  }

  const test = (id: (typeof samples)[number]['id']) => { if (phase !== 'new') return; setSampleId(id); setTested((current) => new Set([...current, id])); };

  return (
    <ContentBlock shuku-edit-id="e-a6702a06-7d1f-4fd8-be0d-1e6a7c9e1635" headingLevel={1} className="rtg-replace-head" title="旧分类头会答旧问题，怎样让它答新问题？" subtitle="保留预训练视觉骨干，只替换负责输出类别分数的最后一段。" data-phase={phase} data-removal-frame={removal.frame} data-complete={complete} onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.stopPropagation(); }}>
      <section shuku-edit-id="e-49823239-e86e-48c3-82c2-5d18c1ddbb84" className={`rtg-replace-head__lab${testedAll ? ' has-bottom-panel' : ''}`} aria-label="替换分类头实验">
        <div shuku-edit-id="e-bc465867-c470-48e7-a740-520a686cf4a9" className="rtg-replace-head__samples">
          <Typography shuku-edit-id="e-bb1bea25-74f0-4d6c-af5d-c440d569eeb1" as="strong" variant="body" tone="warning">新任务输入</Typography>
          {samples.map((item) => <Button key={item.id} data-sample-id={item.id} variant={sampleId === item.id ? 'primary' : 'default'} active={sampleId === item.id} disabled={phase !== 'new'} onClick={() => test(item.id)}><img shuku-edit-id="e-7b303006-f83d-4897-be7f-dd3e27d2f8b2" src={item.image} alt="" aria-hidden="true" /><Typography shuku-edit-id="e-7bba2e94-3882-4518-b325-b7318b8b2a0b" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}
          <Typography shuku-edit-id="e-41aacb95-9925-4c0e-bb75-95a57e12c7aa" variant="bodySmall" tone="muted">接入新分类头后，依次检查三类样本。</Typography>
        </div>

        <div shuku-edit-id="e-e485c5f6-7696-4802-a472-f5081b65db0f" className="rtg-replace-head__model">
          <article shuku-edit-id="e-3b1abafb-6344-4720-b747-05252c95bf18" className="rtg-replace-head__backbone" data-retained-backbone><Typography shuku-edit-id="e-91c7aa0b-f0f4-4b08-a4e4-2349091ae657" variant="bodySmall" tone="accent">保留结构与预训练参数</Typography><Typography shuku-edit-id="e-a2ec40a9-b1ac-4b7e-a61b-c95c513756e7" as="strong" variant="h2" tone="accent">预训练 ResNet-18</Typography><div shuku-edit-id="e-12e9fd07-57b3-4b21-8a1e-5dd599ddad9c">{['边缘','纹理','部件','结构'].map((label) => <Typography shuku-edit-id="e-3c446be4-2ebb-48c4-a2b5-212fdeea09b7" as="span" variant="bodySmall" tone="accent" key={label}>{label}</Typography>)}</div></article>
          <Typography shuku-edit-id="e-56dcb317-bb44-45fb-a1e3-c5f23e369f7a" as="span" className="rtg-replace-head__connection" data-connected={phase === 'old' || phase === 'new'} variant="h2" tone="warning">→</Typography>
          <div shuku-edit-id="e-47df8c37-7844-406f-9939-cb790e220bf2" className={'rtg-replace-head__head-slot is-' + phase} aria-busy={phase === 'removing'}>
          <article shuku-edit-id="e-7e8c29a8-89da-4d63-88b4-3d3c5f6763c2" className={`rtg-replace-head__head is-${phase}`}>
            {(phase === 'old' || phase === 'removing') && <><Typography shuku-edit-id="e-17d5eac3-2f30-491c-8c08-229b391cb4f5" variant="bodySmall" tone="warning">旧分类头 · 仅替换这里</Typography><Typography shuku-edit-id="e-5003b897-e3ea-4262-89e7-dafe325211dc" as="strong" variant="h3" tone="accent">它属于哪个旧类别？</Typography><Typography shuku-edit-id="e-995d6c99-acd4-485e-a33b-5b257a46186c" variant="bodySmall" tone="muted">例如：猫、狗、汽车</Typography><Typography shuku-edit-id="e-fda842d1-d77e-4f82-88cb-fe6ee556d87c" variant="bodySmall" tone="accent">输出旧类别分数</Typography></>}
            {phase === 'removed' && <><Typography shuku-edit-id="e-9c304de3-1424-4561-9238-568b49b741d2" variant="bodySmall" tone="warning">接口空缺</Typography><Typography shuku-edit-id="e-521b5288-4178-4b76-b07f-c05c8e000de4" as="strong" variant="h2" tone="muted">?</Typography><Typography shuku-edit-id="e-5b544f3e-297c-4454-aa84-21dccdeaef6c" variant="bodySmall" tone="muted">骨干仍输出特征 z</Typography></>}
            {phase === 'new' && <><Typography shuku-edit-id="e-d36414af-f013-4f2a-a575-57d220108923" variant="bodySmall" tone="warning">新分类头</Typography><Typography shuku-edit-id="e-a3427cd0-1918-4f29-9793-a819ee889d5c" as="strong" variant="h3" tone="success">3 类分数</Typography><Typography shuku-edit-id="e-4691eae6-acf0-45d2-a71a-ddf7bcf553c5" variant="bodySmall" tone="muted">塑料瓶 · 易拉罐 · 纸盒</Typography></>}
          </article>
          </div>
        </div>

        <div shuku-edit-id="e-b9712e59-a2e2-429d-bc11-c20795929a9b" className="rtg-replace-head__controls">
          <Button data-remove-head variant={phase === 'old' ? 'primary' : 'default'} disabled={phase !== 'old'} onClick={removeOldHead}><Typography shuku-edit-id="e-1cbf51cd-e7bc-4566-b1d5-191b47bc09cc" as="span" variant="body" tone="inherit">{phase === 'removing' ? '① 正在移除…' : '① 移除旧分类头'}</Typography></Button>
          <Button data-install-head variant={phase === 'removed' ? 'primary' : 'default'} disabled={phase !== 'removed'} onClick={() => { if (phase === 'removed') setPhase('new'); }}><Typography shuku-edit-id="e-34ec3966-a2dc-4995-916e-8c0b1b299abb" as="span" variant="body" tone="inherit">② 接入三分类头</Typography></Button>
        </div>

        <article shuku-edit-id="e-400be97d-23e9-4799-8414-e4413844eb59" className={`rtg-replace-head__output${phase === 'new' ? ' is-ready' : ''}`}>
          <Typography shuku-edit-id="e-6f427316-dc59-4aa6-b6eb-2ebc258b2b87" as="strong" variant="body" tone="warning">当前输出</Typography>
          {phase !== 'new' ? <Typography shuku-edit-id="e-c4624d4c-e097-4696-ae24-0ad70832b600" variant="body" tone="muted">等待接入新分类头</Typography> : classNames.map((label, index) => <div shuku-edit-id="e-6081732c-10ff-4126-9867-8ab36fe73099" key={label}><Typography shuku-edit-id="e-0e3e883d-009c-4c9e-87d4-193346196e08" variant="bodySmall" tone={index === samples.findIndex((item) => item.id === sampleId) ? 'success' : 'muted'}>{label}</Typography><span shuku-edit-id="e-4f4bdc1b-422d-4b18-93dc-93794c9675e9"><i shuku-edit-id="e-24252158-0a11-4ca0-8765-7435392e772c" style={{ width: `${Math.max(8, (sample.scores[index] + .5) * 28)}%` }} /></span><Typography shuku-edit-id="e-6cf0062a-bdbc-4b01-90f9-3c2f83ff92e7" variant="bodySmall" tone="accent">{sample.scores[index].toFixed(1)}</Typography></div>)}
          {phase === 'new' && <Typography shuku-edit-id="e-d2c29693-e7d1-4fe6-864b-145e2f3a5792" variant="bodySmall" tone="success">最高分：{sample.label}</Typography>}
        </article>
      </section>

      {testedAll && <RtgQuestion pageId="59fca0aa-209a-42a9-b4d8-f8718fa394ef" questionId="new-output-count" className="rtg-replace-head__question" type="choice" typeLabel="分类头检查" title="为什么新的分类头需要输出 3 个类别分数？" answer="classes" options={[{ value: 'classes', label: '新任务需要比较塑料瓶、易拉罐和纸盒三种答案' }, { value: 'channels', label: '骨干网络最后只有3个通道', wrongFeedback: '骨干最后通常有很多通道，分类头把它们映射成任务类别分数。' }, { value: 'images', label: '训练集中只有3张图片', wrongFeedback: '类别数与图片总数不是一回事。' }]} feedback={{ correct: '正确。分类头的输出维度由新任务的类别空间决定。' }} onCheck={setQuestionResult} />}
      <NoticeStrip tone={complete ? 'green' : 'blue'} role="status"><Typography shuku-edit-id="e-bbf4d702-ec29-4fc9-863d-9e6490a6e11b" variant="body" tone="inherit">{complete ? '骨干继续提供视觉表示，新分类头把表示映射为当前任务的三个类别分数。' : phase === 'old' ? '先移除只会回答旧问题的分类头。' : phase === 'removing' ? '旧分类头正在划走，视觉骨干保持原样。' : phase === 'removed' ? '视觉骨干仍然存在；现在接入新的三分类头。' : !testedAll ? `新分类头已接入，还需检查 ${samples.length - tested.size} 类样本。` : '三类输出已经检查完毕，请完成理解题。'}</Typography></NoticeStrip>
    </ContentBlock>
  );
}
